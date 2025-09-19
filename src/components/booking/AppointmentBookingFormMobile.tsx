import React, { useEffect, useState } from 'react'
import { Steps, Button, Card, Row, Col, Result, Radio } from 'antd'
import ServiceStepMobile from '@/components/booking/steps/ServiceStepMobile'
import PersonalInfoStepMobile from '@/components/booking/steps/PersonalInfoStepMobile'
import SummaryStepMobile from '@/components/booking/steps/SummaryStepMobile'
import axios from 'axios'
import dayjs from 'dayjs'

import type { Booking, Customer, FormValues, Service, TeamMember } from '@/components/booking/types/index'

import ServicesStepSkeletonMobile from '@/components/booking/steps/ServiceStepSkeleton'

import { createAppointment, getServices, getTeamMembers, getBookingByPaymentIntent } from '@/components/booking/api'
import PaymentWidget from '@/components/payment/PaymentWidget'

const { Step } = Steps

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

interface AppointmentBookingFormMobileProps {
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

const AppointmentBookingFormMobile: React.FC<AppointmentBookingFormMobileProps> = ({
  tenantId = 'default',
  apiUrl,
  onBookingComplete,
  onError
}) => {
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

  // Declare before steps to avoid "used before declaration"
  function handlePaymentSuccess(bookingId: string) {
    // Ensure summary content is derived immediately for display
    try {
      computeAndSetSummaryFormValues();
    } catch {}
    setResultState({
      show: true,
      status: 'success',
      title: 'Payment successful',
      description: 'Your payment was confirmed. Your appointment will reflect as paid.'
    });
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
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach((k) => {
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

  const steps = [
    {
      title: 'Select Services',
      content:
        servicesData && employeesData ? (
          <ServiceStepMobile
            formRef={forms.serviceForm}
            setFormValues={setFormValues}
            bookingValues={bookingValues}
            setBookingValues={setBookingValues}
            employeesData={employeesData}
            servicesData={servicesData}
            tenantId={tenantId}
          />
        ) : (
          <ServicesStepSkeletonMobile />
        )
    },
    {
      title: 'Personal Information',
      content: (
        <PersonalInfoStepMobile
          formRef={forms.personalInfoForm}
          setFormValues={setFormValues}
          customerValues={customerValues}
          setCustomerValues={setCustomerValues}
        />
      )
    },
    {
      title: 'Payment Options',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ marginBottom: 8 }}>Choose how you'd like to proceed:</p>
          <Radio.Group
            value={paymentChoice}
            onChange={(e) => setPaymentChoice(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="pay_now">Pay now</Radio.Button>
            <Radio.Button value="pay_later">Pay later</Radio.Button>
          </Radio.Group>
          {!paymentChoice && (
            <div style={{ fontSize: 12, color: '#999' }}>
              You can continue after selecting one of the options.
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Payment',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          {paymentChoice !== 'pay_now' ? (
            <div style={{ color: '#666' }}>
              Please go back and choose "Pay now", or select "Pay later" to finish without payment.
            </div>
          ) : !createdBookingId ? (
            <div>Preparing payment…</div>
          ) : (
            <PaymentWidget
              tenantId={tenantId}
              bookingId={createdBookingId!}
              apiBaseUrl={apiUrl}
              email={customerValues.Email || undefined}
              name={customerValues.FullName || undefined}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={(err: Error) => {
                console.error('Payment failed:', err);
              }}
            />
          )}
        </div>
      )
    }
  ]

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

    // Payment Options step index = 2
    if (current === 2) {
      if (!paymentChoice) return;

      if (paymentChoice === 'pay_later') {
        // Directly create booking and finish (no payment)
        await onSubmit();
        return;
      }

      // pay_now: ensure booking exists to obtain bookingId, then go to Payment step
      try {
        setSubmitting(true)

        const booking = buildBookingPayload()
        const createResp = await createAppointment(
          { ...booking, metadata: buildWidgetMetadata() },
          tenantId,
          apiUrl
        )
        const newId =
          (createResp?.id ?? createResp?.data?.id ?? createResp?.booking?.id ?? createResp?.data?.booking?.id)
        if (!newId) {
          throw new Error('Could not determine bookingId from createAppointment response')
        }
        setCreatedBookingId(String(newId))
        setCurrent(current + 1)
      } catch (err) {
        console.error('Error preparing payment:', err)
        setResultState({
          show: true,
          status: 'error',
          title: 'Could not start payment',
          description: 'We were unable to prepare the payment step. Please try again or choose Pay later.'
        })
      } finally {
        setSubmitting(false)
      }
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
        time: startTime || "", //convertLocalTimeToUtc(bookingValues.time!) || ""
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
        title: 'Appointment Booked Successfully!',
        description: 'Your appointment has been confirmed. You will receive a confirmation email shortly.'
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
    if (rehydrated) return;

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
              try { computeAndSetSummaryFormValues(); } catch {}
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
          } catch {}
        }
      })();
    } catch {}
  }, [tenantId, apiUrl, rehydrated])

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

    // Time formatting:
    // - If ISO datetime → HH:mm
    // - If HH:mm:ss → HH:mm
    // - If already a label (e.g., "08:00 - 08:30") keep as-is
    if (bookingValues.time) {
      const t = bookingValues.time as string;
      let displayTime = t;

      if (t.includes(' - ')) {
        displayTime = t;
      } else if (t.includes('T')) {
        const d = dayjs(t);
        if (d.isValid()) displayTime = d.format('HH:mm');
      } else if (/^\\d{2}:\\d{2}:\\d{2}$/.test(t)) {
        displayTime = t.slice(0, 5);
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

  setFormValues(prev => ({ ...prev, ...next }));
}

// Keep summary derived when dependencies change (rehydration, data fetch, edits)
useEffect(() => {
  computeAndSetSummaryFormValues();
}, [servicesData, employeesData, bookingValues, customerValues]);
  // Derive Summary fields (service name, price, employee name, formatted date/time, customer info)
  // once bookingValues/customerValues and reference data are available.
  useEffect(() => {
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

      // Date formatting for display
      if (bookingValues.date) {
        next.date = bookingValues.date.format('MMMM DD, YYYY');
      }

      // Time formatting for display:
      // - If it's an ISO datetime, format to HH:mm
      // - If it's HH:mm:ss, trim to HH:mm
      // - If it's already a human label (e.g., "08:00 - 08:30"), leave it
      if (bookingValues.time) {
        const t = bookingValues.time as string;
        let displayTime = t;

        if (t.includes(' - ')) {
          // keep label as-is
          displayTime = t;
        } else if (t.includes('T')) {
          const d = dayjs(t);
          if (d.isValid()) displayTime = d.format('HH:mm');
        } else if (/^\d{2}:\d{2}:\d{2}$/.test(t)) {
          displayTime = t.slice(0, 5);
        }

        next.time = displayTime;
      }

      // Customer info
      next.fullName = customerValues.FullName || next.fullName;
      next.email = customerValues.Email || next.email;
      next.phoneNumber = customerValues.Phone || next.phoneNumber;
    } catch {
      // noop
    }

    setFormValues(prev => ({ ...prev, ...next }));
  }, [servicesData, employeesData, bookingValues, customerValues])

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
                  <SummaryStepMobile formValues={formValues} />
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
            <Steps current={current} style={{ marginBottom: 24 }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>

            <div className='steps-content'>
              {steps[current].content}
            </div>

            <div className='steps-action' style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                {current > 0 && (
                  <Col xs={24} sm={current === 3 ? 24 : 12}>
                    <Button
                      block
                      size='middle'
                      onClick={() => prev()}
                      disabled={loading || submitting}
                    >
                      Previous
                    </Button>
                  </Col>
                )}
                {current !== 3 && (
                  <Col xs={24} sm={current > 0 ? 12 : 24}>
                    <Button
                      type='primary'
                      block
                      size='middle'
                      onClick={() => next()}
                      disabled={loading || submitting}
                    >
                      {current === steps.length - 1 ? 'Submit' : 'Next'}
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

export default AppointmentBookingFormMobile