import React, { useEffect, useState } from 'react'
import { Steps, Button, message, Card, Skeleton } from 'antd'
import ServiceStep from '@/components/booking/steps/ServiceStep'
import PersonalInfoStep from '@/components/booking/steps/PersonalInfoStep'
import SummaryStep from '@/components/booking/steps/SummaryStep'
import type { FormValues } from '@/components/booking/types'
import { Dayjs } from 'dayjs'
import axios from 'axios'

import type { Service, Company, TeamMember } from '@/components/booking/types'

import ServiceStepSkeleton from '@/components/booking/steps/ServiceStepSkeleton'
import SummaryStepSkeleton from '@/components/booking/steps/SummaryStepSkeleton'

import { createAppointment, getAppointments, getServices, getTeamMembers } from '@/components/booking/api'
import { useApiNotifications } from '@/components/booking/api-notifications'

const { Step } = Steps

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

interface AppointmentBookingFormProps {
  tenantId?: string;
}

const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({ tenantId = 'default' }) => {
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

  const [wpadminbarHeight, setWpadminbarHeight] = useState(50) // Default to 50 if not found

  useEffect(() => {
    const wpadminbar = document.getElementById('wpadminbar')
    if (wpadminbar) {
      setWpadminbarHeight(wpadminbar.clientHeight)
    }
  }, [])

  const [messageApi, contextHolder] = message.useMessage({ top: wpadminbarHeight })


  const { handleApiResponse, handleApiError, notifications } = useApiNotifications();

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
      title: 'Personal Information',
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
      messageApi.loading({ content: 'Processing your appointment...', key: 'booking' })

      const { id, Notes, ...customerData } = customerValues

      /*await apiClient.post(
        '/book-appointment',
        {
          customer: customerData,
          appointment: {
            service_id: Number(bookingValues.serviceId),
            employee_id: Number(bookingValues.employeeId),
            note: customerValues.Notes,
            notification_enabled: bookingValues.notificationEnabled,
            date: bookingValues.date?.format('YYYY-MM-DD'),
            time: bookingValues.time
          },
        }
      )*/

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
      const response = await createAppointment(booking, tenantId);
      notifications.dismiss(loadingToast);

      handleApiResponse(response, 'Booking created successfully');

      messageApi.success({
        content: 'Appointment booked successfully!',
        key: 'booking',
        duration: 2
      })

      setBookingSuccessful(true)

    } catch (error: unknown) {
      // If it's an Axios error, check specifics
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { status, data } = error.response;

          if (status === 422) {
            // Validation error
            messageApi.error({
              content: 'Validation failed: please check the form fields.',
              key: 'booking',
              duration: 2,
            });
          } else if (status === 500) {
            // Server error
            messageApi.error({
              content: data?.message || 'A server error occurred.',
              key: 'booking',
              duration: 2,
            });
          } else {
            // Other errors (400, 403, 404, etc.)
            messageApi.error({
              content: data?.message || 'An error occurred during the booking.',
              key: 'booking',
              duration: 2,
            });
          }
        } else {
          // Possibly a network error
          messageApi.error({
            content: 'Network error or server did not respond.',
            key: 'booking',
            duration: 2,
          });
        }
      } else {
        // Some non-Axios error
        messageApi.error({
          content: 'An unexpected error occurred.',
          key: 'booking',
          duration: 2,
        });
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
        getAppointments(tenantId),
        getServices(tenantId),
        getTeamMembers(tenantId)
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
      {contextHolder}
      <Card>
        {submitting ? (
          <>
            <Skeleton.Input active size={'small'} block={true} style={{ width: '60%' }} />
            <div style={{ marginTop: 16 }}>
              <SummaryStepSkeleton />
            </div>
            <div className='steps-action' style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type='primary' onClick={onReset} disabled={loading || submitting}>
                Finish
              </Button>
            </div>
          </>
        ) : bookingSuccessful ? (
          <>
            <p>Your appointment has been booked successfully!</p>
            <div style={{ marginTop: 16 }}>
              <SummaryStep formValues={formValues} />
            </div>
            <div className='steps-action' style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type='primary' onClick={onReset}>
                Finish
              </Button>
            </div>
          </>
        ) : (
          <>
            <Steps current={current} style={{ marginBottom: 24 }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
            <div className='steps-content'>{steps[current].content}</div>
            <div className='steps-action' style={{ marginTop: 24, textAlign: 'right' }}>
              {current > 0 && (
                <Button style={{ margin: '0 8px' }} onClick={() => prev()} disabled={loading || submitting}>
                  Previous
                </Button>
              )}
              <Button type='primary' onClick={() => next()} disabled={loading || submitting}>
                {current === steps.length - 1 ? 'Submit' : 'Next'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  )
}

export default AppointmentBookingForm
