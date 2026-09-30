import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { prisma } from "../../database/prisma.js";
import { ROLE_NAMES } from "../../config/permissions.js";
import { audit } from "../../services/audit.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/httpError.js";
import { created, ok } from "../../utils/response.js";

export const usersRouter = Router();
usersRouter.use(authenticate, requirePermission("USER_MANAGE"));

const select = {
  id: true,
  email: true,
  name: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { name: true } },
} as const;

const passwordRule = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/);

const createSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1).max(120),
  password: passwordRule,
  role: z.enum(ROLE_NAMES),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(ROLE_NAMES).optional(),
  active: z.boolean().optional(),
});

const idParams = z.object({ id: z.string().min(1) });

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.user.findMany({ select, orderBy: { createdAt: "asc" } }));
  }),
);

usersRouter.post(
  "/",
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const { email, name, password, role } = req.body as z.infer<typeof createSchema>;
    const roleRow = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRow) throw HttpError.badRequest("Unknown role");
    const user = await prisma.user.create({
      data: { email, name, roleId: roleRow.id, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
      select,
    });
    await audit(req, "user.create", "User", user.id, { role });
    created(res, user);
  }),
);

usersRouter.patch(
  "/:id",
  validate({ params: idParams, body: updateSchema }),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const { name, role, active } = req.body as z.infer<typeof updateSchema>;
    // Prevent an admin from locking themselves out of user management.
    if (id === req.user!.id && (active === false || (role && role !== req.user!.role))) {
      throw HttpError.badRequest("You cannot deactivate or change the role of your own account");
    }
    const roleRow = role ? await prisma.role.findUnique({ where: { name: role } }) : null;
    if (role && !roleRow) throw HttpError.badRequest("Unknown role");
    const user = await prisma.user.update({
      where: { id },
      data: { name, active, roleId: roleRow?.id },
      select,
    });
    if (active === false) {
      await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await audit(req, "user.update", "User", id, { name, role, active });
    ok(res, user);
  }),
);
