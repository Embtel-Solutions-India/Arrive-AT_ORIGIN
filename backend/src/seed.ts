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

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas for seeding...");
  await connectDB();

  // 1. Super Admin User
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@arriveatorigin.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!12345";

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
        "Author, metaphysical counselor, and creator of the Arrive at Origin (AAO) framework and Induced Calmness method. Over two decades guiding individuals through grief, transition, and self-realisation.",
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
    { name: "Healing & Calmness", slug: "healing-and-calmness", description: "Induced Calmness and nervous system regulation" },
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
    { name: "Induced Calmness", slug: "induced-calmness" },
  ];

  for (const t of blogTags) {
    await BlogTag.findOneAndUpdate({ slug: t.slug }, t, { upsert: true });
  }
  console.log("✅ Seeded Blog Tags");

  // 5. Blog Posts
  const initialPosts = [
    {
      title: "What does “meta-human” actually mean?",
      slug: "what-is-a-meta-human",
      authorName: "Dr. Alka Chopra Madan",
      categoryName: "Metaphysics",
      tags: ["Metaphysics", "AAO", "Concept Clearing"],
      excerpt: "There is a part of you that circumstance never manufactured. Metaphysics is the study of it.",
      content: `<h2>Beyond the Assembled Self</h2>
<p>Most of what we call “me” was assembled: by family, by culture, by the things that happened and our decisions about them. It is real, and it is useful. But it is not the whole of you.</p>
<p>The <strong>meta-human</strong> is the part that was here before the assembly began and remains after it is taken apart. It does not need to be fixed, improved or healed. It needs to be noticed.</p>
<blockquote>“What in me is not a reaction? What is still here when the story pauses?”</blockquote>
<p>Metaphysics, as I practise it, is not an abstract discipline. It is the plain habit of asking: what in me is independent of conditions? When we locate that position, the urgency to perform or defend dissolves naturally.</p>`,
      featuredImage: "/dr-alka-chopra-madan.png",
      status: "PUBLISHED",
      isFeatured: true,
      publishDate: new Date("2026-09-12"),
      readTime: "4 min read",
      seo: {
        seoTitle: "What does Meta-Human mean? | Dr. Alka Chopra Madan",
        metaDescription: "Understand the meta-human concept and the study of the position that circumstance never manufactured.",
      },
    },
    {
      title: "Grief without stages",
      slug: "grief-without-stages",
      authorName: "Dr. Alka Chopra Madan",
      categoryName: "Grief & Loss",
      tags: ["Grief", "Healing & Calmness"],
      excerpt: "Loss does not follow a schedule, and you are not behind on it.",
      content: `<h2>Holding Company with What Is Present</h2>
<p>People arrive in grief carrying a quiet worry: that they are doing it wrong, or too slowly. Someone has handed them a list of stages, and they cannot find themselves on it.</p>
<p>In session, the work is simpler. We keep company with what is actually present today — numbness, anger, relief, a sudden laugh — without asking it to be anything else.</p>
<blockquote>“Grief is not a problem to be solved. It is love with nowhere to go, and it needs somewhere to be held.”</blockquote>
<p>When you cease demanding that your heart adhere to a linear calendar, grief softens into an honest witness to what has been cherished.</p>`,
      featuredImage: "/your-path-to-healing.png",
      status: "PUBLISHED",
      isFeatured: true,
      publishDate: new Date("2026-08-27"),
      readTime: "5 min read",
      seo: {
        seoTitle: "Grief Without Stages | Soul Body Healing Center",
        metaDescription: "Loss does not follow a schedule. Explore compassionate, non-linear healing from grief.",
      },
    },
    {
      title: "The four movements of Arrive at Origin",
      slug: "four-movements-of-aao",
      authorName: "Dr. Alka Chopra Madan",
      categoryName: "Arrive at Origin",
      tags: ["AAO", "Concept Clearing", "Meditation"],
      excerpt: "Clear the concept, observe, differentiate, arrive — one method, entered through many doors.",
      content: `<h2>The Architecture of AAO</h2>
<p>AAO is not a technique to master. It is a direction of travel, and it has four movements that repeat throughout a life.</p>
<ol>
  <li><strong>Clear the concept:</strong> Notice the idea you are currently standing inside.</li>
  <li><strong>Observe:</strong> Watch without recruiting a response or judging what appears.</li>
  <li><strong>Differentiate:</strong> Separate what is authentically yours from what was handed to you.</li>
  <li><strong>Arrive:</strong> Rest in the position that remains when striving stops.</li>
</ol>
<p>You do not complete the movements once. You return to them, each time a little less dependent on anyone else's reading of your life.</p>`,
      featuredImage: "/aao-part-one.png",
      status: "PUBLISHED",
      isFeatured: false,
      publishDate: new Date("2026-08-05"),
      readTime: "6 min read",
      seo: {
        seoTitle: "The Four Movements of Arrive at Origin | Dr. Alka Chopra Madan",
        metaDescription: "Learn the core movements of AAO: Clear the concept, observe, differentiate, and arrive.",
      },
    },
    {
      title: "Induced Calmness: Regulating the Overloaded Mind",
      slug: "induced-calmness-regulating-mind",
      authorName: "Dr. Alka Chopra Madan",
      categoryName: "Healing & Calmness",
      tags: ["Induced Calmness", "Healing & Calmness"],
      excerpt: "Step out of mental congestion long enough to see the situation before forcing an answer onto it.",
      content: `<h2>Calm as a Baseline, Not an Achievement</h2>
<p>When the nervous system has operated at high frequency for months, calmness can feel unfamiliar, even unsafe. Induced Calmness is a guided methodology designed to re-introduce the body to safety.</p>
<p>By shifting from cognitive problem-solving to physiological anchoring, the mental noise subsides and genuine clarity emerges.</p>`,
      featuredImage: "/your-path-to-peace.png",
      status: "PUBLISHED",
      isFeatured: false,
      publishDate: new Date("2026-07-20"),
      readTime: "4 min read",
    },
  ];

  for (const post of initialPosts) {
    await BlogPost.findOneAndUpdate({ slug: post.slug }, post, { upsert: true });
  }
  console.log("✅ Seeded Blog Posts");

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
        { format: "Paperback", price: 24.95, sku: "AAO-BK-001-PB", stockQuantity: 85 },
        { format: "Hardcover", price: 34.95, sku: "AAO-BK-001-HC", stockQuantity: 40 },
        { format: "E-book", price: 14.95, sku: "AAO-BK-001-EB", stockQuantity: 999 },
      ],
      description:
        "The central work of the Arrive at Origin framework. Origin as the position that remains when you stop moving away from yourself, and the systematic method for returning to it through Concept Clearing and direct differentiation.",
      shortDescription: "The central work of the AAO framework on returning to Origin.",
      coverImage: "/aao-part-one.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Metaphysics", "Self-Realisation"],
      price: 24.95,
      salePrice: 19.95,
      currency: "USD",
      stockQuantity: 85,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 42,
      revenue: 837.9,
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
        { format: "Paperback", price: 26.95, sku: "AAO-BK-002-PB", stockQuantity: 60 },
        { format: "Hardcover", price: 36.95, sku: "AAO-BK-002-HC", stockQuantity: 25 },
      ],
      description:
        "The elaboration: Concept Clearing as gateway, the four movements in depth, and living from Origin inside ordinary obligation and daily life.",
      shortDescription: "The in-depth elaboration and practical integration of AAO.",
      coverImage: "/aao-part-two.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Philosophy", "Living from Origin"],
      price: 26.95,
      salePrice: 22.95,
      currency: "USD",
      stockQuantity: 60,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 31,
      revenue: 711.45,
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
      formats: [{ format: "Paperback", price: 19.95, sku: "AAO-BK-003-PB", stockQuantity: 45 }],
      description: "Change, unpredictability, and the way we meet a life that does not consult us first.",
      shortDescription: "Navigating change and meeting life with clarity.",
      coverImage: "/your-path-to-transformation.png",
      categoryName: "Earlier Work",
      tags: ["Transformation", "Mindset"],
      price: 19.95,
      currency: "USD",
      stockQuantity: 45,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 19,
      revenue: 379.05,
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
      formats: [{ format: "Paperback", price: 19.95, sku: "AAO-BK-004-PB", stockQuantity: 50 }],
      description: "A return to what spirituality is underneath the labels it has collected.",
      shortDescription: "Spirituality freed from dogma and preconception.",
      coverImage: "/your-path-to-spirituality.png",
      categoryName: "Earlier Work",
      tags: ["Spirituality", "Meditation"],
      price: 19.95,
      currency: "USD",
      stockQuantity: 50,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 15,
      revenue: 299.25,
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
      formats: [{ format: "Paperback", price: 21.95, sku: "AAO-BK-005-PB", stockQuantity: 35 }],
      description:
        "What healing means across living, loss and recovery — held as inquiry rather than instruction.",
      shortDescription: "A gentle inquiry into living, loss, and true restoration.",
      coverImage: "/your-path-to-healing.png",
      categoryName: "Earlier Work",
      tags: ["Healing", "Grief"],
      price: 21.95,
      salePrice: 18.5,
      currency: "USD",
      stockQuantity: 35,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 24,
      revenue: 444.0,
      amazonUrl: "https://www.amazon.com/dp/B0C386DNVQ",
    },
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
      formats: [{ format: "Paperback", price: 17.95, sku: "AAO-BK-006-PB", stockQuantity: 40 }],
      description: "Daily reflections on uncluttering the mind and recovering personal quiet.",
      shortDescription: "Daily reflections on recovering quiet and mental simplicity.",
      coverImage: "/keeping-it-simple.png",
      categoryName: "Earlier Work",
      tags: ["Simplicity", "Peace"],
      price: 17.95,
      currency: "USD",
      stockQuantity: 40,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 12,
      revenue: 215.4,
      amazonUrl: "https://www.amazon.com/dp/B07VRKSC9P",
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
      value: "Metaphysics, grief counsel, spiritual direction, and Induced Calmness with Dr. Alka Chopra Madan.",
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

  console.log("🎉 Seeding complete!");
  await disconnectDB();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
