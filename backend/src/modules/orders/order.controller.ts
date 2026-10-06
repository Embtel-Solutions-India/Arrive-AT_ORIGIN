import type { Request, Response } from "express";
import { Order } from "../../models/Order.js";
import { Payment } from "../../models/Payment.js";
import { Book } from "../../models/Book.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";

export const orderController = {
  async getOrders(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const orderStatus = req.query.orderStatus as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const sort = (req.query.sort as string) || "-createdAt";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customerInfo.name": { $regex: search, $options: "i" } },
        { "customerInfo.email": { $regex: search, $options: "i" } },
      ];
    }
    if (orderStatus && orderStatus !== "ALL") {
      query.orderStatus = orderStatus;
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      query.paymentStatus = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("customer", "name email phone"),
      Order.countDocuments(query),
    ]);

    ok(res, {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async getOrderById(req: Request, res: Response) {
    const { id } = req.params;
    const order = await Order.findById(id).populate("customer").populate("payment");
    if (!order) throw HttpError.notFound("Order not found");
    ok(res, { order });
  },

  async updateOrder(req: Request, res: Response) {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingNumber, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) throw HttpError.notFound("Order not found");

    if (orderStatus !== undefined) order.orderStatus = orderStatus;
    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;
      if (order.payment) {
        await Payment.findByIdAndUpdate(order.payment, {
          status: paymentStatus === "PAID" ? "SUCCESSFUL" : paymentStatus,
        });
      }
    }
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;

    await order.save();
    ok(res, { order }, "Order updated successfully");
  },
};
