import React, { useEffect, useState } from 'react'
import { Steps, Button, Card, Grid, Result } from 'antd-mobile'
import ServiceStepMobile from '@/components/booking/steps/ServiceStepMobile'
import PersonalInfoStepMobile from '@/components/booking/steps/PersonalInfoStepMobile'
import SummaryStepMobile from '@/components/booking/steps/SummaryStepMobile'
import axios from 'axios'

import ServiceStepSkeletonMobile from '@/components/booking/steps/ServiceStepSkeletonMobile'

import { createAppointment } from '@/components/booking/api'

import type { Booking, Customer, FormValues, Service, TeamMember } from '@/components/booking/types/index'

import { getServices, getTeamMembers } from '@/components/booking/api'

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
    service: undefined,
    employee: undefined,
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
    status: 'success' | 'error' | 'waiting';
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
        status: 'waiting',
        title: '',
        description: ''
    })

    const forms = {
        serviceForm: React.createRef<any>(),
        personalInfoForm: React.createRef<any>()
    }

    const steps = [
        {
            title: 'Select Service',
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
                    <ServiceStepSkeletonMobile />
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
        }
    ]

// Build widget metadata snapshot to persist in bookings.widget_metadata (mobile)
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
        date: bookingValues.date ? (bookingValues.date as any).format?.('YYYY-MM-DD') : undefined,
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
    const next = async () => {
        if (submitting) return

        let formRef
        if (current === 0) {
            formRef = forms.serviceForm.current
        } else if (current === 1) {
            formRef = forms.personalInfoForm.current
        }
        if (formRef) {
            try {
                await formRef.validateFields()
                if (current === steps.length - 1) {
                    await onSubmit()
                } else {
                    setCurrent(current + 1)
                }
            } catch (error) {
                // Handle validation error
            }
        } else {
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
                status: 'waiting',
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
        setBookingSuccessful(false)
        setCurrent(0)
        setLoading(true)
        setResultState({
            show: false,
            status: 'waiting',
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
                            description={
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
                                        color='primary'
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
                                <Grid columns={2} gap={16}>
                                    <Grid.Item>
                                        <Button
                                            block
                                            size='middle'
                                            onClick={() => {
                                                setResultState({
                                                    show: false,
                                                    status: 'waiting',
                                                    title: '',
                                                    description: ''
                                                })
                                            }}
                                            style={{ fontSize: '16px' }}
                                        >
                                            Go Back
                                        </Button>
                                    </Grid.Item>
                                    <Grid.Item>
                                        <Button
                                            color='primary'
                                            block
                                            size='middle'
                                            onClick={onSubmit}
                                            style={{ fontSize: '16px' }}
                                        >
                                            Try Again
                                        </Button>
                                    </Grid.Item>
                                </Grid>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Steps current={current} style={{ marginBottom: 24 }}>
                            {steps.map((item) => (
                                <Steps.Step key={item.title} title={item.title} />
                            ))}
                        </Steps>

                        <div>
                            {steps[current].content}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <Grid columns={current > 0 ? 2 : 1} gap={16}>
                                {current > 0 && (
                                    <Grid.Item>
                                        <Button
                                            block
                                            size='middle'
                                            onClick={() => prev()}
                                            disabled={loading || submitting}
                                        >
                                            Previous
                                        </Button>
                                    </Grid.Item>
                                )}
                                <Grid.Item>
                                    <Button
                                        color='primary'
                                        block
                                        size='middle'
                                        onClick={() => next()}
                                        disabled={loading || submitting}
                                    >
                                        {current === steps.length - 1 ? 'Submit' : 'Next'}
                                    </Button>
                                </Grid.Item>
                            </Grid>
                        </div>
                    </>
                )}
            </Card>
        </>
    )
}

export default AppointmentBookingFormMobile