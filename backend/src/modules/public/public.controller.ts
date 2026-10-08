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
import { Coupon } from "../../models/Coupon.js";
import { calculateCouponDiscount } from "../coupons/coupon.controller.js";

// Cache IP geolocation for 24 hours to avoid redundant lookups
const ipGeoCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
      couponCode,
    } = req.body as {
      customerInfo: { name: string; email: string; phone?: string };
      items: Array<{ bookId: string; quantity: number; format?: string }>;
      shippingAddress: { street: string; city: string; state: string; postalCode: string; country: string };
      billingAddress?: { street: string; city: string; state: string; postalCode: string; country: string };
      paymentMethod?: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
      couponCode?: string;
      currency?: string;
    };

    if (!customerInfo?.name || !customerInfo?.email) {
      throw HttpError.badRequest("Customer name and email are required");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw HttpError.badRequest("No items in cart");
    }

    const orderCurrency: "USD" | "INR" = req.body.currency === "INR" ? "INR" : "USD";

    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const isValid = razorpayService.verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
      if (!isValid) throw HttpError.badRequest("Invalid Razorpay payment signature");
    }

    // Verify books and calculate prices server-side based on currency
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const book = await (Book as any).findById(item.bookId);
      if (!book) throw HttpError.badRequest(`Book with ID ${item.bookId} not found`);

      if (book.stockQuantity < item.quantity) {
        throw HttpError.badRequest(`Only ${book.stockQuantity} copies of "${book.title}" are in stock`);
      }

      const itemPrice = orderCurrency === "INR"
        ? (book.salePriceINR ?? book.priceINR ?? book.price)
        : (book.salePriceUSD ?? book.priceUSD ?? book.price);
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

    let discount = 0;
    let appliedCouponCode = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      try {
        const discountResult = await calculateCouponDiscount(couponCode, "CHECKOUT", subtotal);
        discount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;
        await Coupon.updateOne({ code: discountResult.code }, { $inc: { usedCount: 1 } });
      } catch (err: any) {
        throw HttpError.badRequest(err.message || "Invalid coupon code");
      }
    }

    const shipping = orderCurrency === "INR"
      ? (subtotal >= 400 ? 0 : 50)
      : (subtotal >= 50 ? 0 : 5);
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = Number((taxableSubtotal * 0.05).toFixed(2));
    const total = Math.max(0, Number((subtotal - discount + shipping + tax).toFixed(2)));

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
      discount,
      couponCode: appliedCouponCode,
      total,
      currency: orderCurrency,
      paymentStatus: "PAID",
      orderStatus: "PAYMENT_CONFIRMED",
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || shippingAddress || {},
      notes: appliedCouponCode ? `Placed via book store (Coupon: ${appliedCouponCode})` : "Placed via online book store",
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
      currency: orderCurrency,
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
    const { items, customerInfo, couponCode, currency } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw HttpError.badRequest("No items in cart");
    }

    const requestedCurrency: "USD" | "INR" = currency === "INR" ? "INR" : "USD";

    let subtotal = 0;
    for (const item of items) {
      const book = await (Book as any).findById(item.bookId);
      if (!book) throw HttpError.badRequest("Book not found");
      const itemPrice = requestedCurrency === "INR"
        ? (book.salePriceINR ?? book.priceINR ?? book.price)
        : (book.salePriceUSD ?? book.priceUSD ?? book.price);
      subtotal += itemPrice * item.quantity;
    }

    let discount = 0;
    let appliedCouponCode = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      try {
        const discountResult = await calculateCouponDiscount(couponCode, "CHECKOUT", subtotal);
        discount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;
      } catch (err: any) {
        throw HttpError.badRequest(err.message || "Invalid coupon code");
      }
    }

    const shipping = requestedCurrency === "INR"
      ? (subtotal >= 400 ? 0 : 50)
      : (subtotal >= 50 ? 0 : 5);
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = Number((taxableSubtotal * 0.05).toFixed(2));
    const total = Math.max(0, Number((subtotal - discount + shipping + tax).toFixed(2)));

    const receipt = `BK-${Date.now().toString().slice(-8)}`;
    const rzpOrder = await razorpayService.createOrder({
      amount: total,
      currency: requestedCurrency,
      receipt,
      notes: {
        customerEmail: customerInfo?.email || "",
        customerName: customerInfo?.name || "",
        couponCode: appliedCouponCode,
        type: "book_checkout",
      },
    });

    ok(res, {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      subtotal,
      discount,
      couponCode: appliedCouponCode,
      total,
      receipt,
    });
  },

  // ─── IP-Based Geo Location & Currency Detection ───
  async getGeoLocation(req: Request, res: Response) {
    const testCountry = (req.query.country as string) || (req.query.testCountry as string);
    if (testCountry) {
      const country = testCountry.toUpperCase().trim();
      const currency = country === "IN" ? "INR" : "USD";
      return ok(res, { country, currency, source: "test_param" });
    }

    const cdnHeader =
      (req.headers["cf-ipcountry"] as string) ||
      (req.headers["x-country-code"] as string) ||
      (req.headers["cloudfront-viewer-country"] as string) ||
      (req.headers["x-vercel-ip-country"] as string);

    if (cdnHeader && typeof cdnHeader === "string") {
      const country = cdnHeader.toUpperCase().trim();
      if (country.length === 2) {
        const currency = country === "IN" ? "INR" : "USD";
        return ok(res, { country, currency, source: "cdn_header" });
      }
    }

    const xForwardedFor = req.headers["x-forwarded-for"];
    const rawIp = typeof xForwardedFor === "string"
      ? (xForwardedFor.split(",")[0] || "").trim()
      : req.socket.remoteAddress || req.ip || "";
    const cleanIp = rawIp.replace(/^.*:/, "");

    const isPrivate =
      !cleanIp ||
      cleanIp === "127.0.0.1" ||
      cleanIp === "localhost" ||
      cleanIp === "::1" ||
      cleanIp.startsWith("192.168.") ||
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("172.16.") ||
      cleanIp.startsWith("172.31.");

    if (isPrivate) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const isIndiaTz = tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("IST");
      const country = isIndiaTz ? "IN" : "US";
      return ok(res, {
        country,
        currency: country === "IN" ? "INR" : "USD",
        source: "local_network_timezone",
      });
    }

    const cached = ipGeoCache.get(cleanIp);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const currency = cached.country === "IN" ? "INR" : "USD";
      return ok(res, { country: cached.country, currency, source: "cache" });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
        signal: controller.signal,
        headers: { "User-Agent": "soul-body-ecom/1.0" },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        const country = (data.country_code || data.country || "US").toUpperCase();
        ipGeoCache.set(cleanIp, { country, timestamp: Date.now() });
        const currency = country === "IN" ? "INR" : "USD";
        return ok(res, { country, currency, source: "ipapi" });
      }
    } catch {
      // Fallback
    }

    return ok(res, { country: "US", currency: "USD", source: "fallback" });
  },
};
