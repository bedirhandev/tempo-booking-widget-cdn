// AppointmentBookingFormMobile.tsx
import React, { useEffect } from 'react'
import { Button, Card, Space } from 'antd-mobile'
import { Steps } from 'antd-mobile'
import { CheckOutline } from 'antd-mobile-icons'
import ServiceStep from '@/components/booking/steps/ServiceStep'
import PersonalInfoStep from '@/components/booking/steps/PersonalInfoStep'
import SummaryStep from '@/components/booking/steps/SummaryStep'
import type { FormValues } from '@/components/booking/types'
import axios from 'axios'

import type { Service, Company, TeamMember, Booking, Customer } from '@/components/booking/types'

import ServiceStepSkeleton from '@/components/booking/steps/ServiceStepSkeleton'
import SummaryStepSkeleton from '@/components/booking/steps/SummaryStepSkeleton'

import { createAppointment, getAppointments, getServices, getTeamMembers } from '@/components/booking/api'

interface AppointmentBookingFormMobileProps {
    tenantId?: string;
    apiUrl?: string;
    onBookingComplete?: (bookingData: any) => void;
    onError?: (error: any) => void;
    // State props passed from parent
    current: number;
    setCurrent: (value: number) => void;
    formValues: FormValues;
    setFormValues: React.Dispatch<React.SetStateAction<FormValues>>;
    bookingValues: Booking;
    setBookingValues: React.Dispatch<React.SetStateAction<Booking>>;
    customerValues: Customer;
    setCustomerValues: React.Dispatch<React.SetStateAction<Customer>>;
    loading: boolean;
    setLoading: (value: boolean) => void;
    rawBookingData?: Booking[];
    setRawBookingData: (value: Booking[] | undefined) => void;
    rawEmployeeData?: TeamMember[];
    setRawEmployeeData: (value: TeamMember[] | undefined) => void;
    rawServiceData?: Service[];
    setRawServiceData: (value: Service[] | undefined) => void;
    company?: Company;
    setCompany: (value: Company | undefined) => void;
    bookingSuccessful: boolean;
    setBookingSuccessful: (value: boolean) => void;
    submitting: boolean;
    setSubmitting: (value: boolean) => void;
    messageApi: any;
    contextHolder: any;
    handleApiResponse: any;
    notifications: any;
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

const AppointmentBookingFormMobile: React.FC<AppointmentBookingFormMobileProps> = ({
    tenantId = 'default',
    apiUrl,
    onBookingComplete,
    onError,
    current,
    setCurrent,
    formValues,
    setFormValues,
    bookingValues,
    setBookingValues,
    customerValues,
    setCustomerValues,
    loading,
    setLoading,
    rawBookingData,
    setRawBookingData,
    rawEmployeeData,
    setRawEmployeeData,
    rawServiceData,
    setRawServiceData,
    company,
    setCompany,
    bookingSuccessful,
    setBookingSuccessful,
    submitting,
    setSubmitting,
    messageApi,
    contextHolder,
    handleApiResponse,
    notifications
}) => {
    const forms = {
        serviceForm: React.createRef<any>(),
        personalInfoForm: React.createRef<any>()
    }

    const steps = [
        {
            title: 'Select Service',
            content:
                rawBookingData && rawServiceData && rawEmployeeData ? (
                    <ServiceStep
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
                    <ServiceStepSkeleton />
                )
        },
        {
            title: 'Personal Info',
            content: rawBookingData && (
                <PersonalInfoStep
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
            messageApi.loading({ content: 'Processing...', key: 'booking' })

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

            const loadingToast = notifications.loading('Creating booking...');
            const response = await createAppointment(booking, tenantId, apiUrl);
            notifications.dismiss(loadingToast);

            handleApiResponse(response, 'Booking created successfully');

            messageApi.success({
                content: 'Booked successfully!',
                key: 'booking',
                duration: 2
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
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const { status, data } = error.response;

                    if (status === 422) {
                        messageApi.error({
                            content: 'Validation failed',
                            key: 'booking',
                            duration: 2,
                        });
                    } else {
                        messageApi.error({
                            content: data?.message || 'Error occurred',
                            key: 'booking',
                            duration: 2,
                        });
                    }
                } else {
                    messageApi.error({
                        content: 'Network error',
                        key: 'booking',
                        duration: 2,
                    });
                }
            } else {
                messageApi.error({
                    content: 'Unexpected error',
                    key: 'booking',
                    duration: 2,
                });
            }

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
            {contextHolder}
            <div style={{ padding: '12px' }}>
                {submitting ? (
                    <>
                        <SummaryStepSkeleton
                            loadingText='Processing...'
                            subText='Please wait'
                        />
                        <div style={{ marginTop: 16 }}>
                            <Button
                                block
                                color='primary'
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
                        <Card style={{ marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <CheckOutline style={{ fontSize: 48, color: '#52c41a' }} />
                                <p style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>
                                    Appointment Booked Successfully!
                                </p>
                            </div>
                        </Card>
                        <SummaryStep formValues={formValues} />
                        <div style={{ marginTop: 16 }}>
                            <Button
                                block
                                color='primary'
                                size='large'
                                onClick={onReset}
                            >
                                Book Another
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Steps current={current} style={{ marginBottom: 24 }}>
                            {steps.map((item, index) => (
                                <Steps.Step
                                    key={item.title}
                                    title={item.title}
                                    status={index < current ? 'finish' : index === current ? 'process' : 'wait'}
                                />
                            ))}
                        </Steps>

                        <div style={{ minHeight: '300px' }}>
                            {steps[current].content}
                        </div>

                        <Space direction='horizontal' style={{ width: '100%', marginTop: 16 }}>
                            {current > 0 && (
                                <Button
                                    block
                                    size='large'
                                    onClick={() => prev()}
                                    disabled={loading || submitting}
                                    style={{ flex: 1 }}
                                >
                                    Previous
                                </Button>
                            )}
                            <Button
                                block
                                color='primary'
                                size='large'
                                onClick={() => next()}
                                disabled={loading || submitting}
                                style={{ flex: 1 }}
                            >
                                {current === steps.length - 1 ? 'Submit' : 'Next'}
                            </Button>
                        </Space>
                    </>
                )}
            </div>
        </>
    )
}

export default AppointmentBookingFormMobile