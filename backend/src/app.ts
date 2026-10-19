import express from "express";
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

  // Securely protect e-book PDFs from unauthorized public access (Requirement 6)
  app.use("/uploads/ebooks", (_req, res) => {
    res.status(403).json({
      success: false,
      message: "Direct public access to e-book PDF files is restricted. Please access your digital books via your authenticated account library.",
    });
  });

  app.use("/uploads", (req, res, next) => {
    if (req.path.toLowerCase().endsWith(".pdf")) {
      return res.status(403).json({
        success: false,
        message: "Direct public access to PDF files is prohibited. Please use the authorized portal reading or download endpoint.",
      });
    }
    next();
  });

  // Static uploads directory for public media library (images/assets only)
  app.use("/uploads", express.static(uploadDir));

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter, originGuard, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
