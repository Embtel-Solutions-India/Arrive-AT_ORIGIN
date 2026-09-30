import pino from "pino";
import { isProd } from "../config/env.js";

export const logger = pino({
  level: isProd ? "info" : "debug",
  redact: ["req.headers.cookie", "req.headers.authorization", "*.password", "*.passwordHash"],
});
