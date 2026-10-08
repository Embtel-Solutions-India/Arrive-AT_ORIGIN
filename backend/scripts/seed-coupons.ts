import "dotenv/config";
import { connectDB, disconnectDB } from "../src/database/mongodb.js";
import { Coupon } from "../src/models/Coupon.js";

async function main() {
  await connectDB();
  const defaultCoupons = [
    {
      code: "WELCOME10",
      description: "Welcome offer: 10% off store books & session bookings",
      discountType: "PERCENTAGE",
      discountValue: 10,
      applicableTo: "ALL",
      minOrderAmount: 0,
      isActive: true,
    },
    {
      code: "ORIGIN20",
      description: "Special 20% discount on all Book Store purchases",
      discountType: "PERCENTAGE",
      discountValue: 20,
      applicableTo: "CHECKOUT",
      minOrderAmount: 30,
      isActive: true,
    },
    {
      code: "HEALING50",
      description: "$50 off any 1-on-1 Consultation Session booking",
      discountType: "FIXED",
      discountValue: 50,
      applicableTo: "CONSULTATION",
      minOrderAmount: 200,
      isActive: true,
    },
  ];

  for (const c of defaultCoupons) {
    await (Coupon as any).findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    console.log(`✓ Seeded coupon: ${c.code} (${c.applicableTo})`);
  }
  await disconnectDB();
  console.log("Coupons seeding complete!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
