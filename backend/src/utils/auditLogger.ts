import type { Request } from "express";
import { AuditLog } from "../models/AuditLog.js";
import { logger } from "./logger.js";

interface LogAuditOptions {
  req?: Request;
  action: string;
  module: string;
  status?: "SUCCESS" | "FAILED" | "WARNING";
  details?: Record<string, any>;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export async function logAudit(options: LogAuditOptions): Promise<void> {
  try {
    const { req, action, module, status = "SUCCESS", details = {} } = options;

    let userId = options.userId || (req?.user?.id as string | undefined);
    let userName = options.userName || (req?.user?.name as string | undefined) || "Admin User";
    let userEmail = options.userEmail || (req?.user?.email as string | undefined) || "";

    // Extract IP and User-Agent
    let ipAddress = "127.0.0.1";
    let device = "Desktop / Web Browser";
    let browser = "Chrome";

    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        ipAddress = forwarded.split(",")[0]?.trim() || "127.0.0.1";
      } else if (req.socket?.remoteAddress) {
        ipAddress = req.socket.remoteAddress;
      }

      const ua = (req.headers["user-agent"] as string) || "";
      if (/mobile/i.test(ua)) device = "Mobile Device";
      else if (/tablet|ipad/i.test(ua)) device = "Tablet Device";
      else device = "Desktop Device";

      if (/edg/i.test(ua)) browser = "Microsoft Edge";
      else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
      else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
      else if (/safari/i.test(ua)) browser = "Apple Safari";
    }

    await AuditLog.create({
      action,
      module,
      userId,
      userName,
      userEmail,
      ipAddress,
      device,
      browser,
      status,
      details,
    });
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, "Failed to write audit log entry");
  }
}
