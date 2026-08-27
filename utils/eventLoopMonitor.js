/**
 * Event Loop Watchdog (dependency-free)
 * -------------------------------------
 * Detects and logs event loop delays/freezes so repeated "node-cron missed
 * execution" and "MongoDB disconnected" warnings can be traced back to the
 * code (or infrastructure) that caused them.
 *
 *  1. Probes event loop drift every `tickMs` (default 100ms); how late a probe
 *     fires tells us exactly how long the loop was blocked.
 *  2. Classifies freezes: WARN >= warnThresholdMs, FREEZE >= freezeThresholdMs,
 *     and >= 5 minutes => almost certainly the HOST SUSPENDED the process
 *     (idle spin-down, dyno sleep, SIGSTOP, VM pause) - no in-process JS block
 *     can explain multi-minute freezes.
 *  3. Reports lag p50/p90/p99/max, event-loop utilization, memory, handles and
 *     freeze counters every `reportIntervalMs` (default 60s).
 *  4. Optional `blocked-at` integration (if installed) captures the exact JS
 *     stack that was blocking the loop:  npm i blocked-at
 *
 * Env config:
 *   LOOP_MONITOR_ENABLED              "false" disables (default: enabled)
 *   LOOP_MONITOR_TICK_MS              probe interval (default 100)
 *   LOOP_MONITOR_WARN_THRESHOLD_MS    WARN above this lag   (default 250)
 *   LOOP_MONITOR_FREEZE_THRESHOLD_MS  FREEZE above this lag (default 10000)
 *   LOOP_MONITOR_REPORT_INTERVAL_MS   stats cadence         (default 60000)
 *   LOOP_MONITOR_BLOCKED_AT_MS        blocked-at threshold (default 500, 0=off)
 *
 * Usage: import { startEventLoopMonitor } and call it once at boot (app.js).
 */

import perfHooks from "node:perf_hooks";

const { monitorEventLoopDelay, performance } = perfHooks;

// eventLoopUtilization location varies by Node version:
//   Node 14–22: top-level export of node:perf_hooks
//   Node 24+:   performance.eventLoopUtilization()
// Resolve once; null => ELU segment is omitted from reports (lag histogram
// remains the primary diagnostic).
const eventLoopUtilization =
  typeof perfHooks.eventLoopUtilization === "function"
    ? perfHooks.eventLoopUtilization
    : typeof performance?.eventLoopUtilization === "function"
      ? performance.eventLoopUtilization.bind(performance)
      : null;

const PREFIX = "[EVENT-LOOP-MONITOR]";
const HOST_SUSPENSION_MIN_MS = 5 * 60_000; // >= 5 min freeze => host suspension

const readInt = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function startEventLoopMonitor(options = {}) {
  const cfg = {
    enabled:
      process.env.LOOP_MONITOR_ENABLED !== "false" && options.enabled !== false,
    tickMs: readInt(process.env.LOOP_MONITOR_TICK_MS, 100),
    warnThresholdMs: readInt(process.env.LOOP_MONITOR_WARN_THRESHOLD_MS, 250),
    freezeThresholdMs: readInt(
      process.env.LOOP_MONITOR_FREEZE_THRESHOLD_MS,
      10_000,
    ),
    reportIntervalMs: readInt(
      process.env.LOOP_MONITOR_REPORT_INTERVAL_MS,
      60_000,
    ),
    blockedAtThresholdMs: readInt(process.env.LOOP_MONITOR_BLOCKED_AT_MS, 500),
    ...options,
  };

  if (!cfg.enabled) {
    return { stop() {} };
  }

  const log = (level, message, extra = {}) => {
    const emit =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    const line = `${PREFIX} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(extra).length > 0) emit(line, extra);
    else emit(line);
  };

  // --- 1. High-resolution event loop delay histogram (perf_hooks) ----------
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  histogram.enable();

  // --- 2. Drift probe: detects every blocked window ------------------------
  let lastTickAt = performance.now();
  let episodeStartedAt = null;
  let lastEpisodeLogAt = 0;
  const stats = { warns: 0, freezes: 0, maxFreezeMs: 0 };

  const tickTimer = setInterval(() => {
    const now = performance.now();
    const expectedAt = lastTickAt + cfg.tickMs;
    const lagMs = Math.max(0, now - expectedAt);
    lastTickAt = now;

    if (lagMs >= cfg.freezeThresholdMs) {
      stats.freezes += 1;
      if (lagMs > stats.maxFreezeMs) stats.maxFreezeMs = lagMs;

      if (lagMs >= HOST_SUSPENSION_MIN_MS) {
        log(
          "error",
          `Event loop was frozen for ${(lagMs / 1000).toFixed(1)}s. This is far ` +
            `longer than any in-process JS can block - the process was most likely ` +
            `SUSPENDED by the host (idle spin-down, dyno sleep, SIGSTOP, VM pause). ` +
            `Correlate this timestamp with your platform metrics. node-cron and ` +
            `MongoDB warnings during this window are symptoms, not causes.`,
          {
            frozenForMs: Math.round(lagMs),
            frozenForMinutes: +(lagMs / 60000).toFixed(1),
          },
        );
      } else {
        log(
          "error",
          `Event loop frozen for ${(lagMs / 1000).toFixed(1)}s. In-process blocking ` +
            `work suspected (sync IO, CPU-bound loop, catastrophic regex). See ` +
            `server/docs/EVENT_LOOP_DIAGNOSIS.md for triage steps.`,
          { frozenForMs: Math.round(lagMs) },
        );
      }
      episodeStartedAt = null; // probe caught up; episode over
      return;
    }

    if (lagMs >= cfg.warnThresholdMs) {
      if (episodeStartedAt === null) {
        episodeStartedAt = now - lagMs;
        stats.warns += 1;
        log(
          "warn",
          `Event loop delayed by ${Math.round(lagMs)}ms (threshold ` +
            `${cfg.warnThresholdMs}ms). Blocking IO or CPU-heavy work detected.`,
        );
      } else if (now - lastEpisodeLogAt > 5_000) {
        lastEpisodeLogAt = now;
        log(
          "warn",
          `Event loop still blocked - ${((now - episodeStartedAt) / 1000).toFixed(1)}s ` +
            `into the current blocking episode.`,
        );
      }
    } else if (episodeStartedAt !== null) {
      const totalMs = Math.round(now - episodeStartedAt);
      if (totalMs > cfg.warnThresholdMs) {
        log("info", `Blocking episode ended after ~${(totalMs / 1000).toFixed(2)}s.`);
      }
      episodeStartedAt = null;
    }
  }, cfg.tickMs);
  tickTimer.unref(); // the monitor must never keep the process alive

  // --- 3. Periodic stats report --------------------------------------------
  let prevElu = eventLoopUtilization ? eventLoopUtilization() : null;
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  const pct = (q) => (histogram.percentile(q) / 1e6).toFixed(1); // ns -> ms

  const reportTimer = setInterval(() => {
    const elu = eventLoopUtilization ? eventLoopUtilization(prevElu) : null;
    if (eventLoopUtilization) prevElu = eventLoopUtilization();

    const mem = process.memoryUsage();
    const handles =
      typeof process._getActiveHandles === "function"
        ? process._getActiveHandles().length
        : undefined;

    const eluSegment = elu ? ` ELU=${(elu.utilization * 100).toFixed(1)}% |` : "";

    log(
      "info",
      `lag p50=${pct(50)}ms p90=${pct(90)}ms p99=${pct(99)}ms max=${(
        histogram.max / 1e6
      ).toFixed(1)}ms |${eluSegment} ` +
        `heap=${mb(mem.heapUsed)}/${mb(mem.heapTotal)}MB rss=${mb(mem.rss)}MB` +
        `${handles !== undefined ? ` handles=${handles}` : ""} | ` +
        `warns=${stats.warns} freezes=${stats.freezes} maxFreeze=${(
          stats.maxFreezeMs / 1000
        ).toFixed(1)}s | uptime=${(process.uptime() / 60).toFixed(1)}min`,
    );

    stats.warns = 0;
    stats.freezes = 0;
    stats.maxFreezeMs = 0;
    histogram.reset();
  }, cfg.reportIntervalMs);
  reportTimer.unref();

  // --- 4. Optional blocked-at integration (stack capture) ------------------
  let stopBlockedAt = null;
  if (cfg.blockedAtThresholdMs > 0) {
    import("blocked-at")
      .then(({ enable }) => {
        stopBlockedAt = enable(
          { threshold: cfg.blockedAtThresholdMs },
          (stack, duration) => {
            log(
              "error",
              `blocked-at captured a ${duration}ms block. Offending stack:`,
              { stack: String(stack).split("\n").slice(0, 12).join("\n") },
            );
          },
        );
        log(
          "info",
          `blocked-at active (threshold ${cfg.blockedAtThresholdMs}ms) - stacks will be captured for blocking code.`,
        );
      })
      .catch(() => {
        log(
          "info",
          'Optional "blocked-at" package not installed - stack capture disabled. Enable with: npm i blocked-at',
        );
      });
  }

  log(
    "info",
    `started (tick=${cfg.tickMs}ms warn=${cfg.warnThresholdMs}ms freeze=${cfg.freezeThresholdMs}ms report=${cfg.reportIntervalMs}ms)`,
  );

  return {
    stop() {
      clearInterval(tickTimer);
      clearInterval(reportTimer);
      histogram.disable();
      if (typeof stopBlockedAt === "function") stopBlockedAt();
    },
  };
}
