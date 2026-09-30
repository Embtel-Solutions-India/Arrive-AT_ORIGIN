import { prisma } from "../../database/prisma.js";

export const authRepository = {
  findUserByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email }, include: { role: { include: { permissions: true } } } }),

  findUserById: (id: string) =>
    prisma.user.findUnique({ where: { id }, include: { role: { include: { permissions: true } } } }),

  createRefreshToken: (data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }) =>
    prisma.refreshToken.create({ data }),

  findRefreshToken: (tokenHash: string) => prisma.refreshToken.findUnique({ where: { tokenHash } }),

  revokeRefreshToken: (id: string, replacedBy?: string) =>
    prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date(), replacedBy } }),

  revokeAllForUser: (userId: string) =>
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),

  touchLogin: (id: string) => prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } }),

  createResetToken: (data: { userId: string; tokenHash: string; expiresAt: Date }) =>
    prisma.passwordResetToken.create({ data }),

  findResetToken: (tokenHash: string) => prisma.passwordResetToken.findUnique({ where: { tokenHash } }),

  consumeResetAndSetPassword: (tokenId: string, userId: string, passwordHash: string) =>
    prisma.$transaction([
      prisma.passwordResetToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]),
};
