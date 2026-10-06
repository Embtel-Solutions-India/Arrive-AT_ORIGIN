import type { Request, Response } from "express";
import { Consultation } from "../../models/Consultation.js";
import { Order } from "../../models/Order.js";
import { Payment } from "../../models/Payment.js";
import { Customer } from "../../models/Customer.js";
import { razorpayService } from "../../services/razorpay.service.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { generateCustomerToken } from "../customerAuth/customerAuth.controller.js";
import { sendConsultationConfirmationEmail } from "../../services/email.service.js";

export const CONSULTATION_PACKAGES = [
  {
    id: "silver-single",
    name: "Silver - Single Consultation",
    meetingType: "1-on-1 Metaphysical Diagnostic & Counsel",
    sessionsCount: 1,
    duration: "60 Minutes",
    price: 250,
    currency: "USD",
    badge: "Starter",
    description: "Start your wellness journey – book a single 1-on-1 deep metaphysical session with Dr. Alka Chopra Madan.",
    features: [
      "Initial energetic & subconscious assessment",
      "Concept Clearing technique introduction",
      "Actionable holistic alignment roadmap",
      "Private session summary & recommendations",
    ],
  },
  {
    id: "relationship-alignment",
    name: "Relationship & Spiritual Harmony",
    meetingType: "Couples & Family Metaphysical Alignment",
    sessionsCount: 1,
    duration: "90 Minutes",
    price: 350,
    currency: "USD",
    badge: "Spiritual Alignment",
    description: "Specialized joint spiritual counsel, clearing relational conditioning and emotional discord.",
    features: [
      "90-min joint or family counsel",
      "Harmonization of interpersonal field",
      "Conflict clearing & meta-human communication",
      "Guided induced calmness exercises",
    ],
  },
  {
    id: "stress-grief-intensive",
    name: "Grief & Trauma Release Intensive",
    meetingType: "Emotional Freedom & Stress Alleviation",
    sessionsCount: 2,
    duration: "2 x 60 Min Sessions",
    price: 600,
    currency: "USD",
    badge: "Intensive",
    description: "Targeted metaphysical release of chronic grief, traumatic memory weight, and subconscious tension.",
    features: [
      "Two dedicated deep-dive sessions",
      "Somatic & metaphysical grief release",
      "Nervous system recalibration",
      "Direct follow-up check-in",
    ],
  },
  {
    id: "gold-package",
    name: "Gold - Wellness Series",
    meetingType: "5-Session Holistic Transformation Sequence",
    sessionsCount: 5,
    duration: "5 x 60 Min Sessions",
    price: 1250,
    currency: "USD",
    badge: "Most Popular",
    featured: true,
    description: "Boost your well-being with a comprehensive package of five curated metaphysical sessions.",
    features: [
      "Five 60-minute scheduled sessions",
      "Full Arrive at Origin (AAO) curriculum",
      "Ongoing personal energetic monitoring",
      "Priority scheduling & email support",
    ],
  },
  {
    id: "platinum-mastery",
    name: "Platinum - Life Transformation Experience",
    meetingType: "10-Session Comprehensive Metaphysical Mastery",
    sessionsCount: 10,
    duration: "10 x 60 Min Sessions",
    price: 2500,
    currency: "USD",
    badge: "Total Transformation",
    description: "Dive into a deeply transformative experience with ten sessions for total life calibration and spiritual freedom.",
    features: [
      "Ten 60-minute scheduled sessions",
      "Complete concept clearing & meta-human mastery",
      "Direct phone / priority access for urgent counsel",
      "Personalized meditation & contemplation roadmap",
    ],
  },
];

export const consultationController = {
  /**
   * Get available consultation packages with current prices
   */
  async getPackages(_req: Request, res: Response) {
    ok(res, {
      packages: CONSULTATION_PACKAGES,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    });
  },

  /**
   * Initiate a consultation booking and generate Razorpay order
   */
  async createBookingOrder(req: Request, res: Response) {
    const {
      packageId,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate,
      appointmentTime,
      meetingMode = "ONLINE_ZOOM",
      notes = "",
    } = req.body;

    if (!packageId || !clientName || !clientEmail || !appointmentDate || !appointmentTime) {
      throw HttpError.badRequest("Please fill in all required booking fields");
    }

    const selectedPackage = CONSULTATION_PACKAGES.find((p) => p.id === packageId);
    if (!selectedPackage) {
      throw HttpError.badRequest("Invalid consultation package selected");
    }

    // Generate unique booking number
    const bookingNumber = `SB-CNS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Razorpay Order
    const rzpOrder = await razorpayService.createOrder({
      amount: selectedPackage.price,
      currency: selectedPackage.currency,
      receipt: bookingNumber,
      notes: {
        bookingNumber,
        clientName,
        clientEmail,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
      },
    });

    // Create initial Consultation record
    const consultation = await Consultation.create({
      bookingNumber,
      clientName,
      clientEmail: clientEmail.toLowerCase(),
      clientPhone: clientPhone || "",
      packageName: selectedPackage.name,
      meetingType: selectedPackage.meetingType,
      sessionsCount: selectedPackage.sessionsCount,
      price: selectedPackage.price,
      currency: (rzpOrder as any).currency || selectedPackage.currency,
      appointmentDate,
      appointmentTime,
      meetingMode,
      notes,
      paymentStatus: "PENDING",
      status: "CONFIRMED",
      razorpayOrderId: rzpOrder.id,
    });

    ok(
      res,
      {
        bookingNumber,
        bookingId: consultation._id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount, // smallest currency unit (e.g. cents/paise)
        currency: rzpOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
      },
      "Booking initiated. Complete payment to confirm.",
      201
    );
  },

  /**
   * Verify Razorpay payment signature and confirm booking
   */
  async verifyPayment(req: Request, res: Response) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingNumber,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw HttpError.badRequest("Missing payment verification parameters");
    }

    // Cryptographic signature check
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      throw HttpError.badRequest("Payment signature verification failed");
    }

    // Find consultation by booking number or order ID
    const consultation = await Consultation.findOne({
      $or: [{ bookingNumber }, { razorpayOrderId: razorpay_order_id }],
    });

    if (!consultation) {
      throw HttpError.notFound("Consultation record not found for verification");
    }

    // Upsert Customer in database
    let customer = await Customer.findOne({ email: consultation.clientEmail });
    if (!customer) {
      customer = await Customer.create({
        name: consultation.clientName,
        email: consultation.clientEmail,
        phone: consultation.clientPhone,
        totalOrders: 1,
        totalSpent: consultation.price,
        lastOrderDate: new Date(),
      });
    } else {
      customer.totalOrders += 1;
      customer.totalSpent += consultation.price;
      customer.lastOrderDate = new Date();
      if (consultation.clientPhone && !customer.phone) {
        customer.phone = consultation.clientPhone;
      }
      await customer.save();
    }

    // Create Order entry in Orders system for unified admin tracking
    const order = await Order.create({
      orderNumber: consultation.bookingNumber,
      orderType: "CONSULTATION",
      customer: customer._id,
      customerInfo: {
        name: consultation.clientName,
        email: consultation.clientEmail,
        phone: consultation.clientPhone,
      },
      items: [
        {
          title: `Consultation: ${consultation.packageName}`,
          sku: `CNS-${consultation.sessionsCount}`,
          format: `${consultation.sessionsCount} Session(s) • ${consultation.meetingMode.replace("_", " ")}`,
          price: consultation.price,
          quantity: 1,
          subtotal: consultation.price,
        },
      ],
      subtotal: consultation.price,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: consultation.price,
      currency: consultation.currency,
      paymentStatus: "PAID",
      orderStatus: "PAYMENT_CONFIRMED",
      notes: `Appointment scheduled for ${consultation.appointmentDate} at ${consultation.appointmentTime} (${consultation.meetingMode}). Client notes: ${consultation.notes || "None"}`,
    });

    // Create Payment entry in database
    const payment = await Payment.create({
      order: order._id,
      orderNumber: consultation.bookingNumber,
      transactionId: razorpay_payment_id,
      paymentGateway: "razorpay",
      amount: consultation.price,
      currency: consultation.currency,
      status: "SUCCESSFUL",
      paymentMethod: "Razorpay",
      gatewayResponse: {
        razorpay_order_id,
        razorpay_payment_id,
      },
    });

    order.payment = payment._id as any;
    await order.save();

    // Update Consultation
    consultation.paymentStatus = "PAID";
    consultation.status = "CONFIRMED";
    consultation.razorpayPaymentId = razorpay_payment_id;
    consultation.order = order._id as any;
    consultation.payment = payment._id as any;
    consultation.customer = customer._id as any;
    await consultation.save();

    // Send confirmation email via Resend
    sendConsultationConfirmationEmail(consultation).catch((err) =>
      logger.error({ err: err?.message }, "Failed to send consultation confirmation email")
    );

    logger.info(
      { bookingNumber: consultation.bookingNumber, paymentId: razorpay_payment_id },
      "Consultation booking confirmed and paid"
    );

    const customerToken = generateCustomerToken(customer);

    ok(res, {
      booking: consultation,
      orderNumber: order.orderNumber,
      transactionId: razorpay_payment_id,
      customerToken,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    }, "Consultation confirmed successfully!");
  },

  /**
   * Admin: Get all booked consultations
   */
  async getConsultations(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") {
      query.status = status;
    }

    const [consultations, total] = await Promise.all([
      Consultation.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("customer", "name email phone"),
      Consultation.countDocuments(query),
    ]);

    ok(res, {
      consultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },
};
