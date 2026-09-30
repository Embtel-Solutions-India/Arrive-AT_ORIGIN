import { logger } from "../utils/logger.js";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Transport abstraction. Phase 6 adds the transactional provider + templates;
 * until then messages are logged so flows (e.g. password reset) work in development.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  logger.info({ to: msg.to, subject: msg.subject, text: msg.text ?? msg.html }, "email (console transport)");
}
