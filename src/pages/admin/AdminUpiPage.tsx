import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, CreditCard, Settings2, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { errorMessage, formatDateTime } from '@/lib/utils';
import {
  adminListAllPaymentRequests,
  adminApprovePayment,
  adminRejectPayment,
  adminUpdateUpiSettings,
  getUpiSettings,
  type PaymentRequest,
} from '@/services/upiService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/Feedback';

export function AdminUpiPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const settingsQuery = useQuery({
    queryKey: ['upi-settings'],
    queryFn: getUpiSettings,
  });
  const requestsQuery = useQuery({
    queryKey: ['all-payment-requests'],
    queryFn: adminListAllPaymentRequests,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: () => adminUpdateUpiSettings(upiId.trim(), payeeName.trim() || 'QuantaPrep'),
    onSuccess: () => {
      toast.success('Settings saved', 'Your UPI ID has been updated.');
      void queryClient.invalidateQueries({ queryKey: ['upi-settings'] });
    },
    onError: (error: unknown) => toast.error('Save failed', errorMessage(error, 'Please try again.')),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, uid }: { id: string; uid: string }) => adminApprovePayment(id, uid),
    onSuccess: () => {
      toast.success('Approved', 'The payment request has been approved.');
      void queryClient.invalidateQueries({ queryKey: ['all-payment-requests'] });
    },
    onError: (error: unknown) => toast.error('Approval failed', errorMessage(error, 'Please try again.')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminRejectPayment(id, rejectNote.trim() || undefined),
    onSuccess: () => {
      toast.success('Rejected', 'The payment request has been rejected.');
      setRejectingId(null);
      setRejectNote('');
      void queryClient.invalidateQueries({ queryKey: ['all-payment-requests'] });
    },
    onError: (error: unknown) => toast.error('Rejection failed', errorMessage(error, 'Please try again.')),
  });

  const loaded = settingsQuery.data;
  const upiIdValue = upiId || (loaded?.upiId ?? '');
  const payeeValue = payeeName || (loaded?.payeeName ?? 'QuantaPrep');
  const requests = requestsQuery.data ?? [];
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="UPI Payments"
        title="Payment management"
        description="Set your UPI ID for QR payments and approve student UTR submissions."
      />

      {/* UPI Settings */}
      <section className="surface p-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden />
          <h2 className="font-semibold text-slate-900 dark:text-white">UPI settings</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This UPI ID generates the QR code students scan on the premium page.
        </p>
        {settingsQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : settingsQuery.isError ? (
          <div className="mt-4 rounded-xl bg-error-50 p-4 text-sm text-error-600 dark:bg-error-600/15 dark:text-error-500">
            Could not load current settings.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="UPI ID" htmlFor="upi-id">
              <input
                id="upi-id"
                className="input-base"
                placeholder="e.g. yourname@okbank"
                defaultValue={loaded?.upiId ?? ''}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </FormField>
            <FormField label="Payee name (shown on QR)" htmlFor="payee-name">
              <input
                id="payee-name"
                className="input-base"
                placeholder="QuantaPrep"
                defaultValue={loaded?.payeeName ?? 'QuantaPrep'}
                onChange={(e) => setPayeeName(e.target.value)}
              />
            </FormField>
          </div>
        )}
        <Button
          className="mt-4"
          loading={updateSettingsMutation.isPending}
          onClick={() => {
            if (!upiIdValue.trim()) {
              toast.error('Missing UPI ID', 'Enter a valid UPI ID.');
              return;
            }
            updateSettingsMutation.mutate();
          }}
        >
          Save UPI settings
        </Button>
      </section>

      {/* Payment requests */}
      <section className="surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden />
            <h2 className="font-semibold text-slate-900 dark:text-white">Payment requests</h2>
          </div>
          {pendingCount > 0 && <Badge tone="warning">{pendingCount} pending</Badge>}
        </div>

        {requestsQuery.isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : requestsQuery.isError ? (
          <div className="mt-4 rounded-xl bg-error-50 p-4 text-sm text-error-600 dark:bg-error-600/15 dark:text-error-500">
            Could not load payment requests.
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CreditCard}
              title="No payment requests"
              description="When students submit a UTR after paying via UPI, they'll appear here for approval."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((req: PaymentRequest) => (
              <li key={req.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.studentName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{req.studentEmail}</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      UTR: <span className="font-mono font-medium">{req.utr}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" aria-hidden /> {formatDateTime(req.createdAt)}
                    </p>
                    {req.adminNote && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Admin note: {req.adminNote}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="accent"
                            icon={<Check className="h-3.5 w-3.5" />}
                            loading={approveMutation.isPending}
                            onClick={() => approveMutation.mutate({ id: req.id, uid: req.uid })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<X className="h-3.5 w-3.5" />}
                            onClick={() => setRejectingId(rejectingId === req.id ? null : req.id)}
                          >
                            Reject
                          </Button>
                        </div>
                        {rejectingId === req.id && (
                          <div className="w-full sm:w-64">
                            <input
                              className="input-base"
                              placeholder="Reason (optional)"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="danger"
                              className="mt-2 w-full"
                              loading={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(req.id)}
                            >
                              Confirm rejection
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <Badge tone={req.status === 'approved' ? 'success' : 'error'}>
                        {req.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
