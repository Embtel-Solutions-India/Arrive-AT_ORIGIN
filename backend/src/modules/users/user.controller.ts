import type { Request, Response } from "express";
import argon2 from "argon2";
import { User, AdminRole, UserStatus } from "../../models/User.js";
import { AdminSession } from "../../models/AdminSession.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { logAudit } from "../../utils/auditLogger.js";

export const ALL_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "STAFF", "CUSTOM"];
export const ALL_STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"];

export const MODULE_PERMISSIONS = [
  "dashboard",
  "users",
  "books",
  "orders",
  "payments",
  "bookings",
  "customers",
  "leads",
  "blog",
  "media",
  "reports",
  "settings",
] as const;

export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export"] as const;

export const userController = {
  // ─── List Users ───
  async getUsers(req: Request, res: Response) {
    const search = ((req.query.search as string) || "").trim();
    const roleFilter = req.query.role as string;
    const statusFilter = req.query.status as string;

    const filter: Record<string, any> = {};
    if (roleFilter && roleFilter !== "ALL") filter.role = roleFilter;
    if (statusFilter && statusFilter !== "ALL") filter.status = statusFilter;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await (User as any).find(filter)
      .select("-passwordHash -passwordHistory")
      .sort({ createdAt: -1 });

    ok(res, {
      users,
      roles: ALL_ROLES,
      statuses: ALL_STATUSES,
      availableModules: MODULE_PERMISSIONS,
      availableActions: PERMISSION_ACTIONS,
    });
  },

  // ─── Create User ───
  async createUser(req: Request, res: Response) {
    const { name, username, email, phone, password, role, status, avatar, permissions } = req.body;
    if (!name || !email || !password) {
      throw HttpError.badRequest("Name, email, and password are required");
    }

    const existingEmail = await (User as any).findOne({ email: email.toLowerCase() });
    if (existingEmail) throw HttpError.badRequest("A user with this email already exists");

    if (username) {
      const existingUsername = await (User as any).findOne({ username: username.toLowerCase() });
      if (existingUsername) throw HttpError.badRequest("This username is already in use");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await (User as any).create({
      name: name.trim(),
      username: username ? username.trim().toLowerCase() : undefined,
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      passwordHash,
      role: ALL_ROLES.includes(role) ? role : "ADMIN",
      status: ALL_STATUSES.includes(status) ? status : "ACTIVE",
      avatar: avatar || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      lastPasswordChange: new Date(),
    });

    await logAudit({
      req,
      action: "USER_CREATED",
      module: "USERS",
      details: { createdUserId: user._id, email: user.email, role: user.role },
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    delete (userObj as any).passwordHistory;
    ok(res, { user: userObj }, "Admin user created successfully", 201);
  },

  // ─── Update User ───
  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { name, username, phone, role, status, avatar, permissions, password } = req.body;

    const user = await (User as any).findById(id);
    if (!user) throw HttpError.notFound("User not found");

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (role && ALL_ROLES.includes(role)) user.role = role;
    if (status && ALL_STATUSES.includes(status)) user.status = status;
    if (Array.isArray(permissions)) user.permissions = permissions;

    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== user.username) {
        const existingUsername = await (User as any).findOne({ username: cleanUsername });
        if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
          throw HttpError.badRequest("This username is already taken");
        }
        user.username = cleanUsername || undefined;
      }
    }

    if (password) {
      user.passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      user.lastPasswordChange = new Date();
    }

    await user.save();

    await logAudit({
      req,
      action: "USER_UPDATED",
      module: "USERS",
      details: { updatedUserId: id, role: user.role, status: user.status },
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    delete (userObj as any).passwordHistory;
    ok(res, { user: userObj }, "User updated successfully");
  },

  // ─── Update User Status (Activate/Deactivate/Suspend) ───
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALL_STATUSES.includes(status)) {
      throw HttpError.badRequest(`Invalid status. Must be one of: ${ALL_STATUSES.join(", ")}`);
    }

    const user = await (User as any).findById(id);
    if (!user) throw HttpError.notFound("User not found");

    if (req.user?.id === id && status !== "ACTIVE") {
      throw HttpError.badRequest("You cannot deactivate or suspend your own account");
    }

    user.status = status;
    await user.save();

    // If deactivated or suspended, revoke active sessions
    if (status !== "ACTIVE") {
      await (AdminSession as any).updateMany({ userId: id }, { isRevoked: true });
    }

    await logAudit({
      req,
      action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      module: "USERS",
      details: { userId: id, newStatus: status },
    });

    ok(res, { status: user.status }, `User marked as ${status}`);
  },

  // ─── Reset User Password ───
  async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      throw HttpError.badRequest("Password must be at least 8 characters");
    }

    const user = await (User as any).findById(id);
    if (!user) throw HttpError.notFound("User not found");

    user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    user.lastPasswordChange = new Date();
    await user.save();

    // Invalidate user sessions
    await (AdminSession as any).updateMany({ userId: id }, { isRevoked: true });

    await logAudit({
      req,
      action: "PASSWORD_CHANGE",
      module: "USERS",
      details: { resetForUserId: id, email: user.email },
    });

    ok(res, null, `Password for ${user.name} has been reset. Active sessions logged out.`);
  },

  // ─── Force Logout User ───
  async forceLogout(req: Request, res: Response) {
    const { id } = req.params;
    await (AdminSession as any).updateMany({ userId: id }, { isRevoked: true });

    await logAudit({
      req,
      action: "USER_LOGOUT",
      module: "USERS",
      details: { forceLoggedOutUserId: id },
    });

    ok(res, null, "User has been forced to logout from all devices");
  },

  // ─── Logout All Users ───
  async logoutAllUsers(req: Request, res: Response) {
    const callerId = req.user?.id;
    await (AdminSession as any).updateMany(
      callerId ? { userId: { $ne: callerId } } : {},
      { isRevoked: true }
    );

    await logAudit({
      req,
      action: "USER_LOGOUT",
      module: "USERS",
      status: "WARNING",
      details: { allUsersLoggedOut: true, callerId },
    });

    ok(res, null, "All active user sessions have been terminated");
  },

  // ─── Delete User ───
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    if (req.user?.id === id) {
      throw HttpError.badRequest("You cannot delete your own account");
    }

    const target = await (User as any).findById(id);
    if (!target) throw HttpError.notFound("User not found");

    if (target.role === "SUPER_ADMIN") {
      const superAdminCount = await User.countDocuments({ role: "SUPER_ADMIN" });
      if (superAdminCount <= 1) {
        throw HttpError.badRequest("Cannot delete the only Super Admin account");
      }
    }

    await (AdminSession as any).deleteMany({ userId: id });
    await (User as any).findByIdAndDelete(id);

    await logAudit({
      req,
      action: "USER_DELETED",
      module: "USERS",
      details: { deletedUserId: id, email: target.email, name: target.name },
    });

    ok(res, null, `User "${target.name}" has been permanently deleted`);
  },
};
