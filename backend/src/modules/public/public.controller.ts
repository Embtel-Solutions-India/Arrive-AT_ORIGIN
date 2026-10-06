import type { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost.js";
import { Book } from "../../models/Book.js";
import { Customer } from "../../models/Customer.js";
import { Order, IOrderItem } from "../../models/Order.js";
import { Payment } from "../../models/Payment.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { razorpayService } from "../../services/razorpay.service.js";
import { env } from "../../config/env.js";
import { generateCustomerToken } from "../customerAuth/customerAuth.controller.js";
import { sendOrderConfirmationEmail } from "../../services/email.service.js";
import { logger } from "../../utils/logger.js";

export const publicController = {
  // ─── Public Blogs ───
  async getBlogs(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 9);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const query: Record<string, unknown> = { status: "PUBLISHED" };
    if (category && category !== "all") {
      query.categoryName = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const [blogs, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-content"),
      BlogPost.countDocuments(query),
    ]);

    ok(res, {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async getBlogBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const blog = await BlogPost.findOne({ slug, status: "PUBLISHED" }).populate("author");
    if (!blog) throw HttpError.notFound("Blog post not found");

    // Related posts in same category
    const related = await BlogPost.find({
      _id: { $ne: blog._id },
      categoryName: blog.categoryName,
      status: "PUBLISHED",
    })
      .limit(3)
      .select("title slug excerpt featuredImage publishDate readTime");

    ok(res, { blog, related });
  },

  // ─── Public Books ───
  async getBooks(req: Request, res: Response) {
    const format = req.query.format as string | undefined;
    const category = req.query.category as string | undefined;

    const query: Record<string, unknown> = { status: "PUBLISHED" };
    if (format && format !== "all") {
      query.format = format;
    }
    if (category && category !== "all") {
      query.categoryName = category;
    }

    const books = await Book.find(query).sort({ isFeatured: -1, salesCount: -1, createdAt: -1 });
    ok(res, { books });
  },

  async getBookBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const book = await Book.findOne({ slug, status: "PUBLISHED" }).populate("author");
    if (!book) throw HttpError.notFound("Book not found");

    // Related books
    const related = await Book.find({
      _id: { $ne: book._id },
      status: "PUBLISHED",
    })
      .limit(3)
      .select("title slug coverImage price salePrice format");

    ok(res, { book, related });
  },

  // ─── Public Checkout ───
  async checkout(req: Request, res: Response) {
    const {
      customerInfo,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body as {
      customerInfo: { name: string; email: string; phone?: string };
      items: Array<{ bookId: string; quantity: number; format?: string }>;
      shippingAddress: { street: string; city: string; state: string; postalCode: string; country: string };
      billingAddress?: { street: string; city: string; state: string; postalCode: string; country: string };
      paymentMethod?: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
    };

    if (!customerInfo?.name || !customerInfo?.email) {
      throw HttpError.badRequest("Customer name and email are required");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw HttpError.badRequest("No items in cart");
    }

    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const isValid = razorpayService.verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
      if (!isValid) throw HttpError.badRequest("Invalid Razorpay payment signature");
    }

    // Verify books and calculate prices
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book) throw HttpError.badRequest(`Book with ID ${item.bookId} not found`);

      if (book.stockQuantity < item.quantity) {
        throw HttpError.badRequest(`Only ${book.stockQuantity} copies of "${book.title}" are in stock`);
      }

      const itemPrice = book.salePrice ?? book.price;
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        book: book._id as any,
        title: book.title,
        sku: book.sku,
        format: item.format || book.format || "Paperback",
        price: itemPrice,
        quantity: item.quantity,
        coverImage: book.coverImage,
        subtotal: itemSubtotal,
      });

      // Update inventory and sales count
      book.stockQuantity -= item.quantity;
      book.salesCount += item.quantity;
      book.revenue += itemSubtotal;
      if (book.stockQuantity <= 0) {
        book.status = "OUT_OF_STOCK";
      }
      await book.save();
    }

    const shipping = subtotal > 50 ? 0 : 5;
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));

    // Upsert Customer
    let customer = await Customer.findOne({ email: customerInfo.email.toLowerCase() } as any);
    if (!customer) {
      customer = await Customer.create({
        name: customerInfo.name,
        email: customerInfo.email.toLowerCase(),
        phone: customerInfo.phone || "",
        shippingAddress: shippingAddress || {},
        billingAddress: billingAddress || shippingAddress || {},
        totalOrders: 1,
        totalSpent: total,
        lastOrderDate: new Date(),
      });
    } else {
      customer.totalOrders += 1;
      customer.totalSpent += total;
      customer.lastOrderDate = new Date();
      if (shippingAddress) customer.shippingAddress = shippingAddress;
      await customer.save();
    }

    // Generate Order Number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Order
    const order = await Order.create({
      orderNumber,
      orderType: "BOOK_ORDER",
      customer: customer._id,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email.toLowerCase(),
        phone: customerInfo.phone || "",
      },
      items: orderItems,
      subtotal,
      shipping,
      tax,
      discount: 0,
      total,
      currency: "USD",
      paymentStatus: "PAID",
      orderStatus: "PAYMENT_CONFIRMED",
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || shippingAddress || {},
      notes: "Placed via online book store",
    });

    // Create Payment Record
    const isRazorpay = !!razorpayPaymentId || paymentMethod?.toLowerCase().includes("razorpay");
    const transactionId = razorpayPaymentId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const payment = await Payment.create({
      order: order._id,
      orderNumber,
      transactionId,
      paymentGateway: isRazorpay ? "razorpay" : "simulated_gateway",
      amount: total,
      currency: "USD",
      status: "SUCCESSFUL",
      paymentMethod: isRazorpay ? "Razorpay" : paymentMethod || "Credit Card",
      gatewayResponse: isRazorpay
        ? { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId }
        : {
            approved: true,
            authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
            simulated: true,
          },
    });

    order.payment = payment._id as any;
    await order.save();

    // Send order confirmation receipt via Resend
    sendOrderConfirmationEmail(order).catch((err) =>
      logger.error({ err: err?.message }, "Failed to send order confirmation email")
    );

    const customerToken = generateCustomerToken(customer);

    ok(
      res,
      {
        orderNumber: order.orderNumber,
        total: order.total,
        orderId: order._id,
        items: order.items,
        customerInfo: order.customerInfo,
        customerToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
      "Order placed successfully",
      201
    );
  },

  // ─── Public Razorpay Book Order Creation ───
  async createBookRazorpayOrder(req: Request, res: Response) {
    const { items, customerInfo } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw HttpError.badRequest("No items in cart");
    }

    let subtotal = 0;
    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book) throw HttpError.badRequest("Book not found");
      const itemPrice = book.salePrice ?? book.price;
      subtotal += itemPrice * item.quantity;
    }

    const shipping = subtotal > 50 ? 0 : 5;
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));

    const receipt = `BK-${Date.now().toString().slice(-8)}`;
    const rzpOrder = await razorpayService.createOrder({
      amount: total,
      currency: "USD",
      receipt,
      notes: {
        customerEmail: customerInfo?.email || "",
        customerName: customerInfo?.name || "",
        type: "book_checkout",
      },
    });

    ok(res, {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      total,
      receipt,
    });
  },
};
