import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.stubEnv("DATABASE_URL", "postgresql://x:x@localhost:5432/x");
vi.stubEnv("JWT_SECRET", "x".repeat(40));

const { requirePermission } = await import("../src/middleware/auth.js");
const { ROLE_PERMISSIONS, PERMISSIONS } = await import("../src/config/permissions.js");

function run(permissions: string[] | null, needed: Parameters<typeof requirePermission>) {
  const req = { user: permissions ? { permissions } : undefined } as unknown as Request;
  const next = vi.fn();
  requirePermission(...needed)(req, {} as Response, next);
  return next.mock.calls[0]?.[0] as { status?: number } | undefined;
}

describe("requirePermission", () => {
  it("rejects unauthenticated requests with 401", () => {
    expect(run(null, ["BLOG_READ"])?.status).toBe(401);
  });
  it("rejects users without the permission with 403", () => {
    expect(run(["BLOG_READ"], ["BLOG_WRITE"])?.status).toBe(403);
  });
  it("requires every listed permission", () => {
    expect(run(["ORDER_READ"], ["ORDER_READ", "ORDER_REFUND"])?.status).toBe(403);
  });
  it("allows users holding the permission", () => {
    expect(run(["BLOG_WRITE"], ["BLOG_WRITE"])).toBeUndefined();
  });
});

describe("role matrix", () => {
  it("gives SUPER_ADMIN every permission", () => {
    expect([...ROLE_PERMISSIONS.SUPER_ADMIN].sort()).toEqual([...PERMISSIONS].sort());
  });
  it("keeps refund rights away from store and consultation managers", () => {
    expect(ROLE_PERMISSIONS.STORE_MANAGER).not.toContain("ORDER_REFUND");
    expect(ROLE_PERMISSIONS.CONSULTATION_MANAGER).not.toContain("PAYMENT_REFUND");
  });
  it("only SUPER_ADMIN manages users and settings", () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      if (role === "SUPER_ADMIN") continue;
      expect(perms).not.toContain("USER_MANAGE");
      expect(perms).not.toContain("SETTINGS_MANAGE");
    }
  });
});
