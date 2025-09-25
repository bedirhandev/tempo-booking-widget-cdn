
# 📚 Booking Widget - Technical Improvement Plan (Part 2)

## Continuation: AppointmentBookingForm Component

```typescript
// src/components/booking/AppointmentBookingForm.tsx (continued)
      <div className="booking-form-loading">
        <Spin size="large" tip="Loading booking form..." />
      </div>
    );
  }
  
  // Render error state
  if (error && !session) {
    return (
      <Result
        status="error"
        title="Unable to Load Booking Form"
        subTitle={error.message}
        extra={
          <Button type="primary" onClick={() => initializeSession(tenantId)}>
            Retry
          </Button>
        }
      />
    );
  }
  
  // Render step components
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ServiceStep
            services={services}
            teamMembers={teamMembers}
            formValues={formValues}
            onNext={handleNext}
          />
        );
        
      case 1:
        return (
          <PersonalInfoStep
            formValues={formValues}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
        
      case 2:
        // Payment options or payment failure recovery
        if (session?.status === 'payment_failed') {
          return (
            <PaymentRecoveryStep
              bookingId={session.bookingId!}
              lastError={lastPaymentError}
              onSelectOption={handlePaymentOptionSelect}
              onRetry={handlePaymentRetry}
              onCancel={resetStore}
            />
          );
        }
        
        return (
          <PaymentOptionsStep
            bookingTotal={calculateTotal(formValues)}
            onSelectOption={handlePaymentOptionSelect}
            onPrevious={handlePrevious}
          />
        );
        
      case 3:
        // Actual payment processing (only if pay now was selected)
        if (paymentOption === 'now' && session?.bookingId) {
          return (
            <PaymentProcessingStep
              bookingId={session.bookingId}
              amount={calculateTotal(formValues)}
              onSuccess={() => {
                proceedToNextStep();
                if (onComplete) onComplete(session.bookingId);
              }}
              onFailure={(error) => handlePaymentFailure(error)}
              onCancel={handlePrevious}
            />
          );
        }
        
        // Should not reach here, but fallback to summary
        return <SummaryStep booking={formValues} />;
        
      case 4:
        return (
          <SummaryStep 
            booking={formValues}
            bookingId={session?.bookingId}
            paymentStatus={paymentOption === 'later' ? 'pending' : 'completed'}
          />
        );
        
      default:
        return null;
    }
  };
  
  const steps = [
    { title: 'Service', icon: <CalendarOutlined /> },
    { title: 'Details', icon: <UserOutlined /> },
    { title: 'Payment', icon: <CreditCardOutlined /> },
    { title: 'Confirmation', icon: <CheckCircleOutlined /> }
  ];
  
  // Adjust steps based on payment flow
  const getActiveStep = () => {
    if (session?.status === 'payment_failed') {
      return 2; // Show payment step with recovery options
    }
    if (currentStep === 3 && paymentOption === 'later') {
      return 3; // Skip payment processing, go to confirmation
    }
    return currentStep;
  };
  
  return (
    <div className="appointment-booking-form">
      <Steps 
        current={getActiveStep()} 
        items={steps}
        className="booking-steps"
      />
      
      <div className="booking-form-content">
        {renderStep()}
      </div>
      
      {/* Session Recovery Indicator */}
      {session?.status === 'booking_created' && (
        <div className="session-recovery-notice">
          <InfoCircleOutlined />
          <span>Your booking is saved. You can close this window and return later.</span>
        </div>
      )}
    </div>
  );
};
```

## Phase 2: Component Improvements (Week 2)

### 2.1 Payment Recovery Step Component

```typescript
// src/components/booking/steps/PaymentRecoveryStep.tsx
import React from 'react';
import { Result, Button, Alert, Space, Card } from 'antd';
import { ExclamationCircleOutlined, CreditCardOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface Props {
  bookingId: string;
  lastError?: string | null;
  onSelectOption: (option: 'now' | 'later') => void;
  onRetry: () => void;
  onCancel: () => void;
}

export const PaymentRecoveryStep: React.FC<Props> = ({
  bookingId,
  lastError,
  onSelectOption,
  onRetry,
  onCancel
}) => {
  return (
    <div className="payment-recovery-step">
      <Result
        icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
        title="Payment Could Not Be Processed"
        subTitle={`Booking #${bookingId} has been created but payment failed.`}
      />
      
      {lastError && (
        <Alert
          message="Payment Error"
          description={lastError}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      <div className="recovery-options">
        <h3>Choose how to proceed:</h3>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card 
            hoverable
            onClick={() => onSelectOption('now')}
            className="payment-option-card"
          >
            <Space>
              <CreditCardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <h4>Try Payment Again</h4>
                <p>Retry payment with the same or different card</p>
              </div>
            </Space>
          </Card>
          
          <Card 
            hoverable
            onClick={() => onSelectOption('later')}
            className="payment-option-card"
          >
            <Space>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <h4>Pay Later</h4>
                <p>Confirm booking now and pay at the venue</p>
              </div>
            </Space>
          </Card>
        </Space>
        
        <div className="recovery-actions" style={{ marginTop: 24 }}>
          <Button onClick={onCancel} danger>
            Cancel Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### 2.2 Enhanced Payment Processing Component

```typescript
// src/components/booking/steps/PaymentProcessingStep.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button, Spin, Alert } from 'antd';
import { api } from '@/services/api';

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<{
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}> = ({ bookingId, amount, onSuccess, onFailure }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        throw submitError;
      }
      
      // Get client secret from backend
      const { data } = await api.createPaymentIntent(bookingId);
      
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success?id=${bookingId}`,
        },
        redirect: 'if_required'
      });
      
      if (confirmError) {
        throw confirmError;
      }
      
      if (paymentIntent?.status === 'succeeded') {
        // Update booking with successful payment
        await api.confirmPayment(bookingId, paymentIntent.id);
        onSuccess();
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      const message = error.message || 'Payment failed. Please try again.';
      setErrorMessage(message);
      onFailure(message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total Amount: ${(amount / 100).toFixed(2)}</h3>
      </div>
      
      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
        }}
      />
      
      {errorMessage && (
        <Alert
          message="Payment Failed"
          description={errorMessage}
          type="error"
          showIcon
          closable
          onClose={() => setErrorMessage(null)}
          style={{ marginTop: 16 }}
        />
      )}
      
      <div className="payment-actions" style={{ marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={isProcessing}
          disabled={!stripe || !elements}
          size="large"
          block
        >
          {isProcessing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export const PaymentProcessingStep: React.FC<Props> = ({
  bookingId,
  amount,
  onSuccess,
  onFailure,
  onCancel
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initPayment = async () => {
      try {
        // Load Stripe
        const stripe = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);
        setStripePromise(stripe);
        
        // Get payment intent from backend
        const { data } = await api.createPaymentIntent(bookingId);
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        onFailure(error.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };
    
    initPayment();
  }, [bookingId]);
  
  if (loading) {
    return (
      <div className="payment-loading">
        <Spin size="large" tip="Initializing payment..." />
      </div>
    );
  }
  
  if (!stripePromise || !clientSecret) {
    return (
      <Alert
        message="Payment Initialization Failed"
        description="Unable to load payment form. Please try again."
        type="error"
        showIcon
        action={
          <Button onClick={onCancel}>Go Back</Button>
        }
      />
    );
  }
  
  return (
    <div className="payment-processing-step">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#1890ff',
              colorBackground: '#ffffff',
              colorText: '#30313d',
              colorDanger: '#df1b41',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              borderRadius: '4px'
            }
          }
        }}
      >
        <PaymentForm
          bookingId={bookingId}
          amount={amount}
          onSuccess={onSuccess}
          onFailure={onFailure}
        />
      </Elements>
      
      <div className="payment-footer" style={{ marginTop: 16 }}>
        <Button onClick={onCancel} type="link">
          ← Back to payment options
        </Button>
      </div>
    </div>
  );
};
```

## Phase 3: Testing Infrastructure (Week 3)

### 3.1 Unit Tests for Booking Store

```typescript
// src/stores/__tests__/bookingStore.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookingStore } from '../bookingStore';
import { SessionService } from '@/services/sessionService';
import { api } from '@/services/api';

// Mock dependencies
jest.mock('@/services/sessionService');
jest.mock('@/services/api');

describe('BookingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useBookingStore());
    act(() => {
      result.current.resetStore();
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Session Management', () => {
    it('should initialize a new session', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'draft',
        formData: {},
        createdAt: new Date().toISOString()
      };
      
      (SessionService.prototype.createSession as jest.Mock).mockResolvedValue(mockSession);
      (api.getServices as jest.Mock).mockResolvedValue({ data: [] });
      (api.getTeamMembers as jest.Mock).mockResolvedValue({ data: [] });
      
      const { result } = renderHook(() => useBookingStore());
      
      await act(async () => {
        await result.current.initializeSession('tenant-123');
      });
      
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should recover an existing session', async () => {
      const mockSession = {
        id: 'session-456',
        status: 'booking_created',
        formData: {
          fullName: 'John Doe',
          email: 'john@example.com'
        },
        bookingId: 'booking-789'
      };
      
      (SessionService.prototype.recoverSession as jest.Mock).mockResolvedValue(mockSession);
      
      const { result } = renderHook(() => useBookingStore());
      
      await act(async () => {
        const recovered = await result.current.recoverSession();
        expect(recovered).toBe(true);
      });
      
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.formValues.fullName).toBe('John Doe');
      expect(result.current.currentStep).toBe(2); // Should be at payment step
    });
    
    it('should handle payment failure recovery', async () => {
      const mockSession = {
        id: 'session-789',
        status: 'payment_failed',
        formData: { fullName: 'Jane Doe' },
        bookingId: 'booking-123',
        metadata: {
          lastPaymentError: 'Card declined'
        }
      };
      
      (SessionService.prototype.recoverSession as jest.Mock).mockResolvedValue(mockSession);
      
      const { result } = renderHook(() => useBookingStore());
      
      await act(async () => {
        await result.current.recoverSession();
      });
      
      expect(result.current.session?.status).toBe('payment_failed');
      expect(result.current.currentStep).toBe(2); // Back to payment options
      expect(result.current.lastPaymentError).toBe('Card declined');
    });
  });
  
  describe('Form Updates', () => {
    it('should update form fields and persist to session', async () => {
      const mockSession = { id: 'session-123', formData: {} };
      const updatedSession = { 
        ...mockSession, 
        formData: { fullName: 'Test User' } 
      };
      
      (SessionService.prototype.updateSession as jest.Mock).mockResolvedValue(updatedSession);
      
      const { result } = renderHook(() => useBookingStore());
      
      // Set initial session
      act(() => {
        result.current.session = mockSession;
      });
      
      await act(async () => {
        await result.current.updateFormField('fullName', 'Test User');
      });
      
      expect(result.current.formValues.fullName).toBe('Test User');
      expect(SessionService.prototype.updateSession).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          formData: expect.objectContaining({ fullName: 'Test User' })
        })
      );
    });
    
    it('should handle update failures gracefully', async () => {
      const mockSession = { 
        id: 'session-123', 
        formData: { fullName: 'Original' } 
      };
      
      (SessionService.prototype.updateSession as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const { result } = renderHook(() => useBookingStore());
      
      act(() => {
        result.current.session = mockSession;
        result.current.formValues = { fullName: 'Original' };
      });
      
      await act(async () => {
        await result.current.updateFormField('fullName', 'Updated');
      });
      
      // Should revert to original value on failure
      expect(result.current.formValues.fullName).toBe('Original');
      expect(result.current.error).toBeTruthy();
    });
  });
  
  describe('Booking Creation', () => {
    it('should create booking and update session', async () => {
      const mockBooking = { id: 'booking-123', status: 'pending' };
      const mockSession = { id: 'session-123', formData: {} };
      
      (api.createAppointment as jest.Mock).mockResolvedValue(mockBooking);
      (SessionService.prototype.updateSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        bookingId: 'booking-123',
        status: 'booking_created'
      });
      
      const { result } = renderHook(() => useBookingStore());
      
      act(() => {
        result.current.session = mockSession;
        result.current.formValues = { fullName: 'Test' };
      });
      
      let bookingId;
      await act(async () => {
        bookingId = await result.current.createBooking();
      });
      
      expect(bookingId).toBe('booking-123');
      expect(result.current.session?.bookingId).toBe('booking-123');
      expect(result.current.session?.status).toBe('booking_created');
    });
  });
  
  describe('Payment Flow', () => {
    it('should handle pay later option', async () => {
      const mockSession = { 
        id: 'session-123', 
        bookingId: 'booking-123' 
      };
      
      (api.confirmBooking as jest.Mock).mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useBookingStore());
      
      act(() => {
        result.current.session = mockSession;
      });
      
      await act(async () => {
        result.current.setPaymentOption('later');
        await result.current.confirmBooking('booking-123');
      });
      
      expect(result.current.paymentOption).toBe('later');
      expect(api.confirmBooking).toHaveBeenCalledWith('booking-123');
    });
    
    it('should handle payment failure and allow retry', async () => {
      const mockSession = { 
        id: 'session-123', 
        bookingId: 'booking-123',
        status: 'booking_created'
      };
      
      const { result } = renderHook(() => useBookingStore());
      
      act(() => {
        result.current.session = mockSession;
      });
      
      await act(async () => {
        await result.current.handlePaymentFailure('Card declined');
      });
      
      expect(result.current.session?.status).toBe('payment_failed');
      expect(result.current.lastPaymentError).toBe('Card declined');
      expect(result.current.currentStep).toBe(2); // Back to payment options
      expect(result.current.paymentOption).toBeNull(); // Reset selection
    });
  });
});
```

### 3.2 Integration Tests

```typescript
// src/__tests__/integration/booking-flow.test.tsx
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentBookingForm } from '@/components/booking/AppointmentBookingForm';
import { server } from '@/__mocks__/server';
import { rest } from 'msw';

// Setup MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Complete Booking Flow', () => {
  it('should complete booking with pay later option', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    
    render(
      <AppointmentBookingForm
        tenantId="test-tenant"
        apiUrl="http://localhost:3000/api"
        onComplete={onComplete}
      />
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/select service/i)).toBeInTheDocument();
    });
    
    // Step 1: Select service
    const serviceCard = screen.getByText('Haircut');
    await user.click(serviceCard);
    
    // Select team member
    const teamMember = screen.getByText('John Smith');
    await user.click(teamMember);
    
    // Select date and time
    const dateButton = screen.getByLabelText('Select Date');
    await user.click(dateButton);
    
    // Select today's date
    const today = screen.getByTitle(new Date().toLocaleDateString());
    await user.click(today);
    
    // Select time slot
    const timeSlot = screen.getByText('10:00 AM');
    await user.click(timeSlot);
    
    // Proceed to next step
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Step 2: Personal Information
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Payment Options
    await waitFor(() => {
      expect(screen.getByText(/payment options/i)).toBeInTheDocument();
    });
    
    // Choose pay later
    const payLaterOption = screen.getByText(/pay later/i).closest('div[role="button"]');
    await user.click(payLaterOption!);
    
    // Should proceed to confirmation
    await waitFor(() => {
      expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
    });
    
    expect(onComplete).toHaveBeenCalledWith(expect.stringContaining('booking-'));
  });
  
  it('should recover from payment failure', async () => {
    const user = userEvent.setup();
    
    // Mock payment failure
    server.use(
      rest.post('*/payment-intents', (req, res, ctx) => {
        return res.once(
          ctx.status(400),
          ctx.json({ 
            error: { 
              message: 'Your card was declined',
              code: 'card_declined'
            }
          })
        );
      })
    );
    
    render(
      <AppointmentBookingForm
        tenantId="test-tenant"
        apiUrl="http://localhost:3000/api"
      />
    );
    
    // Complete steps 1 and 2 (abbreviated for clarity)
    // ... 
    
    // Step 3: Choose pay now
    const payNowOption = screen.getByText(/pay now/i).closest('div[role="button"]');
    await user.click(payNowOption!);
    
    // Payment form should appear
    await waitFor(() => {
      expect(screen.getByText(/enter card details/i)).toBeInTheDocument();
    });
    
    // Fill payment form (using test card that will be declined)
    // ...
    
    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay/i });
    await user.click(payButton);
    
    // Should show payment failure and recovery options
    await waitFor(() => {
      expect(screen.getByText(/payment could not be processed/i)).toBeInTheDocument();
    });
    
    // Should show recovery options
    expect(screen.getByText(/try payment again/i)).toBeInTheDocument();
    expect(screen.getByText(/pay later/i)).toBeInTheDocument();
    
    // Choose pay later this time
    const payLaterRecovery = screen.getByText(/pay later/i).closest('div[role="button"]');
    await user.click(payLaterRecovery!);
    
    // Should proceed to confirmation
    await waitFor(() => {
      expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(/payment.*pending/i)).toBeInTheDocument();
    });
  });
  
  it('should recover session after browser refresh', async () => {
    const { rerender } = render(
      <AppointmentBookingForm
        tenantId="test-tenant"
        apiUrl="http://localhost:3000/api"
      />
    );
    
    // Simulate partially completed form
    // ...
    
    // Simulate browser refresh by unmounting and remounting
    rerender(
      <AppointmentBookingForm
        tenantId="test-tenant"
        apiUrl="http://localhost:3000/api"
      />
    );
    
    // Should recover session and show correct step
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });
});
```

## Phase 4: Migration Strategy

### 4.1 Feature Flag Implementation

```typescript
// src/utils/featureFlags.ts
export interface FeatureFlags {
  useNewBookingFlow: boolean;
  enableSessionRecovery: boolean;
  enablePaymentRecovery: boolean;
  useZustandStore: boolean;
}

class FeatureFlagService {
  private flags: FeatureFlags = {
    useNewBookingFlow: false,
    enableSessionRecovery: false,
    enablePaymentRecovery: false,
    useZustandStore: false
  };
  
  initialize(tenantId: string): void {
    // Check tenant configuration
    const enabledTenants = process.env.REACT_APP_NEW_FLOW_TENANTS?.split(',') || [];
    
    if (enabledTenants.includes(tenantId) || enabledTenants.includes('*')) {
      this.flags.useNewBookingFlow = true;
      this.flags.enableSessionRecovery = true;
      this.flags.enablePaymentRecovery = true;
      this.flags.useZustandStore = true;
    }
    
    // Override with URL params for testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('newFlow') === 'true') {
      this.flags.useNewBookingFlow = true;
    }
  }
  
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
  
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagService();
```

### 4.2 Gradual Rollout Component

```typescript
// src/components/booking/BookingFormWrapper.tsx
import React from 'react';
import { featureFlags } from '@/utils/featureFlags';
import { AppointmentBookingForm as NewBookingForm } from './AppointmentBookingForm';
import { LegacyAppointmentBookingForm } from './LegacyAppointmentBookingForm';

interface Props {
  tenantId: string;
  apiUrl?: string;
  onComplete?: (bookingId: string) => void;
}

export const BookingFormWrapper: React.FC<Props> = (props) => {
  // Initialize feature flags
  React.useEffect(() => {
    featureFlags.initialize(props.tenantId);
  }, [props.tenantId]);
  
  // Choose which version to render
  if (featureFlags.isEnabled('useNewBookingFlow')) {
    return <NewBookingForm {...props} />;
  }
  
  return <LegacyAppointmentBookingForm {...props} />;
};
```

## 📝 Implementation Checklist

### Week 1: Critical Infrastructure
- [ ] Implement BookingSession types and interfaces
- [ ] Create SessionService with persistence
- [ ] Set up Zustand store with persistence middleware
- [ ] Implement centralized error handling
- [ ] Create error recovery strategies
- [ ] Add session recovery mechanism
- [ ] Update API service with retry logic

### Week 2: Component Updates
- [ ] Refactor AppointmentBookingForm with new store
- [ ] Create PaymentRecoveryStep component
- [ ] Update Payment