import React, { useEffect, useState, useMemo } from 'react'
import { Steps, Button, Card, Row, Col, Result, Typography, Space } from 'antd'
import { ClockCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import ServiceStep from '@/components/booking/steps/ServiceStep'
import PersonalInfoStep from '@/components/booking/steps/PersonalInfoStep'
import SummaryStep from '@/components/booking/steps/SummaryStep'
import axios from 'axios'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

import type { Booking, Customer, FormValues, Service, TeamMember } from '@/components/booking/types/index'

import ServicesStepSkeleton from '@/components/booking/steps/ServiceStepSkeleton'

import { createAppointment, getServices, getTeamMembers, getBookingByPaymentIntent } from '@/components/booking/api'
import PaymentWidget from '@/components/payment/PaymentWidget'
import { useFinancialSettings } from '@/components/booking/financial/FinancialSettingsProvider'

const initialBookingState: Booking = {
  id: '',
  serviceId: undefined,
  employeeId: undefined,
  customerId: undefined,
  note: undefined,
  notificationEnabled: true,
  date: null,
  time: undefined
}

const initialCustomerState: Customer = {
  id: '',
  FullName: '',
  Email: '',
  Phone: undefined,
  Notes: undefined,
  isRegistered: false
}

const initialFormValues = {
  services: undefined,
  employees: undefined,
  date: undefined,
  time: undefined,
  fullName: '',
  email: undefined,
  phoneNumber: undefined,
  additionalNotes: undefined
} as FormValues

interface AppointmentBookingFormProps {
  tenantId?: string;
  apiUrl?: string;
  onBookingComplete?: (bookingData: any) => void;
  onError?: (error: any) => void;
}

interface ResultState {
  show: boolean;
  status: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({
  tenantId = 'default',
  apiUrl,
  onBookingComplete,
  onError
}) => {
  const { payLaterEnabled, stripeEnabled, isReady: financialSettingsReady } = useFinancialSettings();
  
  const [current, setCurrent] = useState(0)
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues)
  const [bookingValues, setBookingValues] = useState<Booking>(initialBookingState)
  const [customerValues, setCustomerValues] = useState<Customer>(initialCustomerState)
  const [loading, setLoading] = useState(true)
  const [employeesData, setEmployeesData] = useState<TeamMember[]>()
  const [servicesData, setServicesData] = useState<Service[]>()
  const [bookingSuccessful, setBookingSuccessful] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultState, setResultState] = useState<ResultState>({
    show: false,
    status: 'info',
    title: '',
    description: ''
  })

  // Payment decision and created booking id
  const [paymentChoice, setPaymentChoice] = useState<'pay_now' | 'pay_later' | null>(null)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [rehydrated, setRehydrated] = useState(false)

  // Determine if payment step is needed and what options are available
  const paymentStepNeeded = useMemo(() => payLaterEnabled || stripeEnabled, [payLaterEnabled, stripeEnabled]);
  
  // Auto-select payment choice if only one option is available
  useEffect(() => {
    if (!paymentStepNeeded) return;
    
    // If we're on the payment step and only one option is available, auto-select it
    if (current === 3 && paymentChoice === null) {
      if (payLaterEnabled && !stripeEnabled) {
        setPaymentChoice('pay_later');
      } else if (!payLaterEnabled && stripeEnabled) {
        setPaymentChoice('pay_now');
      }
    }
  }, [current, paymentChoice, payLaterEnabled, stripeEnabled, paymentStepNeeded]);

  // Declare before steps to avoid "used before declaration"
  function handlePaymentSuccess(bookingId: string) {
    // Ensure summary content is derived immediately for display
    try {
      computeAndSetSummaryFormValues();
    } catch { }
    setResultState({
      show: true,
      status: 'success',
      title: 'Thank you!',
      description: 'Your appointment has been confirmed and a confirmation email has been sent to you.'
    })
    setBookingSuccessful(true);
  }

  const forms = {
    serviceForm: React.createRef<any>(),
    personalInfoForm: React.createRef<any>()
  }

  // Build booking payload from current state (used for both pay-now and pay-later)
  const buildBookingPayload = () => {
    const { Notes } = customerValues

    const startTime = bookingValues.time?.includes(' - ')
      ? bookingValues.time.split(' - ')[0]
      : bookingValues.time

    const booking: any = {
      userId: bookingValues.employeeId || "",
      teamId: undefined,
      serviceId: bookingValues.serviceId || "",
      customer: {
        id: customerValues.id || "",
        fullName: customerValues.FullName || "",
        email: customerValues.Email || "",
        phone: customerValues.Phone || "",
        notes: customerValues.Notes || "",
        isRegistered: customerValues.isRegistered || false
      },
      statusTypeId: "1",
      note: Notes,
      notificationEnabled: bookingValues.notificationEnabled,
      date: bookingValues.date!.toDate(), // Convert dayjs to Date object
      time: startTime || "",
    };

    return booking;
  }

  // Build widget metadata snapshot to persist in bookings.widget_metadata
  const buildWidgetMetadata = () => {
    try {
      const url = new URL(window.location.href);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const utm: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
        const v = url.searchParams.get(k);
        if (v) utm[k] = v;
      });
      return {
        source: 'widget',
        env: {
          href: url.href,
          locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
          browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timezone: tz,
        },
        utm,
        form: {
          serviceId: bookingValues.serviceId,
          employeeId: bookingValues.employeeId,
          date: bookingValues.date ? bookingValues.date.format('YYYY-MM-DD') : undefined,
          time: bookingValues.time,
          notificationEnabled: bookingValues.notificationEnabled,
          customer: {
            id: customerValues.id || undefined,
            fullName: customerValues.FullName || undefined,
            email: customerValues.Email || undefined,
            phone: customerValues.Phone || undefined,
          },
        },
        step: current,
      };
    } catch {
      return {
        source: 'widget',
        step: current,
      };
    }
  }

  // Build steps dynamically based on payment settings
  const steps = useMemo(() => {
    const baseSteps = [
      {
        title: 'Select Services',
        content: servicesData && employeesData ? (
          <ServiceStep
            formRef={forms.serviceForm}
            setFormValues={setFormValues}
            bookingValues={bookingValues}
            setBookingValues={setBookingValues}
            employeesData={employeesData}
            servicesData={servicesData}
            tenantId={tenantId}
          />
        ) : (
          <ServicesStepSkeleton />
        )
      },
      {
        title: 'Personal Information',
        content: (
          <PersonalInfoStep
            formRef={forms.personalInfoForm}
            setFormValues={setFormValues}
            customerValues={customerValues}
            setCustomerValues={setCustomerValues}
          />
        )
      },
      {
        title: 'Review',
        content: (
          <div>
            <Typography.Title level={4} style={{ marginBottom: 16, color: '#262626', textAlign: 'center' }}>
              Please review your appointment details
            </Typography.Title>
            <SummaryStep formValues={formValues} />
          </div>
        )
      }
    ];

    // Only add payment step if needed
    if (paymentStepNeeded) {
      baseSteps.push({
        title: 'Payment',
        content: (
          <div>
            {/* Only show selection if both options are available */}
            {payLaterEnabled && stripeEnabled && (
              <>
                <Typography.Title level={5} style={{ marginBottom: 12, color: '#262626' }}>
                  Choose how you'd like to proceed:
                </Typography.Title>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <Card
                    hoverable
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: paymentChoice === 'pay_later' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      backgroundColor: paymentChoice === 'pay_later' ? '#f0f8ff' : '#fff'
                    }}
                    onClick={() => {
                      setPaymentChoice('pay_later');
                      setCreatedBookingId(null);
                    }}
                    bodyStyle={{ padding: '16px 12px' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <ClockCircleOutlined style={{ fontSize: 32, color: '#595959' }} />
                      <Typography.Text strong style={{ fontSize: 14 }}>
                        Pay later
                      </Typography.Text>
                    </Space>
                  </Card>

                  <Card
                    hoverable
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: paymentChoice === 'pay_now' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      backgroundColor: paymentChoice === 'pay_now' ? '#f0f8ff' : '#fff'
                    }}
                    onClick={async () => {
                      setPaymentChoice('pay_now');
                      if (!createdBookingId) {
                        try {
                          setSubmitting(true);
                          const booking = buildBookingPayload();
                          const createResp = await createAppointment(
                            { ...booking, metadata: buildWidgetMetadata() },
                            tenantId,
                            apiUrl
                          );
                          const newId = createResp?.id ?? createResp?.data?.id ?? createResp?.booking?.id ?? createResp?.data?.booking?.id;
                          if (!newId) {
                            throw new Error('Could not determine bookingId from createAppointment response');
                          }
                          setCreatedBookingId(String(newId));
                        } catch (err) {
                          console.error('Error preparing payment:', err);
                          setPaymentChoice(null);
                        } finally {
                          setSubmitting(false);
                        }
                      }
                    }}
                    bodyStyle={{ padding: '16px 12px' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <CreditCardOutlined style={{ fontSize: 32, color: '#595959' }} />
                      <Typography.Text strong style={{ fontSize: 14 }}>
                        Pay now
                      </Typography.Text>
                    </Space>
                  </Card>
                </div>
              </>
            )}

            {/* Auto-show payment widget if only Stripe is enabled */}
            {!payLaterEnabled && stripeEnabled && (
              <>
                <Typography.Title level={5} style={{ marginBottom: 16, color: '#262626' }}>
                  Complete your payment to confirm the appointment
                </Typography.Title>
                {!createdBookingId && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Button
                      type="primary"
                      size="large"
                      loading={submitting}
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          const booking = buildBookingPayload();
                          const createResp = await createAppointment(
                            { ...booking, metadata: buildWidgetMetadata() },
                            tenantId,
                            apiUrl
                          );
                          const newId = createResp?.id ?? createResp?.data?.id ?? createResp?.booking?.id ?? createResp?.data?.booking?.id;
                          if (!newId) {
                            throw new Error('Could not determine bookingId from createAppointment response');
                          }
                          setCreatedBookingId(String(newId));
                          setPaymentChoice('pay_now');
                        } catch (err) {
                          console.error('Error preparing payment:', err);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Auto-show confirmation if only pay later is enabled */}
            {payLaterEnabled && !stripeEnabled && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Typography.Title level={5} style={{ marginBottom: 16, color: '#262626' }}>
                  Click confirm to complete your booking
                </Typography.Title>
                <Typography.Text type="secondary">
                  You can pay for this appointment when you arrive
                </Typography.Text>
              </div>
            )}

            {/* Payment Widget - show when pay_now is selected and booking is created */}
            {paymentChoice === 'pay_now' && createdBookingId && (
              <div style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: '16px',
                backgroundColor: '#fafafa',
                marginTop: 16
              }}>
                <PaymentWidget
                  tenantId={tenantId}
                  bookingId={createdBookingId}
                  apiBaseUrl={apiUrl}
                  email={customerValues.Email || undefined}
                  name={customerValues.FullName || undefined}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={(err: Error) => {
                    console.error('Payment failed:', err);
                  }}
                />
              </div>
            )}

            {/* Show loading when preparing payment */}
            {paymentChoice === 'pay_now' && !createdBookingId && submitting && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#595959',
                fontSize: 14,
                marginTop: 16
              }}>
                Preparing payment...
              </div>
            )}
          </div>
        )
      });
    }

    return baseSteps;
  }, [
    servicesData,
    employeesData,
    bookingValues,
    customerValues,
    formValues,
    paymentChoice,
    createdBookingId,
    submitting,
    payLaterEnabled,
    stripeEnabled,
    paymentStepNeeded,
    tenantId,
    apiUrl
  ]);

  const next = async () => {
    if (submitting) return;

    // Validate forms for the first two steps
    let formRef
    if (current === 0) {
      formRef = forms.serviceForm.current
    } else if (current === 1) {
      formRef = forms.personalInfoForm.current
    }
    if (formRef) {
      try {
        await formRef.validateFields()
      } catch {
        return
      }
    }

    // Check if this is the last step (could be Review or Payment)
    const isLastStep = current === steps.length - 1;
    const isPaymentStep = paymentStepNeeded && current === 3;
    const isReviewStep = !paymentStepNeeded && current === 2;

    // If no payment step needed and we're on Review, submit directly
    if (isReviewStep) {
      await onSubmit();
      return;
    }

    // Payment step handling
    if (isPaymentStep) {
      if (!paymentChoice) {
        // If only one option available, it should be auto-selected, but check anyway
        if (payLaterEnabled && !stripeEnabled) {
          setPaymentChoice('pay_later');
        } else if (!payLaterEnabled && stripeEnabled) {
          // For stripe-only, the user needs to click "Proceed to Payment" button
          return;
        }
        return;
      }

      if (paymentChoice === 'pay_later') {
        // Directly create booking and finish (no payment)
        await onSubmit();
        return;
      }

      // For pay_now, the widget should already be loaded and handle payment
      return;
    }

    // Default step advance
    if (current < steps.length - 1) {
      setCurrent(current + 1)
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const onSubmit = async () => {
    try {
      setSubmitting(true)

      // Show loading result
      setResultState({
        show: true,
        status: 'info',
        title: 'Processing your appointment...',
        description: 'Please wait while we confirm your booking'
      })

      const { Notes } = customerValues

      // Extract start time from time range
      const startTime = bookingValues.time?.includes(' - ')
        ? bookingValues.time.split(' - ')[0]
        : bookingValues.time

      const booking: any = {
        userId: bookingValues.employeeId || "",
        teamId: undefined,
        serviceId: bookingValues.serviceId || "",
        customer: {
          id: customerValues.id || "",
          fullName: customerValues.FullName || "",
          email: customerValues.Email || "",
          phone: customerValues.Phone || "",
          notes: customerValues.Notes || "",
          isRegistered: customerValues.isRegistered || false
        },
        statusTypeId: "1",
        note: Notes,
        notificationEnabled: bookingValues.notificationEnabled,
        date: bookingValues.date!.toDate(), // Convert dayjs to Date object
        time: startTime || "",
      };

      await createAppointment(
        { ...booking, metadata: buildWidgetMetadata() },
        tenantId,
        apiUrl
      );

      // Show success result
      setResultState({
        show: true,
        status: 'success',
        title: 'Thank you!',
        description: 'Your appointment has been confirmed and a confirmation email has been sent to you.'
      })

      setBookingSuccessful(true)

      if (onBookingComplete) {
        onBookingComplete({
          booking: booking,
          formValues: formValues,
          customerValues: customerValues,
          bookingValues: bookingValues
        })
      }

    } catch (error: unknown) {
      let errorTitle = 'Booking Failed';
      let errorDescription = 'An unexpected error occurred.';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { status, data } = error.response;

          if (status === 422) {
            errorTitle = 'Validation Error';
            errorDescription = 'Please check the form fields and try again.';
          } else if (status === 500) {
            errorTitle = 'Server Error';
            errorDescription = data?.message || 'A server error occurred. Please try again later.';
          } else {
            errorTitle = 'Booking Error';
            errorDescription = data?.message || 'An error occurred during the booking.';
          }
        } else {
          errorTitle = 'Network Error';
          errorDescription = 'Unable to connect to the server. Please check your internet connection.';
        }
      }

      // Show error result
      setResultState({
        show: true,
        status: 'error',
        title: errorTitle,
        description: errorDescription
      })

      if (onError) {
        onError(error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onReset = async () => {
    setServicesData(undefined)
    setEmployeesData(undefined)
    setBookingValues(initialBookingState)
    setCustomerValues(initialCustomerState)
    setFormValues(initialFormValues)
    setPaymentChoice(null)
    setCreatedBookingId(null)
    setBookingSuccessful(false)
    setCurrent(0)
    setLoading(true)
    setResultState({
      show: false,
      status: 'info',
      title: '',
      description: ''
    })
    await fetchData()
    setLoading(false)
  }

  const fetchData = async () => {
    try {
      const [servicesResponse, employeesResponse] = await Promise.all([
        getServices(tenantId, apiUrl),
        getTeamMembers(tenantId, apiUrl)
      ])
      setServicesData(servicesResponse.data.data)
      setEmployeesData(employeesResponse.data.data)
    } catch (error) {
      console.error('Something went wrong:', error)
    }
  }

  useEffect(() => {
    fetchData().then(() => setLoading(false))
  }, [])

  // Rehydrate form after Stripe redirect by looking up booking via PaymentIntent ID
  useEffect(() => {
    if (rehydrated || !stripeEnabled) return;

    try {
      const url = new URL(window.location.href);
      const paymentIntentId = url.searchParams.get('payment_intent');
      if (!paymentIntentId) return;

      (async () => {
        try {
          const resp = await getBookingByPaymentIntent(tenantId, paymentIntentId, apiUrl);
          const payload = resp.data?.booking ?? resp.data?.data ?? resp.data;
          const b = payload?.booking ?? payload;

          if (b) {
            const bId = String(b.id ?? '');
            if (bId) setCreatedBookingId(bId);

            // Prefer booking payload, but fall back to widget_metadata.form if fields are missing
            const widgetMeta = b.widget_metadata ?? b.widgetMetadata ?? b.metadata ?? null;
            const metaForm = widgetMeta?.form ?? {};

            const resolvedServiceId =
              b.serviceId != null
                ? String(b.serviceId)
                : (metaForm.serviceId != null ? String(metaForm.serviceId) : undefined);

            const resolvedEmployeeId =
              b.userId != null
                ? String(b.userId)
                : (b.employeeId != null
                  ? String(b.employeeId)
                  : (metaForm.employeeId != null ? String(metaForm.employeeId) : undefined));

            const resolvedDateStr = b.date ?? metaForm.date;
            const resolvedTime = b.time ?? metaForm.time;

            setBookingValues(prev => ({
              ...prev,
              serviceId: resolvedServiceId ?? prev.serviceId,
              employeeId: resolvedEmployeeId ?? prev.employeeId,
              note: b.note ?? prev.note,
              notificationEnabled:
                typeof b.notificationEnabled === 'boolean' ? b.notificationEnabled : prev.notificationEnabled,
              date: resolvedDateStr ? dayjs(resolvedDateStr) : prev.date,
              time: resolvedTime ?? prev.time,
            }));

            const custSrc = b.customer ?? metaForm.customer ?? {};
            setCustomerValues(prev => ({
              ...prev,
              id: custSrc.id != null ? String(custSrc.id) : prev.id,
              FullName: custSrc.fullName ?? custSrc.FullName ?? prev.FullName,
              Email: custSrc.email ?? prev.Email,
              Phone: custSrc.phone ?? prev.Phone,
              Notes: custSrc.notes ?? prev.Notes,
              isRegistered:
                typeof custSrc.isRegistered === 'boolean' ? custSrc.isRegistered : prev.isRegistered,
            }));

            // Only set customer display fields here; summary (service/price/date/time/employee) is derived.
            setFormValues(prev => ({
              ...prev,
              fullName: custSrc.fullName ?? prev.fullName,
              email: custSrc.email ?? prev.email,
              phoneNumber: custSrc.phone ?? prev.phoneNumber,
            }));

            setPaymentChoice('pay_now');

            // Ensure summary is recomputed after state updates (and once services/employees load it will refine)
            setTimeout(() => {
              try { computeAndSetSummaryFormValues(); } catch { }
            }, 0);

            setCurrent(3); // Jump directly to Payment step
          }
        } catch (e) {
          console.error('Failed to restore booking from PaymentIntent:', e);
        } finally {
          setRehydrated(true);
          // Clean URL to avoid re-triggering on refresh and hide sensitive params
          try {
            const cleanUrl = new URL(window.location.href);
            ['payment_intent', 'payment_intent_client_secret', 'redirect_status'].forEach((k) =>
              cleanUrl.searchParams.delete(k)
            );
            window.history.replaceState({}, document.title, cleanUrl.toString());
          } catch { }
        }
      })();
    } catch { }
  }, [tenantId, apiUrl, rehydrated, stripeEnabled])

  // Compute and set summary form values based on current state + reference data
  function computeAndSetSummaryFormValues() {
    const next: Partial<FormValues> = {};

    try {
      // Service name + price from servicesData
      if (servicesData && bookingValues.serviceId) {
        const svc = servicesData.find(s => String(s.id) === String(bookingValues.serviceId));
        if (svc) {
          next.service = svc.name;
          next.price = String(svc.price);
        }
      }

      // Employee name from employeesData
      if (employeesData && bookingValues.employeeId) {
        const emp = employeesData.find(e => String(e.id) === String(bookingValues.employeeId));
        if (emp) {
          next.employee = emp.name;
        }
      }

      // Date formatting (human-friendly)
      if (bookingValues.date) {
        next.date = bookingValues.date.format('MMMM DD, YYYY');
      }

      // Time formatting with service duration range:
      // Prefer preserved user-facing label from formValues.time (keeps 12h/24h exactly as chosen).
      // Otherwise, compute "start - end" from bookingValues.time and format to match input style.
      if (formValues.time) {
        next.time = formValues.time;
      } else if (bookingValues.time) {
        const t = String(bookingValues.time);
        let displayTime = t;

        if (t.includes(' - ')) {
          // Already a range (either 12h or 24h), keep as-is
          displayTime = t;
        } else {
          // Build a Dayjs start from available context
          let start: dayjs.Dayjs | null = null;

          // Determine desired output style based on input
          const is12hInput = /(?:\bAM\b|\bPM\b)/i.test(t);

          if (t.includes('T')) {
            // ISO-like
            const d = dayjs(t);
            if (d.isValid()) start = d;
          } else {
            // Prefer selected date; fallback to today to construct a valid datetime
            const baseDate = bookingValues.date
              ? bookingValues.date.format('YYYY-MM-DD')
              : dayjs().format('YYYY-MM-DD');

            // Try parsing with multiple formats (strict)
            const candidates = is12hInput
              ? [
                  'YYYY-MM-DD h:mm A',
                  'YYYY-MM-DD hh:mm A',
                  'YYYY-MM-DD h:mm:ss A',
                  'YYYY-MM-DD hh:mm:ss A'
                ]
              : [
                  'YYYY-MM-DD HH:mm',
                  'YYYY-MM-DD H:mm',
                  'YYYY-MM-DD HH:mm:ss',
                  'YYYY-MM-DD H:mm:ss'
                ];

            for (const fmt of candidates) {
              const d = dayjs(`${baseDate} ${t}`, fmt, true);
              if (d.isValid()) {
                start = d;
                break;
              }
            }

            // Extra tolerant fallback: normalize common bare times
            if (!start) {
              let normalized = t.trim();
              if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) normalized = normalized.slice(0, 5);

              const fallbackFormats = [
                'YYYY-MM-DD HH:mm',
                'YYYY-MM-DD H:mm',
                'YYYY-MM-DD h:mm A',
                'YYYY-MM-DD hh:mm A'
              ];
              for (const fmt of fallbackFormats) {
                const d = dayjs(`${baseDate} ${normalized}`, fmt, true);
                if (d.isValid()) {
                  start = d;
                  break;
                }
              }
            }
          }

          // Determine service duration (minutes)
          const svc = servicesData?.find(s => String(s.id) === String(bookingValues.serviceId));
          const durationMin = typeof svc?.duration === 'number' ? svc!.duration : undefined;

          if (start) {
            const fmt = is12hInput ? 'h:mm A' : 'HH:mm';
            const startStr = start.format(fmt);
            if (durationMin && durationMin > 0) {
              const end = start.add(durationMin, 'minute');
              const endStr = end.format(fmt);
              displayTime = `${startStr} - ${endStr}`;
            } else {
              displayTime = startStr;
            }
          } else if (/^\d{2}:\d{2}:\d{2}$/.test(t)) {
            // Basic fallback formatting
            displayTime = t.slice(0, 5);
          }
        }

        next.time = displayTime;
      }

      // Customer info (from customerValues)
      next.fullName = customerValues.FullName || next.fullName;
      next.email = customerValues.Email || next.email;
      next.phoneNumber = customerValues.Phone || next.phoneNumber;
    } catch {
      // ignore
    }

    // Preserve user-selected time label (e.g., 12hr "7:00 AM - 8:00 AM") if it already exists,
    // to avoid being overwritten by async recomputations based on bookingValues.time (ISO).
    setFormValues(prev => {
      if (prev.time) {
        return { ...prev, ...next, time: prev.time };
      }
      return { ...prev, ...next };
    });
  }

  // Keep summary derived when dependencies change (rehydration, data fetch, edits)
  useEffect(() => {
    computeAndSetSummaryFormValues();
  }, [servicesData, employeesData, bookingValues, customerValues]);

  // Determine the correct step index for payment handling
  const paymentStepIndex = paymentStepNeeded ? 3 : -1;
  const isPaymentStep = paymentStepNeeded && current === paymentStepIndex;
  const isLastStep = current === steps.length - 1;

  return (
    <>
      <Card>
        {resultState.show ? (
          <>
            <Result
              status={resultState.status}
              title={resultState.title}
              subTitle={
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#666',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  textAlign: 'center'
                }}>
                  {resultState.description}
                </div>
              }
              style={{ padding: 0 }}
            />
            {bookingSuccessful && (
              <>
                <div style={{ marginTop: 16 }}>
                  <SummaryStep formValues={formValues} />
                </div>
                <div style={{ marginTop: 24 }}>
                  <Button
                    type='primary'
                    block
                    size='middle'
                    onClick={onReset}
                    style={{ fontSize: '14px' }}
                  >
                    OK
                  </Button>
                </div>
              </>
            )}
            {resultState.status === 'error' && (
              <div style={{ marginTop: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Button
                      block
                      size='middle'
                      onClick={() => {
                        setResultState({
                          show: false,
                          status: 'info',
                          title: '',
                          description: ''
                        })
                      }}
                      style={{ fontSize: '16px' }}
                    >
                      Go Back
                    </Button>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Button
                      type='primary'
                      block
                      size='middle'
                      onClick={onSubmit}
                      style={{ fontSize: '16px' }}
                    >
                      Try Again
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </>
        ) : (
          <>
            <Steps
              current={current < steps.length - 1 ? 0 : 0} // Current step is always position 0 in our filtered view
              type="navigation"
              size="small"
              style={{ marginBottom: 24 }}
              items={[
                // Current step
                {
                  title: steps[current].title,
                  status: 'process',
                  icon: <div style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {current + 1}
                  </div>
                },
                // Next step (if exists)
                ...(current < steps.length - 1 ? [{
                  title: steps[current + 1].title,
                  status: 'wait' as const,
                  icon: <div style={{
                    backgroundColor: '#d9d9d9',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {current + 2}
                  </div>
                }] : [])
              ]}
            />

            <div className='steps-content'>
              {steps[current].content}
            </div>

            <div className='steps-action' style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                {current > 0 && (
                  <Col xs={24} sm={
                    isPaymentStep && paymentChoice === 'pay_now' ? 24 : // Full width when pay_now
                      isPaymentStep && paymentChoice === 'pay_later' ? 12 : // Half width when pay_later  
                        isPaymentStep ? 24 : // Full width when no selection
                          12 // Half width for other steps
                  }>
                    <Button
                      block
                      size='middle'
                      onClick={() => prev()}
                      disabled={loading || submitting || !financialSettingsReady}
                    >
                      Previous
                    </Button>
                  </Col>
                )}
                {!isPaymentStep && (
                  <Col xs={24} sm={current > 0 ? 12 : 24}>
                    <Button
                      type='primary'
                      block
                      size='middle'
                      onClick={() => next()}
                      disabled={loading || submitting || !financialSettingsReady}
                    >
                      {isLastStep && !paymentStepNeeded ? 'Confirm' : 'Next'}
                    </Button>
                  </Col>
                )}
                {isPaymentStep && paymentChoice === 'pay_later' && (
                  <Col xs={24} sm={12}>
                    <Button
                      type='primary'
                      block
                      size='middle'
                      onClick={() => next()}
                      disabled={loading || submitting || !financialSettingsReady}
                    >
                      Confirm
                    </Button>
                  </Col>
                )}
              </Row>
            </div>
          </>
        )}
      </Card>
    </>
  )
}

export default AppointmentBookingForm