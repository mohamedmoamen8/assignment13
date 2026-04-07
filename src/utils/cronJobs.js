import cron from "node-cron";
import { userModel } from "../db/models/user.models.js";

// Runs every hour
cron.schedule("0 * * * *", async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await userModel.deleteMany({
    isEmailconfirmed: false,
    createdAt: { $lt: cutoff },
  });
  console.log(`Deleted ${result.deletedCount} unconfirmed users`);
});