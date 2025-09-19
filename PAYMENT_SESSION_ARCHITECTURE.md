# Payment Session Architecture - Improved Payment Flow

## Current Implementation Problems

### 1. **Database Pollution with Incomplete Bookings**

**Current Flow:**
```
1. User fills form → 2. Create booking in DB → 3. Get booking ID → 4. Create payment intent → 5. Redirect to Stripe
```

**Problems:**
- **Abandoned Bookings**: If user abandons payment, you have a booking in your database that was never paid for
- **Data Integrity Issues**: You have "ghost" bookings that appear in reports but represent no actual revenue
- **Cleanup Complexity**: Need background jobs to clean up unpaid bookings after X hours
- **Status Management**: Need complex status fields (pending_payment, paid, cancelled, expired)

**Example of Current Issue:**
```typescript
// Current: Booking created BEFORE payment
const booking = await createBooking({
  serviceId: 123,
  customerId: 456,
  status: 'pending_payment',  // This booking might never be paid!
  widget_metadata: formData    // Storing UI state in business entity
});

// If user closes browser here, booking exists but is unpaid
```

### 2. **Mixing UI State with Business Data**

**Current Problem:**
- `widget_metadata` is stored directly in the booking table
- This mixes temporary UI state with permanent business records
- Makes it hard to change UI without affecting business logic

### 3. **Difficult Recovery from Payment Failures**

**Current Issue:**
- If payment fails, you have a booking record that needs to be updated or deleted
- Multiple payment attempts create confusion about which booking is "real"
- Hard to track payment retry attempts

### 4. **Security Concerns**

**Current Vulnerabilities:**
- Booking ID is exposed to client before payment confirmation
- Client could potentially manipulate booking state
- No clear separation between "intent to book" and "confirmed booking"

---

## Proposed Solution: Payment Session Pattern

### **Core Concept**
Instead of creating a booking immediately, create a temporary "payment session" that holds the intent to book. Only convert it to an actual booking after successful payment.

### **Improved Flow**

```
1. User fills form → 2. Create payment session → 3. Store form data → 4. Process payment → 5. Confirm & create booking
```

### **Detailed Implementation**

#### **Step 1: Create Payment Session**

```typescript
// Backend: POST /api/payment-sessions
interface CreatePaymentSessionRequest {
  serviceId: string;
  employeeId: string;
  date: string;
  time: string;
  customerId?: string;  // Optional if new customer
}

interface PaymentSessionResponse {
  sessionId: string;        // UUID for this session
  paymentIntentId: string;  // Stripe payment intent
  clientSecret: string;     // For Stripe Elements
  expiresAt: string;        // ISO timestamp
}

// Database Table: payment_sessions
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE,
  service_id INTEGER,
  employee_id INTEGER,
  appointment_date DATE,
  appointment_time TIME,
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50),  -- 'pending', 'processing', 'completed', 'expired'
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Benefits:**
- No booking created yet - just an intent
- Clean separation of payment process from booking
- Automatic expiration handling

#### **Step 2: Store Form Data in Session**

```typescript
// Backend: POST /api/payment-sessions/{sessionId}/form-data
interface StoreFormDataRequest {
  customer: {
    fullName: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  formValues: {
    // Any UI-specific data for rehydration
    selectedServiceName?: string;
    selectedEmployeeName?: string;
    // ... other UI state
  };
}

// Database Table: payment_session_data
CREATE TABLE payment_session_data (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES payment_sessions(id) ON DELETE CASCADE,
  customer_data JSONB,     -- Customer information
  form_data JSONB,         -- UI state for rehydration
  created_at TIMESTAMP
);
```

**Benefits:**
- Form data stored separately from business data
- Can be automatically deleted when session expires
- Easy to rehydrate form on return from Stripe

#### **Step 3: Handle Stripe Redirect**

```typescript
// Frontend: Return from Stripe
const handleStripeReturn = async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const paymentStatus = params.get('redirect_status');
  
  if (paymentStatus === 'succeeded') {
    // Confirm the booking
    const booking = await confirmPaymentSession(sessionId);
    showSuccessMessage(booking);
  } else {
    // Rehydrate form for retry
    const sessionData = await getPaymentSession(sessionId);
    rehydrateForm(sessionData.formData);
  }
};

// Backend: GET /api/payment-sessions/{sessionId}
interface PaymentSessionData {
  session: {
    id: string;
    status: string;
    serviceId: string;
    employeeId: string;
    date: string;
    time: string;
  };
  customer: CustomerData;
  formData: any;  // UI state
}
```

#### **Step 4: Confirm Booking After Payment**

```typescript
// Backend: POST /api/payment-sessions/{sessionId}/confirm
interface ConfirmBookingResponse {
  bookingId: string;
  booking: {
    id: string;
    referenceNumber: string;
    service: Service;
    employee: Employee;
    customer: Customer;
    date: string;
    time: string;
    status: 'confirmed';
    paymentIntentId: string;
  };
}

// Backend implementation
async function confirmPaymentSession(sessionId: string) {
  // 1. Verify payment with Stripe
  const session = await getPaymentSession(sessionId);
  const paymentIntent = await stripe.paymentIntents.retrieve(session.paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not successful');
  }
  
  // 2. Create the actual booking
  const booking = await createBooking({
    serviceId: session.serviceId,
    employeeId: session.employeeId,
    customerId: session.customerId,
    date: session.date,
    time: session.time,
    paymentIntentId: session.paymentIntentId,
    status: 'confirmed'
  });
  
  // 3. Mark session as completed
  await updatePaymentSession(sessionId, { status: 'completed' });
  
  // 4. Send confirmation email
  await sendBookingConfirmation(booking);
  
  return booking;
}
```

### **Database Schema Comparison**

#### **Current Schema (Problems)**
```sql
-- Bookings table polluted with incomplete records
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  service_id INTEGER,
  customer_id INTEGER,
  status VARCHAR(50),  -- Many statuses: pending_payment, paid, cancelled, expired
  widget_metadata JSONB,  -- UI state mixed with business data
  payment_intent_id VARCHAR(255),
  created_at TIMESTAMP
);

-- Problems:
-- 1. Unpaid bookings remain in table
-- 2. UI metadata stored with business data
-- 3. Complex status management
```

#### **Improved Schema (Clean Separation)**
```sql
-- Payment sessions (temporary, auto-cleaned)
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY,
  payment_intent_id VARCHAR(255),
  expires_at TIMESTAMP,  -- Auto-cleanup after this time
  status VARCHAR(50)     -- Simple: pending, completed, expired
);

-- Session data (temporary, deleted with session)
CREATE TABLE payment_session_data (
  session_id UUID REFERENCES payment_sessions(id) ON DELETE CASCADE,
  form_data JSONB  -- UI state separate from business
);

-- Bookings (only confirmed, paid bookings)
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  service_id INTEGER,
  customer_id INTEGER,
  payment_intent_id VARCHAR(255),
  status VARCHAR(50)  -- Simple: confirmed, cancelled, completed
);

-- Benefits:
-- 1. Bookings table only has real, paid bookings
-- 2. UI state separate and temporary
-- 3. Automatic cleanup via CASCADE DELETE
```

### **Implementation Timeline**

#### **Phase 1: Backend API (Week 1)**
```typescript
// New endpoints to implement
POST   /api/payment-sessions                    // Create session
POST   /api/payment-sessions/{id}/form-data    // Store form data
GET    /api/payment-sessions/{id}              // Get session data
POST   /api/payment-sessions/{id}/confirm      // Confirm booking
DELETE /api/payment-sessions/{id}              // Cancel session
```

#### **Phase 2: Frontend Integration (Week 2)**
```typescript
// New service class
class PaymentSessionService {
  async createSession(bookingData: BookingData): Promise<SessionResponse> {
    const session = await api.post('/payment-sessions', bookingData);
    await api.post(`/payment-sessions/${session.id}/form-data`, {
      customer: customerData,
      formValues: formState
    });
    return session;
  }
  
  async confirmBooking(sessionId: string): Promise<Booking> {
    return api.post(`/payment-sessions/${sessionId}/confirm`);
  }
  
  async rehydrateFromSession(sessionId: string): Promise<FormData> {
    const data = await api.get(`/payment-sessions/${sessionId}`);
    return data.formData;
  }
}
```

#### **Phase 3: Migration Strategy (Week 3)**
1. Deploy new payment session endpoints
2. Update frontend to use new flow for new bookings
3. Keep old endpoints for backward compatibility
4. Migrate existing pending bookings to completed status
5. After 30 days, remove old endpoints

### **Cleanup Strategy**

```typescript
// Automatic cleanup job (runs every hour)
async function cleanupExpiredSessions() {
  const expired = await db.query(`
    DELETE FROM payment_sessions 
    WHERE expires_at < NOW() 
    AND status = 'pending'
    RETURNING id
  `);
  
  console.log(`Cleaned up ${expired.length} expired sessions`);
}

// Payment sessions expire after 1 hour by default
const SESSION_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
```

### **Benefits Summary**

1. **Clean Database**: Only real bookings in bookings table
2. **Better UX**: Easy form rehydration without complex fallback logic
3. **Simpler Code**: Clear separation of concerns
4. **Automatic Cleanup**: Expired sessions auto-delete
5. **Better Analytics**: No ghost bookings in reports
6. **Improved Security**: No booking ID exposed before payment
7. **Easier Testing**: Can test payment flow without creating bookings
8. **Scalability**: Can handle high abandonment rates without database pollution

### **Migration Path from Current System**

1. **Keep current system running** (no breaking changes)
2. **Add new payment session endpoints** alongside existing ones
3. **Update frontend to use new flow** with feature flag
4. **Test with small percentage** of users
5. **Gradually roll out** to all users
6. **Deprecate old endpoints** after stability confirmed
7. **Clean up old abandoned bookings** with one-time script

### **Code Examples for Frontend Integration**

#### **Current Complex Rehydration**
```typescript
// Current: Complex nested fallbacks
const serviceId = 
  booking?.serviceId ?? 
  booking?.service_id ?? 
  metadata?.form?.serviceId ?? 
  widgetMetadata?.serviceId ?? 
  undefined;  // 😱 Hard to maintain!
```

#### **New Simple Rehydration**
```typescript
// New: Clean, predictable structure
const { formData } = await getPaymentSession(sessionId);
const { serviceId, employeeId, date, time } = formData;
// That's it! 🎉
```

This architecture provides a much cleaner, more maintainable solution that separates payment processing from booking creation, making the system more robust and easier to work with.