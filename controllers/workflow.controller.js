import dayjs from "dayjs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const { serve } = require("../node_modules/@upstash/workflow/express.js");

import Subscription from "../models/Subscription.js";
import { sendReminderEmail } from "../utils/send-email.js";

const REMINDERS = [7, 5, 2, 1];

export const sendReminders = serve(async () => {
  const { subscriptionId } = context.requestPayload;

  const subscription = await fetchSubscription(context, subscriptionId);

  if (!subscription || subscription.status != "active") return;

  const renewalDate = dayjs(subscription.renwalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(
      `renewal date has passes for subscription ${subscriptionId}. Stopping workflow.`
    );
    return;
  }

  for (const daysBefore of REMINDERS) {
    // renwal dATE =22feb ,,so reminder date =15feb,cureent date is 16feb

    const reminderDate = renewalDate.subtract(daysBefore, "day");

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminder(
        context,
        `${daysBefore} days before reminder`, // 2 days before reminder
        reminderDate
      );
    }

    if (dayjs().isSame(reminderDate, "day")) {
      await triggerReminder(
        context,
        `Reminder ${daysBefore} days before`,
        subscription
      );
    }
  }
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run("get subscription", async () => {
    return Subscription.findById(subscriptionId).populate("user", "name email");
  });
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping Until ${label} reminder at ${date}`);

  await context.sleepUntil(label, date.toDate());
};

const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(`Triggering ${label} reminder`);

    // send email,sms,push notificationsss

    await sendReminderEmail({
      to: subscription.user.email,

      type: label,
      subscription,
    });
  });
};
