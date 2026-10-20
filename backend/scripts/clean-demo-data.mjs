import mongoose from 'mongoose';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const VISHU_EMAIL = 'vishu@embtelsolutions.com';
const VISHU_ORDER_ID = new mongoose.Types.ObjectId('6ad7a599f96d18e602889ae0');
const VISHU_CUSTOMER_ID = new mongoose.Types.ObjectId('6ac7cf99e377c142aecb9dd5');
const VISHU_CONSULTATION_ID = new mongoose.Types.ObjectId('6ac7cfd4e377c142aecb9dd6');
const VISHU_PAYMENT_ID = new mongoose.Types.ObjectId('6ad7a599f96d18e602889ae1');
const AAO_PART_ONE_BOOK_ID = new mongoose.Types.ObjectId('6ac3d7e20d0c728ad6b902b5');

async function cleanDemoData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas.");

  const db = mongoose.connection.db;

  // 1. Create a full backup of affected collections first
  console.log("📦 Creating backup of current data...");
  const backup = {
    customers: await db.collection('customers').find({}).toArray(),
    orders: await db.collection('orders').find({}).toArray(),
    payments: await db.collection('payments').find({}).toArray(),
    consultations: await db.collection('consultations').find({}).toArray(),
    purchasedbooks: await db.collection('purchasedbooks').find({}).toArray(),
    users: await db.collection('users').find({}).toArray(),
  };
  fs.writeFileSync('./scripts/backup-demo-data.json', JSON.stringify(backup, null, 2));
  console.log("✅ Backup saved to backend/scripts/backup-demo-data.json");

  // 2. Clean Orders: Keep only Vishu's order
  const ordersBefore = await db.collection('orders').countDocuments();
  const delOrders = await db.collection('orders').deleteMany({
    _id: { $ne: VISHU_ORDER_ID }
  });
  console.log(`🛒 Orders: removed ${delOrders.deletedCount} demo orders (was ${ordersBefore}, now ${await db.collection('orders').countDocuments()})`);

  // 3. Clean Payments: Keep only Vishu's payment
  const paymentsBefore = await db.collection('payments').countDocuments();
  const delPayments = await db.collection('payments').deleteMany({
    $and: [
      { _id: { $ne: VISHU_PAYMENT_ID } },
      { order: { $ne: VISHU_ORDER_ID } }
    ]
  });
  console.log(`💳 Payments: removed ${delPayments.deletedCount} demo payments (was ${paymentsBefore}, now ${await db.collection('payments').countDocuments()})`);

  // 4. Clean Customers: Keep only Vishu Gupta
  const customersBefore = await db.collection('customers').countDocuments();
  const delCustomers = await db.collection('customers').deleteMany({
    email: { $ne: VISHU_EMAIL }
  });
  console.log(`👥 Customers: removed ${delCustomers.deletedCount} demo customers (was ${customersBefore}, now ${await db.collection('customers').countDocuments()})`);

  // 5. Clean Consultations: Keep only Vishu Gupta's consultation
  const consultsBefore = await db.collection('consultations').countDocuments();
  const delConsults = await db.collection('consultations').deleteMany({
    $and: [
      { _id: { $ne: VISHU_CONSULTATION_ID } },
      { customerEmail: { $ne: VISHU_EMAIL } }
    ]
  });
  console.log(`📅 Consultations: removed ${delConsults.deletedCount} demo consultations (was ${consultsBefore}, now ${await db.collection('consultations').countDocuments()})`);

  // 6. Purchased Books: Remove demo purchased books, ensure Vishu has his purchased book
  const pbBefore = await db.collection('purchasedbooks').countDocuments();
  await db.collection('purchasedbooks').deleteMany({
    customerEmail: { $ne: VISHU_EMAIL }
  });
  
  // Ensure Vishu has his purchased book for AAO Part 1
  const vishuPB = await db.collection('purchasedbooks').findOne({ customerEmail: VISHU_EMAIL });
  if (!vishuPB) {
    await db.collection('purchasedbooks').insertOne({
      customer: VISHU_CUSTOMER_ID,
      customerEmail: VISHU_EMAIL,
      customerName: "Vishu Gupta",
      book: AAO_PART_ONE_BOOK_ID,
      order: VISHU_ORDER_ID,
      orderNumber: "ORD-442972-519",
      title: "AAO – Arrive at Origin (Part 1)",
      slug: "arrive-at-origin-part-one",
      format: "E-Book",
      coverImage: "/aao-part-one.png",
      authorName: "Dr. Alka Chopra Madan",
      price: 58.23,
      currency: "INR",
      pdfUrl: "/ebooks/arrive-at-origin-part-one.pdf",
      purchasedAt: new Date("2026-10-20T17:32:09.501Z"),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("📚 Added Vishu's purchased book record for AAO Part 1 (E-Book)");
  }
  console.log(`📖 Purchased Books: now ${await db.collection('purchasedbooks').countDocuments()} (was ${pbBefore})`);

  // 7. Update Vishu's customer stats
  await db.collection('customers').updateOne(
    { email: VISHU_EMAIL },
    {
      $set: {
        totalOrders: 1,
        totalSpent: 58.23,
        lastOrderDate: new Date("2026-10-20T17:32:09.501Z"),
        updatedAt: new Date()
      }
    }
  );

  // 8. Add Vishu to Users (Admin) if not already present
  const hash = await argon2.hash('Password123!', { type: argon2.argon2id });
  const existingVishuUser = await db.collection('users').findOne({ email: VISHU_EMAIL });
  if (!existingVishuUser) {
    await db.collection('users').insertOne({
      name: 'Vishu Gupta',
      username: 'vishu',
      email: VISHU_EMAIL,
      phone: '+91 8650253797',
      passwordHash: hash,
      role: 'ADMIN',
      avatar: '',
      status: 'ACTIVE',
      permissions: ['*'],
      passwordHistory: [hash],
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`👤 Created Admin user for ${VISHU_EMAIL}`);
  } else {
    console.log(`👤 Vishu user already exists in users collection`);
  }

  // Summary check
  console.log("\n=== FINAL VERIFICATION ===");
  const customers = await db.collection('customers').find({}).toArray();
  console.log("Customers in DB:", customers.map(c => `${c.name} (${c.email})`));

  const orders = await db.collection('orders').find({}).toArray();
  console.log("Orders in DB:", orders.map(o => `${o.orderNumber} - ${o.customerInfo?.name || o.customerName} (${o.total} ${o.currency})`));

  const payments = await db.collection('payments').find({}).toArray();
  console.log("Payments in DB:", payments.map(p => `${p.orderNumber} - ${p.amount} ${p.currency} (${p.status})`));

  const consultations = await db.collection('consultations').find({}).toArray();
  console.log("Consultations in DB:", consultations.map(c => `${c.customerName || c.clientName} (${c.customerEmail || c.clientEmail}) - ${c.status}`));

  const purchasedBooks = await db.collection('purchasedbooks').find({}).toArray();
  console.log("Purchased Books in DB:", purchasedBooks.map(b => `${b.customerName} (${b.customerEmail}) -> ${b.title}`));

  const users = await db.collection('users').find({}).toArray();
  console.log("Admin Users in DB:", users.map(u => `${u.name} (${u.email}) [${u.role}]`));

  await mongoose.disconnect();
  console.log("\n✨ Demo data cleanup complete!");
}

cleanDemoData().catch(console.error);
