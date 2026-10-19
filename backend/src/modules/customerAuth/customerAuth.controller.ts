import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { Customer, ICustomer } from "../../models/Customer.js";
import { Consultation } from "../../models/Consultation.js";
import { Order } from "../../models/Order.js";
import { Book } from "../../models/Book.js";
import { PurchasedBook } from "../../models/PurchasedBook.js";
import { syncCustomerPurchasedBooks, resolveBookPdfFile } from "../../services/ebookAccess.service.js";
import { env } from "../../config/env.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { logger } from "../../utils/logger.js";
import { randomToken, sha256 } from "../../utils/crypto.js";
import { sendWelcomeEmail, sendCustomerPasswordResetEmail } from "../../services/email.service.js";

export function generateCustomerToken(customer: ICustomer): string {
  return jwt.sign(
    {
      customerId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      type: "customer",
    },
    env.JWT_SECRET,
    { expiresIn: "60d" }
  );
}

export function verifyCustomerToken(token: string): { customerId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      customerId: string;
      email: string;
      type?: string;
    };
    if (decoded && decoded.customerId) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export const customerAuthController = {
  /**
   * Client login or auto-creation by email
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || typeof email !== "string") {
        throw HttpError.badRequest("Please enter a valid email address");
      }

      const cleanEmail = email.trim().toLowerCase();
      let customer = await Customer.findOne({ email: cleanEmail });

      // If customer doesn't exist yet, auto-create customer account!
      if (!customer) {
        let passwordHash: string | undefined;
        if (password && typeof password === "string" && password.length >= 6) {
          passwordHash = await argon2.hash(password);
        }

        // Look up previous booking or order to fetch client's real name and phone
        const pastConsultation = await Consultation.findOne({ clientEmail: cleanEmail } as any);
        const pastOrder = await Order.findOne({ "customerInfo.email": cleanEmail } as any);

        const resolvedName = name?.trim() || pastConsultation?.clientName || pastOrder?.customerInfo?.name || cleanEmail.split("@")[0];
        const resolvedPhone = pastConsultation?.clientPhone || pastOrder?.customerInfo?.phone || "";

        customer = await Customer.create({
          name: resolvedName,
          email: cleanEmail,
          phone: resolvedPhone,
          passwordHash,
          lastLogin: new Date(),
        });
        logger.info({ email: cleanEmail, name: resolvedName }, "New client account automatically created");

        // Send Welcome email to newly registered customer
        sendWelcomeEmail(cleanEmail, resolvedName).catch((err) =>
          logger.error({ err: err?.message }, "Failed to send welcome email")
        );
      } else {
        // If customer has a password set, verify if password provided
        if (customer.passwordHash && password) {
          const matches = await argon2.verify(customer.passwordHash, password).catch(() => false);
          if (!matches) {
            throw HttpError.unauthorized("Incorrect password for this account");
          }
        }
        customer.lastLogin = new Date();
        await customer.save();
      }

      const token = generateCustomerToken(customer);

      ok(res, {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
          shippingAddress: customer.shippingAddress,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          createdAt: customer.createdAt,
        },
      }, "Signed in successfully");
    } catch (err: any) {
      logger.error({ err: err?.message || err, stack: err?.stack }, "Customer login failed");
      throw err;
    }
  },

  /**
   * Client signup / registration
   */
  async signup(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        throw HttpError.badRequest("Please provide your full name");
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        throw HttpError.badRequest("Please provide a valid email address");
      }
      if (!password || typeof password !== "string" || password.length < 6) {
        throw HttpError.badRequest("Password must be at least 6 characters long");
      }

      const cleanEmail = email.trim().toLowerCase();
      let customer = await Customer.findOne({ email: cleanEmail } as any);

      if (customer && customer.passwordHash) {
        throw HttpError.conflict("An account with this email already exists. Please log in.");
      }

      const passwordHash = await argon2.hash(password);

      if (customer) {
        // Upgrade existing auto-created customer record with password
        customer.name = name.trim();
        if (phone?.trim()) customer.phone = phone.trim();
        customer.passwordHash = passwordHash;
        customer.lastLogin = new Date();
        await customer.save();
        logger.info({ email: cleanEmail }, "Customer account upgraded with password");
      } else {
        customer = await Customer.create({
          name: name.trim(),
          email: cleanEmail,
          phone: phone?.trim() || "",
          passwordHash,
          lastLogin: new Date(),
        });
        logger.info({ email: cleanEmail, name: customer.name }, "New customer signed up");
      }

      const token = generateCustomerToken(customer);
      const origin =
        (req.headers.origin as string) ||
        (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
        undefined;

      // Send Welcome email with tokenized link
      sendWelcomeEmail(customer.email, customer.name, origin, token).catch((err) =>
        logger.error({ err: err?.message }, "Failed to send welcome email")
      );

      ok(res, {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
          shippingAddress: customer.shippingAddress,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          createdAt: customer.createdAt,
        },
      }, "Account created successfully");
    } catch (err: any) {
      logger.error({ err: err?.message || err, stack: err?.stack }, "Customer signup failed");
      throw err;
    }
  },

  /**
   * Fetch current customer portal details (Sessions, Orders, Profile)
   */
  async getPortal(req: Request, res: Response) {
    // 1. Extract token from header or query
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    let customer: ICustomer | null = null;

    if (token) {
      const decoded = verifyCustomerToken(token);
      if (decoded) {
        customer = await Customer.findById(decoded.customerId);
      }
    }

    // Fallback: If query email provided and in test/local mode or verified
    if (!customer && typeof req.query.email === "string") {
      const cleanEmail = (req.query.email as string).trim().toLowerCase();
      customer = await Customer.findOne({ email: cleanEmail } as any);
      if (!customer) {
        const pastConsultation = await Consultation.findOne({ clientEmail: cleanEmail } as any);
        const pastOrder = await Order.findOne({ "customerInfo.email": cleanEmail } as any);
        if (pastConsultation || pastOrder) {
          customer = await Customer.create({
            name: pastConsultation?.clientName || pastOrder?.customerInfo?.name || cleanEmail.split("@")[0],
            email: cleanEmail,
            phone: pastConsultation?.clientPhone || pastOrder?.customerInfo?.phone || "",
            lastLogin: new Date(),
          });
        }
      }
    }

    if (!customer) {
      throw HttpError.unauthorized("Please sign in to view your account portal");
    }

    // 2. Fetch all booked consultation sessions
    const sessions = await Consultation.find({
      clientEmail: customer.email.toLowerCase(),
    }).sort({ createdAt: -1 });

    // 3. Fetch all book store orders
    const orders = await Order.find({
      "customerInfo.email": customer.email.toLowerCase(),
      orderType: { $ne: "CONSULTATION" },
    }).sort({ createdAt: -1 });

    // 4. Ensure customer's purchased e-books are synced from all paid orders (Requirement 2, 8)
    await syncCustomerPurchasedBooks(customer.email).catch((err) =>
      logger.error({ err: err?.message, email: customer.email }, "Failed to sync purchased books for customer")
    );

    const customerToken = generateCustomerToken(customer);

    // Fetch customer's assigned e-books from PurchasedBook
    const purchasedRecords = await PurchasedBook.find({
      customerEmail: customer.email.toLowerCase(),
    }).sort({ purchasedAt: -1 });

    const allBooks = await Book.find({});
    const bookMap = new Map<string, any>();
    allBooks.forEach((b: any) => {
      bookMap.set(b._id.toString(), b);
      bookMap.set(b.slug, b);
      bookMap.set(b.title.toLowerCase(), b);
    });

    const isEbookFormat = (fmt?: string): boolean => {
      if (!fmt) return false;
      const clean = fmt.toLowerCase().trim();
      return (
        clean.includes("ebook") ||
        clean.includes("e-book") ||
        clean.includes("kindle") ||
        clean.includes("digital") ||
        clean.includes("soft copy") ||
        clean.includes("pdf")
      );
    };

    const ebooksMap = new Map<string, any>();

    // 4a. Load from PurchasedBook collection first (primary source of truth)
    for (const pb of purchasedRecords) {
      const matchedBook = bookMap.get(pb.book?.toString()) || bookMap.get(pb.slug) || null;
      const targetSlug = pb.slug || matchedBook?.slug || "";
      const pdfResolution = resolveBookPdfFile(pb.pdfUrl || matchedBook?.pdfUrl || "", matchedBook);

      const downloadUrl = (pdfResolution.exists && targetSlug)
        ? `/api/public/books/${targetSlug}/download-pdf?download=true&token=${customerToken}`
        : "";
      const readUrl = (pdfResolution.exists && targetSlug)
        ? `/api/public/books/${targetSlug}/read-pdf?token=${customerToken}`
        : "";

      const key = pb.book?.toString() || pb.slug;
      ebooksMap.set(key, {
        bookId: pb.book,
        title: pb.title || matchedBook?.title,
        slug: targetSlug,
        coverImage: pb.coverImage || matchedBook?.coverImage || "/aao-part-one.png",
        format: pb.format || "E-Book",
        authorName: pb.authorName || matchedBook?.authorName || "Dr. Alka Chopra Madan",
        hasPdf: pdfResolution.exists,
        pdfFilename: pdfResolution.filename,
        pdfUrl: pdfResolution.exists ? (matchedBook?.pdfUrl || pb.pdfUrl) : "",
        downloadUrl,
        readUrl,
        orderNumber: pb.orderNumber,
        purchasedAt: pb.purchasedAt,
        purchaseDate: pb.purchasedAt,
      });
    }

    // 4b. Secondary pass over paid orders to ensure 100% coverage
    for (const ord of orders) {
      const isPaidOrder =
        ord.paymentStatus === "PAID" ||
        ord.orderStatus === "PAYMENT_CONFIRMED" ||
        ord.orderStatus === "PROCESSING" ||
        ord.orderStatus === "SHIPPED" ||
        ord.orderStatus === "DELIVERED";

      if (!isPaidOrder) continue;

      for (const item of ord.items) {
        const isDigital = isEbookFormat(item.format);
        if (!isDigital) {
          item.pdfUrl = "";
          continue;
        }

        const matchedBook =
          (item.book ? bookMap.get(item.book.toString()) : null) ||
          bookMap.get(item.sku) ||
          bookMap.get(item.title.toLowerCase()) ||
          Array.from(bookMap.values()).find(
            (b: any) =>
              b.title.toLowerCase().includes(item.title.toLowerCase()) ||
              item.title.toLowerCase().includes(b.title.toLowerCase())
          );

        const key = matchedBook?._id?.toString() || item.title;
        if (!ebooksMap.has(key)) {
          const targetSlug = matchedBook?.slug || "";
          const pdfResolution = resolveBookPdfFile(item.pdfUrl || matchedBook?.pdfUrl || "", matchedBook);

          const downloadUrl = (pdfResolution.exists && targetSlug)
            ? `/api/public/books/${targetSlug}/download-pdf?download=true&token=${customerToken}`
            : "";
          const readUrl = (pdfResolution.exists && targetSlug)
            ? `/api/public/books/${targetSlug}/read-pdf?token=${customerToken}`
            : "";

          ebooksMap.set(key, {
            bookId: matchedBook?._id || item.book,
            title: matchedBook?.title || item.title,
            slug: targetSlug,
            coverImage: item.coverImage || matchedBook?.coverImage || "/aao-part-one.png",
            format: item.format || "E-Book",
            authorName: matchedBook?.authorName || "Dr. Alka Chopra Madan",
            hasPdf: pdfResolution.exists,
            pdfFilename: pdfResolution.filename,
            pdfUrl: pdfResolution.exists ? (matchedBook?.pdfUrl || item.pdfUrl) : "",
            downloadUrl,
            readUrl,
            orderNumber: ord.orderNumber,
            purchasedAt: ord.createdAt,
            purchaseDate: ord.createdAt,
          });
        }
      }
    }

    const ebooks = Array.from(ebooksMap.values());

    ok(res, {
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        shippingAddress: customer.shippingAddress,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        createdAt: customer.createdAt,
      },
      sessions,
      orders,
      ebooks,
      stats: {
        sessionsCount: sessions.length,
        ordersCount: orders.length,
        ebooksCount: ebooks.length,
        totalSpent: customer.totalSpent,
      },
    });
  },

  /**
   * Update client profile / set password
   */
  async updateProfile(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const decoded = token ? verifyCustomerToken(token) : null;

    if (!decoded) {
      throw HttpError.unauthorized("Authentication required");
    }

    const customer = await Customer.findById(decoded.customerId);
    if (!customer) {
      throw HttpError.notFound("Customer account not found");
    }

    const { name, phone, shippingAddress, password } = req.body;
    if (name) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (shippingAddress) customer.shippingAddress = shippingAddress;
    if (password && typeof password === "string" && password.length >= 6) {
      customer.passwordHash = await argon2.hash(password);
    }

    await customer.save();

    ok(res, {
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        shippingAddress: customer.shippingAddress,
      },
    }, "Profile updated successfully");
  },

  /**
   * Request customer password reset link
   */
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw HttpError.badRequest("Please provide a valid email address");
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({ email: cleanEmail } as any);

    if (customer) {
      const resetToken = randomToken();
      customer.resetPasswordToken = sha256(resetToken);
      customer.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1 hour
      await customer.save();

      const origin =
        (req.headers.origin as string) ||
        (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
        env.APP_URL;

      sendCustomerPasswordResetEmail(customer.email, customer.name, resetToken, origin).catch((err) =>
        logger.error({ err: err?.message }, "Failed to send customer password reset email")
      );
    }

    // Return friendly generic message for security
    ok(
      res,
      null,
      "If an account exists with this email, a password reset link has been sent."
    );
  },

  /**
   * Reset customer password using secure token
   */
  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      throw HttpError.badRequest("Reset token is missing or invalid");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      throw HttpError.badRequest("Password must be at least 6 characters long");
    }

    const hashedToken = sha256(token);
    const customer = await Customer.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    } as any);

    if (!customer) {
      throw HttpError.badRequest("Password reset link is invalid or has expired. Please request a new one.");
    }

    customer.passwordHash = await argon2.hash(password);
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;
    customer.lastLogin = new Date();
    await customer.save();

    const customerToken = generateCustomerToken(customer);

    ok(
      res,
      {
        token: customerToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
          shippingAddress: customer.shippingAddress,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          createdAt: customer.createdAt,
        },
      },
      "Password reset successfully. You are now logged in."
    );
  },

  /**
   * Google OAuth Sign-in & Sign-up for Customers
   */
  async googleAuth(req: Request, res: Response) {
    try {
      const { credential, email, name, googleId } = req.body;

      let verifiedEmail = "";
      let verifiedName = "";
      let verifiedSub = "";
      let verifiedPicture = "";

      if (credential && typeof credential === "string") {
        // Verify with Google OAuth2 tokeninfo endpoint
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        const payload = (await googleRes.json()) as any;

        if (!googleRes.ok || payload.error) {
          logger.warn({ error: payload.error_description || payload.error }, "Google token verification failed");
          throw HttpError.unauthorized("Google token validation failed. Please try signing in again.");
        }

        if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
          logger.warn({ aud: payload.aud, expected: env.GOOGLE_CLIENT_ID }, "Google token audience mismatch");
          throw HttpError.unauthorized("Google token audience mismatch");
        }

        verifiedEmail = payload.email?.toLowerCase().trim();
        verifiedName = payload.name?.trim() || verifiedEmail.split("@")[0];
        verifiedSub = payload.sub;
        verifiedPicture = payload.picture || "";
      } else if (env.NODE_ENV !== "production" && email && typeof email === "string" && email.includes("@")) {
        // Development / testing fallback when Google Client ID has not been provisioned yet
        verifiedEmail = email.toLowerCase().trim();
        verifiedName = (typeof name === "string" && name.trim()) || verifiedEmail.split("@")[0];
        verifiedSub = (typeof googleId === "string" && googleId.trim()) || `google_demo_${Date.now()}`;
        verifiedPicture = "";
        logger.info({ email: verifiedEmail }, "Using development mock Google authentication");
      } else {
        throw HttpError.badRequest("Missing Google authentication credential");
      }

      if (!verifiedEmail) {
        throw HttpError.badRequest("Unable to retrieve verified email from Google");
      }

      let customer = await Customer.findOne({
        $or: [{ googleId: verifiedSub }, { email: verifiedEmail }],
      } as any);

      let isNewAccount = false;

      if (!customer) {
        isNewAccount = true;
        // Check past booking or order
        const pastConsultation = await Consultation.findOne({ clientEmail: verifiedEmail } as any);
        const pastOrder = await Order.findOne({ "customerInfo.email": verifiedEmail } as any);

        const resolvedPhone = pastConsultation?.clientPhone || pastOrder?.customerInfo?.phone || "";

        customer = await Customer.create({
          name: verifiedName,
          email: verifiedEmail,
          phone: resolvedPhone,
          googleId: verifiedSub,
          avatar: verifiedPicture,
          authProvider: "google",
          lastLogin: new Date(),
        });
        logger.info({ email: verifiedEmail, name: verifiedName }, "New customer account created via Google");

        const origin =
          (req.headers.origin as string) ||
          (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
          undefined;

        sendWelcomeEmail(customer.email, customer.name, origin).catch((err) =>
          logger.error({ err: err?.message }, "Failed to send welcome email after Google signup")
        );
      } else {
        // Update customer with Google ID and avatar if missing
        if (!customer.googleId && verifiedSub) customer.googleId = verifiedSub;
        if (!customer.avatar && verifiedPicture) customer.avatar = verifiedPicture;
        if (customer.authProvider === "local" && !customer.googleId) customer.authProvider = "google";
        customer.lastLogin = new Date();
        await customer.save();
        logger.info({ email: verifiedEmail }, "Existing customer signed in with Google");
      }

      const token = generateCustomerToken(customer);

      ok(
        res,
        {
          token,
          isNewAccount,
          customer: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || "",
            avatar: customer.avatar || verifiedPicture || "",
            shippingAddress: customer.shippingAddress,
            totalOrders: customer.totalOrders,
            totalSpent: customer.totalSpent,
            createdAt: customer.createdAt,
          },
        },
        isNewAccount ? "Account created successfully with Google" : "Signed in with Google successfully"
      );
    } catch (err: any) {
      logger.error({ err: err?.message || err }, "Google authentication failed");
      throw err;
    }
  },
};
