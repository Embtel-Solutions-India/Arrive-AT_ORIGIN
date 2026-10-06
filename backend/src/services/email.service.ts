import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { IConsultation } from "../models/Consultation.js";
import type { IOrder } from "../models/Order.js";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Dispatches transactional email via Resend API
 */
export async function sendEmail(msg: EmailMessage): Promise<{ id?: string; success: boolean }> {
  const rawFrom = msg.from || env.EMAIL_FROM || "Arrive at Origin <info@arriveatorigin.com>";
  const from = rawFrom.replace(/^["']|["']$/g, "").trim();
  const rawReplyTo = msg.replyTo || env.EMAIL_REPLY_TO || "info@arriveatorigin.com";
  const replyTo = rawReplyTo.replace(/^["']|["']$/g, "").trim();
  const to = Array.isArray(msg.to) ? msg.to : [msg.to];

  logger.info({ to, subject: msg.subject }, "Dispatching transactional email via Resend API");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: replyTo,
      }),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      logger.error({ status: res.status, data }, "Resend API rejected email dispatch");
      return { success: false };
    }

    logger.info({ id: data.id, to }, "Email successfully delivered to Resend queue");
    return { id: data.id, success: true };
  } catch (err: any) {
    logger.error({ err: err?.message || err }, "Failed to send email via Resend");
    return { success: false };
  }
}

// ─── Shared Email Shell ───
function wrapEmailShell(title: string, badgeText: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #070B18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #EDE7DA;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #0E1630; border: 1px solid rgba(232, 206, 140, 0.28); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #18254A 0%, #0E1630 100%); padding: 36px 24px 28px; border-bottom: 1px solid rgba(232, 206, 140, 0.18);">
              <div style="font-size: 28px; line-height: 1; margin-bottom: 8px;">✦</div>
              <div style="color: #E8CE8C; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; margin-bottom: 8px;">
                Arrive at Origin
              </div>
              <h1 style="color: #EDE7DA; font-size: 24px; font-weight: 300; margin: 0 0 6px; letter-spacing: -0.5px;">
                ${title}
              </h1>
              ${badgeText ? `<div style="display: inline-block; background: rgba(232, 206, 140, 0.12); border: 1px solid rgba(232, 206, 140, 0.25); color: #E8CE8C; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 9999px; margin-top: 6px;">${badgeText}</div>` : ""}
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px; color: #C6CBD8; font-size: 15px; line-height: 1.65;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070B18; border-top: 1px solid rgba(232, 206, 140, 0.12); padding: 24px; text-align: center; color: #8A93A8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px; color: #E8CE8C; font-weight: 600; font-size: 13px;">
                Arrive at Origin
              </p>
              <p style="margin: 0 0 10px;">
                Soul Body Healing Center • Fremont, CA<br>
                Living from Wholeness
              </p>
              <p style="margin: 0; font-size: 11px; color: #5A6275;">
                Need assistance? Reply directly to this email or visit <a href="${env.APP_URL}" style="color: #E8CE8C; text-decoration: none;">arriveatorigin.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. ✦ New User Welcome Email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const portalUrl = `${env.APP_URL}/account`;

  const content = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${name}</strong>,
    </p>
    <p>
      Welcome to <strong>Arrive at Origin</strong>. We are deeply honored to have you join our sanctuary of holistic transformation, consciousness, and self-realization.
    </p>
    <p>
      Your personal account has been created, giving you seamless, 24/7 access to your healing journey:
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 22px 0; background: rgba(7, 11, 24, 0.6); border: 1px solid rgba(232, 206, 140, 0.15); border-radius: 12px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td width="28" valign="top" style="color: #E8CE8C; font-size: 16px;">✦</td>
              <td style="color: #EDE7DA; font-size: 14px; padding-bottom: 10px;">
                <strong>Consultation Sessions:</strong> Access appointment dates, session notes, and Zoom links anytime.
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="color: #E8CE8C; font-size: 16px;">✦</td>
              <td style="color: #EDE7DA; font-size: 14px; padding-bottom: 10px;">
                <strong>Book Store & Orders:</strong> Track shipments, download digital guides, and view past receipts.
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="color: #E8CE8C; font-size: 16px;">✦</td>
              <td style="color: #EDE7DA; font-size: 14px;">
                <strong>Unified Profile:</strong> Manage your billing preferences and appointment history in one secure place.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px 0 20px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 15px; padding: 14px 34px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(232, 206, 140, 0.3);">
            Go to My Account →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #A0A8BA; margin-bottom: 0;">
      If you ever have any questions about scheduling or your orders, our team is always here for you. Simply reply to this email.
    </p>
  `;

  const html = wrapEmailShell("Welcome to Arrive at Origin", "✦ Account Activated", content);

  await sendEmail({
    to: email,
    subject: `✦ Welcome to Arrive at Origin, ${name}`,
    html,
  });
}

/**
 * 2. 🔐 Customer Password Reset Email
 */
export async function sendCustomerPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.APP_URL}/account?mode=reset&token=${resetToken}`;

  const content = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Hello <strong style="color: #E8CE8C;">${name}</strong>,
    </p>
    <p>
      We received a request to reset the password for your Arrive at Origin account (<strong>${email}</strong>).
    </p>
    <p>
      Click the golden button below to choose your new password:
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px 0 24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(232, 206, 140, 0.3);">
            Reset My Password →
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.5); border: 1px solid rgba(232, 206, 140, 0.12); border-radius: 10px; margin: 20px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #8A93A8; font-size: 13px; line-height: 1.5;">
          ⏱ <strong>Security Notice:</strong> This reset link will expire in <strong>1 hour</strong> and can only be used once.<br>
          If you did not request this password reset, please ignore this email. Your account remains completely secure.
        </td>
      </tr>
    </table>
  `;

  const html = wrapEmailShell("Password Reset", "🔐 Account Security", content);

  await sendEmail({
    to: email,
    subject: "🔐 Reset Your Arrive at Origin Password",
    html,
  });
}

/**
 * 3. ✦ Consultation Booking Confirmation Email
 */
export async function sendConsultationConfirmationEmail(booking: IConsultation): Promise<void> {
  const isZoom = booking.meetingMode === "ONLINE_ZOOM";
  const formatText = isZoom
    ? "Online Video Meeting (Zoom / Google Meet)"
    : "In-Person Sanctuary (Fremont, CA)";

  const meetingInstructions = isZoom
    ? `
      <div style="background: rgba(78, 124, 116, 0.15); border: 1px solid rgba(78, 124, 116, 0.35); border-radius: 10px; padding: 14px 18px; margin: 18px 0; color: #EDE7DA; font-size: 14px;">
        <strong style="color: #4E7C74;">📹 Online Session Details:</strong><br>
        A private, encrypted video conference link will be sent to your email 15 minutes before your scheduled appointment. Please find a quiet, comfortable space with a stable internet connection.
      </div>
    `
    : `
      <div style="background: rgba(232, 206, 140, 0.1); border: 1px solid rgba(232, 206, 140, 0.25); border-radius: 10px; padding: 14px 18px; margin: 18px 0; color: #EDE7DA; font-size: 14px;">
        <strong style="color: #E8CE8C;">📍 In-Person Sanctuary Location:</strong><br>
        Soul Body Healing Center • Fremont, California.<br>
        Please plan to arrive 10 minutes prior to your appointment time in comfortable clothing.
      </div>
    `;

  const content = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${booking.clientName}</strong>,
    </p>
    <p>
      Your consultation with <strong>Arrive at Origin</strong> has been confirmed and registered in our calendar.
    </p>

    <!-- Appointment Summary Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.7); border: 1px solid rgba(232, 206, 140, 0.2); border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Booking Ref:</td>
              <td align="right" style="padding: 8px 0; color: #E8CE8C; font-weight: 700; font-size: 14px;">${booking.bookingNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Package:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">${booking.packageName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Date & Time:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">${booking.appointmentDate} at ${booking.appointmentTime}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Session Format:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 14px;">${formatText}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Total Paid:</td>
              <td align="right" style="padding: 8px 0; color: #34D399; font-weight: 700; font-size: 15px;">$${booking.price} USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${meetingInstructions}

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <a href="${env.APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 14px; padding: 13px 30px; border-radius: 9999px; text-decoration: none;">
            View Appointment in My Account →
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = wrapEmailShell("Consultation Confirmed", "✓ Scheduled & Confirmed", content);

  await sendEmail({
    to: booking.clientEmail,
    subject: `✦ Consultation Confirmed: ${booking.packageName} (${booking.bookingNumber}) — Arrive at Origin`,
    html,
  });
}

/**
 * 4. 📦 Book Store Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order: IOrder): Promise<void> {
  const itemsRows = order.items
    .map(
      (it) => `
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

  const address = order.shippingAddress;
  const addressText = address?.street
    ? `${address.street}, ${address.city || ""}, ${address.state || ""} ${address.postalCode || ""}`
    : "Digital Delivery / Pick-up on Record";

  const content = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${order.customerInfo.name}</strong>,
    </p>
    <p>
      Thank you for your order with <strong>Arrive at Origin Publications</strong>. Your payment has been received and your order is currently being prepared for dispatch.
    </p>

    <!-- Order Items Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.7); border: 1px solid rgba(232, 206, 140, 0.2); border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr style="border-bottom: 1px solid rgba(232, 206, 140, 0.2);">
              <td style="padding: 6px 0; color: #E8CE8C; font-size: 13px; font-weight: 700;">ORDER #${order.orderNumber}</td>
              <td align="right" style="padding: 6px 0; color: #34D399; font-size: 13px; font-weight: 700;">PAID</td>
            </tr>
            ${itemsRows}
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Subtotal</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 13px;">$${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Shipping</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 13px;">${order.shipping === 0 ? "FREE" : `$${order.shipping.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 4px; color: #E8CE8C; font-weight: 700; font-size: 15px;">Total</td>
              <td align="right" style="padding: 10px 0 4px; color: #E8CE8C; font-weight: 700; font-size: 17px;">$${order.total.toFixed(2)} USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.5); border: 1px solid rgba(232, 206, 140, 0.12); border-radius: 10px; margin: 18px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #C6CBD8; font-size: 13px;">
          <strong style="color: #EDE7DA;">📦 Shipping To:</strong><br>
          ${addressText}
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <a href="${env.APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 14px; padding: 13px 30px; border-radius: 9999px; text-decoration: none;">
            Track Order in My Account →
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = wrapEmailShell("Order Receipt", `📦 Order #${order.orderNumber}`, content);

  await sendEmail({
    to: order.customerInfo.email,
    subject: `📦 Order Confirmed #${order.orderNumber} — Arrive at Origin`,
    html,
  });
}

/**
 * 5. 🔐 Admin Password Reset Email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.APP_URL}/admin/reset-password?token=${resetToken}`;

  const content = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Hello <strong style="color: #E8CE8C;">${name}</strong>,
    </p>
    <p>
      A password reset request was initiated for your <strong>Administrative Access</strong> to Arrive at Origin.
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px 0 24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(232, 206, 140, 0.3);">
            Reset Admin Password →
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.5); border: 1px solid rgba(232, 206, 140, 0.12); border-radius: 10px; margin: 20px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #8A93A8; font-size: 13px; line-height: 1.5;">
          ⏱ <strong>Security Notice:</strong> This admin link will expire in <strong>1 hour</strong>.<br>
          If you did not initiate this request, notify your security lead immediately.
        </td>
      </tr>
    </table>
  `;

  const html = wrapEmailShell("Admin Password Reset", "🔐 Admin Portal Security", content);

  await sendEmail({
    to: email,
    subject: "🔐 Admin Access: Password Reset Request — Arrive at Origin",
    html,
  });
}
