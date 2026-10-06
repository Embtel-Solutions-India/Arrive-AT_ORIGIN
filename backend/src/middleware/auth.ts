import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ACCESS_COOKIE } from "../config/cookies.js";
import { Permission, ROLE_PERMISSIONS, RoleName } from "../config/permissions.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  permissions: Permission[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

/** Verifies the access cookie or Authorization header and loads the user's role + permissions from MongoDB. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    let token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) throw HttpError.unauthorized("Authentication required");

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    } catch {
      throw HttpError.unauthorized("Session expired or invalid");
    }

    const user = await User.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("User account not found or inactive");
    }

    const role = (user.role || "ADMIN") as RoleName;
    const permissions = (ROLE_PERMISSIONS[role] || []) as Permission[];

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role,
      permissions,
    };
    next();
  } catch (e) {
    next(e);
  }
};

/** Server-side RBAC gate. Requires ALL listed permissions. */
export const requirePermission =
  (...needed: Permission[]): RequestHandler =>
  (req, _res, next) => {
    const user = req.user;
    if (!user) return next(HttpError.unauthorized());
    if (user.role === "SUPER_ADMIN") return next();
    if (!needed.every((p) => user.permissions.includes(p))) {
      return next(HttpError.forbidden("Insufficient permissions"));
    }
    next();
  };
