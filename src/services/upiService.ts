import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { asString, toDate } from '@/services/converters';
import type { UserProfile } from '@/lib/types';
import { sendPaymentApprovedEmail, sendPaymentPendingEmail, sendPaymentRejectedEmail } from '@/services/emailService';

const PREMIUM_AMOUNT = 199;

export interface UpiSettings {
  upiId: string;
  payeeName: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  uid: string;
  studentName: string;
  studentEmail: string;
  utr: string;
  status: PaymentStatus;
  adminNote: string | null;
  createdAt: Date | null;
  reviewedAt: Date | null;
}

const SETTINGS_DOC = 'upiSettings';

function toUpiSettings(data: Record<string, unknown>): UpiSettings {
  return {
    upiId: asString(data.upiId),
    payeeName: asString(data.payeeName, 'QuantaPrep'),
  };
}

function toPaymentRequest(id: string, data: Record<string, unknown>): PaymentRequest {
  return {
    id,
    uid: asString(data.uid),
    studentName: asString(data.studentName),
    studentEmail: asString(data.studentEmail),
    utr: asString(data.utr),
    status: asString(data.status, 'pending') as PaymentStatus,
    adminNote: typeof data.adminNote === 'string' ? data.adminNote : null,
    createdAt: toDate(data.createdAt),
    reviewedAt: toDate(data.reviewedAt),
  };
}

export async function getUpiSettings(): Promise<UpiSettings> {
  const snap = await getDoc(doc(db, 'config', SETTINGS_DOC));
  return snap.exists() ? toUpiSettings(snap.data() as Record<string, unknown>) : { upiId: '', payeeName: 'QuantaPrep' };
}

export async function submitPaymentRequest(profile: UserProfile, utr: string): Promise<PaymentRequest> {
  const clean = utr.trim();
  if (!clean) throw new Error('Enter the UTR / reference number from your payment.');

  const ref = doc(collection(db, 'paymentRequests'));
  const payload = {
    uid: profile.uid,
    studentName: profile.name,
    studentEmail: profile.email,
    utr: clean,
    status: 'pending' as PaymentStatus,
    adminNote: null,
    createdAt: serverTimestamp(),
    reviewedAt: null,
  };
  await setDoc(ref, payload);
  const request = toPaymentRequest(ref.id, { ...payload, createdAt: null, reviewedAt: null });

  void sendPaymentPendingEmail(profile.email, {
    studentName: profile.name,
    utr: clean,
    amount: PREMIUM_AMOUNT,
  }).catch(() => undefined);

  return request;
}

export async function listMyPaymentRequests(uid: string): Promise<PaymentRequest[]> {
  const snap = await getDocs(
    query(collection(db, 'paymentRequests'), where('uid', '==', uid), limit(20)),
  );
  return snap.docs
    .map((d) => toPaymentRequest(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

// --- Admin operations ---

export async function adminUpdateUpiSettings(upiId: string, payeeName: string): Promise<void> {
  const cleanId = upiId.trim();
  if (!cleanId) throw new Error('Enter a valid UPI ID.');
  await setDoc(doc(db, 'config', SETTINGS_DOC), {
    upiId: cleanId,
    payeeName: payeeName.trim() || 'QuantaPrep',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function adminListAllPaymentRequests(): Promise<PaymentRequest[]> {
  const snap = await getDocs(
    query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'), limit(200)),
  );
  return snap.docs.map((d) => toPaymentRequest(d.id, d.data() as Record<string, unknown>));
}

export async function adminApprovePayment(requestId: string, uid: string, adminNote?: string): Promise<void> {
  const requestRef = doc(db, 'paymentRequests', requestId);
  const userRef = doc(db, 'users', uid);
  const requestSnap = await getDoc(requestRef);

  await updateDoc(requestRef, {
    status: 'approved',
    adminNote: adminNote?.trim() || null,
    reviewedAt: serverTimestamp(),
  });
  // Flip the student's isPremium flag. The Firestore rule allows admin to update any user field.
  await updateDoc(userRef, { isPremium: true });

  if (requestSnap.exists()) {
    const req = toPaymentRequest(requestSnap.id, requestSnap.data() as Record<string, unknown>);
    void sendPaymentApprovedEmail(req.studentEmail, {
      studentName: req.studentName,
      utr: req.utr,
      amount: PREMIUM_AMOUNT,
      adminNote: adminNote?.trim() || null,
    }).catch(() => undefined);
  }
}

export async function adminRejectPayment(requestId: string, adminNote?: string): Promise<void> {
  const requestRef = doc(db, 'paymentRequests', requestId);
  const requestSnap = await getDoc(requestRef);

  await updateDoc(requestRef, {
    status: 'rejected',
    adminNote: adminNote?.trim() || null,
    reviewedAt: serverTimestamp(),
  });

  if (requestSnap.exists()) {
    const req = toPaymentRequest(requestSnap.id, requestSnap.data() as Record<string, unknown>);
    void sendPaymentRejectedEmail(req.studentEmail, {
      studentName: req.studentName,
      utr: req.utr,
      amount: PREMIUM_AMOUNT,
      adminNote: adminNote?.trim() || null,
    }).catch(() => undefined);
  }
}
