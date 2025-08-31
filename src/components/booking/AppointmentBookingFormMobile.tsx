import React, { useEffect, useState } from 'react'
import { Steps, Button, Toast, Card, Grid } from 'antd-mobile'
import ServiceStepMobile from '@/components/booking/steps/ServiceStepMobile'
import PersonalInfoStepMobile from '@/components/booking/steps/PersonalInfoStepMobile'
import SummaryStepMobile from '@/components/booking/steps/SummaryStepMobile'
import type { FormValues } from '@/components/booking/types'
import { Dayjs } from 'dayjs'
import axios from 'axios'

import type { Service, Company, TeamMember } from '@/components/booking/types'

import ServiceStepSkeletonMobile from '@/components/booking/steps/ServiceStepSkeletonMobile'
import SummaryStepSkeletonMobile from '@/components/booking/steps/SummaryStepSkeletonMobile'

import { createAppointment, getAppointments, getServices, getTeamMembers } from '@/components/booking/api'
import { useApiNotifications } from '@/components/booking/api-notifications'

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
    const [submitting, setSubmitting] = useState(false) // Add submitting state

    const { handleApiResponse } = useApiNotifications();

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
        if (submitting) return // Prevent actions during submission

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
                    // Trigger submission after Personal Information step
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

            // Replace messageApi.loading with Toast.show
            Toast.show({
                icon: 'loading',
                content: 'Processing your appointment...',
                duration: 0, // 0 means it won't auto-dismiss
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

            // Remove notifications.loading and replace with Toast if needed
            // If you want a second loading message:
            // Toast.show({ icon: 'loading', content: 'Creating booking...', duration: 0 })

            const response = await createAppointment(booking, tenantId, apiUrl);

            // Clear any loading toasts
            Toast.clear()

            handleApiResponse(response, 'Booking created successfully');

            // Replace messageApi.success
            Toast.show({
                icon: 'success',
                content: 'Appointment booked successfully!',
                duration: 2000, // 2 seconds in milliseconds
            })

            setBookingSuccessful(true)

            // Call the onBookingComplete callback if provided
            if (onBookingComplete) {
                onBookingComplete({
                    booking: booking,
                    formValues: formValues,
                    customerValues: customerValues,
                    bookingValues: bookingValues
                })
            }

        } catch (error: unknown) {
            // Clear any loading toasts
            Toast.clear()

            // If it's an Axios error, check specifics
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const { status, data } = error.response;

                    if (status === 422) {
                        // Validation error
                        Toast.show({
                            icon: 'fail',
                            content: 'Validation failed: please check the form fields.',
                            duration: 2000,
                        })
                    } else if (status === 500) {
                        // Server error
                        Toast.show({
                            icon: 'fail',
                            content: data?.message || 'A server error occurred.',
                            duration: 2000,
                        })
                    } else {
                        // Other errors (400, 403, 404, etc.)
                        Toast.show({
                            icon: 'fail',
                            content: data?.message || 'An error occurred during the booking.',
                            duration: 2000,
                        })
                    }
                } else {
                    // Possibly a network error
                    Toast.show({
                        icon: 'fail',
                        content: 'Network error or server did not respond.',
                        duration: 2000,
                    })
                }
            } else {
                // Some non-Axios error
                Toast.show({
                    icon: 'fail',
                    content: 'An unexpected error occurred.',
                    duration: 2000,
                })
            }

            // Call the onError callback if provided
            if (onError) {
                onError(error)
            }
        } finally {
            setSubmitting(false) // End submission
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
        await fetchData()
        setLoading(false)
    }

    const fetchData = async () => {
        //setLoading(true)

        try {
            const [appointmentsResponse, servicesResponse, employeesResponse] = await Promise.all([
                getAppointments(tenantId, apiUrl),
                getServices(tenantId, apiUrl),
                getTeamMembers(tenantId, apiUrl)
            ])
            setRawBookingData(appointmentsResponse)
            setRawServiceData(servicesResponse.data)
            setRawEmployeeData(employeesResponse.data.data)
            setCompany(undefined) // Company data will be handled separately
        } catch (error) {
            console.error('Something went wrong:', error)
        } /*finally {
      setLoading(false)
    }*/
    }

    useEffect(() => {
        fetchData().then(() => setLoading(false))
    }, [])

    return (
        <>
            <Card>
                {submitting ? (
                    <>
                        <div style={{ marginTop: 16 }}>
                            <SummaryStepSkeletonMobile
                                loadingText='Processing booking details...'
                                subText='This usually takes a few seconds'
                            />
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <Button
                                color='primary'
                                block
                                size='large'
                                onClick={onReset}
                                disabled={loading || submitting}
                                loading={submitting}
                            >
                                {submitting ? 'Processing...' : 'Finish'}
                            </Button>
                        </div>
                    </>
                ) : bookingSuccessful ? (
                    <>
                        <p style={{ marginTop: 0 }}>Your appointment has been booked successfully!</p>
                        <div style={{ marginTop: 16 }}>
                            <SummaryStepMobile formValues={formValues} />
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <Button
                                color='primary'
                                block
                                size='large'
                                onClick={onReset}
                            >
                                Finish
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Steps current={current} style={{ marginBottom: 24 }}>
                            {steps.map((item) => (
                                <Steps.Step key={item.title} title={item.title} />
                            ))}
                        </Steps>

                        <div style={{ minHeight: '300px' }}>
                            {steps[current].content}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <Grid columns={current > 0 ? 2 : 1} gap={16}>
                                {current > 0 && (
                                    <Grid.Item>
                                        <Button
                                            block
                                            size='large'
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
                                        size='large'
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
