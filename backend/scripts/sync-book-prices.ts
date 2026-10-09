import "dotenv/config";
import { connectDB, disconnectDB } from "../src/database/mongodb.js";
import { Book } from "../src/models/Book.js";

const USD_TO_INR_RATE = 96.79;

// Known accurate INR book rates mapped by slug or SKU
const KNOWN_INR_PRICES: Record<string, { inr: number; usd: number; formats?: Array<{ format: string; price: number; sku?: string }> }> = {
  "keeping-it-simple": {
    inr: 289.55,
    usd: 2.99,
    formats: [{ format: "Paperback", price: 2.99, sku: "AAO-BK-006-PB" }],
  },
  "your-path-to-peace": {
    inr: 386.39,
    usd: 3.99,
    formats: [{ format: "Paperback", price: 3.99, sku: "AAO-BK-007-PB" }],
  },
  "life-force-lost-and-found": {
    inr: 289.55,
    usd: 2.99,
    formats: [{ format: "Paperback", price: 2.99, sku: "AAO-BK-008-PB" }],
  },
  "arrive-at-origin-part-one": {
    inr: 483.23,
    usd: 4.99,
    formats: [
      { format: "Paperback", price: 4.99, sku: "AAO-BK-001-PB" },
      { format: "Hardcover", price: 7.06, sku: "AAO-BK-001-HC" },
      { format: "E-book", price: 3.09, sku: "AAO-BK-001-EB" },
    ],
  },
  "arrive-at-origin-part-two": {
    inr: 483.23,
    usd: 4.99,
    formats: [
      { format: "Paperback", price: 4.99, sku: "AAO-BK-002-PB" },
      { format: "Hardcover", price: 7.06, sku: "AAO-BK-002-HC" },
    ],
  },
  "your-path-to-transformation": {
    inr: 484.20,
    usd: 5.00,
    formats: [{ format: "Paperback", price: 5.00, sku: "AAO-BK-003-PB" }],
  },
  "your-path-to-spirituality": {
    inr: 290.52,
    usd: 3.00,
    formats: [{ format: "Paperback", price: 3.00, sku: "AAO-BK-004-PB" }],
  },
  "your-path-to-healing": {
    inr: 483.23,
    usd: 4.99,
    formats: [{ format: "Paperback", price: 4.99, sku: "AAO-BK-005-PB" }],
  },
};

async function syncBookPrices() {
  console.log("Connecting to MongoDB to sync book prices...");
  await connectDB();

  const books = await Book.find({});
  console.log(`Found ${books.length} books in database.`);

  for (const book of books) {
    const known = KNOWN_INR_PRICES[book.slug] || Object.values(KNOWN_INR_PRICES).find((k) => k.formats?.some(f => f.sku === book.sku));

    let inrPrice = known?.inr || book.priceINR || (book.price >= 50 ? book.price : Number((book.price * USD_TO_INR_RATE).toFixed(2)));
    let usdPrice = known?.usd || (book.priceUSD && book.priceUSD < 50 ? book.priceUSD : Number((inrPrice / USD_TO_INR_RATE).toFixed(2)));

    book.priceINR = inrPrice;
    book.priceUSD = usdPrice;
    book.price = usdPrice; // Website default is USD
    book.currency = "USD";

    if (known?.formats && known.formats.length > 0) {
      book.formats = known.formats.map((kf) => ({
        format: kf.format,
        price: kf.price,
        sku: kf.sku,
        stockQuantity: book.formats?.find((f) => f.format === kf.format)?.stockQuantity ?? 50,
      }));
    }

    await book.save();
    console.log(`✓ Updated "${book.title}": USD $${usdPrice} | INR ₹${inrPrice}`);
  }

  console.log("✨ All book prices synchronized successfully!");
  await disconnectDB();
}

syncBookPrices().catch((err) => {
  console.error("Failed to sync book prices:", err);
  process.exit(1);
});
