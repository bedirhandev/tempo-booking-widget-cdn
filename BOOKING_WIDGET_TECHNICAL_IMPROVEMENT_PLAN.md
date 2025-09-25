
# 📚 Booking Widget - Comprehensive Technical Improvement Plan

## 🎯 Document Overview

This document provides a detailed technical roadmap for improving the booking widget system based on architectural analysis and agreed design decisions.

### Design Decisions Summary
- **State Management**: Zustand with persistence middleware
- **Error Handling**: Centralized error handler with automatic recovery strategies
- **API Architecture**: Keep current REST API structure
- **Testing Strategy**: Balanced approach (unit + E2E tests)
- **Payment Recovery**: Redirect to payment options step for user choice (Pay Now / Pay Later)

---

## 🏗️ System Architecture Overview

### Current Issues Identified

1. **Payment Flow Atomicity** - Booking and payment are separate operations without proper transaction handling
2. **State Management** - Complex state spread across multiple components with risk of data loss
3. **Type Safety** - Multiple `any` types and optional fields causing runtime errors
4. **Error Handling** - Inconsistent error handling with poor user feedback
5. **Session Recovery** - No mechanism to recover interrupted bookings
6. **API Configuration** - Hardcoded localhost URLs

---

## 📋 Implementation Plan

## Phase 1: Critical Infrastructure (Week 1)

### 1.1 Booking Session Management

Create a robust session management system to handle booking state persistence and recovery.

#### Session Types Definition

```typescript
// src/types/session.ts
export interface BookingSession {
  id: string;
  tenantId: string;
  status: SessionStatus;
  formData: Partial<FormValues>;
  bookingId?: string;
  paymentIntentId?: string;
  paymentStatus?: PaymentStatus;
  metadata: {
    userAgent: string;
    timezone: string;
    locale: string;
    createdFrom: string; // widget instance ID
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type SessionStatus = 
  | 'draft'                  // Initial state
  | 'booking_created'        // Booking exists in backend
  | 'payment_pending'        // Awaiting payment selection
  | 'payment_processing'     // Payment in progress
  | 'payment_failed'         // Payment failed - can retry
  | 'confirmed'             // Booking confirmed
  | 'expired';              // Session expired

export type PaymentStatus = 
  | 'not_required'
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface SessionRecoveryData {
  sessionId: string;
  formData: Partial<FormValues>;
  lastStep: number;
  paymentAttempts: number;
  lastPaymentError?: string;
}
```

#### Session Service Implementation

```typescript
// src/services/sessionService.ts
import axios, { AxiosInstance } from 'axios';
import { BookingSession, SessionRecoveryData } from '@/types/session';

export class SessionService {
  private client: AxiosInstance;
  private readonly storageKey = 'booking_session_v2';
  private readonly recoveryKey = 'booking_recovery_v2';
  
  constructor(baseUrl: string) {
    this.client = axios.create({ baseURL: baseUrl });
  }
  
  async createSession(tenantId: string, data: Partial<FormValues>): Promise<BookingSession> {
    const session = await this.client.post<BookingSession>(`/${tenantId}/sessions`, {
      formData: data,
      metadata: this.collectMetadata()
    });
    
    this.persistSession(session.data);
    return session.data;
  }
  
  async updateSession(sessionId: string, updates: Partial<BookingSession>): Promise<BookingSession> {
    const response = await this.client.patch<BookingSession>(
      `/sessions/${sessionId}`, 
      updates
    );
    this.persistSession(response.data);
    return response.data;
  }
  
  private persistSession(session: BookingSession): void {
    // Store in sessionStorage for current session
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    
    // Store recovery data in localStorage
    const recoveryData: SessionRecoveryData = {
      sessionId: session.id,
      formData: session.formData,
      lastStep: this.determineStepFromSession(session),
      paymentAttempts: session.metadata?.paymentAttempts || 0,
      lastPaymentError: session.metadata?.lastPaymentError
    };
    localStorage.setItem(this.recoveryKey, JSON.stringify(recoveryData));
  }
  
  async recoverSession(): Promise<BookingSession | null> {
    // Try sessionStorage first (current session)
    const sessionData = sessionStorage.getItem(this.storageKey);
    if (sessionData) {
      const session = JSON.parse(sessionData) as BookingSession;
      if (new Date(session.expiresAt) > new Date()) {
        return session;
      }
    }
    
    // Try localStorage recovery
    const recoveryData = localStorage.getItem(this.recoveryKey);
    if (recoveryData) {
      const recovery = JSON.parse(recoveryData) as SessionRecoveryData;
      try {
        const session = await this.client.get<BookingSession>(
          `/sessions/${recovery.sessionId}`
        );
        if (new Date(session.data.expiresAt) > new Date()) {
          this.persistSession(session.data);
          return session.data;
        }
      } catch (error) {
        console.error('Failed to recover session from server', error);
      }
    }
    
    return null;
  }
  
  private determineStepFromSession(session: BookingSession): number {
    if (session.status === 'confirmed') return 4;
    if (session.status === 'payment_failed') return 2; // Back to payment options
    if (session.bookingId) return 2; // Payment step
    if (session.formData.fullName && session.formData.email) return 1;
    return 0;
  }
  
  private collectMetadata() {
    return {
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      createdFrom: this.getWidgetInstanceId()
    };
  }
  
  private getWidgetInstanceId(): string {
    let instanceId = sessionStorage.getItem('widget_instance_id');
    if (!instanceId) {
      instanceId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('widget_instance_id', instanceId);
    }
    return instanceId;
  }
}
```

### 1.2 Zustand Store with Persistence

```typescript
// src/stores/bookingStore.ts
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SessionService } from '@/services/sessionService';
import { BookingSession } from '@/types/session';
import { FormValues, Service, TeamMember, AvailableTime } from '@/types';

interface BookingStore {
  // Session & State
  session: BookingSession | null;
  currentStep: number;
  isLoading: boolean;
  error: AppError | null;
  
  // Form Data

  formValues: FormValues;
  
  // Cached Data
  services: Service[];
  teamMembers: TeamMember[];
  availableTimes: AvailableTime[];
  
  // Payment State
  paymentOption: 'now' | 'later' | null;
  paymentIntent: any | null;
  lastPaymentError: string | null;
  
  // Actions
  initializeSession: (tenantId: string) => Promise<void>;
  recoverSession: () => Promise<boolean>;
  updateFormField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => Promise<void>;
  updateMultipleFields: (fields: Partial<FormValues>) => Promise<void>;
  
  // Navigation
  proceedToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  
  // Booking Operations
  createBooking: () => Promise<string>;
  confirmBooking: (bookingId: string) => Promise<void>;
  
  // Payment Operations  
  setPaymentOption: (option: 'now' | 'later') => void;
  createPaymentIntent: (bookingId: string) => Promise<void>;
  handlePaymentFailure: (error: string) => Promise<void>;
  retryPayment: () => Promise<void>;
  
  // Utilities
  resetStore: () => void;
  setError: (error: AppError | null) => void;
}

const sessionService = new SessionService(
  process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
);

export const useBookingStore = create<BookingStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial State
          session: null,
          currentStep: 0,
          isLoading: false,
          error: null,
          formValues: {} as FormValues,
          services: [],
          teamMembers: [],
          availableTimes: [],
          paymentOption: null,
          paymentIntent: null,
          lastPaymentError: null,
          
          // Initialize new session
          initializeSession: async (tenantId: string) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });
            
            try {
              // Try to recover existing session first
              const recovered = await get().recoverSession();
              if (recovered) return;
              
              // Create new session
              const session = await sessionService.createSession(tenantId, {});
              
              // Load initial data
              const [services, teamMembers] = await Promise.all([
                api.getServices(tenantId),
                api.getTeamMembers(tenantId)
              ]);
              
              set((state) => {
                state.session = session;
                state.services = services.data;
                state.teamMembers = teamMembers.data;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error as AppError;
                state.isLoading = false;
              });
            }
          },
          
          // Recover existing session
          recoverSession: async () => {
            const session = await sessionService.recoverSession();
            if (!session) return false;
            
            set((state) => {
              state.session = session;
              state.formValues = session.formData as FormValues;
              
              // Restore to appropriate step based on session status
              if (session.status === 'payment_failed') {
                // Go back to payment options selection
                state.currentStep = 2;
                state.lastPaymentError = session.metadata?.lastPaymentError;
              } else if (session.bookingId) {
                state.currentStep = 2; // Payment step
              } else {
                state.currentStep = state.formValues.fullName ? 1 : 0;
              }
            });
            
            return true;
          },
          
          // Update single form field
          updateFormField: async (field, value) => {
            const { session } = get();
            if (!session) return;
            
            // Optimistic update
            set((state) => {
              (state.formValues as any)[field] = value;
            });
            
            try {
              const updatedSession = await sessionService.updateSession(session.id, {
                formData: { ...get().formValues, [field]: value }
              });
              
              set((state) => {
                state.session = updatedSession;
              });
            } catch (error) {
              // Revert on failure
              set((state) => {
                (state.formValues as any)[field] = session.formData[field];
                state.error = error as AppError;
              });
            }
          },
          
          // Update multiple fields at once
          updateMultipleFields: async (fields) => {
            const { session } = get();
            if (!session) return;
            
            const newFormValues = { ...get().formValues, ...fields };
            
            set((state) => {
              state.formValues = newFormValues;
            });
            
            try {
              const updatedSession = await sessionService.updateSession(session.id, {
                formData: newFormValues
              });
              
              set((state) => {
                state.session = updatedSession;
              });
            } catch (error) {
              set((state) => {
                state.formValues = session.formData as FormValues;
                state.error = error as AppError;
              });
            }
          },
          
          // Navigation
          proceedToNextStep: async () => {
            const { currentStep } = get();
            
            // Validate current step before proceeding
            const validation = await validateStep(currentStep, get().formValues);
            if (!validation.success) {
              set((state) => {
                state.error = new ValidationError('Please complete all required fields', validation.errors);
              });
              return;
            }
            
            // Special handling for payment step
            if (currentStep === 1) {
              // Create booking before payment step
              await get().createBooking();
            }
            
            set((state) => {
              state.currentStep = Math.min(state.currentStep + 1, 3);
              state.error = null;
            });
          },
          
          goToPreviousStep: () => {
            set((state) => {
              state.currentStep = Math.max(state.currentStep - 1, 0);
              state.error = null;
            });
          },
          
          goToStep: (step: number) => {
            set((state) => {
              state.currentStep = step;
              state.error = null;
            });
          },
          
          // Booking Operations
          createBooking: async () => {
            const { session, formValues } = get();
            if (!session) throw new Error('No session');
            
            set((state) => {
              state.isLoading = true;
            });
            
            try {
              const booking = await api.createAppointment({
                ...formValues,
                sessionId: session.id
              });
              
              const updatedSession = await sessionService.updateSession(session.id, {
                bookingId: booking.id,
                status: 'booking_created'
              });
              
              set((state) => {
                state.session = updatedSession;
                state.isLoading = false;
              });
              
              return booking.id;
            } catch (error) {
              set((state) => {
                state.error = error as AppError;
                state.isLoading = false;
              });
              throw error;
            }
          },
          
          confirmBooking: async (bookingId: string) => {
            const { session } = get();
            if (!session) return;
            
            await api.confirmBooking(bookingId);
            
            const updatedSession = await sessionService.updateSession(session.id, {
              status: 'confirmed'
            });
            
            set((state) => {
              state.session = updatedSession;
            });
          },
          
          // Payment Operations
          setPaymentOption: (option) => {
            set((state) => {
              state.paymentOption = option;
              state.lastPaymentError = null; // Clear any previous errors
            });
          },
          
          createPaymentIntent: async (bookingId: string) => {
            set((state) => {
              state.isLoading = true;
            });
            
            try {
              const paymentIntent = await api.createPaymentIntent(bookingId);
              
              await sessionService.updateSession(get().session!.id, {
                paymentIntentId: paymentIntent.id,
                status: 'payment_pending'
              });
              
              set((state) => {
                state.paymentIntent = paymentIntent;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error as AppError;
                state.isLoading = false;
              });
              throw error;
            }
          },
          
          handlePaymentFailure: async (error: string) => {
            const { session } = get();
            if (!session) return;
            
            // Update session with failure status
            const updatedSession = await sessionService.updateSession(session.id, {
              status: 'payment_failed',
              metadata: {
                ...session.metadata,
                lastPaymentError: error,
                paymentAttempts: (session.metadata?.paymentAttempts || 0) + 1
              }
            });
            
            set((state) => {
              state.session = updatedSession;
              state.lastPaymentError = error;
              state.paymentOption = null; // Reset payment option
              state.currentStep = 2; // Go back to payment options
            });
          },
          
          retryPayment: async () => {
            const { session, paymentOption } = get();
            if (!session || !session.bookingId) return;
            
            if (paymentOption === 'now') {
              // Create new payment intent for retry
              await get().createPaymentIntent(session.bookingId);
            } else if (paymentOption === 'later') {
              // Just confirm the booking without payment
              await get().confirmBooking(session.bookingId);
            }
          },
          
          // Utilities
          resetStore: () => {
            sessionStorage.removeItem('booking_session_v2');
            localStorage.removeItem('booking_recovery_v2');
            
            set((state) => {
              state.session = null;
              state.currentStep = 0;
              state.formValues = {} as FormValues;
              state.paymentOption = null;
              state.paymentIntent = null;
              state.lastPaymentError = null;
              state.error = null;
            });
          },
          
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          }
        })),
        {
          name: 'booking-store',
          partialize: (state) => ({
            formValues: state.formValues,
            currentStep: state.currentStep,
            paymentOption: state.paymentOption
          })
        }
      )
    )
  )
);
```

### 1.3 Centralized Error Handling System (Widget-Contained)

```typescript
// src/services/errorHandler.ts
import { AppError, NetworkError, ValidationError, PaymentError } from '@/types/errors';
import { notification } from 'antd';
import { Toast } from 'antd-mobile';

export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private errorLog: AppError[] = [];
  private readonly MAX_ERROR_LOG = 50;
  private isWidgetContext = true; // Ensure we're in widget context
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  constructor() {
    this.registerDefaultStrategies();
    this.setupGlobalErrorHandlers();
  }
  
  /**
   * Setup global error handlers to catch unhandled errors
   * within the widget context only
   */
  private setupGlobalErrorHandlers() {
    // Store original handlers
    const originalErrorHandler = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;
    
    // Override window.onerror for widget errors only
    window.onerror = (message, source, lineno, colno, error) => {
      // Check if error originated from widget code
      if (this.isWidgetError(source)) {
        this.handle(error || new Error(String(message)));
        return true; // Prevent bubbling
      }
      
      // Call original handler for non-widget errors
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Override unhandledrejection for widget promises only
    window.addEventListener('unhandledrejection', (event) => {
      // Check if the promise rejection is from widget code
      if (this.isWidgetPromise(event)) {
        event.preventDefault(); // Prevent default error handling
        this.handle(new Error(event.reason));
      }
    });
    
    // Cleanup function for when widget is destroyed
    window.bookingWidgetCleanup = () => {
      window.onerror = originalErrorHandler;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }
  
  private isWidgetError(source: string | undefined): boolean {
    if (!source) return false;
    // Check if error source is from widget files
    return source.includes('booking-widget') ||
           source.includes('/widget/') ||
           source.includes('BookingWidget');
  }
  
  private isWidgetPromise(event: PromiseRejectionEvent): boolean {
    // Check stack trace to determine if from widget
    const stack = event.reason?.stack || '';
    return this.isWidgetError(stack);
  }
  
  private registerDefaultStrategies() {
    // Network error recovery
    this.registerStrategy('NETWORK_ERROR', {
      canRecover: () => true,
      recover: async (error: NetworkError) => {
        const shouldRetry = await this.showRetryDialog(
          'Network Error',
          'Unable to connect to the server. Would you like to retry?'
        );
        
        if (shouldRetry) {
          // Retry the last failed request
          return this.retryLastRequest();
        }
      }
    });
    
    // Payment error recovery
    this.registerStrategy('PAYMENT_ERROR', {
      canRecover: (error: PaymentError) => {
        // Can recover from most payment errors except fraud
        return error.paymentErrorCode !== 'fraudulent';
      },
      recover: async (error: PaymentError) => {
        const store = useBookingStore.getState();
        
        // Navigate back to payment options
        await store.handlePaymentFailure(error.message);
        
        // Show helpful message
        this.showError(
          'Payment Failed',
          'Your payment could not be processed. You can try again or choose to pay later.',
          'warning'
        );
      }
    });
    
    // Session expired recovery
    this.registerStrategy('SESSION_EXPIRED', {
      canRecover: () => true,
      recover: async () => {
        const store = useBookingStore.getState();
        
        // Try to create a new session with existing form data
        const formData = store.formValues;
        store.resetStore();
        
        if (Object.keys(formData).length > 0) {
          // Restore form data in new session
          await store.initializeSession(window.widgetConfig?.tenantId || '');
          await store.updateMultipleFields(formData);
          
          this.showError(
            'Session Restored',
            'Your session expired but we\'ve restored your information.',
            'info'
          );
        }
      }
    });
  }
  
  registerStrategy(errorCode: string, strategy: ErrorRecoveryStrategy) {
    this.recoveryStrategies.set(errorCode, strategy);
  }
  
  async handle(error: Error | AppError): Promise<void> {
    try {
      // Wrap all error handling in try-catch to prevent any errors from escaping
      
      // Log error
      this.logError(error);
      
      // Convert to AppError if needed
      const appError = this.normalizeError(error);
      
      // Try automatic recovery
      const strategy = this.recoveryStrategies.get(appError.code);
      if (strategy && strategy.canRecover(appError)) {
        try {
          await strategy.recover(appError);
          return;
        } catch (recoveryError) {
          console.error('[Widget] Recovery failed', recoveryError);
        }
      }
      
      // Fallback to showing error to user
      this.showErrorToUser(appError);
    } catch (handlingError) {
      // Even error handling failed - log but don't throw
      console.error('[Widget] Error handler failed:', handlingError);
      console.error('[Widget] Original error:', error);
    }
  }
  
  private normalizeError(error: Error | AppError): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    // Check for common error patterns
    if (error.message.includes('Network')) {
      return new NetworkError(error.message);
    }
    
    if (error.message.includes('Payment')) {
      return new PaymentError(error.message, 'unknown');
    }
    
    // Default
    return new AppError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500
    );
  }
  
  private showErrorToUser(error: AppError) {
    const isMobile = window.innerWidth < 768;
    
    const message = this.getUserFriendlyMessage(error);
    
    if (isMobile) {
      Toast.show({
        icon: 'fail',
        content: message,
        duration: 5000
      });
    } else {
      notification.error({
        message: 'Error',
        description: message,
        duration: 5,
        placement: 'topRight'
      });
    }
  }
  
  private getUserFriendlyMessage(error: AppError): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'PAYMENT_ERROR': 'Payment could not be processed. Please try again.',
      'SESSION_EXPIRED': 'Your session has expired. Please start over.',
      'BOOKING_CONFLICT': 'This time slot is no longer available. Please select another.',
      'SERVER_ERROR': 'Something went wrong on our end. Please try again later.'
    };
    
    return messages[error.code] || error.message || 'An unexpected error occurred.';
  }
  
  private async showRetryDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Use antd-mobile Modal
        const modal = Modal.show({
          title,
          content: message,
          closeOnMaskClick: false,
          actions: [
            {
              key: 'cancel',
              text: 'Cancel',
              onClick: () => resolve(false)
            },
            {
              key: 'retry',
              text: 'Retry',
              primary: true,
              onClick: () => resolve(true)
            }
          ]
        });
      } else {
        // Use antd Modal
        Modal.confirm({
          title,
          content: message,
          okText: 'Retry',
          cancelText: 'Cancel',
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        });
      }
    });
  }
  
  private showError(title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      Toast.show({
        icon: type === 'error' ? 'fail' : type === 'warning' ? 'exclamation' : 'info',
        content: message
      });
    } else {
      notification[type]({
        message: title,
        description: message
      });
    }
  }
  
  private logError(error: Error | AppError) {
    try {
      const normalizedError = this.normalizeError(error);
      this.errorLog.push(normalizedError);
      
      // Keep log size manageable
      if (this.errorLog.length > this.MAX_ERROR_LOG) {
        this.errorLog.shift();
      }
      
      // Send to monitoring service with widget context
      if (window.Sentry && this.isWidgetContext) {
        window.Sentry.withScope((scope) => {
          scope.setTag('component', 'booking-widget');
          scope.setTag('tenant', window.widgetConfig?.tenantId || 'unknown');
          scope.setContext('widget', {
            version: '2.0.0',
            instance: sessionStorage.getItem('widget_instance_id') || 'unknown'
          });
          window.Sentry.captureException(error);
        });
      }
      
      // Log to console in development with widget prefix
      if (process.env.NODE_ENV === 'development') {
        console.error('[BookingWidget Error]', error);
      }
    } catch (logError) {
      // Even logging failed - don't let it escape
      console.error('[Widget] Logging failed:', logError);
    }
  }
  
  private async retryLastRequest(): Promise<void> {
    // This would be implemented based on your request tracking system
    const store = useBookingStore.getState();
    
    // For now, just retry the current operation
    if (store.currentStep === 0) {
      await store.initializeSession(window.widgetConfig?.tenantId || '');
    }
  }
  
  getErrorLog(): readonly AppError[] {
    return this.errorLog;
  }
  
  clearErrorLog(): void {
    this.errorLog = [];
  }
  
  /**
   * Destroy error handler and cleanup global handlers
   * Should be called when widget is unmounted
   */
  destroy(): void {
    if (window.bookingWidgetCleanup) {
      window.bookingWidgetCleanup();
      delete window.bookingWidgetCleanup;
    }
    this.clearErrorLog();
    this.recoveryStrategies.clear();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Widget Error Boundary Component
export class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to our error handler
    errorHandler.handle(error);
    
    // Log component stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Widget ErrorBoundary]', errorInfo.componentStack);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="widget-error-fallback" style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>Booking Widget Error</h3>
          <p>We're sorry, but something went wrong with the booking widget.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Reload Widget
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 1.4 Updated AppointmentBookingForm Component

```typescript
// src/components/booking/AppointmentBookingForm.tsx
import React, { useEffect, useCallback } from 'react';
import { Steps, Spin, Result } from 'antd';
import { useBookingStore } from '@/stores/bookingStore';
import { errorHandler } from '@/services/errorHandler';
import { ServiceStep } from './steps/ServiceStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { PaymentStep } from './steps/PaymentStep';
import { SummaryStep } from './steps/SummaryStep';

interface Props {
  tenantId: string;
  apiUrl?: string;
  onComplete?: (bookingId: string) => void;
}

export const AppointmentBookingForm: React.FC<Props> = ({
  tenantId,
  apiUrl,
  onComplete
}) => {
  const {
    session,
    currentStep,
    isLoading,
    error,
    formValues,
    paymentOption,
    lastPaymentError,
    initializeSession,
    recoverSession,
    proceedToNextStep,
    goToPreviousStep,
    setPaymentOption,
    retryPayment,
    confirmBooking,
    resetStore
  } = useBookingStore();
  
  // Initialize or recover session on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Try to recover existing session first
        const recovered = await recoverSession();
        
        if (!recovered) {
          // No session to recover, create new one
          await initializeSession(tenantId);
        } else if (session?.status === 'payment_failed' && lastPaymentError) {
          // Show payment failure message if recovering from failed payment
          errorHandler.handle(
            new PaymentError(
              lastPaymentError,
              'payment_failed_recovery'
            )
          );
        }
      } catch (error) {
        errorHandler.handle(error as Error);
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      // Don't reset if we're just navigating away temporarily
      if (!document.hidden) {
        // Only reset if the widget is being destroyed
        const widgetContainer = document.getElementById('booking-widget-container');
        if (!widgetContainer) {
          resetStore();
        }
      }
    };
  }, [tenantId]);
  
  // Handle step navigation
  const handleNext = useCallback(async () => {
    try {
      await proceedToNextStep();
    } catch (error) {
      errorHandler.handle(error as Error);
    }
  }, [proceedToNextStep]);
  
  const handlePrevious = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);
  
  // Handle payment option selection
  const handlePaymentOptionSelect = useCallback(async (option: 'now' | 'later') => {
    setPaymentOption(option);
    
    if (!session?.bookingId) {
      errorHandler.handle(new Error('No booking found'));
      return;
    }
    
    if (option === 'later') {
      // Confirm booking without payment
      try {
        await confirmBooking(session.bookingId);
        await proceedToNextStep();
        
        if (onComplete) {
          onComplete(session.bookingId);
        }
      } catch (error) {
        errorHandler.handle(error as Error);
      }
    } else {
      // Proceed to payment
      await proceedToNextStep();
    }
  }, [session, setPaymentOption, confirmBooking, proceedToNextStep, onComplete]);
  
  // Handle payment retry
  const handlePaymentRetry = useCallback(async () => {
    if (!paymentOption) {
      // No payment option selected, go back to selection
      goToPreviousStep();
    } else {
      try {
        await retryPayment();
      } catch (error) {
        errorHandler.handle(error as Error);
      }
    }
  }, [paymentOption, goToPreviousStep, retryPayment]);
  
  // Render loading state
  if (isLoading && !session) {
    return (
      <div