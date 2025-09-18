import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export type PaymentFormProps = {
  clientSecret: string;
  amount: number;
  currency: string;
  bookingId: string;
  onPaymentSuccess?: (bookingId: string) => void;
  onPaymentFailure?: (err: Error) => void;
  onStatusChange?: (status: 'idle' | 'confirming' | 'succeeded' | 'failed') => void;
};

export default function PaymentForm({
  clientSecret,
  amount,
  currency,
  bookingId,
  onPaymentSuccess,
  onPaymentFailure,
  onStatusChange,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const formatAmount = (value: number, curr: string) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr.toUpperCase() }).format(value / 100);
    } catch {
      // Fallback: display raw minor unit amount if currency unknown to Intl
      return `${value / 100} ${curr.toUpperCase()}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      setMessage('Payment is not ready yet. Please try again shortly.');
      return;
    }

    setSubmitting(true);
    onStatusChange?.('confirming');
    setMessage('Processing your payment…');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        // Avoid full page redirect in widgets
        redirect: 'if_required',
        // Optionally you could provide confirmParams.return_url if your backend requires a redirect flow.
      });

      if (error) {
        const errMsg = error.message || 'Payment failed. Please try another card.';
        setMessage(errMsg);
        onStatusChange?.('failed');
        onPaymentFailure?.(new Error(errMsg));
        setSubmitting(false);
        return;
      }

      // If no error returned, Stripe has confirmed the payment.
      // Webhook will mark the booking as paid on the backend.
      onStatusChange?.('succeeded');
      setMessage('Payment confirmed. We’re updating your appointment…');
      onPaymentSuccess?.(bookingId);
      // Keep the button disabled to avoid duplicate submissions after success
    } catch (err: any) {
      const errMsg = err?.message || 'Unexpected error during confirmation.';
      setMessage(errMsg);
      onStatusChange?.('failed');
      onPaymentFailure?.(new Error(errMsg));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 500 }}>Pay {formatAmount(amount, currency)}</div>
      <PaymentElement />
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        style={{
          padding: '10px 14px',
          background: submitting ? '#999' : '#1677ff',
          color: '#fff',
          borderRadius: 6,
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {submitting ? 'Processing your payment…' : 'Pay now'}
      </button>

      {message && (
        <div role="status" aria-live="polite" style={{ fontSize: 14, color: '#333' }}>
          {message}
        </div>
      )}
    </form>
  );
}