import express from "express";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { corsOrigins, isAllowedOrigin } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { originGuard } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { uploadDir } from "./middleware/upload.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)),
      credentials: true,
    })
  );
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));

  // Redirect legacy /uploads/ebooks/* requests to /ebooks/*
  app.use((req, res, next) => {
    const p = req.path;
    if (p.toLowerCase().startsWith("/uploads/ebooks/")) {
      const filename = p.slice("/uploads/ebooks/".length);
      return res.redirect(301, `/ebooks/${filename}`);
    }
    next();
  });

  // Static ebooks directory (serving all 8 publication PDFs)
  const frontendEbooksDir = path.resolve(process.cwd(), "../frontend/public/ebooks");
  const localEbooksDir = path.resolve(process.cwd(), "uploads", "ebooks");
  if (fs.existsSync(frontendEbooksDir)) {
    app.use("/ebooks", express.static(frontendEbooksDir));
  } else if (fs.existsSync(localEbooksDir)) {
    app.use("/ebooks", express.static(localEbooksDir));
  }

  // Static uploads directory for public media library (images/assets only)
  app.use("/uploads", express.static(uploadDir));

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter, originGuard, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
