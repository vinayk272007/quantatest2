import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  buildEmail,
  type EmailType,
  type PaymentEmailData,
  type PremiumEmailData,
  type ResultEmailData,
  type WeakAreasEmailData,
} from '@/lib/emailTemplates';

export type { EmailType, PaymentEmailData, PremiumEmailData, ResultEmailData, WeakAreasEmailData };

async function logEmail(recipient: string, type: EmailType, subject: string, providerId: string | null): Promise<void> {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addDoc(collection(db, 'emailLogs'), {
      uid,
      recipient,
      emailType: type,
      subject,
      providerId,
      sentAt: serverTimestamp(),
    });
  } catch {
    // best-effort log; never fail the email send
  }
}

async function sendEmail(to: string, type: EmailType, data: unknown): Promise<void> {
  const { subject, html } = buildEmail(type, data);

  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  });

  if (!response.ok) {
    let detail = `Email request failed (${response.status}).`;
    try {
      const parsed = await response.json() as { error?: string };
      if (parsed?.error) detail = parsed.error;
    } catch {
      // keep default detail
    }
    throw new Error(detail);
  }

  const result = await response.json() as { id?: string };
  void logEmail(to, type, subject, result.id ?? null);
}

export function sendResultEmail(to: string, data: ResultEmailData) {
  return sendEmail(to, 'result', data);
}

export function sendPremiumEmail(to: string, data: PremiumEmailData) {
  return sendEmail(to, 'premium', data);
}

export function sendWeakAreasEmail(to: string, data: WeakAreasEmailData) {
  return sendEmail(to, 'weak_areas', data);
}

export function sendPaymentPendingEmail(to: string, data: PaymentEmailData) {
  return sendEmail(to, 'payment_pending', data);
}

export function sendPaymentApprovedEmail(to: string, data: PaymentEmailData) {
  return sendEmail(to, 'payment_approved', data);
}

export function sendPaymentRejectedEmail(to: string, data: PaymentEmailData) {
  return sendEmail(to, 'payment_rejected', data);
}
