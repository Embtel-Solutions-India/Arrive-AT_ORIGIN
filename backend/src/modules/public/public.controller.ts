import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { uploadDir } from "../../middleware/upload.js";
import { BlogPost } from "../../models/BlogPost.js";
import { BlogCategory } from "../../models/BlogCategory.js";
import { BlogTag } from "../../models/BlogTag.js";
import { Book } from "../../models/Book.js";
import { Customer } from "../../models/Customer.js";
import { Order, IOrderItem } from "../../models/Order.js";
import { Payment } from "../../models/Payment.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { razorpayService } from "../../services/razorpay.service.js";
import { stripeService } from "../../services/stripe.service.js";
import { env } from "../../config/env.js";
import { generateCustomerToken } from "../customerAuth/customerAuth.controller.js";
import { sendOrderConfirmationEmail } from "../../services/email.service.js";
import { logger } from "../../utils/logger.js";
import { Coupon } from "../../models/Coupon.js";
import { calculateCouponDiscount } from "../coupons/coupon.controller.js";
import { getGroupSetting, DEFAULT_SHIPPING } from "../settings/settings.controller.js";

// Helper to look up a book by either MongoDB ObjectId or URL slug
export async function findBookByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug) return null;
  const isMongoId = mongoose.Types.ObjectId.isValid(idOrSlug) && idOrSlug.length === 24;
  if (isMongoId) {
    const book = await (Book as any).findById(idOrSlug);
    if (book) return book;
  }
  return await (Book as any).findOne({
    $or: [{ slug: idOrSlug }, { sku: idOrSlug }, { title: new RegExp(`^${idOrSlug}$`, "i") }],
  });
}

// Cache IP geolocation for 24 hours to avoid redundant lookups
const ipGeoCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const USD_TO_INR_RATE = 96.79;

export function resolveBookPrice(book: any, targetCurrency: "USD" | "INR", requestedFormat?: string): number {
  if (requestedFormat && Array.isArray(book.formats) && book.formats.length > 0) {
    const cleanFmt = requestedFormat.trim().toLowerCase();
    const fmtObj = book.formats.find((f: any) => {
      const fName = (f.format || "").trim().toLowerCase();
      if (fName === cleanFmt) return true;
      if ((cleanFmt.includes("kindle") || cleanFmt.includes("ebook") || cleanFmt.includes("e-book")) && (fName.includes("kindle") || fName.includes("ebook") || fName.includes("e-book"))) {
        return true;
      }
      return false;
    });

    if (fmtObj && fmtObj.isAvailable !== false) {
      if (targetCurrency === "INR") {
        if (typeof fmtObj.priceINR === "number" && fmtObj.priceINR > 0) return fmtObj.priceINR;
        if (typeof fmtObj.priceUSD === "number" && fmtObj.priceUSD > 0) {
          return Number((fmtObj.priceUSD * USD_TO_INR_RATE).toFixed(2));
        }
        if (typeof fmtObj.price === "number" && fmtObj.price > 0) {
          return fmtObj.price >= 50 ? fmtObj.price : Number((fmtObj.price * USD_TO_INR_RATE).toFixed(2));
        }
      } else {
        // USD
        if (typeof fmtObj.priceUSD === "number" && fmtObj.priceUSD > 0) return fmtObj.priceUSD;
        if (typeof fmtObj.priceINR === "number" && fmtObj.priceINR > 0) {
          return Number((fmtObj.priceINR / USD_TO_INR_RATE).toFixed(2));
        }
        if (typeof fmtObj.price === "number" && fmtObj.price > 0) {
          return fmtObj.price < 50 ? fmtObj.price : Number((fmtObj.price / USD_TO_INR_RATE).toFixed(2));
        }
      }
    }
  }

  if (targetCurrency === "INR") {
    if (typeof book.salePriceINR === "number" && book.salePriceINR > 0) return book.salePriceINR;
    if (typeof book.priceINR === "number" && book.priceINR > 0) return book.priceINR;
    if (typeof book.salePriceUSD === "number" && book.salePriceUSD > 0) {
      return Number((book.salePriceUSD * USD_TO_INR_RATE).toFixed(2));
    }
    if (typeof book.priceUSD === "number" && book.priceUSD > 0) {
      return Number((book.priceUSD * USD_TO_INR_RATE).toFixed(2));
    }
    if (typeof book.price === "number" && book.price >= 50) return book.price;
    if (typeof book.price === "number" && book.price > 0) {
      return Number((book.price * USD_TO_INR_RATE).toFixed(2));
    }
    return 483.23;
  } else {
    // USD
    if (typeof book.salePriceUSD === "number" && book.salePriceUSD > 0) return book.salePriceUSD;
    if (typeof book.priceUSD === "number" && book.priceUSD > 0) return book.priceUSD;
    if (typeof book.salePriceINR === "number" && book.salePriceINR > 0) {
      return Number((book.salePriceINR / USD_TO_INR_RATE).toFixed(2));
    }
    if (typeof book.priceINR === "number" && book.priceINR > 0) {
      return Number((book.priceINR / USD_TO_INR_RATE).toFixed(2));
    }
    if (typeof book.price === "number" && book.price > 0 && book.price < 50) return book.price;
    if (typeof book.price === "number" && book.price >= 50) {
      return Number((book.price / USD_TO_INR_RATE).toFixed(2));
    }
    return 4.99;
  }
}

export const publicController = {
  // ─── Public Blogs ───
  async getBlogs(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;

    const query: Record<string, unknown> = { status: "PUBLISHED" };
    if (category && category.toLowerCase() !== "all") {
      query.categoryName = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }
    if (tag && tag.toLowerCase() !== "all") {
      query.tags = { $in: [new RegExp(`^${tag.trim()}$`, "i")] };
    }
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { excerpt: { $regex: s, $options: "i" } },
        { categoryName: { $regex: s, $options: "i" } },
        { tags: { $in: [new RegExp(s, "i")] } },
      ];
    }

    const [blogs, total, recentPosts, allCategories, allTags, postCategoryCounts, postTagAgg] = await Promise.all([
      (BlogPost as any).find(query)
        .sort({ publishDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-content"),
      (BlogPost as any).countDocuments(query),
      (BlogPost as any).find({ status: "PUBLISHED" })
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(5)
        .select("title slug excerpt featuredImage publishDate readTime categoryName"),
      (BlogCategory as any).find().sort({ name: 1 }).select("name slug"),
      (BlogTag as any).find().sort({ name: 1 }).select("name slug"),
      BlogPost.aggregate([
        { $match: { status: "PUBLISHED" } },
        { $group: { _id: "$categoryName", count: { $sum: 1 } } },
      ]),
      BlogPost.aggregate([
        { $match: { status: "PUBLISHED" } },
        { $unwind: "$tags" },
        { $match: { tags: { $ne: "" } } },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 25 },
      ]),
    ]);

    // Build category count map
    const countMap: Record<string, number> = {};
    postCategoryCounts.forEach((c: { _id: string; count: number }) => {
      if (c._id) countMap[c._id.toLowerCase()] = c.count;
    });

    const categoryList = allCategories.map((c: any) => ({
      name: c.name,
      slug: c.slug,
      count: countMap[c.name.toLowerCase()] || 0,
    }));

    // If there are post categories not in allCategories, add them
    postCategoryCounts.forEach((c: { _id: string; count: number }) => {
      if (c._id && !categoryList.some((cat: any) => cat.name.toLowerCase() === c._id.toLowerCase())) {
        categoryList.push({
          name: c._id,
          slug: c._id.toLowerCase().replace(/\s+/g, "-"),
          count: c.count,
        });
      }
    });

    // Merge tags from BlogTag collection and any tags attached to posts
    const tagSet = new Map<string, { name: string; slug: string; count: number }>();
    allTags.forEach((t: any) => {
      tagSet.set(t.name.toLowerCase(), {
        name: t.name,
        slug: t.slug,
        count: 0,
      });
    });
    postTagAgg.forEach((pt: { _id: string; count: number }) => {
      if (!pt._id) return;
      const key = pt._id.toLowerCase();
      if (tagSet.has(key)) {
        tagSet.get(key)!.count = pt.count;
      } else {
        tagSet.set(key, {
          name: pt._id,
          slug: pt._id.toLowerCase().replace(/\s+/g, "-"),
          count: pt.count,
        });
      }
    });

    const tagList = Array.from(tagSet.values());

    ok(res, {
      blogs,
      recentPosts,
      categories: categoryList,
      tags: tagList,
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
    const blog = await (BlogPost as any).findOne({ slug, status: "PUBLISHED" }).populate("author");
    if (!blog) throw HttpError.notFound("Blog post not found");

    // Related posts, recent posts, categories with counts, and tags for sidebar
    const [related, recentPosts, allCategories, allTags, postCategoryCounts] = await Promise.all([
      (BlogPost as any).find({
        _id: { $ne: blog._id },
        categoryName: blog.categoryName,
        status: "PUBLISHED",
      })
        .limit(3)
        .select("title slug excerpt featuredImage publishDate readTime categoryName"),
      (BlogPost as any).find({
        _id: { $ne: blog._id },
        status: "PUBLISHED",
      })
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(5)
        .select("title slug excerpt featuredImage publishDate readTime categoryName"),
      (BlogCategory as any).find().sort({ name: 1 }).select("name slug"),
      (BlogTag as any).find().sort({ name: 1 }).select("name slug"),
      BlogPost.aggregate([
        { $match: { status: "PUBLISHED" } },
        { $group: { _id: "$categoryName", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap: Record<string, number> = {};
    postCategoryCounts.forEach((c: { _id: string; count: number }) => {
      if (c._id) countMap[c._id.toLowerCase()] = c.count;
    });

    const categoryList = allCategories.map((c: any) => ({
      name: c.name,
      slug: c.slug,
      count: countMap[c.name.toLowerCase()] || 0,
    }));

    postCategoryCounts.forEach((c: { _id: string; count: number }) => {
      if (c._id && !categoryList.some((cat: any) => cat.name.toLowerCase() === c._id.toLowerCase())) {
        categoryList.push({
          name: c._id,
          slug: c._id.toLowerCase().replace(/\s+/g, "-"),
          count: c.count,
        });
      }
    });

    ok(res, {
      blog,
      related,
      recentPosts,
      categories: categoryList,
      tags: allTags.map((t: any) => ({ name: t.name, slug: t.slug })),
    });
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
      const book = await findBookByIdOrSlug(item.bookId);
      if (!book) throw HttpError.badRequest(`Book with ID or slug "${item.bookId}" not found`);

      if (book.stockQuantity < item.quantity) {
        throw HttpError.badRequest(`Only ${book.stockQuantity} copies of "${book.title}" are in stock`);
      }

      const itemPrice = resolveBookPrice(book, orderCurrency, item.format);
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      const matchedFmt = Array.isArray(book.formats)
        ? book.formats.find((f: any) => f.format?.toLowerCase() === (item.format || "").toLowerCase())
        : null;

      orderItems.push({
        book: book._id as any,
        title: book.title,
        sku: matchedFmt?.sku || book.sku,
        format: item.format || book.format || "E-Book",
        price: itemPrice,
        quantity: item.quantity,
        coverImage: book.coverImage,
        subtotal: itemSubtotal,
        pdfUrl: matchedFmt?.pdfUrl || book.pdfUrl || "",
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
        const discountResult = await calculateCouponDiscount(couponCode, "CHECKOUT", subtotal, orderCurrency);
        discount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;
        await (Coupon as any).updateOne({ code: discountResult.code }, { $inc: { usedCount: 1 } });
      } catch (err: any) {
        throw HttpError.badRequest(err.message || "Invalid coupon code");
      }
    }

    const shippingSettings = await getGroupSetting("shipping", DEFAULT_SHIPPING);
    let shipping = 0;
    if (shippingSettings.enableShipping) {
      const isFree = shippingSettings.enableFreeDelivery && (
        orderCurrency === "INR"
          ? subtotal >= (shippingSettings.freeDeliveryThresholdINR || 0)
          : subtotal >= (shippingSettings.freeDeliveryThresholdUSD || 0)
      );
      shipping = isFree ? 0 : (orderCurrency === "INR" ? (shippingSettings.standardShippingFeeINR || 0) : (shippingSettings.standardShippingFeeUSD || 0));
    }
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxRate = shippingSettings.enableSalesTax ? (shippingSettings.salesTaxPercentage || 0) / 100 : 0;
    const tax = Number((taxableSubtotal * taxRate).toFixed(2));
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
    const isStripe = paymentMethod?.toLowerCase().includes("stripe");
    const transactionId = razorpayPaymentId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const gateway = isStripe ? "stripe" : isRazorpay ? "razorpay" : "simulated_gateway";
    const payment = await Payment.create({
      order: order._id,
      orderNumber,
      transactionId,
      paymentGateway: gateway,
      amount: total,
      currency: orderCurrency,
      status: "SUCCESSFUL",
      paymentMethod: isStripe ? "Stripe" : isRazorpay ? "Razorpay" : paymentMethod || "Credit Card",
      gatewayResponse: isRazorpay
        ? { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId }
        : isStripe
        ? { stripe: true, approved: true }
        : {
            approved: true,
            authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
            simulated: true,
          },
    });

    order.payment = payment._id as any;
    await order.save();

    const customerToken = generateCustomerToken(customer);
    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
      undefined;

    // Send order confirmation receipt via Resend with deep-link & token
    sendOrderConfirmationEmail(order, origin, customerToken).catch((err) =>
      logger.error({ err: err?.message }, "Failed to send order confirmation email")
    );

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
      const book = await findBookByIdOrSlug(item.bookId);
      if (!book) throw HttpError.badRequest(`Book with ID or slug "${item.bookId}" not found`);
      const itemPrice = resolveBookPrice(book, requestedCurrency, item.format);
      subtotal += itemPrice * item.quantity;
    }

    let discount = 0;
    let appliedCouponCode = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      try {
        const discountResult = await calculateCouponDiscount(couponCode, "CHECKOUT", subtotal, requestedCurrency);
        discount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;
      } catch (err: any) {
        throw HttpError.badRequest(err.message || "Invalid coupon code");
      }
    }

    const shippingSettings = await getGroupSetting("shipping", DEFAULT_SHIPPING);
    let shipping = 0;
    if (shippingSettings.enableShipping) {
      const isFree = shippingSettings.enableFreeDelivery && (
        requestedCurrency === "INR"
          ? subtotal >= (shippingSettings.freeDeliveryThresholdINR || 0)
          : subtotal >= (shippingSettings.freeDeliveryThresholdUSD || 0)
      );
      shipping = isFree ? 0 : (requestedCurrency === "INR" ? (shippingSettings.standardShippingFeeINR || 0) : (shippingSettings.standardShippingFeeUSD || 0));
    }
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxRate = shippingSettings.enableSalesTax ? (shippingSettings.salesTaxPercentage || 0) / 100 : 0;
    const tax = Number((taxableSubtotal * taxRate).toFixed(2));
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

  // ─── Public Stripe Book Order Session Creation ───
  async createBookStripeSession(req: Request, res: Response) {
    const { items, customerInfo, couponCode, currency } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw HttpError.badRequest("No items in cart");
    }

    const requestedCurrency: "USD" | "INR" = currency === "INR" ? "INR" : "USD";

    const resolvedItems: any[] = [];
    let subtotal = 0;
    for (const item of items) {
      const book = await findBookByIdOrSlug(item.bookId);
      if (!book) throw HttpError.badRequest(`Book with ID or slug "${item.bookId}" not found`);
      if (book.stockQuantity < item.quantity) {
        throw HttpError.badRequest(`Only ${book.stockQuantity} copies of "${book.title}" are in stock`);
      }
      const itemPrice = resolveBookPrice(book, requestedCurrency, item.format);
      subtotal += itemPrice * item.quantity;
      resolvedItems.push({
        bookId: book._id.toString(),
        title: book.title,
        price: itemPrice,
        quantity: item.quantity,
        format: item.format || book.format || "E-Book",
        coverImage: book.coverImage,
      });
    }

    let discount = 0;
    let appliedCouponCode = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      try {
        const discountResult = await calculateCouponDiscount(couponCode, "CHECKOUT", subtotal, requestedCurrency);
        discount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;
      } catch (err: any) {
        throw HttpError.badRequest(err.message || "Invalid coupon code");
      }
    }

    const shippingSettings = await getGroupSetting("shipping", DEFAULT_SHIPPING);
    let shipping = 0;
    if (shippingSettings.enableShipping) {
      const isFree = shippingSettings.enableFreeDelivery && (
        requestedCurrency === "INR"
          ? subtotal >= (shippingSettings.freeDeliveryThresholdINR || 0)
          : subtotal >= (shippingSettings.freeDeliveryThresholdUSD || 0)
      );
      shipping = isFree ? 0 : (requestedCurrency === "INR" ? (shippingSettings.standardShippingFeeINR || 0) : (shippingSettings.standardShippingFeeUSD || 0));
    }
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxRate = shippingSettings.enableSalesTax ? (shippingSettings.salesTaxPercentage || 0) / 100 : 0;
    const tax = Number((taxableSubtotal * taxRate).toFixed(2));
    const total = Math.max(0, Number((subtotal - discount + shipping + tax).toFixed(2)));

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
      env.APP_URL;

    const returnUrl = `${origin}/order-success/${orderNumber}?session_id={CHECKOUT_SESSION_ID}`;
    const successUrl = returnUrl;
    const cancelUrl = `${origin}/checkout?stripe_cancelled=true`;

    const session = await stripeService.createBookCheckoutSession({
      orderNumber,
      items: resolvedItems,
      customerInfo: customerInfo || { name: "Valued Reader", email: "reader@arriveatorigin.com" },
      subtotal,
      discount,
      shipping,
      tax,
      total,
      currency: requestedCurrency,
      couponCode: appliedCouponCode,
      successUrl,
      cancelUrl,
      returnUrl,
      uiMode: req.body.uiMode || "embedded",
    });

    ok(res, {
      orderNumber,
      sessionId: session.id,
      clientSecret: session.client_secret,
      sessionUrl: session.url,
      total,
      currency: requestedCurrency,
      subtotal,
      discount,
      shipping,
      tax,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    });
  },

  // ─── Public Stripe Book Order Verification ───
  async verifyBookStripeSession(req: Request, res: Response) {
    const {
      sessionId,
      orderNumber,
      customerInfo,
      items,
      shippingAddress,
      billingAddress,
      couponCode,
      currency,
    } = req.body;

    if (!sessionId) {
      throw HttpError.badRequest("Stripe session ID is required");
    }

    const session = await stripeService.retrieveSession(sessionId);
    if (session.payment_status !== "paid") {
      throw HttpError.badRequest(`Stripe payment not completed (status: ${session.payment_status})`);
    }

    const targetOrderNumber = session.client_reference_id || orderNumber || session.metadata?.orderNumber;

    // Check if order already created
    const searchFilter: any[] = [];
    if (targetOrderNumber) searchFilter.push({ orderNumber: targetOrderNumber });
    if (sessionId) searchFilter.push({ notes: { $regex: sessionId } });

    let existingOrder = searchFilter.length > 0
      ? await (Order as any).findOne({ $or: searchFilter }).populate("customer")
      : null;

    if (existingOrder) {
      const customerToken = existingOrder.customer ? generateCustomerToken(existingOrder.customer as any) : undefined;
      return ok(res, {
        orderNumber: existingOrder.orderNumber,
        total: existingOrder.total,
        orderId: existingOrder._id,
        items: existingOrder.items,
        customerInfo: existingOrder.customerInfo,
        customerToken,
        customer: existingOrder.customer,
      }, "Order verified");
    }

    const orderCurrency: "USD" | "INR" = (session.metadata?.currency === "INR" || currency === "INR") ? "INR" : "USD";
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    const itemsToProcess = items && Array.isArray(items) && items.length > 0 ? items : [];

    for (const item of itemsToProcess) {
      const book = await findBookByIdOrSlug(item.bookId);
      if (!book) continue;

      const itemPrice = resolveBookPrice(book, orderCurrency, item.format);
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      const matchedFmt = Array.isArray(book.formats)
        ? book.formats.find((f: any) => f.format?.toLowerCase() === (item.format || "").toLowerCase())
        : null;

      orderItems.push({
        book: book._id as any,
        title: book.title,
        sku: matchedFmt?.sku || book.sku,
        format: item.format || book.format || "E-Book",
        price: itemPrice,
        quantity: item.quantity,
        coverImage: book.coverImage,
        subtotal: itemSubtotal,
        pdfUrl: matchedFmt?.pdfUrl || book.pdfUrl || "",
      });

      book.stockQuantity = Math.max(0, book.stockQuantity - item.quantity);
      book.salesCount += item.quantity;
      book.revenue += itemSubtotal;
      if (book.stockQuantity <= 0) {
        book.status = "OUT_OF_STOCK";
      }
      await book.save();
    }

    const finalCustomerInfo = customerInfo || {
      name: session.metadata?.customerName || session.customer_details?.name || "Valued Reader",
      email: session.metadata?.customerEmail || session.customer_details?.email || "customer@arriveatorigin.com",
      phone: session.metadata?.customerPhone || session.customer_details?.phone || "",
    };

    const appliedCouponCode = session.metadata?.couponCode || couponCode || "";
    let discount = 0;
    if (appliedCouponCode) {
      try {
        const discountResult = await calculateCouponDiscount(appliedCouponCode, "CHECKOUT", subtotal, orderCurrency);
        discount = discountResult.discountAmount;
        await (Coupon as any).updateOne({ code: appliedCouponCode }, { $inc: { usedCount: 1 } });
      } catch (_) {}
    }

    const total = Number(session.metadata?.totalAmount) || (session.amount_total ? session.amount_total / 100 : subtotal - discount);

    let customer = await (Customer as any).findOne({ email: finalCustomerInfo.email.toLowerCase() });
    if (!customer) {
      customer = await Customer.create({
        name: finalCustomerInfo.name,
        email: finalCustomerInfo.email.toLowerCase(),
        phone: finalCustomerInfo.phone || "",
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

    const resolvedOrderNumber = targetOrderNumber || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let order: any;
    try {
      order = await Order.create({
        orderNumber: resolvedOrderNumber,
        orderType: "BOOK_ORDER",
        customer: customer._id,
        customerInfo: {
          name: finalCustomerInfo.name,
          email: finalCustomerInfo.email.toLowerCase(),
          phone: finalCustomerInfo.phone || "",
        },
        items: orderItems,
        subtotal,
        shipping: 0,
        tax: 0,
        discount,
        couponCode: appliedCouponCode,
        total,
        currency: orderCurrency,
        paymentStatus: "PAID",
        orderStatus: "PAYMENT_CONFIRMED",
        shippingAddress: shippingAddress || {},
        billingAddress: billingAddress || shippingAddress || {},
        notes: `Stripe Checkout paid (Session: ${sessionId}). ${appliedCouponCode ? `Coupon: ${appliedCouponCode}` : ""}`,
      });
    } catch (createErr: any) {
      if (createErr?.code === 11000 || createErr?.message?.includes("E11000 duplicate key")) {
        const raceOrder = await (Order as any).findOne({
          $or: [{ orderNumber: resolvedOrderNumber }, { notes: { $regex: sessionId } }],
        }).populate("customer");
        if (raceOrder) {
          const customerToken = raceOrder.customer ? generateCustomerToken(raceOrder.customer as any) : undefined;
          return ok(res, {
            orderNumber: raceOrder.orderNumber,
            total: raceOrder.total,
            orderId: raceOrder._id,
            items: raceOrder.items,
            customerInfo: raceOrder.customerInfo,
            customerToken,
            customer: raceOrder.customer,
          }, "Order already verified");
        }
      }
      throw createErr;
    }

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || session.id;

    try {
      const payment = await Payment.create({
        order: order._id,
        orderNumber: resolvedOrderNumber,
        transactionId: paymentIntentId,
        paymentGateway: "stripe",
        amount: total,
        currency: orderCurrency,
        status: "SUCCESSFUL",
        paymentMethod: "Stripe",
        gatewayResponse: {
          stripeSessionId: session.id,
          paymentIntentId,
          customerDetails: session.customer_details,
        },
      });

      order.payment = payment._id as any;
      await order.save();
    } catch (payErr: any) {
      logger.warn({ payErr: payErr?.message }, "Payment record already created or skipped in concurrency");
    }

    const customerToken = generateCustomerToken(customer);
    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
      undefined;

    sendOrderConfirmationEmail(order, origin, customerToken).catch((err) =>
      logger.error({ err: err?.message }, "Failed to send order confirmation email")
    );

    return ok(res, {
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
    }, "Order verified and placed successfully", 201);
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

  // ─── Public Shipping Settings ───
  async getShippingSettings(_req: Request, res: Response) {
    const shipping = await getGroupSetting("shipping", DEFAULT_SHIPPING);
    ok(res, { shipping });
  },

  // ─── Download / View Book Soft Copy PDF ───
  async downloadBookPdf(req: Request, res: Response) {
    const idOrSlug = (req.params.idOrSlug as string) || "";
    if (!idOrSlug) throw HttpError.badRequest("Publication identifier is required");
    const book = await findBookByIdOrSlug(idOrSlug);
    if (!book) throw HttpError.notFound("Publication not found");

    const pdfFilename: string = book.pdfUrl
      ? path.basename(book.pdfUrl)
      : `${book.slug || "book"}.pdf`;

    const candidatePaths = [
      path.resolve(uploadDir, "ebooks", pdfFilename),
      path.resolve(uploadDir, pdfFilename),
      path.resolve(process.cwd(), "uploads/ebooks", pdfFilename),
      path.resolve(process.cwd(), "../frontend/public/ebooks", pdfFilename),
    ];

    let foundPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!foundPath) {
      // Fallback to first available ebook in uploads/ebooks
      const fallbackDir = path.resolve(uploadDir, "ebooks");
      if (fs.existsSync(fallbackDir)) {
        const files = fs.readdirSync(fallbackDir).filter((f) => f.endsWith(".pdf"));
        if (files.length > 0 && files[0]) {
          foundPath = path.join(fallbackDir, files[0]);
        }
      }
    }

    if (!foundPath || !fs.existsSync(foundPath)) {
      throw HttpError.notFound("Digital copy file is not currently available for this publication");
    }

    const isDownload = req.query.download === "true";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${pdfFilename}"`
    );

    const stream = fs.createReadStream(foundPath);
    stream.pipe(res);
  },
};
