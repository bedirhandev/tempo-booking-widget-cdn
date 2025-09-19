import { useEffect, useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import { createAppointmentPaymentIntent, type PaymentIntentResponse } from '@/components/booking/api';
import { getGlobalConfig } from '@/widget/config';

export type PaymentWidgetProps = {
  tenantId: string;
  bookingId: string;
  apiBaseUrl?: string; // Expected to include /api/v1, defaults to http://127.0.0.1:8000/api/v1
  email?: string;
  name?: string;
  onPaymentSuccess?: (bookingId: string) => void;
  onPaymentFailure?: (err: Error) => void;
  onReady?: () => void;
};

type Status = 'idle' | 'loading' | 'confirming' | 'succeeded' | 'failed';

export default function PaymentWidget({
  tenantId,
  bookingId,
  apiBaseUrl,
  email,
  name,
  onPaymentSuccess,
  onPaymentFailure,
  onReady,
}: PaymentWidgetProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);

  const effectiveApiBaseUrl = useMemo(() => {
    if (apiBaseUrl) return apiBaseUrl;
    const globalCfg = getGlobalConfig() as any;
    // If a global apiUrl exists and already includes /api/v1, use it; otherwise fall back to default inside API util
    if (typeof globalCfg.apiUrl === 'string' && globalCfg.apiUrl.includes('/api/v1')) {
      return globalCfg.apiUrl as string;
    }
    return undefined; // use default from the API utility
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!tenantId || !bookingId) {
      setError('Missing tenantId or bookingId.');
      return;
    }

    let cancelled = false;
    async function bootstrap() {
      setStatus('loading');
      setError(null);

      try {
        // Build metadata to be merged into bookings.widget_metadata and a safe subset sent to Stripe
        const metadata: Record<string, any> = {
          paymentStep: 'started',
          env: {
            locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
            browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        };

        const res = await createAppointmentPaymentIntent(
          tenantId,
          bookingId,
          { email, name, metadata },
          effectiveApiBaseUrl
        );

        if (cancelled) return;

        setIntent(res);
        // Initialize Stripe with the publishableKey from server
        const promise = loadStripe(res.publishableKey);
        setStripePromise(promise);

        // Notify that widget is ready to display payment form
        onReady?.();
        setStatus('idle');
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.response?.data?.message || e?.message || 'Failed to initialize payment.';
        setError(msg);
        setStatus('failed');
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [tenantId, bookingId, email, name, effectiveApiBaseUrl, onReady]);

  const onFormStatusChange = (s: Status) => setStatus(s);

  if (!tenantId || !bookingId) {
    return (
      <div style={{ color: '#c00', fontSize: 14 }}>
        Missing tenantId or bookingId. Please provide valid identifiers.
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#c00', fontSize: 14 }}>
        {error}
      </div>
    );
  }

  if (status === 'loading' || !intent || !stripePromise) {
    return (
      <div style={{ fontSize: 14 }}>Loading payment form…</div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: intent.clientSecret,
          // You can tweak appearance here if needed
          appearance: { theme: 'stripe' },
        }}
      >
        <PaymentForm
          clientSecret={intent.clientSecret}
          amount={intent.amount}
          currency={intent.currency}
          bookingId={intent.bookingId}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentFailure={onPaymentFailure}
          onStatusChange={onFormStatusChange}
        />
      </Elements>
    </div>
  );
}