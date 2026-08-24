import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function main(): Promise<void> {
  await connectDB();
  const app = createApp();
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`[server] ClimateShield backend listening on port ${env.port}`);
  });
}

main();
