import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, ROLE_NAMES, ROLE_PERMISSIONS } from "../src/config/permissions.js";

const prisma = new PrismaClient();

async function main() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      update: { permissions: { set: ROLE_PERMISSIONS[name].map((key) => ({ key })) } },
      create: { name, permissions: { connect: ROLE_PERMISSIONS[name].map((key) => ({ key })) } },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        email: email.toLowerCase(),
        name: "Super Admin",
        roleId: role.id,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      },
    });
    console.log(`Seeded super admin: ${email}`);
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set - skipped admin user");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
