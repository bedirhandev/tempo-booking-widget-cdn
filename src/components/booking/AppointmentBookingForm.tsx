import React, { useEffect, useState } from 'react'
import { Steps, Button, Card, Row, Col, Result, Radio } from 'antd'
import ServiceStep from '@/components/booking/steps/ServiceStep'
import PersonalInfoStep from '@/components/booking/steps/PersonalInfoStep'
import SummaryStep from '@/components/booking/steps/SummaryStep'
import axios from 'axios'

import type { Booking, Customer, FormValues, Service, TeamMember } from '@/components/booking/types/index'

import ServicesStepSkeleton from '@/components/booking/steps/ServiceStepSkeleton'

import { createAppointment } from '@/components/booking/api'
import { getServices, getTeamMembers } from '@/components/booking/api'
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

  // Declare before steps to avoid "used before declaration"
  function handlePaymentSuccess(bookingId: string) {
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

  const steps = [
    {
      title: 'Select Services',
      content:
        servicesData && employeesData ? (
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
        const createResp = await createAppointment(booking, tenantId, apiUrl)
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

      await createAppointment(booking, tenantId, apiUrl);

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

export default AppointmentBookingForm