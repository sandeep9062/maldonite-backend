# Event Loop Starvation — Diagnosis & Remediation

## 1. Symptoms

- `node-cron` v4 logs `[NODE-CRON] [WARN] missed execution... Possible blocking IO or high CPU use at the same process`, dumped **in batches**.
- `MongoDB disconnected` warnings appear periodically; Mongoose operations time out.
- Event loop appears blocked for **15–30 minutes** at a time.

## 2. Audit results (what was searched and found)

| Check | Result |
|---|---|
| `fs.*Sync`, `execSync`, `spawnSync`, `pbkdf2Sync`, `scryptSync` | ✅ **None** in `server/` — all `fs` usage is async (`blogController.js` unlink callbacks) |
| `crypto.randomBytes(32)` (`authController.js`) | ✅ Negligible (microseconds) |
| Large `JSON.parse`/`stringify` server-side | ✅ None (frontend-only) |
| `bcryptjs` (pure-JS bcrypt) | ⚠️ Runs **on the main thread** even when awaited — ~60–150 ms CPU per `hash`/`compare` at cost 10 (`models/User.js`, `routes/userRoutes.js` login). A login burst can stall the loop for seconds. Not minutes. |
| Unbounded `Model.find()` loading whole collections | ⚠️ **Found & fixed** (see §4) |
| CPU-bound loops / `forEach(async)` anti-patterns | ✅ None; bulk writes already use `updateMany`/`insertMany` |
| node-cron handlers | ✅ Only ONE cron task exists (keep-alive self-ping, `app.js`). It is already `async`, `try/catch`-wrapped with an 8 s `AbortController` timeout. **No heavy cron handlers exist** — the missed-execution warnings are a *symptom*, not a cause. |

## 3. Root-cause analysis — read this first

**No code path in this server can block the event loop for 15–30 minutes.** The
largest measured sync costs (bcryptjs, 10 MB `express.json` parses, compression)
are milliseconds-to-seconds. A multi-minute freeze with batched cron warnings
and Mongo disconnects is the signature of **host process suspension**:

- Render free instances spin down after ~15 min of "inactivity"; Heroku eco dynos sleep after ~30 min. While suspended, the process gets no CPU.
- During suspension: Mongoose heartbeats fail → `socketTimeoutMS: 45000` expires → *"MongoDB disconnected"*; on wake, node-cron detects every missed 5-min slot since the freeze and dumps `missed execution` warnings **in a batch** — exactly your symptom.
- The in-process `cron.schedule` self-ping **cannot prevent suspension**: node-cron doesn't run while the process is frozen, and on some platforms internal/self traffic doesn't count as activity.

**How to confirm:** with the new watchdog (`server/utils/eventLoopMonitor.js`) a
suspension logs `FROZEN for 900.0s ... process was most likely SUSPENDED by the
host` — in-process blocking logs the alternative message instead. Correlate the
timestamp with your platform's metrics (CPU flatlines at 0 during suspension).

## 4. Fixes applied in this pass (all backward-compatible response shapes)

| File | Change |
|---|---|
| `utils/eventLoopMonitor.js` | **New** — event loop watchdog (see §5) |
| `app.js` | Starts the watchdog at boot |
| `controllers/quoteRequestController.js` | `getAllQuoteRequests` was unbounded on a **user-generated** collection → paginated (`?page`/`?limit`, default 20, cap 100) + `lean()` + `maxTimeMS(5000)`; `data` stays an array |
| `controllers/userController.js` | `getUsers` was `User.find({})` **leaking password hashes**, unbounded → `select("-password")` + pagination + `lean()` (dead code today — route not mounted, but a landmine) |
| `controllers/bookingController.js` | `getAllBookings` was unbounded with double `.populate()` → pagination + `lean()` + `maxTimeMS` (dead code today) |
| `controllers/productController.js` | `getProducts` → `lean()`, `maxTimeMS`, sort, safety cap 2000, optional `?page`/`?limit` |
| `controllers/testimonialController.js` | `getTestimonials` → `lean()`, `maxTimeMS`, cap |
| `controllers/clientController.js` | `getClients` → `lean()`, `maxTimeMS`, cap |
| `controllers/websiteImageController.js` | `getImages` → `lean()`, `maxTimeMS`, cap |
| `controllers/serviceController.js` | `getServices` → `lean()`, `maxTimeMS`, cap |
| `controllers/subscription.controller.js` | `getAllSubscriptions` / `getUserSubscriptions` → `lean()`, `maxTimeMS`, cap |

Already-good patterns (kept as the house style): `blogController`,
`contactController`, `leadController`, `projectController`, `careerController`,
`notificationController`, `dashboardController`.

## 5. The event loop watchdog — usage & output

Started automatically in `app.js`. Zero new dependencies; optional deep-dive:

```bash
cd server && npm i blocked-at   # captures the exact JS stack that blocks the loop
```

Log lines to watch for (all prefixed `[EVENT-LOOP-MONITOR]`):

```
[EVENT-LOOP-MONITOR] [INFO] started (tick=100ms warn=250ms freeze=10000ms report=60000ms)
[EVENT-LOOP-MONITOR] [WARN] Event loop delayed by 312ms (threshold 250ms)...
[EVENT-LOOP-MONITOR] [ERROR] Event loop frozen for 12.3s. In-process blocking work suspected...
[EVENT-LOOP-MONITOR] [ERROR] Event loop was frozen for 900.0s ... SUSPENDED by the host ...
[EVENT-LOOP-MONITOR] [INFO] lag p50=1.2ms p90=18.4ms p99=45.0ms max=310.0ms | ELU=6.2% | heap=88.1/128.0MB rss=152.3MB handles=17 | warns=2 freezes=0 maxFreeze=0.0s | uptime=42.0min
```

Env tuning: `LOOP_MONITOR_ENABLED`, `LOOP_MONITOR_TICK_MS`,
`LOOP_MONITOR_WARN_THRESHOLD_MS`, `LOOP_MONITOR_FREEZE_THRESHOLD_MS`,
`LOOP_MONITOR_REPORT_INTERVAL_MS`, `LOOP_MONITOR_BLOCKED_AT_MS`.

Interpretation: sustained **ELU** (event-loop utilization) > 60–70% ⇒ CPU-bound;
high p99 with low ELU ⇒ many small blocks (sync IO / hydration);
a **15–30 min freeze ⇒ platform suspension** (fix hosting, not code).

## 6. Actionable recommendations

### 6.1 Keep every list endpoint bounded (done above)
House pattern for any new list endpoint — copy from `careerController.js`:
`find(filter).sort().skip().limit().lean().maxTimeMS(5000)` in `Promise.all`
with `countDocuments()`. Never ship a `Model.find()` without a `limit` — even
"small" collections grow.

### 6.2 Cursor streaming for bulk jobs (no whole-collection loads)
When you must process every document (exports, migrations, bulk emails), stream
instead of materializing:

```js
const cursor = NewsLetter.find({}).select("email").lean().cursor();
let batch = [];
for await (const doc of cursor) {          // one doc in memory at a time
  batch.push(sendEmail(doc.email));        // async, non-blocking
  if (batch.length >= 100) {
    await Promise.allSettled(batch);       // bounded concurrency
    batch = [];
    await new Promise((r) => setImmediate(r)); // yield the loop between batches
  }
}
await Promise.allSettled(batch);
```

### 6.3 Offload CPU-heavy work to worker threads (when introduced)
If you later add image processing, PDF generation, large aggregations, etc.,
don't do it in the request/cron path:

```js
// server/workers/cpuWorker.js
import { parentPort } from "node:worker_threads";
parentPort.on("message", ({ id, task, payload }) => {
  const result = tasks[task](payload);   // heavy, sync work is fine HERE
  parentPort.postMessage({ id, result });
});

// server/utils/workerPool.js — call from Express/cron with await, never blocks
import Piscina from "piscina";           // npm i piscina  (worker pool)
export const runHeavy = new Piscina({
  filename: new URL("../workers/cpuWorker.js", import.meta.url).href,
  maxThreads: 2,                          // leave cores for the event loop
});
// usage: const out = await runHeavy.run({ task: "resize", payload: buf });
```

### 6.4 Move cron tasks to a dedicated worker process (recommended)
The web process should serve HTTP; schedules belong in a separate entrypoint so
a burst of requests can never delay cron ticks, and cron load can never delay
responses. Also guarantees exactly ONE scheduler when you later scale out.

```js
// server/jobs/scheduler.js  →  run with: node jobs/scheduler.js
import cron from "node-cron";
import mongoose from "mongoose";
import { startEventLoopMonitor } from "../utils/eventLoopMonitor.js";

startEventLoopMonitor();
await mongoose.connect(process.env.MONGO_DB, { maxPoolSize: 5 });

cron.schedule("0 3 * * *", async () => {
  try { /* cleanup/reminder/backup jobs — all async, batched */ }
  catch (err) { console.error("job failed:", err); } // NEVER let it throw
});
```

Split the current keep-alive cron out of `app.js` the same way. Rules for every
handler: 100% async (no `*Sync`, no `bcryptjs`), wrap in `try/catch`, per-doc
errors isolated with `Promise.allSettled`, process in pages (e.g. 500 docs),
never hold the loop with big in-memory arrays.

### 6.5 Replace `bcryptjs` with native `bcrypt` (drop-in)
`bcryptjs` is pure JS: every `hash`/`compare` burns ~60–150 ms **on the main
thread** even when `await`ed. Native `bcrypt` runs in the libuv threadpool.
Both produce standard `$2a/$2b` hashes, so existing password hashes verify
without migration:

```bash
cd server && npm i bcrypt && npm uninstall bcryptjs
```
Then change the single import in `models/User.js` (`import bcrypt from "bcrypt"`).
Keep cost at 10–12. Alternatively keep bcryptjs but lower traffic to it.

### 6.6 Delete the dead booking/property code
These files are never imported (would crash if they ever were — the model files
don't exist in this repo): `controllers/bookingController.js`,
`controllers/userController.js` (booking/favourite parts; `userRoutes.js`
defines its own handlers), `routes/bookingRoutes.js`,
`controllers/websiteImageController.js` is alive, but `routes/migration.js`
imports a nonexistent `Property` model. Removing them eliminates an entire
latent failure class.

### 6.7 Infrastructure checklist (the actual 15–30 min fix)
1. **Stop the spin-down:** use an *external* monitor (UptimeRobot / cron-job.org
   / Better Stack) pinging `GET /api/ping` every 5 min — not only the in-process
   self-ping, which dies with the process. On Render, upgrade to an always-on
   instance; on Railway/Fly disable auto-stop.
2. **Mongoose resilience** (`config/db.js`): add
   `heartbeatFrequencyMS: 10000`, `maxIdleTimeMS: 60000`, and consider
   `autoIndex: false` in production. The 45 s `socketTimeoutMS` is fine —
   disconnect logs during a suspension are expected noise; alert only when
   `reconnected` does not follow.
3. **Alert on batches:** treat >3 consecutive `missed execution` warnings or a
   watchdog `FROZEN` log as a hosting incident, not an app bug.
4. **Verify with the watchdog:** after deploy, confirm you see
   `SUSPENDED by the host` (fix hosting) vs `In-process blocking work suspected`
   (then `npm i blocked-at` and read the captured stack).
5. node-cron v4 note: warnings only dump *after* the process wakes — they are a
   lagging indicator of the freeze, exactly matching your batch pattern.

— End of report. Generated during the event-loop starvation audit.
