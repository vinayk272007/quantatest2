export type EmailType = 'result' | 'premium' | 'weak_areas' | 'payment_pending' | 'payment_approved' | 'payment_rejected';

export interface ResultEmailData {
  studentName: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeTaken: number;
  rank?: number | null;
  submittedAt: string;
}

export interface PremiumEmailData {
  studentName: string;
  coinsSpent: number;
  planName?: string;
  purchasedAt: string;
}

export interface WeakAreasEmailData {
  studentName: string;
  testsSubmitted: number;
  overallAccuracy: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  skipRate: number;
  trend: Array<{ testTitle: string; accuracy: number; attempted: number; submittedAt: string | null }>;
  topics: Array<{ name: string; correct: number; wrong: number; skipped: number; accuracy: number; attempted: number }>;
  sections: Array<{ name: string; correct: number; wrong: number; skipped: number; accuracy: number; attempted: number }>;
  focusTopics: Array<{ name: string; accuracy: number; attempted: number }>;
  generatedAt: string;
}

export interface PaymentEmailData {
  studentName: string;
  utr: string;
  amount?: number;
  adminNote?: string | null;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface EmailRequest {
  to: string;
  type: EmailType;
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'just now';
  try {
    return new Date(iso).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function resultHtml(p: ResultEmailData): string {
  const rankRow = p.rank ? `<tr><td style="padding:8px 12px;color:#64748b">Rank</td><td style="padding:8px 12px;font-weight:600">#${p.rank}</td></tr>` : '';
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#0f766e,#1d4ed8);padding:28px 24px;color:#ffffff">
      <h1 style="margin:0;font-size:22px;font-weight:700">${escapeHtml(p.testTitle)}</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9">Submitted ${escapeHtml(formatDate(p.submittedAt))}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, here is your test result.</p>
      <div style="background:#0f766e;border-radius:12px;padding:20px;text-align:center;color:#fff;margin-bottom:20px">
        <p style="margin:0;font-size:13px;opacity:0.85;text-transform:uppercase;letter-spacing:1px">Score</p>
        <p style="margin:4px 0 0;font-size:34px;font-weight:800">${p.score} / ${p.totalMarks}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e293b">
        <tr><td style="padding:8px 12px;color:#64748b">Accuracy</td><td style="padding:8px 12px;font-weight:600">${p.accuracy}%</td></tr>
        <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b">Correct</td><td style="padding:8px 12px;font-weight:600;color:#0d9488">${p.correct}</td></tr>
        <tr><td style="padding:8px 12px;color:#64748b">Wrong</td><td style="padding:8px 12px;font-weight:600;color:#ef4444">${p.wrong}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b">Skipped</td><td style="padding:8px 12px;font-weight:600">${p.skipped}</td></tr>
        <tr><td style="padding:8px 12px;color:#64748b">Time spent</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(formatDuration(p.timeTaken))}</td></tr>
        ${rankRow}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Keep practising on QuantaPrep.</p>
    </div>
  </div>`;
}

function premiumHtml(p: PremiumEmailData): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#7c3aed,#1d4ed8);padding:28px 24px;color:#ffffff">
      <h1 style="margin:0;font-size:22px;font-weight:700">Premium Unlocked</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9">${escapeHtml(formatDate(p.purchasedAt))}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, congratulations on upgrading to Premium!</p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e293b">
          <tr><td style="padding:8px 12px;color:#64748b">Plan</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(p.planName ?? 'Premium Plan')}</td></tr>
          <tr style="background:#ffffff"><td style="padding:8px 12px;color:#64748b">Coins spent</td><td style="padding:8px 12px;font-weight:600">${p.coinsSpent}</td></tr>
        </table>
      </div>
      <ul style="margin:0 0 16px;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">
        <li>Every premium test is now unlocked</li>
        <li>Full answer keys and explanations</li>
        <li>Priority leaderboard rankings</li>
        <li>Unlimited attempts on all tests</li>
      </ul>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Thank you for choosing QuantaPrep.</p>
    </div>
  </div>`;
}

function breakdownTable(rows: Array<{ name: string; correct: number; wrong: number; skipped: number; accuracy: number; attempted: number }>): string {
  if (rows.length === 0) return `<p style="font-size:14px;color:#94a3b8">No data available.</p>`;
  const body = rows.map((r) => `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#1e293b">${escapeHtml(r.name)}</td>
      <td style="padding:8px 12px;text-align:center;color:#0d9488">${r.correct}</td>
      <td style="padding:8px 12px;text-align:center;color:#ef4444">${r.wrong}</td>
      <td style="padding:8px 12px;text-align:center">${r.skipped}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:600">${r.accuracy}%</td>
      <td style="padding:8px 12px;text-align:center;color:#64748b">${r.attempted}</td>
    </tr>`).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#1e293b">
      <thead>
        <tr style="background:#f1f5f9;color:#64748b;text-align:left">
          <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Name</th>
          <th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.5px">Correct</th>
          <th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.5px">Wrong</th>
          <th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.5px">Skipped</th>
          <th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.5px">Accuracy</th>
          <th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.5px">Answered</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

function weakAreasHtml(p: WeakAreasEmailData): string {
  const focusList = p.focusTopics.length === 0
    ? `<p style="font-size:14px;color:#94a3b8">Not enough data to identify focus areas yet.</p>`
    : `<ol style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">${p.focusTopics.map((t) => `<li><strong>${escapeHtml(t.name)}</strong> — ${t.accuracy}% accuracy (${t.attempted} answered)</li>`).join('')}</ol>`;
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#0d9488,#1d4ed8);padding:28px 24px;color:#ffffff">
      <h1 style="margin:0;font-size:22px;font-weight:700">Weak-Areas Analytics</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9">Generated ${escapeHtml(formatDate(p.generatedAt))}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, here is your full performance breakdown.</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px">
        <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Overall accuracy</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#0d9488">${p.overallAccuracy}%</p>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Tests submitted</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#1d4ed8">${p.testsSubmitted}</p>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Correct</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#0d9488">${p.totalCorrect}</p>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Skip rate</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#ef4444">${p.skipRate}%</p>
        </div>
      </div>
      <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:0 0 10px">Focus next — your weakest topics</h2>
      ${focusList}
      <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 10px">Topic breakdown</h2>
      ${breakdownTable(p.topics)}
      <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 10px">Section breakdown</h2>
      ${breakdownTable(p.sections)}
      <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 10px">Recent accuracy trend</h2>
      ${p.trend.length === 0
        ? `<p style="font-size:14px;color:#94a3b8">No trend data yet.</p>`
        : `<table style="width:100%;border-collapse:collapse;font-size:13px;color:#1e293b"><thead><tr style="background:#f1f5f9;color:#64748b;text-align:left"><th style="padding:8px 12px;font-size:12px;text-transform:uppercase">Test</th><th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase">Accuracy</th><th style="padding:8px 12px;font-size:12px;text-align:center;text-transform:uppercase">Answered</th><th style="padding:8px 12px;font-size:12px;text-transform:uppercase">Date</th></tr></thead><tbody>${p.trend.map((t) => `<tr><td style="padding:8px 12px;font-weight:600">${escapeHtml(t.testTitle)}</td><td style="padding:8px 12px;text-align:center;font-weight:600">${t.accuracy}%</td><td style="padding:8px 12px;text-align:center">${t.attempted}</td><td style="padding:8px 12px;color:#64748b">${escapeHtml(formatDate(t.submittedAt))}</td></tr>`).join('')}</tbody></table>`}
      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8">Log in to QuantaPrep to revisit these areas and keep improving.</p>
    </div>
  </div>`;
}

function paymentHeader(gradient: string, title: string, subtitle: string): string {
  return `
    <div style="background:linear-gradient(135deg,${gradient});padding:28px 24px;color:#ffffff">
      <h1 style="margin:0;font-size:22px;font-weight:700">${title}</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9">${subtitle}</p>
    </div>`;
}

function paymentTable(p: PaymentEmailData): string {
  const noteRow = p.adminNote ? `<tr><td style="padding:8px 12px;color:#64748b">Admin note</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(p.adminNote)}</td></tr>` : '';
  return `
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e293b">
        <tr><td style="padding:8px 12px;color:#64748b">UTR / Reference</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(p.utr)}</td></tr>
        ${p.amount ? `<tr style="background:#ffffff"><td style="padding:8px 12px;color:#64748b">Amount</td><td style="padding:8px 12px;font-weight:600">₹${p.amount}</td></tr>` : ''}
        ${noteRow}
      </table>
    </div>`;
}

function paymentPendingHtml(p: PaymentEmailData): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    ${paymentHeader('#d97706,#1d4ed8', 'Payment Under Review', escapeHtml(formatDate(p.submittedAt ?? new Date().toISOString())))}
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, we have received your UPI payment details.</p>
      ${paymentTable(p)}
      <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7">Your payment is now <strong>pending approval</strong>. Our team will verify the UTR and you will receive another email once it is approved.</p>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Premium access is unlocked immediately after approval.</p>
    </div>
  </div>`;
}

function paymentApprovedHtml(p: PaymentEmailData): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    ${paymentHeader('#0f766e,#1d4ed8', 'Payment Approved', escapeHtml(formatDate(p.reviewedAt ?? new Date().toISOString())))}
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, your UPI payment has been approved. Welcome to Premium!</p>
      ${paymentTable(p)}
      <ul style="margin:0 0 16px;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">
        <li>Every premium test is now unlocked</li>
        <li>Full answer keys and explanations</li>
        <li>Priority leaderboard rankings</li>
        <li>Unlimited attempts on all tests</li>
      </ul>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Log in to QuantaPrep and start your premium tests today.</p>
    </div>
  </div>`;
}

function paymentRejectedHtml(p: PaymentEmailData): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    ${paymentHeader('#dc2626,#1d4ed8', 'Payment Not Verified', escapeHtml(formatDate(p.reviewedAt ?? new Date().toISOString())))}
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hi ${escapeHtml(p.studentName)}, unfortunately we could not verify your UPI payment.</p>
      ${paymentTable(p)}
      <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7">Please double-check the UTR / reference number and submit a new payment request from the Premium page. If you believe this is a mistake, contact the administrator.</p>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">No money should be lost — verify the reference number matches your bank statement.</p>
    </div>
  </div>`;
}

export function buildEmail(type: EmailType, data: unknown): { subject: string; html: string } {
  switch (type) {
    case 'result': {
      const p = data as ResultEmailData;
      return { subject: `Your ${p.testTitle} result — ${p.score}/${p.totalMarks}`, html: resultHtml(p) };
    }
    case 'premium': {
      const p = data as PremiumEmailData;
      return { subject: 'Premium unlocked on QuantaPrep — welcome!', html: premiumHtml(p) };
    }
    case 'weak_areas': {
      const p = data as WeakAreasEmailData;
      return { subject: 'Your QuantaPrep weak-areas analytics report', html: weakAreasHtml(p) };
    }
    case 'payment_pending': {
      const p = data as PaymentEmailData;
      return { subject: `Payment received — your UTR ${p.utr} is awaiting approval`, html: paymentPendingHtml(p) };
    }
    case 'payment_approved': {
      const p = data as PaymentEmailData;
      return { subject: 'Payment approved — Premium is now unlocked on QuantaPrep', html: paymentApprovedHtml(p) };
    }
    case 'payment_rejected': {
      const p = data as PaymentEmailData;
      return { subject: 'Payment could not be verified — action needed on QuantaPrep', html: paymentRejectedHtml(p) };
    }
    default:
      throw new Error('Unknown email type: ' + type);
  }
}
