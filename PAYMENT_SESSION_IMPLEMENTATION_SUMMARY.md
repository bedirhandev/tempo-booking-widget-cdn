# Payment Session Implementation Summary

## Quick Reference Guide

### 🎯 **Main Goal**
Replace the current approach of creating bookings before payment with a cleaner two-phase system:
1. **Payment Session Phase**: Temporary intent to book (can be abandoned without consequence)
2. **Booking Phase**: Confirmed appointment (only after payment or explicit "pay later" confirmation)

---

## 📊 **Database Changes Summary**

### **New Tables to Create**

| Table Name | Purpose | Lifetime |
|------------|---------|----------|
| `payment_sessions` | Store temporary booking intent | Auto-delete after 1 hour |
| `payment_session_data` | Store form data for rehydration | Cascade delete with session |

### **Existing Tables to Modify**

| Table Name | Changes Needed | Reason |
|------------|----------------|---------|
| `bookings` | Remove `widget_metadata` column | UI state no longer stored here |
| `bookings` | Simplify status to: `confirmed`, `cancelled`, `completed` | No more `pending_payment` status |

---

## 🔌 **API Endpoints Summary**

### **New Endpoints to Implement**

| Method | Endpoint | Purpose | When Called |
|--------|----------|---------|-------------|
| `POST` | `/api/payment-sessions` | Create payment session | When user clicks "Continue to Payment" |
| `POST` | `/api/payment-sessions/{id}/form-data` | Store form state | Right after session creation |
| `GET` | `/api/payment-sessions/{id}` | Retrieve session data | When returning from Stripe |
| `POST` | `/api/payment-sessions/{id}/confirm` | Convert to booking | After successful payment |
| `POST` | `/api/payment-sessions/{id}/confirm-pay-later` | Create pay-later booking | When user chooses "Pay on Site" |
| `DELETE` | `/api/payment-sessions/{id}` | Cancel session | User changes selection after session created |

### **Endpoints to Deprecate (After Migration)**

| Method | Endpoint | Reason for Deprecation |
|--------|----------|------------------------|
| `POST` | `/api/bookings` (with pending status) | Replaced by payment sessions |
| `GET` | `/api/bookings/by-payment-intent` | Replaced by session retrieval |

---

## 💳 **Payment Flow Comparison**

### **Pay Now Flow (Credit Card)**

#### Current Implementation:
```
1. User fills form
2. POST /api/bookings → Creates booking with status='pending_payment'
3. Create Stripe payment intent with booking_id
4. Redirect to Stripe
5. Return from Stripe
6. GET /api/bookings/by-payment-intent → Complex rehydration
7. Update booking status to 'confirmed'
```

#### New Implementation:
```
1. User fills form
2. POST /api/payment-sessions → Creates temporary session
3. POST /api/payment-sessions/{id}/form-data → Store form state
4. Create Stripe payment intent with session_id
5. Redirect to Stripe
6. Return from Stripe
7. GET /api/payment-sessions/{id} → Simple rehydration
8. POST /api/payment-sessions/{id}/confirm → Creates actual booking
```

### **Pay Later Flow (On-Site Payment)**

#### Current Implementation:
```
1. User fills form
2. User selects "Pay Later"
3. POST /api/bookings → Creates booking with status='pending_payment'
4. Show confirmation
Problem: Booking exists but might not be honored
```

#### New Implementation:
```
1. User fills form
2. User selects "Pay Later"
3. POST /api/payment-sessions → Creates temporary session
4. POST /api/payment-sessions/{id}/confirm-pay-later → Creates booking with payment_method='on_site'
5. Show confirmation
Benefit: Clear distinction between payment methods
```

---

## 🏗️ **Implementation for Pay Later Appointments**

### **Backend Endpoint**

```typescript
// POST /api/payment-sessions/{id}/confirm-pay-later
async function confirmPayLaterBooking(sessionId: string, request: Request) {
  // 1. Retrieve session data
  const session = await getPaymentSession(sessionId);
  
  if (session.status !== 'pending') {
    throw new Error('Session already processed');
  }
  
  // 2. Validate business rules
  // Some services might not allow pay-later
  const service = await getService(session.serviceId);
  if (!service.allowPayLater) {
    throw new Error('This service requires advance payment');
  }
  
  // 3. Create booking with pay-later flag
  const booking = await createBooking({
    serviceId: session.serviceId,
    employeeId: session.employeeId,
    customerId: session.customerId,
    date: session.date,
    time: session.time,
    paymentMethod: 'on_site',  // Key difference
    paymentStatus: 'pending',   // Will be paid on-site
    status: 'confirmed'         // Booking is confirmed
  });
  
  // 4. Mark session as completed
  await updatePaymentSession(sessionId, { 
    status: 'completed',
    bookingId: booking.id 
  });
  
  // 5. Send confirmation email (different template)
  await sendPayLaterConfirmation(booking);
  
  return {
    bookingId: booking.id,
    booking: booking,
    paymentRequired: true,
    paymentDueAt: 'arrival'
  };
}
```

### **Frontend Implementation**

```typescript
// In SummaryStep.tsx
const handlePaymentChoice = async (choice: 'pay_now' | 'pay_later') => {
  // Create session first (same for both flows)
  const session = await createPaymentSession({
    serviceId,
    employeeId,
    date,
    time,
    amount
  });
  
  // Store form data for potential rehydration
  await storeSessionFormData(session.id, {
    customer: customerData,
    formValues: currentFormState
  });
  
  if (choice === 'pay_now') {
    // Redirect to Stripe
    const { clientSecret } = session;
    await stripe.confirmPayment({
      clientSecret,
      return_url: `${window.location.origin}/booking?session_id=${session.id}`
    });
  } else {
    // Confirm as pay-later booking
    const booking = await confirmPayLaterBooking(session.id);
    showSuccessMessage({
      type: 'pay_later',
      booking,
      message: 'Please pay at the venue'
    });
  }
};
```

---

## 📋 **Step-by-Step Migration Checklist**

### **Phase 1: Database Setup (Day 1-2)**
- [ ] Create `payment_sessions` table
- [ ] Create `payment_session_data` table  
- [ ] Add indexes for performance
- [ ] Set up automatic cleanup job

### **Phase 2: Backend API (Day 3-5)**
- [ ] Implement session creation endpoint
- [ ] Implement form data storage endpoint
- [ ] Implement session retrieval endpoint
- [ ] Implement payment confirmation endpoint
- [ ] Implement pay-later confirmation endpoint
- [ ] Add session expiry logic

### **Phase 3: Frontend Integration (Day 6-8)**
- [ ] Create `PaymentSessionService` class
- [ ] Update payment flow to use sessions
- [ ] Implement pay-later flow
- [ ] Update rehydration logic
- [ ] Add error handling

### **Phase 4: Testing (Day 9-10)**
- [ ] Test pay-now flow end-to-end
- [ ] Test pay-later flow end-to-end
- [ ] Test session expiry
- [ ] Test form rehydration
- [ ] Test error scenarios

### **Phase 5: Deployment (Day 11-12)**
- [ ] Deploy with feature flag
- [ ] Test with 10% of users
- [ ] Monitor for issues
- [ ] Full rollout

### **Phase 6: Cleanup (Day 13-14)**
- [ ] Remove old endpoints
- [ ] Clean up abandoned bookings
- [ ] Remove `widget_metadata` column
- [ ] Update documentation

---

## 🎯 **Goals Achievement Summary**

| Problem | Current State | New Solution | Benefit |
|---------|--------------|--------------|---------|
| **Database Pollution** | Unpaid bookings remain forever | Sessions auto-expire after 1 hour | Clean database |
| **Complex Rehydration** | Multiple nested fallbacks | Single, predictable data source | Simpler code |
| **Mixed Concerns** | UI state in booking table | Separate session_data table | Better architecture |
| **Pay Later Handling** | Same as failed payments | Explicit pay-later flow | Clear business logic |
| **Recovery from Failures** | Update existing booking | Create new session | Cleaner retry |
| **Security** | Booking ID exposed early | Only session ID exposed | Better security |

---

## 📈 **Business Benefits**

1. **Accurate Analytics**: Only real bookings in reports
2. **Reduced Support**: Fewer issues with stuck bookings
3. **Better UX**: Smoother payment retry experience
4. **Flexibility**: Easy to add new payment methods
5. **Maintainability**: Cleaner, more testable code
6. **Scalability**: Can handle high abandonment rates

---

## 🔍 **Key Differences for Developers**

### **Before (Complex)**
```typescript
// Multiple places to check for data
const serviceId = 
  booking?.serviceId ?? 
  booking?.service_id ?? 
  metadata?.form?.serviceId ?? 
  widgetMetadata?.serviceId;

// Unclear booking state
if (booking.status === 'pending_payment') {
  // Is this abandoned? Failed? In progress?
}
```

### **After (Simple)**
```typescript
// Single source of truth
const { serviceId } = session.formData;

// Clear booking state
if (booking.paymentMethod === 'on_site') {
  // Definitely a pay-later booking
}
```

---

## 🚀 **Quick Start for Implementation**

1. **Start with pay-later support** in current system:
   - Add `payment_method` field to bookings table
   - Update booking creation to accept payment method

2. **Then implement sessions** alongside current flow:
   - Create new tables
   - Add new endpoints
   - Test with feature flag

3. **Finally migrate** all users to new flow:
   - Remove old code
   - Clean up database

This approach ensures zero downtime and safe rollback if needed.