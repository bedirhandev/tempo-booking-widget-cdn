import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { CheckCircleOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import type { Service } from '@/components/booking/types/index'

export type PaymentFormProps = {
  clientSecret: string;
  amount: number;
  currency: string;
  bookingId: string;
  service?: Service;
  onPaymentSuccess?: (bookingId: string) => void;
  onPaymentFailure?: (err: Error) => void;
  onStatusChange?: (status: 'idle' | 'confirming' | 'succeeded' | 'failed') => void;
};

export default function PaymentForm({
  clientSecret,
  amount,
  currency,
  bookingId,
  service,
  onPaymentSuccess,
  onPaymentFailure,
  onStatusChange,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const formatAmount = (value: number, curr: string) => {
    if (service?.formattedPrice) {
      return service.formattedPrice;
    }
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
        confirmParams: {
          return_url: window.location.href,
          // Optionally you could provide confirmParams.return_url if your backend requires a redirect flow.
        }
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
      setMessage('Payment successful');
      onPaymentSuccess?.(bookingId);
      setSucceeded(true);
      setSubmitting(false);
    } catch (err: any) {
      const errMsg = err?.message || 'Unexpected error during confirmation.';
      setMessage(errMsg);
      onStatusChange?.('failed');
      onPaymentFailure?.(new Error(errMsg));
      setSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    // Trigger form submission programmatically
    const form = document.getElementById('payment-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  if (succeeded) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 24px',
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: 12
      }}>
        <CheckCircleOutlined style={{ 
          fontSize: 48, 
          color: '#52c41a',
          marginBottom: 16
        }} />
        <h3 style={{ 
          color: '#52c41a', 
          marginBottom: 8,
          fontSize: 18,
          fontWeight: 600
        }}>
          Payment Successful!
        </h3>
        <p style={{ 
          color: '#595959', 
          margin: 0,
          fontSize: 14
        }}>
          Your booking has been confirmed. You'll receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Payment Summary */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 8
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8c8c8c', fontSize: 14, fontWeight: 500 }}>
            Total Amount
          </span>
          <span style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: '#262626'
          }}>
            {formatAmount(amount, currency)}
          </span>
        </div>
      </div>

      <form id="payment-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        {/* Payment Method Section */}
        <div>
          <h4 style={{ 
            marginBottom: 16, 
            color: '#262626', 
            fontSize: 16,
            fontWeight: 600
          }}>
            Payment Details
          </h4>
          
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Security Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          backgroundColor: '#f0f9f0',
          border: '1px solid #d9f7be',
          borderRadius: 6,
          fontSize: 13,
          color: '#389e0d'
        }}>
          <CheckOutlined />
          <span>Your payment information is encrypted and secure</span>
        </div>

        {/* Submit Button */}
        <Button
          type="primary"
          size="large"
          block
          loading={submitting}
          disabled={!stripe || !elements}
          onClick={handleButtonClick}
          style={{
            height: 48,
            fontSize: 16,
            fontWeight: 600
          }}
          icon={submitting ? <LoadingOutlined /> : undefined}
        >
          {submitting ? 'Processing Payment...' : `Complete Payment • ${formatAmount(amount, currency)}`}
        </Button>

        {/* Status Message */}
        {message && (
          <div 
            role="status" 
            aria-live="polite" 
            style={{ 
              padding: '12px 16px',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: message.includes('successful') ? '#f6ffed' : '#fff2e8',
              border: message.includes('successful') ? '1px solid #b7eb8f' : '1px solid #ffbb96',
              color: message.includes('successful') ? '#52c41a' : '#fa541c'
            }}
          >
            {message}
          </div>
        )}

        {/* Trust Indicators */}
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#8c8c8c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <span>🔒</span>
          <span>Secured by Stripe • SSL Encrypted</span>
        </div>
      </form>
    </div>
  );
}