import "dotenv/config";
import argon2 from "argon2";
import { connectDB, disconnectDB } from "./database/mongodb.js";
import { User } from "./models/User.js";
import { Author } from "./models/Author.js";
import { BlogCategory } from "./models/BlogCategory.js";
import { BlogTag } from "./models/BlogTag.js";
import { BlogPost } from "./models/BlogPost.js";
import { BookCategory } from "./models/BookCategory.js";
import { Book } from "./models/Book.js";
import { Customer } from "./models/Customer.js";
import { Order } from "./models/Order.js";
import { Payment } from "./models/Payment.js";
import { Setting } from "./models/Setting.js";
import { Coupon } from "./models/Coupon.js";

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas for seeding...");
  await connectDB();

  // 1. Super Admin User
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@arriveatorigin.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required in environment variables before seeding the admin user. Refusing to seed admin with a hardcoded password."
    );
  }

  let admin = await User.findOne({ email });
  if (!admin) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    admin = await User.create({
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });
    console.log(`✅ Seeded Super Admin: ${email}`);
  } else {
    admin.role = "SUPER_ADMIN";
    admin.status = "ACTIVE";
    await admin.save();
    console.log(`ℹ️ Super Admin already exists: ${email}`);
  }

  // 2. Author
  let author = await Author.findOne({ slug: "dr-alka-chopra-madan" });
  if (!author) {
    author = await Author.create({
      name: "Dr. Alka Chopra Madan",
      slug: "dr-alka-chopra-madan",
      biography:
        "Author, metaphysical counselor, and creator of the Arrive at Origin (AAO) framework and Living from Origin approach. Over two decades guiding individuals through grief, transition, and self-realisation.",
      profileImage: "/dr-alka-chopra-madan.png",
      website: "https://soulbodyhealingcenter.com",
      socialLinks: {
        instagram: "https://instagram.com/dr.alkachopra",
        youtube: "https://youtube.com/@soulbodyhealing",
        linkedin: "https://linkedin.com/in/dr-alka-chopra-madan",
      },
    });
    console.log("✅ Seeded Author: Dr. Alka Chopra Madan");
  }

  // 3. Blog Categories
  const blogCats = [
    { name: "Metaphysics", slug: "metaphysics", description: "Inquiries into origin, consciousness, and the meta-human" },
    { name: "Grief & Loss", slug: "grief-and-loss", description: "Holding space for loss without rigid timelines or formulas" },
    { name: "Arrive at Origin", slug: "arrive-at-origin", description: "The four movements of living from Origin in daily life" },
    { name: "Living from Origin", slug: "living-from-origin", description: "Integration of Origin consciousness into everyday life" },
  ];

  for (const c of blogCats) {
    await BlogCategory.findOneAndUpdate({ slug: c.slug }, c, { upsert: true });
  }
  console.log("✅ Seeded Blog Categories");

  // 4. Blog Tags
  const blogTags = [
    { name: "AAO", slug: "aao" },
    { name: "Concept Clearing", slug: "concept-clearing" },
    { name: "Meditation", slug: "meditation" },
    { name: "Metaphysics", slug: "metaphysics" },
    { name: "Grief", slug: "grief" },
    { name: "Living from Origin", slug: "living-from-origin" },
  ];

  for (const t of blogTags) {
    await BlogTag.findOneAndUpdate({ slug: t.slug }, t, { upsert: true });
  }
  console.log("✅ Seeded Blog Tags");

  // 5. Blog Posts
  const initialPosts: any[] = [];

  // 6. Book Categories
  const bookCats = [
    { name: "AAO Series", slug: "aao-series", description: "The definitive Arrive at Origin series" },
    { name: "Earlier Work", slug: "earlier-work", description: "Foundational teachings on transformation, spirituality, and healing" },
  ];

  for (const bc of bookCats) {
    await BookCategory.findOneAndUpdate({ slug: bc.slug }, bc, { upsert: true });
  }
  console.log("✅ Seeded Book Categories");

  // 7. Books
  const books = [
    {
      title: "Keeping It Simple",
      slug: "keeping-it-simple",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-006",
      isbn: "979-8877665599",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 180,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 289.55, sku: "AAO-BK-006-PB", stockQuantity: 40 }],
      description: "Daily reflections on uncluttering the mind and recovering personal quiet. Soul, body and mind do not require life to be made more complicated than it already is.",
      shortDescription: "Daily reflections on recovering quiet and mental simplicity.",
      coverImage: "/keeping-it-simple.png",
      categoryName: "Earlier Work",
      tags: ["Simplicity", "Peace"],
      price: 289.55,
      currency: "INR",
      stockQuantity: 40,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 12,
      revenue: 3474.6,
      amazonUrl: "https://www.amazon.com/dp/B07VRKSC9P",
    },
    {
      title: "Your Path to Peace",
      slug: "your-path-to-peace",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-007",
      isbn: "979-8877665501",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 210,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 386.39, sku: "AAO-BK-007-PB", stockQuantity: 50 }],
      description: "A journey beyond calmness — toward the peace that remains when what is unfinished is no longer veiled.",
      shortDescription: "Toward the peace that remains when what is unfinished is no longer veiled.",
      coverImage: "/your-path-to-peace.png",
      categoryName: "Earlier Work",
      tags: ["Peace", "Inner Stillness"],
      price: 386.39,
      currency: "INR",
      stockQuantity: 50,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 18,
      revenue: 6955.02,
      amazonUrl: "https://www.amazon.com/dp/B0GJQV5M2F",
    },
    {
      title: "Life Force: Lost and Found",
      slug: "life-force-lost-and-found",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-008",
      isbn: "979-8877665518",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 195,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 289.55, sku: "AAO-BK-008-PB", stockQuantity: 45 }],
      description: "Energy, wholeness, and reconnecting with the vitality of being alive.",
      shortDescription: "Energy, wholeness, and reconnecting with the vitality of being alive.",
      coverImage: "/life-force-lost-and-found.png",
      categoryName: "Earlier Work",
      tags: ["Energy", "Vitality", "Healing"],
      price: 289.55,
      currency: "INR",
      stockQuantity: 45,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 14,
      revenue: 4053.7,
      amazonUrl: "https://www.amazon.com/Life-Force-Alka-Chopra-Madan-ebook/dp/B07VQDY6VP",
    },
    {
      title: "Arrive at Origin",
      slug: "arrive-at-origin-part-one",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-001",
      isbn: "979-8877665544",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 284,
      format: "Paperback",
      formats: [
        { format: "Paperback", price: 483.23, sku: "AAO-BK-001-PB", stockQuantity: 85 },
        { format: "Hardcover", price: 683.23, sku: "AAO-BK-001-HC", stockQuantity: 40 },
        { format: "E-book", price: 299.00, sku: "AAO-BK-001-EB", stockQuantity: 999 },
      ],
      description:
        "The central work of the Arrive at Origin framework. Origin as the position that remains when you stop moving away from yourself, and the systematic method for returning to it through Concept Clearing and direct differentiation.",
      shortDescription: "The central work of the AAO framework on returning to Origin.",
      coverImage: "/aao-part-one.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Metaphysics", "Self-Realisation"],
      price: 483.23,
      currency: "INR",
      stockQuantity: 85,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 42,
      revenue: 20295.66,
      amazonUrl: "https://www.amazon.com/dp/B0GX33FYHW",
      seo: {
        seoTitle: "Arrive at Origin: Part One by Dr. Alka Chopra Madan",
        metaDescription: "Discover Arrive at Origin, the central work on returning to the position that remains.",
      },
    },
    {
      title: "Arrive at Origin II",
      slug: "arrive-at-origin-part-two",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-002",
      isbn: "979-8877665551",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 312,
      format: "Paperback",
      formats: [
        { format: "Paperback", price: 483.23, sku: "AAO-BK-002-PB", stockQuantity: 60 },
        { format: "Hardcover", price: 683.23, sku: "AAO-BK-002-HC", stockQuantity: 25 },
      ],
      description:
        "The elaboration: Concept Clearing as gateway, the four movements in depth, and living from Origin inside ordinary obligation and daily life.",
      shortDescription: "The in-depth elaboration and practical integration of AAO.",
      coverImage: "/aao-part-two.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Philosophy", "Living from Origin"],
      price: 483.23,
      currency: "INR",
      stockQuantity: 60,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 31,
      revenue: 14980.13,
      amazonUrl: "https://www.amazon.com/dp/B0H1H83KNV",
      seo: {
        seoTitle: "Arrive at Origin II by Dr. Alka Chopra Madan",
        metaDescription: "Concept Clearing, the four movements in depth, and living from Origin.",
      },
    },
    {
      title: "Your Path to Transformation",
      slug: "your-path-to-transformation",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-003",
      isbn: "979-8877665568",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 220,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 484.20, sku: "AAO-BK-003-PB", stockQuantity: 45 }],
      description: "Change, unpredictability, and the way we meet a life that does not consult us first.",
      shortDescription: "Navigating change and meeting life with clarity.",
      coverImage: "/your-path-to-transformation.png",
      categoryName: "Earlier Work",
      tags: ["Transformation", "Mindset"],
      price: 484.20,
      currency: "INR",
      stockQuantity: 45,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 19,
      revenue: 9199.8,
      amazonUrl: "https://www.amazon.com/dp/B0CR9H7YMH",
    },
    {
      title: "Your Path to Spirituality",
      slug: "your-path-to-spirituality",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-004",
      isbn: "979-8877665575",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 208,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 290.52, sku: "AAO-BK-004-PB", stockQuantity: 50 }],
      description: "A return to what spirituality is underneath the labels it has collected.",
      shortDescription: "Spirituality freed from dogma and preconception.",
      coverImage: "/your-path-to-spirituality.png",
      categoryName: "Earlier Work",
      tags: ["Spirituality", "Meditation"],
      price: 290.52,
      currency: "INR",
      stockQuantity: 50,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 15,
      revenue: 4357.8,
      amazonUrl: "https://www.amazon.com/dp/B0BBS9GRPJ",
    },
    {
      title: "Your Path to Healing",
      slug: "your-path-to-healing",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-005",
      isbn: "979-8877665582",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 240,
      format: "Paperback",
      formats: [{ format: "Paperback", price: 483.23, sku: "AAO-BK-005-PB", stockQuantity: 35 }],
      description:
        "What healing means across living, loss and recovery — held as inquiry rather than instruction.",
      shortDescription: "A gentle inquiry into living, loss, and true restoration.",
      coverImage: "/your-path-to-healing.png",
      categoryName: "Earlier Work",
      tags: ["Healing", "Grief"],
      price: 483.23,
      currency: "INR",
      stockQuantity: 35,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 24,
      revenue: 11597.52,
      amazonUrl: "https://www.amazon.com/dp/B0C386DNVQ",
    },
  ];

  for (const b of books) {
    await Book.findOneAndUpdate({ sku: b.sku }, b, { upsert: true });
  }
  console.log("✅ Seeded Books");

  // 8. Sample Customer & Orders
  let customer = await Customer.findOne({ email: "claire.bennett@example.com" });
  if (!customer) {
    customer = await Customer.create({
      name: "Claire Bennett",
      email: "claire.bennett@example.com",
      phone: "+1 (415) 890-1234",
      shippingAddress: {
        street: "742 Evergreen Terrace",
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        country: "United States",
      },
      billingAddress: {
        street: "742 Evergreen Terrace",
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        country: "United States",
      },
      totalOrders: 2,
      totalSpent: 87.8,
      lastOrderDate: new Date(),
    });
  }

  const sampleOrderNumber = "ORD-2026-1001";
  let sampleOrder = await Order.findOne({ orderNumber: sampleOrderNumber });
  if (!sampleOrder) {
    const book1 = await Book.findOne({ sku: "AAO-BK-001" });
    const book2 = await Book.findOne({ sku: "AAO-BK-002" });

    sampleOrder = await Order.create({
      orderNumber: sampleOrderNumber,
      customer: customer._id,
      customerInfo: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      items: [
        {
          book: book1?._id || customer._id,
          title: "Arrive at Origin",
          sku: "AAO-BK-001",
          format: "Paperback",
          price: 19.95,
          quantity: 2,
          coverImage: "/aao-part-one.png",
          subtotal: 39.9,
        },
        {
          book: book2?._id || customer._id,
          title: "Arrive at Origin II",
          sku: "AAO-BK-002",
          format: "Paperback",
          price: 22.95,
          quantity: 1,
          coverImage: "/aao-part-two.png",
          subtotal: 22.95,
        },
      ],
      subtotal: 62.85,
      shipping: 0,
      tax: 3.14,
      discount: 0,
      total: 65.99,
      currency: "USD",
      paymentStatus: "PAID",
      orderStatus: "PROCESSING",
      shippingAddress: customer.shippingAddress,
      billingAddress: customer.billingAddress,
      notes: "First time reader of AAO series.",
      createdAt: new Date(Date.now() - 2 * 86_400_000),
    });

    const payment = await Payment.create({
      order: sampleOrder._id,
      orderNumber: sampleOrderNumber,
      transactionId: "txn_sim_1001_seed",
      paymentGateway: "stripe",
      amount: 65.99,
      currency: "USD",
      status: "SUCCESSFUL",
      paymentMethod: "Credit Card (Visa ···· 4242)",
    });

    sampleOrder.payment = payment._id as any;
    await sampleOrder.save();
    console.log("✅ Seeded Sample Customer & Order");
  }

  // 9. SEO & Site Settings
  const defaultSettings = [
    { key: "siteTitle", value: "Soul Body Healing Center | Arrive at Origin", group: "seo" },
    {
      key: "siteDescription",
      value: "Metaphysics, grief counsel, spiritual direction, and Living from Origin with Dr. Alka Chopra Madan.",
      group: "seo",
    },
    { key: "canonicalDomain", value: "https://soulbodyhealingcenter.com", group: "seo" },
    { key: "ogImage", value: "/dr-alka-chopra-madan.png", group: "seo" },
    { key: "twitterHandle", value: "@soulbodyorigin", group: "seo" },
    { key: "robotsIndex", value: true, group: "seo" },
    { key: "robotsFollow", value: true, group: "seo" },
    { key: "currency", value: "USD", group: "general" },
    { key: "contactEmail", value: "contact@soulbodyhealingcenter.com", group: "general" },
    { key: "contactPhone", value: "+1 (555) 019-2834", group: "general" },
  ];

  for (const s of defaultSettings) {
    await Setting.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }
  console.log("✅ Seeded SEO & Site Settings");

  // 10. Coupons & Discounts
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
    await (Coupon as any).findOneAndUpdate({ code: c.code }, c, { upsert: true });
  }
  console.log("✅ Seeded Default Promotional Coupons");

  console.log("🎉 Seeding complete!");
  await disconnectDB();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
