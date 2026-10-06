import type { Request, Response } from "express";
import { Payment } from "../../models/Payment.js";
import { ok } from "../../utils/response.js";

export const paymentController = {
  async getPayments(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") {
      query.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("order", "orderNumber customerInfo total paymentStatus"),
      Payment.countDocuments(query),
    ]);

    ok(res, {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },
};
