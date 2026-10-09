import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicController } from "../modules/public/public.controller.js";
import { seoController } from "../modules/seo/seo.controller.js";
import { consultationController } from "../modules/consultations/consultation.controller.js";
import { customerAuthController } from "../modules/customerAuth/customerAuth.controller.js";
import { couponController } from "../modules/coupons/coupon.controller.js";

export const publicRouter = Router();

// Public Blogs
publicRouter.get("/blogs", asyncHandler(publicController.getBlogs));
publicRouter.get("/blogs/:slug", asyncHandler(publicController.getBlogBySlug));

// Public Books
publicRouter.get("/books", asyncHandler(publicController.getBooks));
publicRouter.get("/books/:slug", asyncHandler(publicController.getBookBySlug));

// Public Checkout & Coupons & Geo
publicRouter.get("/geo", asyncHandler(publicController.getGeoLocation));
publicRouter.post("/coupons/validate", asyncHandler(couponController.validate));
publicRouter.post("/orders/checkout", asyncHandler(publicController.checkout));
publicRouter.post("/orders/razorpay/create", asyncHandler(publicController.createBookRazorpayOrder));

// Public Consultations & Razorpay Booking
publicRouter.get("/consultations/packages", asyncHandler(consultationController.getPackages));
publicRouter.post("/consultations/book", asyncHandler(consultationController.createBookingOrder));
publicRouter.post("/consultations/verify-payment", asyncHandler(consultationController.verifyPayment));

// Public Customer Account & Portal
publicRouter.post("/customer/login", asyncHandler(customerAuthController.login));
publicRouter.post("/customer/signup", asyncHandler(customerAuthController.signup));
publicRouter.post("/customer/forgot-password", asyncHandler(customerAuthController.forgotPassword));
publicRouter.post("/customer/reset-password", asyncHandler(customerAuthController.resetPassword));
publicRouter.get("/customer/portal", asyncHandler(customerAuthController.getPortal));
publicRouter.put("/customer/profile", asyncHandler(customerAuthController.updateProfile));

// Public SEO & Shipping Settings
publicRouter.get("/seo/settings", asyncHandler(seoController.getSettings));
publicRouter.get("/settings/shipping", asyncHandler(publicController.getShippingSettings));

