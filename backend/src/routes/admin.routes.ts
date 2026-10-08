import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dashboardController } from "../modules/dashboard/dashboard.controller.js";
import { blogController } from "../modules/blogs/blog.controller.js";
import { bookController } from "../modules/books/book.controller.js";
import { orderController } from "../modules/orders/order.controller.js";
import { customerController } from "../modules/customers/customer.controller.js";
import { paymentController } from "../modules/payments/payment.controller.js";
import { authorController } from "../modules/authors/author.controller.js";
import { mediaController } from "../modules/media/media.controller.js";
import { seoController } from "../modules/seo/seo.controller.js";
import { userController } from "../modules/users/user.controller.js";
import { consultationController } from "../modules/consultations/consultation.controller.js";
import { settingsController } from "../modules/settings/settings.controller.js";
import { couponController } from "../modules/coupons/coupon.controller.js";

export const adminRouter = Router();

// Protect ALL admin routes with authentication
adminRouter.use(authenticate);

// ─── Dashboard ───
adminRouter.get("/dashboard", asyncHandler(dashboardController.getStats));

// ─── Blogs ───
adminRouter.get("/blogs/export", requirePermission("BLOG_READ"), asyncHandler(blogController.exportBlogs));
adminRouter.get("/blogs", requirePermission("BLOG_READ"), asyncHandler(blogController.getBlogs));
adminRouter.post("/blogs", requirePermission("BLOG_WRITE"), asyncHandler(blogController.createBlog));
adminRouter.post("/blogs/bulk", requirePermission("BLOG_WRITE"), asyncHandler(blogController.bulkAction));
adminRouter.get("/blogs/:id", requirePermission("BLOG_READ"), asyncHandler(blogController.getBlogById));
adminRouter.put("/blogs/:id", requirePermission("BLOG_WRITE"), asyncHandler(blogController.updateBlog));
adminRouter.delete("/blogs/:id", requirePermission("BLOG_DELETE"), asyncHandler(blogController.deleteBlog));
adminRouter.post("/blogs/:id/publish", requirePermission("BLOG_WRITE"), asyncHandler(blogController.publishBlog));
adminRouter.post("/blogs/:id/unpublish", requirePermission("BLOG_WRITE"), asyncHandler(blogController.unpublishBlog));
adminRouter.post("/blogs/:id/duplicate", requirePermission("BLOG_WRITE"), asyncHandler(blogController.duplicateBlog));

// ─── Blog Categories & Tags ───
adminRouter.get("/blog-categories", requirePermission("BLOG_READ"), asyncHandler(blogController.getCategories));
adminRouter.post("/blog-categories", requirePermission("BLOG_WRITE"), asyncHandler(blogController.createCategory));
adminRouter.put("/blog-categories/:id", requirePermission("BLOG_WRITE"), asyncHandler(blogController.updateCategory));
adminRouter.delete("/blog-categories/:id", requirePermission("BLOG_DELETE"), asyncHandler(blogController.deleteCategory));

adminRouter.get("/blog-tags", requirePermission("BLOG_READ"), asyncHandler(blogController.getTags));
adminRouter.post("/blog-tags", requirePermission("BLOG_WRITE"), asyncHandler(blogController.createTag));
adminRouter.delete("/blog-tags/:id", requirePermission("BLOG_DELETE"), asyncHandler(blogController.deleteTag));

// ─── Books ───
adminRouter.get("/books/export", requirePermission("PRODUCT_READ"), asyncHandler(bookController.exportBooks));
adminRouter.get("/books", requirePermission("PRODUCT_READ"), asyncHandler(bookController.getBooks));
adminRouter.post("/books", requirePermission("PRODUCT_WRITE"), asyncHandler(bookController.createBook));
adminRouter.put("/books/inventory", requirePermission("PRODUCT_WRITE"), asyncHandler(bookController.updateInventory));
adminRouter.get("/books/:id", requirePermission("PRODUCT_READ"), asyncHandler(bookController.getBookById));
adminRouter.put("/books/:id", requirePermission("PRODUCT_WRITE"), asyncHandler(bookController.updateBook));
adminRouter.delete("/books/:id", requirePermission("PRODUCT_DELETE"), asyncHandler(bookController.deleteBook));
adminRouter.post("/books/:id/duplicate", requirePermission("PRODUCT_WRITE"), asyncHandler(bookController.duplicateBook));

// ─── Book Categories ───
adminRouter.get("/book-categories", requirePermission("PRODUCT_READ"), asyncHandler(bookController.getCategories));
adminRouter.post("/book-categories", requirePermission("PRODUCT_WRITE"), asyncHandler(bookController.createCategory));
adminRouter.delete("/book-categories/:id", requirePermission("PRODUCT_DELETE"), asyncHandler(bookController.deleteCategory));

// ─── Orders & Consultations ───
adminRouter.get("/orders", requirePermission("ORDER_READ"), asyncHandler(orderController.getOrders));
adminRouter.get("/orders/:id", requirePermission("ORDER_READ"), asyncHandler(orderController.getOrderById));
adminRouter.put("/orders/:id", requirePermission("ORDER_UPDATE"), asyncHandler(orderController.updateOrder));
adminRouter.get("/consultations", requirePermission("ORDER_READ"), asyncHandler(consultationController.getConsultations));

// ─── Coupons & Promo Codes ───
adminRouter.get("/coupons", requirePermission("ORDER_READ"), asyncHandler(couponController.getCoupons));
adminRouter.post("/coupons", requirePermission("ORDER_UPDATE"), asyncHandler(couponController.createCoupon));
adminRouter.get("/coupons/:id", requirePermission("ORDER_READ"), asyncHandler(couponController.getCouponById));
adminRouter.put("/coupons/:id", requirePermission("ORDER_UPDATE"), asyncHandler(couponController.updateCoupon));
adminRouter.delete("/coupons/:id", requirePermission("ORDER_UPDATE"), asyncHandler(couponController.deleteCoupon));
adminRouter.put("/coupons/:id/toggle", requirePermission("ORDER_UPDATE"), asyncHandler(couponController.toggleCoupon));


// ─── Customers ───
adminRouter.get("/customers", requirePermission("CUSTOMER_READ"), asyncHandler(customerController.getCustomers));
adminRouter.get("/customers/:id", requirePermission("CUSTOMER_READ"), asyncHandler(customerController.getCustomerById));

// ─── Payments ───
adminRouter.get("/payments", requirePermission("PAYMENT_READ"), asyncHandler(paymentController.getPayments));

// ─── Authors ───
adminRouter.get("/authors", asyncHandler(authorController.getAuthors));
adminRouter.get("/authors/:id", asyncHandler(authorController.getAuthorById));
adminRouter.post("/authors", requirePermission("BLOG_WRITE"), asyncHandler(authorController.createAuthor));
adminRouter.put("/authors/:id", requirePermission("BLOG_WRITE"), asyncHandler(authorController.updateAuthor));
adminRouter.delete("/authors/:id", requirePermission("BLOG_DELETE"), asyncHandler(authorController.deleteAuthor));

// ─── Media Library ───
adminRouter.get("/media", requirePermission("MEDIA_READ"), asyncHandler(mediaController.getMedia));
adminRouter.post("/media/upload", requirePermission("MEDIA_UPLOAD"), upload.array("files", 10), asyncHandler(mediaController.uploadFiles));
adminRouter.get("/media/:id/download", requirePermission("MEDIA_READ"), asyncHandler(mediaController.downloadMedia));
adminRouter.put("/media/:id", requirePermission("MEDIA_UPLOAD"), asyncHandler(mediaController.updateMedia));
adminRouter.delete("/media/:id", requirePermission("MEDIA_DELETE"), asyncHandler(mediaController.deleteMedia));

// ─── SEO Management ───
adminRouter.get("/seo/settings", requirePermission("SETTINGS_MANAGE"), asyncHandler(seoController.getSettings));
adminRouter.put("/seo/settings", requirePermission("SETTINGS_MANAGE"), asyncHandler(seoController.updateSettings));

// ─── Settings Hub & Operations Control ───
adminRouter.get("/settings", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.getAllSettings));
adminRouter.put("/settings/:group", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.updateGroupSetting));

// ─── Account Settings (Any authenticated admin) ───
adminRouter.get("/settings/account/profile", asyncHandler(settingsController.getAccountProfile));
adminRouter.put("/settings/account/profile", asyncHandler(settingsController.updateAccountProfile));
adminRouter.put("/settings/account/password", asyncHandler(settingsController.changeAccountPassword));

// ─── Sessions & Devices ───
adminRouter.get("/settings/sessions", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.getSessions));
adminRouter.delete("/settings/sessions/:id", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.revokeSession));
adminRouter.delete("/settings/sessions/all/revoke", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.revokeAllSessions));

// ─── Operational Tests ───
adminRouter.post("/settings/email/test", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.testEmail));
adminRouter.post("/settings/payments/:provider/test", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.testPaymentGateway));

// ─── System Health & Status ───
adminRouter.get("/settings/system/status", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.getSystemStatus));

// ─── Audit & Activity Logs ───
adminRouter.get("/settings/audit-logs", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.getAuditLogs));

// ─── Database Backups & Restore ───
adminRouter.get("/settings/backups", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.getBackups));
adminRouter.post("/settings/backups", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.createBackup));
adminRouter.post("/settings/backups/restore", requirePermission("SETTINGS_MANAGE"), asyncHandler(settingsController.restoreBackup));

// ─── Admin Users & Roles ───
adminRouter.get("/users", requirePermission("USER_MANAGE"), asyncHandler(userController.getUsers));
adminRouter.post("/users", requirePermission("USER_MANAGE"), asyncHandler(userController.createUser));
adminRouter.put("/users/:id", requirePermission("USER_MANAGE"), asyncHandler(userController.updateUser));
adminRouter.delete("/users/:id", requirePermission("USER_MANAGE"), asyncHandler(userController.deleteUser));
adminRouter.put("/users/:id/status", requirePermission("USER_MANAGE"), asyncHandler(userController.updateStatus));
adminRouter.post("/users/:id/reset-password", requirePermission("USER_MANAGE"), asyncHandler(userController.resetPassword));
adminRouter.post("/users/:id/force-logout", requirePermission("USER_MANAGE"), asyncHandler(userController.forceLogout));
adminRouter.post("/users/logout-all", requirePermission("USER_MANAGE"), asyncHandler(userController.logoutAllUsers));
