const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import mongoose from "mongoose";
import { env } from "./env";

// Mongoose defaults to buffering operations for up to 10s hoping a
// connection appears, instead of failing fast. That means every
// request would hang ~10s before responding whenever MongoDB is down —
// discovered during final resilience testing. Disabling buffering
// makes an unavailable DB fail immediately, which the routes already
// catch and treat as "persistence unavailable".
mongoose.set("bufferCommands", false);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("[db] connected to MongoDB");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[db] MongoDB unavailable, continuing without persistence: ${message}`);
  }
}
