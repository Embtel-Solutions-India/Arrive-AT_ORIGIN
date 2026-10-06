import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./database/mongodb.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  await connectDB();
  const server = createApp().listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));

  async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
