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
      title: "AAO – Arrive at Origin (Part 1)",
      slug: "arrive-at-origin-part-one",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-001",
      isbn: "979-8877665544",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 284,
      format: "Kindle",
      pdfUrl: "/ebooks/arrive-at-origin-part-one.pdf",
      formats: [
        {
          format: "Kindle",
          price: 4.99,
          priceUSD: 4.99,
          priceINR: 483.23,
          sku: "AAO-BK-001-KINDLE",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/arrive-at-origin-part-one.pdf",
        },
        {
          format: "Paperback",
          price: 10.99,
          priceUSD: 10.99,
          priceINR: 1063.72,
          sku: "AAO-BK-001-PB",
          stockQuantity: 85,
          isAvailable: true,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-001-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description:
        "The central work of the Arrive at Origin framework. Origin as the position that remains when you stop moving away from yourself, and the systematic method for returning to it through Concept Clearing and direct differentiation.",
      shortDescription: "The central work of the AAO framework on returning to Origin.",
      coverImage: "/aao-part-one.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Metaphysics", "Self-Realisation"],
      price: 4.99,
      priceUSD: 4.99,
      priceINR: 483.23,
      currency: "USD",
      stockQuantity: 85,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 42,
      revenue: 209.58,
      amazonUrl: "https://www.amazon.com/dp/B0GX33FYHW",
      seo: {
        seoTitle: "AAO – Arrive at Origin (Part 1) by Dr. Alka Chopra Madan",
        metaDescription: "Discover Arrive at Origin, the central work on returning to the position that remains.",
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
      format: "Kindle",
      pdfUrl: "/ebooks/your-path-to-transformation.pdf",
      formats: [
        {
          format: "Kindle",
          price: 5.0,
          priceUSD: 5.0,
          priceINR: 484.2,
          sku: "AAO-BK-003-KINDLE",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/your-path-to-transformation.pdf",
        },
        {
          format: "Paperback",
          price: 5.0,
          priceUSD: 5.0,
          priceINR: 484.2,
          sku: "AAO-BK-003-PB",
          stockQuantity: 45,
          isAvailable: true,
        },
        {
          format: "Hardcover",
          price: 12.0,
          priceUSD: 12.0,
          priceINR: 1161.48,
          sku: "AAO-BK-003-HC",
          stockQuantity: 30,
          isAvailable: true,
        },
      ],
      description: "Change, unpredictability, and the way we meet a life that does not consult us first.",
      shortDescription: "Navigating change and meeting life with clarity.",
      coverImage: "/your-path-to-transformation.png",
      categoryName: "Earlier Work",
      tags: ["Transformation", "Mindset"],
      price: 5.0,
      priceUSD: 5.0,
      priceINR: 484.2,
      currency: "USD",
      stockQuantity: 45,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 19,
      revenue: 95.0,
      amazonUrl: "https://www.amazon.com/dp/B0CR9H7YMH",
    },
    {
      title: "Your Path to Peace",
      slug: "your-path-to-peace",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-007",
      isbn: "979-8877665501",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 41,
      format: "E-Book",
      pdfUrl: "/ebooks/your-path-to-peace.pdf",
      formats: [
        {
          format: "E-Book",
          price: 3.99,
          priceUSD: 3.99,
          priceINR: 386.39,
          sku: "AAO-BK-007-EBOOK",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/your-path-to-peace.pdf",
        },
        {
          format: "Paperback",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-007-PB",
          stockQuantity: 0,
          isAvailable: false,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-007-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description:
        "<p><strong>Your Path to Peace</strong> subtitled <em>A Journey Beyond Calmness</em> is Dr. Alka Chopra Madan's profound contemplative inquiry into the nature of true peace and emotional resolution.</p><p class=\"italic text-halo\">\"This book is not about becoming calm. It is about listening long enough for peace to arrive. Calmness can be created. Peace cannot. Peace emerges when nothing inside is being interrupted, silenced, or managed. It remains when what was unfinished is finally allowed to complete itself.\"</p><h4>Core Teachings & Insights</h4><ul><li><strong>Calmness vs. Peace:</strong> Why induced calmness through routines and affirmations provides temporary relief, but not resolution.</li><li><strong>The Nervous System Does Not Lie:</strong> The nervous system responds to experience, not beliefs. Tightness, chronic fatigue, and recurring anxiety are signals of unfinished sensation.</li><li><strong>Unfinished Emotional Loops:</strong> Emotions do not repeat because they are stubborn; they repeat because earlier experiences were interrupted before completing their arc.</li><li><strong>Facing Without Fixing:</strong> Facing does not happen in thought—it happens in the body as soft, uninterrupted attention.</li><li><strong>Emotional Sovereignty:</strong> Reclaiming your sovereignty by trusting the body to complete its own processes rather than outsourcing regulation.</li></ul><h4>Table of Contents</h4><ul><li><strong>Part I — The Addiction to Calm:</strong> The Era of Induced Calmness · Why Silence Became the Ideal · Spiritual Bypassing in Modern Disguise · The Nervous System Does Not Lie</li><li><strong>Part II — Understanding the Noise:</strong> The Language of Inner Noise · Unfinished Emotional Loops · Grief, Shock, and the Body’s Memory</li><li><strong>Part III — Facing Without Fixing:</strong> The Discipline of Facing · Staying Without Intervening · Letting Sensations Finish · When Meaning Arrives on Its Own</li><li><strong>Part IV — What Remains When the Noise Ends:</strong> The Difference Between Calm and Stillness · Living Without Internal Suppression · Emotional Sovereignty · A Quiet That Does Not Require Effort</li></ul>",
      shortDescription:
        "A Journey Beyond Calmness. An invitation not to practice peace, but to remove what stands in its way.",
      coverImage: "/your-path-to-peace.png",
      categoryName: "Earlier Work",
      tags: ["Peace", "Inner Stillness"],
      price: 3.99,
      priceUSD: 3.99,
      priceINR: 386.39,
      currency: "USD",
      stockQuantity: 9999,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 18,
      revenue: 71.82,
      amazonUrl: "https://www.amazon.com/dp/B0GJQV5M2F",
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
      format: "Kindle",
      pdfUrl: "/ebooks/your-path-to-spirituality.pdf",
      formats: [
        {
          format: "Kindle",
          price: 3.0,
          priceUSD: 3.0,
          priceINR: 290.52,
          sku: "AAO-BK-004-KINDLE",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/your-path-to-spirituality.pdf",
        },
        {
          format: "Paperback",
          price: 4.0,
          priceUSD: 4.0,
          priceINR: 387.16,
          sku: "AAO-BK-004-PB",
          stockQuantity: 50,
          isAvailable: true,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-004-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description: "A return to what spirituality is underneath the labels it has collected.",
      shortDescription: "Spirituality freed from dogma and preconception.",
      coverImage: "/your-path-to-spirituality.png",
      categoryName: "Earlier Work",
      tags: ["Spirituality", "Meditation"],
      price: 3.0,
      priceUSD: 3.0,
      priceINR: 290.52,
      currency: "USD",
      stockQuantity: 50,
      lowStockThreshold: 8,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 15,
      revenue: 45.0,
      amazonUrl: "https://www.amazon.com/dp/B0BBS9GRPJ",
    },
    {
      title: "AAO – Arrive at Origin (Part 2)",
      slug: "arrive-at-origin-part-two",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-002",
      isbn: "979-8877665551",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 70,
      format: "E-Book",
      pdfUrl: "/ebooks/arrive-at-origin-part-two.pdf",
      formats: [
        {
          format: "E-Book",
          price: 4.99,
          priceUSD: 4.99,
          priceINR: 483.23,
          sku: "AAO-BK-002-EBOOK",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/arrive-at-origin-part-two.pdf",
        },
        {
          format: "Paperback",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-002-PB",
          stockQuantity: 0,
          isAvailable: false,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-002-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description:
        "<p><strong>AAO (आओ) — Arrive at Origin: Part 2</strong> subtitled <em>Why We Repeat Emotional Pain and How to Return to Love</em> is Dr. Alka Chopra Madan's transformative inquiry into the hidden emotional architecture of human life.</p><p>Why do different relationships create the same ache? Why does a new opportunity awaken the same fear? Why does life keep repeating itself? In Part 2 of the Arrive at Origin series, Dr. Madan introduces a breakthrough distinction: <strong>events pass, but emotional charge often remains</strong>. When overwhelming experiences exceed our capacity to process them in the moment, they become weighted impressions—internal architecture that quietly dictates our reactions, choices, and identities.</p><h4>Core Themes & Teachings</h4><ul><li><strong>The Invisible Suitcase:</strong> How adaptive survival strategies from childhood become invisible burdens we mistake for personality or nature.</li><li><strong>Emotional Charge & Identity Fusion:</strong> Understanding how 'I failed' turns into 'I am a failure,' and how to untangle who you are from what you experienced.</li><li><strong>Pleasure Can Trap Too:</strong> How addiction to validation, romantic intensity, and achievements creates the exact same emotional loops as trauma.</li><li><strong>Your Body Is an Interface:</strong> Honoring the physical body as a sacred interface without letting physical and biological changes collapse your core identity.</li><li><strong>The Zero Principle:</strong> Neutrality not as coldness or numbness, but as equilibrium—the still lake after the storm where love, creativity, and presence flourish freely.</li><li><strong>Play Consciousness:</strong> Reclaiming participation without scorekeeping—shifting from being an anxious defendant in a courtroom to a joyful player on a canvas.</li><li><strong>The 10-Step AAO Digestion Sequence:</strong> A practical, repeatable process (Notice, Separate, Locate, Name, Trace, Allow, Question, Regulate, Complete, Return) to dissolve emotional charge and metabolize pain into wisdom.</li></ul><h4>Complete Table of Contents</h4><ol><li>Why Does This Keep Happening to Me?</li><li>The Invisible Suitcase</li><li>Same Event, Different Reality</li><li>Pleasure Can Trap Too</li><li>Emotional Charge: The Real Trap</li><li>How Overwhelm Becomes Imprint</li><li>Your Body Is an Interface</li><li>The Mind That Repeats</li><li>What If Life Is Play?</li><li>Why Forgetting Happens</li><li>The Creator Who Forgot</li><li>Creation and Uncreation</li><li>Love Is Not Attachment</li><li>The Freedom of Being Nothing</li><li>Returning to Zero</li><li>Digesting Emotional Impressions</li><li>Reclaiming Playfulness</li><li>Conscious Creation</li><li><em>Final Chapter:</em> Arrive at Origin</li></ol><p class=\"italic text-halo\">\"You are not the emotional loop, you are not the unfinished story, and you are not the burden you have been carrying. You are the awareness beneath it. The love beneath it. Arrive at origin.\"</p>",
      shortDescription:
        "Why We Repeat Emotional Pain and How to Return to Love. Dissolving emotional loops, identity fusion, and returning to conscious presence.",
      coverImage: "/aao-part-two.png",
      categoryName: "AAO Series",
      tags: ["AAO", "Metaphysics", "Consciousness", "Emotional Healing", "Living from Origin"],
      price: 4.99,
      priceUSD: 4.99,
      priceINR: 483.23,
      currency: "USD",
      stockQuantity: 9999,
      lowStockThreshold: 10,
      status: "PUBLISHED",
      isFeatured: true,
      salesCount: 31,
      revenue: 154.69,
      amazonUrl: "https://www.amazon.com/dp/B0H1H83KNV",
      seo: {
        seoTitle: "AAO (आओ) – Arrive at Origin (Part 2) | Dr. Alka Chopra Madan",
        metaDescription:
          "Why We Repeat Emotional Pain and How to Return to Love. Explore the 10-step digestion sequence and return to Origin by Dr. Alka Chopra Madan.",
      },
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
      format: "Kindle",
      pdfUrl: "/ebooks/your-path-to-healing.pdf",
      formats: [
        {
          format: "Kindle",
          price: 4.99,
          priceUSD: 4.99,
          priceINR: 483.23,
          sku: "AAO-BK-005-KINDLE",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/your-path-to-healing.pdf",
        },
        {
          format: "Paperback",
          price: 4.99,
          priceUSD: 4.99,
          priceINR: 483.23,
          sku: "AAO-BK-005-PB",
          stockQuantity: 35,
          isAvailable: true,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-005-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description:
        "What healing means across living, loss and recovery — held as inquiry rather than instruction.",
      shortDescription: "A gentle inquiry into living, loss, and true restoration.",
      coverImage: "/your-path-to-healing.png",
      categoryName: "Earlier Work",
      tags: ["Healing", "Grief"],
      price: 4.99,
      priceUSD: 4.99,
      priceINR: 483.23,
      currency: "USD",
      stockQuantity: 35,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 24,
      revenue: 119.76,
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
      format: "Kindle",
      pdfUrl: "/ebooks/keeping-it-simple.pdf",
      formats: [
        {
          format: "Kindle",
          price: 2.99,
          priceUSD: 2.99,
          priceINR: 289.55,
          sku: "AAO-BK-006-KINDLE",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/keeping-it-simple.pdf",
        },
        {
          format: "Paperback",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-006-PB",
          stockQuantity: 0,
          isAvailable: false,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-006-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description: "Daily reflections on uncluttering the mind and recovering personal quiet. Soul, body and mind do not require life to be made more complicated than it already is.",
      shortDescription: "Daily reflections on recovering quiet and mental simplicity.",
      coverImage: "/keeping-it-simple.png",
      categoryName: "Earlier Work",
      tags: ["Simplicity", "Peace"],
      price: 2.99,
      priceUSD: 2.99,
      priceINR: 289.55,
      currency: "USD",
      stockQuantity: 40,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 12,
      revenue: 35.88,
      amazonUrl: "https://www.amazon.com/dp/B07VRKSC9P",
    },
    {
      title: "Life Force: Lost and Found",
      slug: "life-force-lost-and-found",
      authorName: "Dr. Alka Chopra Madan",
      sku: "AAO-BK-008",
      isbn: "979-8877665518",
      publisher: "Soul Body Publishing",
      language: "English",
      pages: 46,
      format: "E-Book",
      pdfUrl: "/ebooks/life-force-lost-and-found.pdf",
      formats: [
        {
          format: "E-Book",
          price: 2.99,
          priceUSD: 2.99,
          priceINR: 289.55,
          sku: "AAO-BK-008-EBOOK",
          stockQuantity: 9999,
          isAvailable: true,
          pdfUrl: "/ebooks/life-force-lost-and-found.pdf",
        },
        {
          format: "Paperback",
          price: 2.99,
          priceUSD: 2.99,
          priceINR: 289.55,
          sku: "AAO-BK-008-PB",
          stockQuantity: 45,
          isAvailable: true,
        },
        {
          format: "Hardcover",
          price: 0,
          priceUSD: 0,
          priceINR: 0,
          sku: "AAO-BK-008-HC",
          stockQuantity: 0,
          isAvailable: false,
        },
      ],
      description: "Energy, wholeness, and reconnecting with the vitality of being alive.",
      shortDescription: "Energy, wholeness, and reconnecting with the vitality of being alive.",
      coverImage: "/life-force-lost-and-found.png",
      categoryName: "Earlier Work",
      tags: ["Energy", "Vitality", "Healing"],
      price: 2.99,
      priceUSD: 2.99,
      priceINR: 289.55,
      currency: "USD",
      stockQuantity: 45,
      lowStockThreshold: 5,
      status: "PUBLISHED",
      isFeatured: false,
      salesCount: 0,
      revenue: 0,
      amazonUrl: "https://www.amazon.com/Life-Force-Alka-Chopra-Madan-ebook/dp/B07VQDY6VP",
    },
  ];

  for (const b of books) {
    await Book.findOneAndUpdate({ sku: b.sku }, b, { upsert: true });
  }
  console.log("✅ Seeded Books");

  // 8. SEO & Site Settings
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

  // 9. Coupons & Discounts
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
