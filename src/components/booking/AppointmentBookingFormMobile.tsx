import React, { useEffect, useState } from 'react'
import { Steps, Button, Card, Grid, Result } from 'antd-mobile'
import ServiceStepMobile from '@/components/booking/steps/ServiceStepMobile'
import PersonalInfoStepMobile from '@/components/booking/steps/PersonalInfoStepMobile'
import SummaryStepMobile from '@/components/booking/steps/SummaryStepMobile'
import type { FormValues } from '@/components/booking/types'
import { Dayjs } from 'dayjs'
import axios from 'axios'

import type { Service, Company, TeamMember } from '@/components/booking/types'

import ServiceStepSkeletonMobile from '@/components/booking/steps/ServiceStepSkeletonMobile'

import { createAppointment, getAppointments} from '@/components/booking/api'


import { getAvailableTimeSlots, getServices, getTeamMembers } from './api-test'

interface Booking {
    id: string
    serviceId: string | undefined
    employeeId: string | undefined
    customerId: string | undefined
    note: string | undefined
    notificationEnabled: boolean
    date: Dayjs | null
    time: string | undefined
}

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

interface Customer {
    id: string
    FullName: string
    Email: string
    Phone?: string
    Notes?: string
    isRegistered?: boolean
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
    const [rawBookingData, setRawBookingData] = useState<Booking[]>()
    const [rawEmployeeData, setRawEmployeeData] = useState<TeamMember[]>()
    const [rawServiceData, setRawServiceData] = useState<Service[]>()
    const [company, setCompany] = useState<Company>()
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
                rawBookingData && rawServiceData && rawEmployeeData ? (
                    <ServiceStepMobile
                        formRef={forms.serviceForm}
                        setFormValues={setFormValues}
                        bookingValues={bookingValues}
                        setBookingValues={setBookingValues}
                        company={company || { id: undefined, image: '', name: '', address: '', website: '', phone: '', email: '', time_entries: [], days_off: [] }}
                        rawServiceData={rawServiceData}
                        rawEmployeeData={rawEmployeeData}
                        rawBookingData={rawBookingData}
                    />
                ) : (
                    <ServiceStepSkeletonMobile />
                )
        },
        {
            title: 'Personal Information',
            content: rawBookingData && (
                <PersonalInfoStepMobile
                    formRef={forms.personalInfoForm}
                    setFormValues={setFormValues}
                    customerValues={customerValues}
                    setCustomerValues={setCustomerValues}
                />
            )
        }
    ]

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
                date: bookingValues.date!.toDate(),
                time: bookingValues.time || ""
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
        setRawBookingData(undefined)
        setRawServiceData(undefined)
        setRawEmployeeData(undefined)
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
            const [appointmentsResponse, servicesResponse, employeesResponse] = await Promise.all([
                getAppointments(tenantId, apiUrl),
                getServices(tenantId, apiUrl),
                getTeamMembers(tenantId, apiUrl)
            ])
            setRawBookingData(appointmentsResponse)
            setRawServiceData(servicesResponse.data)
            setRawEmployeeData(employeesResponse.data.data)
            setCompany(undefined)
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