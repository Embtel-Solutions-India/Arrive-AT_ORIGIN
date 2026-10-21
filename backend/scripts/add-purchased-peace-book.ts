import "dotenv/config";
import { connectDB, disconnectDB } from "../src/database/mongodb.js";
import { Book } from "../src/models/Book.js";
import { Customer } from "../src/models/Customer.js";
import { PurchasedBook } from "../src/models/PurchasedBook.js";

async function main() {
  await connectDB();

  const peaceBook = await Book.findOne({ slug: "your-path-to-peace" });
  if (!peaceBook) {
    console.error("Book 'your-path-to-peace' not found in database.");
    await disconnectDB();
    return;
  }

  console.log(`Found book: "${peaceBook.title}" (ID: ${peaceBook._id})`);

  // Find all customers (including Vishu)
  const customers = await Customer.find({});
  console.log(`Found ${customers.length} customer(s).`);

  for (const cust of customers) {
    const existing = await PurchasedBook.findOne({
      customerEmail: cust.email.toLowerCase(),
      book: peaceBook._id,
    });

    if (!existing) {
      const pb = await PurchasedBook.create({
        customer: cust._id,
        customerEmail: cust.email.toLowerCase(),
        customerName: cust.name || "Customer",
        book: peaceBook._id,
        order: cust._id, // fallback ID
        orderNumber: `ORD-${Date.now().toString().slice(-6)}-PEACE`,
        title: peaceBook.title,
        slug: peaceBook.slug,
        format: "E-Book",
        coverImage: peaceBook.coverImage || "/your-path-to-peace.png",
        authorName: peaceBook.authorName || "Dr. Alka Chopra Madan",
        price: peaceBook.price || 3.99,
        currency: peaceBook.currency || "USD",
        pdfUrl: "/ebooks/your-path-to-peace.pdf",
        purchasedAt: new Date(),
      });
      console.log(`✅ Granted "${peaceBook.title}" to ${cust.name} (${cust.email})`);
    } else {
      existing.pdfUrl = "/ebooks/your-path-to-peace.pdf";
      await existing.save();
      console.log(`ℹ️ Updated existing purchase record for ${cust.name} (${cust.email})`);
    }
  }

  await disconnectDB();
}

main().catch((err) => {
  console.error("Error adding purchased book:", err);
  process.exit(1);
});
