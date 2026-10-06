import type { Request, Response } from "express";
import { Customer } from "../../models/Customer.js";
import { Order } from "../../models/Order.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";

export const customerController = {
  async getCustomers(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "-createdAt";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    ok(res, {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async getCustomerById(req: Request, res: Response) {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) throw HttpError.notFound("Customer not found");

    const orders = await Order.find({
      $or: [{ customer: customer._id }, { "customerInfo.email": customer.email }],
    }).sort({ createdAt: -1 });

    ok(res, {
      customer,
      orders,
    });
  },
};
