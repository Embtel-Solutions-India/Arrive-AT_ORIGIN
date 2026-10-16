import dotenv from "dotenv";
dotenv.config();

import {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderAdminNotificationEmail,
  getAdminNotificationEmails,
} from "../src/services/email.service.js";
import { logger } from "../src/utils/logger.js";

// Parse CLI flags
const args = process.argv.slice(2);
let customerEmail = "shiv@embtelsolutions.com";
let adminOverride: string[] | null = null;

for (const arg of args) {
  if (arg.startsWith("--customer=")) {
    customerEmail = arg.split("=")[1].trim();
  } else if (arg.startsWith("--admin=")) {
    adminOverride = arg
      .split("=")[1]
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));
  }
}

const adminRecipients = adminOverride && adminOverride.length > 0
  ? adminOverride
  : getAdminNotificationEmails();

console.log("=================================================");
console.log("📦 DISPATCHING TEST ORDER EMAILS VIA RESEND");
console.log("=================================================");
console.log(`1. Customer Confirmation Recipient: ${customerEmail}`);
console.log(`2. Admin Notification Alert Recipient(s): ${adminRecipients.join(", ")}`);
console.log("=================================================\n");

const sampleOrder: any = {
  orderNumber: `ORD-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
  customerInfo: {
    name: "Shivraj Singh (Test Customer)",
    email: customerEmail,
    phone: "+1 (510) 555-0199",
  },
  items: [
    {
      title: "Arrive at Origin: Part One — Awakening to Wholeness",
      sku: "AAO-BK-01-HC",
      format: "Hardcover Edition",
      price: 49.0,
      quantity: 1,
      subtotal: 49.0,
    },
    {
      title: "Living from Wholeness: Daily Meditation & Practice Guide",
      sku: "AAO-BK-02-PB",
      format: "Paperback Edition",
      price: 24.99,
      quantity: 1,
      subtotal: 24.99,
    },
  ],
  subtotal: 73.99,
  shipping: 0,
  tax: 0,
  discount: 10.0,
  couponCode: "WELCOME10",
  total: 63.99,
  currency: "USD",
  paymentStatus: "PAID",
  orderStatus: "PAYMENT_CONFIRMED",
  shippingAddress: {
    street: "39899 Balentine Dr, Suite 200",
    city: "Newark",
    state: "CA",
    postalCode: "94560",
    country: "United States",
  },
  billingAddress: {
    street: "39899 Balentine Dr, Suite 200",
    city: "Newark",
    state: "CA",
    postalCode: "94560",
    country: "United States",
  },
};

async function run() {
  console.log(`[Step 1/2] Sending Customer Order Confirmation to: ${customerEmail}...`);
  await sendOrderConfirmationEmail(sampleOrder);
  console.log("✓ Customer Confirmation Email dispatched successfully!\n");

  if (adminOverride && adminOverride.length > 0) {
    console.log(`[Step 2/2] Awaiting Admin Notification Alert delivery to override: ${adminRecipients.join(", ")}...`);
    const { resolveBaseUrl, wrapEmailShell } = await import("../src/services/email.service.js");
    const baseUrl = resolveBaseUrl();
    const adminUrl = `${baseUrl}/admin/orders`;

    const itemsRows = sampleOrder.items
      .map(
        (it: any) => `
        <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
          <td style="padding: 10px 0; color: #EDE7DA; font-size: 14px;">
            <strong>${it.title}</strong><br>
            <span style="color: #8A93A8; font-size: 12px;">${it.format || "Paperback"} × ${it.quantity}</span>
          </td>
          <td align="right" style="padding: 10px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">
            $${(it.price * it.quantity).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const address = sampleOrder.shippingAddress;
    const addressText = `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;

    const content = `
      <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
        Hello <strong>Administrator</strong>,
      </p>
      <p>
        A new test book purchase has been completed on <strong>Arrive at Origin</strong>.
      </p>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.7); border: 1px solid rgba(232, 206, 140, 0.2); border-radius: 12px; margin: 18px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <div style="color: #E8CE8C; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 10px;">
              Customer & Delivery Details
            </div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
                <td style="padding: 6px 0; color: #8A93A8; font-size: 13px;">Customer Name:</td>
                <td align="right" style="padding: 6px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">${sampleOrder.customerInfo.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
                <td style="padding: 6px 0; color: #8A93A8; font-size: 13px;">Email:</td>
                <td align="right" style="padding: 6px 0; color: #E8CE8C; font-size: 14px;">${sampleOrder.customerInfo.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
                <td style="padding: 6px 0; color: #8A93A8; font-size: 13px;">Shipping Address:</td>
                <td align="right" style="padding: 6px 0; color: #EDE7DA; font-size: 13px;">${addressText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.7); border: 1px solid rgba(232, 206, 140, 0.2); border-radius: 12px; margin: 20px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr style="border-bottom: 1px solid rgba(232, 206, 140, 0.2);">
                <td style="padding: 6px 0; color: #E8CE8C; font-size: 13px; font-weight: 700;">ORDER #${sampleOrder.orderNumber}</td>
                <td align="right" style="padding: 6px 0; color: #34D399; font-size: 13px; font-weight: 700;">PAID</td>
              </tr>
              ${itemsRows}
              <tr>
                <td style="padding: 10px 0 4px; color: #E8CE8C; font-weight: 700; font-size: 15px;">Total Paid</td>
                <td align="right" style="padding: 10px 0 4px; color: #34D399; font-weight: 700; font-size: 17px;">$${sampleOrder.total.toFixed(2)} USD</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const html = wrapEmailShell("New Book Order Received", `📦 Order #${sampleOrder.orderNumber}`, content, baseUrl);
    const res = await sendEmail({
      to: adminRecipients,
      subject: `🔔 [New Book Order Alert] Order #${sampleOrder.orderNumber} from ${sampleOrder.customerInfo.name} ($${sampleOrder.total.toFixed(2)})`,
      html,
    });
    console.log("✓ Admin Alert dispatched via override! Resend ID:", res.id);
  } else {
    console.log("✓ Admin Notification Alert automatically dispatched to ADMIN_NOTIFICATION_EMAILS via sendOrderConfirmationEmail!");
  }

  // Small delay to ensure all asynchronous loggers/background tasks finish
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("\n=================================================");
  console.log("✨ ALL TEST ORDER EMAILS DISPATCHED SUCCESSFULLY!");
  console.log("=================================================");
}

run().catch((err) => {
  console.error("❌ Error sending test order emails:", err);
  process.exit(1);
});
