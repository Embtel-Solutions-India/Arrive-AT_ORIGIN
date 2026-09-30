import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ACCESS_COOKIE } from "../config/cookies.js";
import type { Permission } from "../config/permissions.js";
import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/httpError.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Permission[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

/** Verifies the access cookie and loads the user's *current* role + permissions from the DB. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw HttpError.unauthorized();
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    } catch {
      throw HttpError.unauthorized("Session expired");
    }
    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
      include: { role: { include: { permissions: true } } },
    });
    if (!user || !user.active) throw HttpError.unauthorized();
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => p.key as Permission),
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
    if (!needed.every((p) => user.permissions.includes(p))) return next(HttpError.forbidden());
    next();
  };
