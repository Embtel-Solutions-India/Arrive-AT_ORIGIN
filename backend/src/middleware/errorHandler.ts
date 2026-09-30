import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found", errors: [] });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.errors });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "A record with these values already exists", errors: [] });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Record not found", errors: [] });
    }
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ success: false, message: "Something went wrong", errors: [] });
};
