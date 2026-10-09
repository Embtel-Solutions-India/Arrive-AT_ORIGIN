import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const TARGET_EMAIL = 'vishu@embtelsolutions.com';
const TARGET_NAME = 'Vishu';
const API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Arrive at Origin <info@arriveatorigin.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

console.log('Sending all test emails to:', TARGET_EMAIL);
console.log('From address:', FROM_EMAIL);

async function dispatchResend(subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TARGET_EMAIL],
      subject,
      html
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── Shared Email Shell ───
function wrapEmailShell(title, badgeText, contentHtml) {
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
                Need assistance? Reply directly to this email or visit <a href="${APP_URL}" style="color: #E8CE8C; text-decoration: none;">arriveatorigin.com</a>
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

async function sendAll() {
  const results = [];

  // 1. Account Created / Welcome Email
  console.log('\n[1/6] Sending Welcome / Account Created Email...');
  const welcomeContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
    </p>
    <p>
      Welcome to <strong>Arrive at Origin</strong>. We are deeply honored to have you join our sanctuary of holistic transformation, consciousness, and self-realization.
    </p>
    <p>
      Your personal client account has been created, giving you seamless, 24/7 access to your healing journey:
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
          <a href="${APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 15px; padding: 14px 34px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(232, 206, 140, 0.3);">
            Go to My Account →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #A0A8BA; margin-bottom: 0;">
      If you ever have any questions about scheduling or your orders, our team is always here for you. Simply reply to this email.
    </p>
  `;
  const welcomeHtml = wrapEmailShell('Welcome to Arrive at Origin', '✦ Client Account Activated', welcomeContent);
  const res1 = await dispatchResend(`✦ Welcome to Arrive at Origin, ${TARGET_NAME}`, welcomeHtml);
  console.log('✓ Sent Welcome Email, Resend ID:', res1.id);
  results.push({ type: 'Account Created / Welcome', id: res1.id });

  // 2. Client Forgot Password Email
  console.log('\n[2/6] Sending Client Forgot Password Email...');
  const resetUrl = `${APP_URL}/reset-password?token=sample_client_token_482910`;
  const clientForgotContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Hello <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
    </p>
    <p>
      We received a request to reset the password for your Arrive at Origin client account (<strong>${TARGET_EMAIL}</strong>).
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
  const clientForgotHtml = wrapEmailShell('Password Reset', '🔐 Client Security', clientForgotContent);
  const res2 = await dispatchResend('🔐 Reset Your Arrive at Origin Password', clientForgotHtml);
  console.log('✓ Sent Client Forgot Password Email, Resend ID:', res2.id);
  results.push({ type: 'Client Forgot Password', id: res2.id });

  // 3. Admin Password Reset Email
  console.log('\n[3/6] Sending Admin Password Reset Email...');
  const adminResetUrl = `${APP_URL}/admin/reset-password?token=sample_admin_token_918237`;
  const adminForgotContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Hello <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
    </p>
    <p>
      A password reset request was initiated for your <strong>Administrative Access</strong> to Arrive at Origin.
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px 0 24px;">
      <tr>
        <td align="center">
          <a href="${adminResetUrl}" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 15px rgba(232, 206, 140, 0.3);">
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
  const adminForgotHtml = wrapEmailShell('Admin Password Reset', '🔐 Admin Portal Security', adminForgotContent);
  const res3 = await dispatchResend('🔐 Admin Access: Password Reset Request — Arrive at Origin', adminForgotHtml);
  console.log('✓ Sent Admin Forgot Password Email, Resend ID:', res3.id);
  results.push({ type: 'Admin Password Reset', id: res3.id });

  // 4. Book Store Order Confirmation Email
  console.log('\n[4/6] Sending Order Confirmation Email...');
  const orderNumber = 'ORD-2026-94812';
  const orderContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
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
              <td style="padding: 6px 0; color: #E8CE8C; font-size: 13px; font-weight: 700;">ORDER #${orderNumber}</td>
              <td align="right" style="padding: 6px 0; color: #34D399; font-size: 13px; font-weight: 700;">PAID</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 10px 0; color: #EDE7DA; font-size: 14px;">
                <strong>Arrive at Origin: Part One (Hardcover Edition)</strong><br>
                <span style="color: #8A93A8; font-size: 12px;">Hardcover × 1</span>
              </td>
              <td align="right" style="padding: 10px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">
                $49.00
              </td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 10px 0; color: #EDE7DA; font-size: 14px;">
                <strong>Living from Wholeness: Meditation & Practice Handbook</strong><br>
                <span style="color: #8A93A8; font-size: 12px;">Paperback × 1</span>
              </td>
              <td align="right" style="padding: 10px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">
                $24.99
              </td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Subtotal</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 13px;">$73.99</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Shipping</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 13px;">FREE</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 4px; color: #E8CE8C; font-weight: 700; font-size: 15px;">Total</td>
              <td align="right" style="padding: 10px 0 4px; color: #E8CE8C; font-weight: 700; font-size: 17px;">$73.99 USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.5); border: 1px solid rgba(232, 206, 140, 0.12); border-radius: 10px; margin: 18px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #C6CBD8; font-size: 13px;">
          <strong style="color: #EDE7DA;">📦 Shipping To:</strong><br>
          123 Peace Sanctuary Blvd, Fremont, CA 94538
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 14px; padding: 13px 30px; border-radius: 9999px; text-decoration: none;">
            Track Order in My Account →
          </a>
        </td>
      </tr>
    </table>
  `;
  const orderHtml = wrapEmailShell('Order Receipt', `📦 Order #${orderNumber}`, orderContent);
  const res4 = await dispatchResend(`📦 Order Confirmed #${orderNumber} — Arrive at Origin`, orderHtml);
  console.log('✓ Sent Order Confirmation Email, Resend ID:', res4.id);
  results.push({ type: 'Order Confirmation', id: res4.id });

  // 5. Session Booking Confirmation (Online Zoom)
  console.log('\n[5/6] Sending Online Session Booking Confirmation...');
  const zoomBookingNumber = 'SB-CNS-849102-71';
  const zoomContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
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
              <td align="right" style="padding: 8px 0; color: #E8CE8C; font-weight: 700; font-size: 14px;">${zoomBookingNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Package:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">Holistic Consciousness Consultation (60 Min)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Date & Time:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">Monday, Oct 12, 2026 at 10:00 AM PST</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Session Format:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 14px;">Online Video Meeting (Zoom / Google Meet)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Total Paid:</td>
              <td align="right" style="padding: 8px 0; color: #34D399; font-weight: 700; font-size: 15px;">$150.00 USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background: rgba(78, 124, 116, 0.15); border: 1px solid rgba(78, 124, 116, 0.35); border-radius: 10px; padding: 14px 18px; margin: 18px 0; color: #EDE7DA; font-size: 14px;">
      <strong style="color: #4E7C74;">📹 Online Session Details:</strong><br>
      A private, encrypted video conference link will be sent to your email 15 minutes before your scheduled appointment. Please find a quiet, comfortable space with a stable internet connection.
    </div>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 14px; padding: 13px 30px; border-radius: 9999px; text-decoration: none;">
            View Appointment in My Account →
          </a>
        </td>
      </tr>
    </table>
  `;
  const zoomHtml = wrapEmailShell('Consultation Confirmed', '✓ Scheduled & Confirmed', zoomContent);
  const res5 = await dispatchResend(`✦ Consultation Confirmed: Holistic Consciousness Consultation (${zoomBookingNumber}) — Arrive at Origin`, zoomHtml);
  console.log('✓ Sent Online Consultation Booking Email, Resend ID:', res5.id);
  results.push({ type: 'Online Session Booking', id: res5.id });

  // 6. Session Booking Confirmation (In-Person Sanctuary)
  console.log('\n[6/6] Sending In-Person Sanctuary Booking Confirmation...');
  const inPersonBookingNumber = 'SB-CNS-950284-18';
  const inPersonContent = `
    <p style="margin-top: 0; font-size: 16px; color: #EDE7DA;">
      Dear <strong style="color: #E8CE8C;">${TARGET_NAME}</strong>,
    </p>
    <p>
      Your in-person sanctuary consultation with <strong>Arrive at Origin</strong> has been confirmed and registered in our calendar.
    </p>

    <!-- Appointment Summary Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: rgba(7, 11, 24, 0.7); border: 1px solid rgba(232, 206, 140, 0.2); border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Booking Ref:</td>
              <td align="right" style="padding: 8px 0; color: #E8CE8C; font-weight: 700; font-size: 14px;">${inPersonBookingNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Package:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">Energy Alignment &amp; Sanctuary Healing (90 Min)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Date & Time:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-weight: 600; font-size: 14px;">Thursday, Oct 15, 2026 at 02:30 PM PST</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(237, 231, 218, 0.08);">
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Session Format:</td>
              <td align="right" style="padding: 8px 0; color: #EDE7DA; font-size: 14px;">In-Person Sanctuary (Fremont, CA)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8A93A8; font-size: 13px;">Total Paid:</td>
              <td align="right" style="padding: 8px 0; color: #34D399; font-weight: 700; font-size: 15px;">$220.00 USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background: rgba(232, 206, 140, 0.1); border: 1px solid rgba(232, 206, 140, 0.25); border-radius: 10px; padding: 14px 18px; margin: 18px 0; color: #EDE7DA; font-size: 14px;">
      <strong style="color: #E8CE8C;">📍 In-Person Sanctuary Location:</strong><br>
      Soul Body Healing Center • Fremont, California.<br>
      Please plan to arrive 10 minutes prior to your appointment time in comfortable clothing.
    </div>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/account" style="display: inline-block; background-color: #E8CE8C; color: #070B18; font-weight: 700; font-size: 14px; padding: 13px 30px; border-radius: 9999px; text-decoration: none;">
            View Appointment in My Account →
          </a>
        </td>
      </tr>
    </table>
  `;
  const inPersonHtml = wrapEmailShell('In-Person Sanctuary Confirmed', '✓ Confirmed & Reserved', inPersonContent);
  const res6 = await dispatchResend(`✦ Sanctuary Consultation Confirmed (${inPersonBookingNumber}) — Arrive at Origin`, inPersonHtml);
  console.log('✓ Sent In-Person Consultation Booking Email, Resend ID:', res6.id);
  results.push({ type: 'In-Person Session Booking', id: res6.id });

  console.log('\n========================================');
  console.log('ALL TEST EMAILS SUCCESSFULLY DELIVERED TO RESEND!');
  console.log('Recipient:', TARGET_EMAIL);
  console.table(results);
  console.log('========================================');
}

sendAll().catch((err) => {
  console.error('ERROR SENDING EMAILS:', err);
  process.exit(1);
});
