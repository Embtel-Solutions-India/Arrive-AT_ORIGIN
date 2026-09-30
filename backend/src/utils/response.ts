import type { Response } from "express";

export const ok = <T>(res: Response, data: T, message = "Operation successful", status = 200) =>
  res.status(status).json({ success: true, data, message });

export const created = <T>(res: Response, data: T, message = "Created") => ok(res, data, message, 201);
