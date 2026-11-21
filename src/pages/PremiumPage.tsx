import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Clock, Copy, Crown, QrCode, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage, formatDateTime } from '@/lib/utils';
import { PREMIUM_COST } from '@/lib/constants';
import { buyPremiumWithCoins } from '@/services/premiumService';
import {
  getUpiSettings,
  listMyPaymentRequests,
  submitPaymentRequest,
  type PaymentRequest,
  type PaymentStatus,
} from '@/services/upiService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/Feedback';

const perks = [
  'Unlock every premium test in the library',
  'Access full answer keys and explanations',
  'Priority leaderboard rankings',
  'Unlimited attempts on all tests',
];

function statusBadge(status: PaymentStatus) {
  if (status === 'approved') return <Badge tone="success">Approved</Badge>;
  if (status === 'rejected') return <Badge tone="error">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
}

export function PremiumPage() {
  const { firebaseUser, profile } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [utr, setUtr] = useState('');

  const settingsQuery = useQuery({
    queryKey: ['upi-settings'],
    queryFn: getUpiSettings,
  });

  const requestsQuery = useQuery({
    queryKey: ['my-payment-requests', firebaseUser?.uid ?? ''],
    queryFn: () => listMyPaymentRequests(firebaseUser?.uid ?? ''),
    enabled: Boolean(firebaseUser?.uid),
  });

  const coinBuyMutation = useMutation({
    mutationFn: () => buyPremiumWithCoins(firebaseUser?.uid ?? ''),
    onSuccess: () => {
      toast.success('Premium unlocked!', `${PREMIUM_COST} coins spent. All premium tests are now available.`);
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: unknown) => toast.error('Could not complete purchase', errorMessage(error, 'Please try again.')),
  });

  const submitUtrMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Please sign in first.');
      return submitPaymentRequest(profile, utr);
    },
    onSuccess: () => {
      toast.success('Submitted!', 'Your UTR has been sent for admin approval.');
      setUtr('');
      void queryClient.invalidateQueries({ queryKey: ['my-payment-requests', firebaseUser?.uid ?? ''] });
    },
    onError: (error: unknown) => toast.error('Could not submit', errorMessage(error, 'Please try again.')),
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (profile.isPremium) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <PageHeader eyebrow="Premium" title="You're a Premium member" description="All premium tests and features are unlocked." />
        <div className="mt-8 surface flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-secondary-600 to-primary-700 text-white">
            <Crown className="h-8 w-8" aria-hidden />
          </span>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Enjoy unrestricted access</p>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
            Every test, answer key, and explanation is available. Your leaderboard rankings are prioritised.
          </p>
        </div>
      </div>
    );
  }

  const upiId = settingsQuery.data?.upiId ?? '';
  const payeeName = settingsQuery.data?.payeeName ?? 'QuantaPrep';
  const amount = 199;
  const upiString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=QuantaPrep%20Premium`
    : '';

  const canPayWithCoins = profile.coins >= PREMIUM_COST;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        eyebrow="Premium"
        title="Upgrade to Premium"
        description="Unlock every premium test, full answer keys, and priority rankings."
      />

      {/* Plan card */}
      <section className="mt-8 surface overflow-hidden p-0">
        <div className="bg-gradient-to-r from-secondary-600 to-primary-700 p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Crown className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold">Premium Plan</p>
              <p className="text-sm text-white/80">Unlock the full test library</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-600/20 dark:text-success-500">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Payment options */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Option 1: Coins */}
        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
              <Check className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Pay with coins</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use coins earned from referrals</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Your balance</span>
              <Badge tone={canPayWithCoins ? 'success' : 'warning'}>{profile.coins} coins</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Premium cost</span>
              <span className="font-semibold text-slate-900 dark:text-white">{PREMIUM_COST} coins</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            size="lg"
            loading={coinBuyMutation.isPending}
            disabled={!canPayWithCoins}
            onClick={() => coinBuyMutation.mutate()}
          >
            {canPayWithCoins ? `Buy for ${PREMIUM_COST} coins` : 'Not enough coins'}
          </Button>
        </div>

        {/* Option 2: UPI */}
        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Pay with UPI</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Scan, pay, then submit your UTR</p>
            </div>
          </div>

          {settingsQuery.isLoading ? (
            <div className="mt-4 flex justify-center py-8">
              <Skeleton className="h-48 w-48" />
            </div>
          ) : settingsQuery.isError ? (
            <div className="mt-4 rounded-xl bg-error-50 p-4 text-sm text-error-600 dark:bg-error-600/15 dark:text-error-500">
              Could not load payment settings. Please try again later.
            </div>
          ) : !upiId ? (
            <div className="mt-4 rounded-xl bg-warning-50 p-4 text-sm text-warning-700 dark:bg-warning-600/15 dark:text-warning-500">
              UPI payments are not set up yet. Please check back soon or use coins.
            </div>
          ) : (
            <>
              {/* QR + UPI ID */}
              <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={upiString} size={180} includeLevel={false} />
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {upiId}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(upiId);
                      toast.success('Copied', 'UPI ID copied to clipboard.');
                    }}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    aria-label="Copy UPI ID"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Smartphone className="h-4 w-4" aria-hidden />
                  Scan with any UPI app to pay <span className="font-semibold text-slate-900 dark:text-white">₹{amount}</span>
                </div>
              </div>

              {/* UTR submission */}
              <FormField label="UTR / Reference number" htmlFor="utr-input" className="mt-4">
                <input
                  id="utr-input"
                  className="input-base"
                  placeholder="e.g. 412056789012"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  maxLength={30}
                />
              </FormField>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Enter the 12-digit transaction reference from your UPI app after paying.
              </p>
              <Button
                className="mt-3 w-full"
                size="lg"
                loading={submitUtrMutation.isPending}
                disabled={!utr.trim()}
                onClick={() => submitUtrMutation.mutate()}
              >
                Submit UTR for approval
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Payment history */}
      <section className="mt-8 surface p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Your payment requests</h2>
        {requestsQuery.isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : requestsQuery.isError ? (
          <p className="mt-4 text-sm text-error-600 dark:text-error-500">Could not load your requests.</p>
        ) : (requestsQuery.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No UPI payment requests yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {(requestsQuery.data ?? []).map((req: PaymentRequest) => (
              <li key={req.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">UTR: {req.utr}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" aria-hidden /> {formatDateTime(req.createdAt)}
                  </p>
                  {req.adminNote && req.status !== 'pending' && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Note: {req.adminNote}</p>
                  )}
                </div>
                {statusBadge(req.status)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
