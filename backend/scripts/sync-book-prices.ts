import "dotenv/config";
import { connectDB, disconnectDB } from "../src/database/mongodb.js";
import { Book } from "../src/models/Book.js";

export const USD_TO_INR_RATE = 96.79;

export interface BookFormatData {
  format: "E-Book" | "Kindle" | "Paperback" | "Hardcover";
  price: number; // in USD
  priceUSD: number;
  priceINR: number;
  sku: string;
  stockQuantity: number;
  isAvailable: boolean;
  pdfUrl?: string;
}

export interface AmazonBookData {
  slug: string;
  title: string;
  sku: string;
  priceUSD: number;
  priceINR: number;
  pdfUrl: string;
  formats: BookFormatData[];
}

export const AMAZON_US_BOOKS: AmazonBookData[] = [
  {
    slug: "arrive-at-origin-part-one",
    title: "AAO – Arrive at Origin (Part 1)",
    sku: "AAO-BK-001",
    priceUSD: 4.99,
    priceINR: 483.23,
    pdfUrl: "/uploads/ebooks/arrive-at-origin-part-one.pdf",
    formats: [
      {
        format: "E-Book",
        price: 4.99,
        priceUSD: 4.99,
        priceINR: 483.23,
        sku: "AAO-BK-001-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/arrive-at-origin-part-one.pdf",
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
  },
  {
    slug: "your-path-to-transformation",
    title: "Your Path to Transformation",
    sku: "AAO-BK-003",
    priceUSD: 5.0,
    priceINR: 484.2,
    pdfUrl: "/uploads/ebooks/your-path-to-transformation.pdf",
    formats: [
      {
        format: "E-Book",
        price: 5.0,
        priceUSD: 5.0,
        priceINR: 484.2,
        sku: "AAO-BK-003-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/your-path-to-transformation.pdf",
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
  },
  {
    slug: "your-path-to-peace",
    title: "Your Path to Peace",
    sku: "AAO-BK-007",
    priceUSD: 3.99,
    priceINR: 386.39,
    pdfUrl: "",
    formats: [
      {
        format: "E-Book",
        price: 3.99,
        priceUSD: 3.99,
        priceINR: 386.39,
        sku: "AAO-BK-007-EBOOK",
        stockQuantity: 0,
        isAvailable: false,
        pdfUrl: "",
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
  },
  {
    slug: "your-path-to-spirituality",
    title: "Your Path to Spirituality",
    sku: "AAO-BK-004",
    priceUSD: 3.0,
    priceINR: 290.52,
    pdfUrl: "/uploads/ebooks/your-path-to-spirituality.pdf",
    formats: [
      {
        format: "E-Book",
        price: 3.0,
        priceUSD: 3.0,
        priceINR: 290.52,
        sku: "AAO-BK-004-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/your-path-to-spirituality.pdf",
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
  },
  {
    slug: "arrive-at-origin-part-two",
    title: "AAO – Arrive at Origin (Part 2)",
    sku: "AAO-BK-002",
    priceUSD: 4.99,
    priceINR: 483.23,
    pdfUrl: "/uploads/ebooks/arrive-at-origin-part-two.pdf",
    formats: [
      {
        format: "E-Book",
        price: 4.99,
        priceUSD: 4.99,
        priceINR: 483.23,
        sku: "AAO-BK-002-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/arrive-at-origin-part-two.pdf",
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
  },
  {
    slug: "your-path-to-healing",
    title: "Your Path to Healing",
    sku: "AAO-BK-005",
    priceUSD: 4.99,
    priceINR: 483.23,
    pdfUrl: "/uploads/ebooks/your-path-to-healing.pdf",
    formats: [
      {
        format: "E-Book",
        price: 4.99,
        priceUSD: 4.99,
        priceINR: 483.23,
        sku: "AAO-BK-005-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/your-path-to-healing.pdf",
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
  },
  {
    slug: "keeping-it-simple",
    title: "Keeping It Simple",
    sku: "AAO-BK-006",
    priceUSD: 2.99,
    priceINR: 289.55,
    pdfUrl: "/uploads/ebooks/keeping-it-simple.pdf",
    formats: [
      {
        format: "E-Book",
        price: 2.99,
        priceUSD: 2.99,
        priceINR: 289.55,
        sku: "AAO-BK-006-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/keeping-it-simple.pdf",
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
  },
  {
    slug: "life-force-lost-and-found",
    title: "Life Force: Lost and Found",
    sku: "AAO-BK-008",
    priceUSD: 2.99,
    priceINR: 289.55,
    pdfUrl: "/uploads/ebooks/life-force-lost-and-found.pdf",
    formats: [
      {
        format: "E-Book",
        price: 2.99,
        priceUSD: 2.99,
        priceINR: 289.55,
        sku: "AAO-BK-008-EBOOK",
        stockQuantity: 9999,
        isAvailable: true,
        pdfUrl: "/uploads/ebooks/life-force-lost-and-found.pdf",
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
  },
];

async function syncBookPrices() {
  console.log("Connecting to MongoDB to sync exact Amazon US book prices and 3 format types...");
  await connectDB();

  for (const amazonData of AMAZON_US_BOOKS) {
    const book = await Book.findOne({
      $or: [{ slug: amazonData.slug }, { sku: amazonData.sku }],
    });

    if (book) {
      book.title = amazonData.title;
      book.price = amazonData.priceUSD;
      book.priceUSD = amazonData.priceUSD;
      book.priceINR = amazonData.priceINR;
      book.currency = "USD";
      book.pdfUrl = amazonData.pdfUrl;
      book.format = "E-Book";
      book.formats = amazonData.formats;

      await book.save();
      console.log(`✅ Synced "${book.title}": E-Book $${amazonData.priceUSD} | Formats:`, amazonData.formats.map(f => `${f.format}: ${f.isAvailable ? `$${f.price}` : 'Not Available'}`).join(', '));
    } else {
      console.warn(`⚠️ Book not found in database for slug: ${amazonData.slug}`);
    }
  }

  console.log("✨ All 7 Amazon US books synced with exact pricing, 3 formats, and dummy PDFs!");
  await disconnectDB();
}

syncBookPrices().catch((err) => {
  console.error("❌ Failed to sync book prices:", err);
  process.exit(1);
});
