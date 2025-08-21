import React, { useEffect } from 'react'
import { Form, DatePicker, TimePicker } from 'antd'
import dayjs from 'dayjs'
import type { FormValues } from '@/components/booking/types'

interface DateTimeStepProps {
  formRef: React.RefObject<any>
  formValues: FormValues
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
}

const DateTimeStep: React.FC<DateTimeStepProps> = ({ formRef, formValues, setFormValues }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    //  formRef.current = form;
  }, [form, formRef])

  const disabledDate = (current: any) => {
    return current && current < dayjs().startOf('day')
  }

  const handleDateChange = (date: any) => {
    setFormValues({
      ...formValues,
      date: date ? date.format('YYYY-MM-DD') : undefined
    })
  }

  const handleTimeChange = (time: any) => {
    setFormValues({
      ...formValues,
      time: time ? time.format('HH:mm') : undefined
    })
  }

  return (
    <Form form={form} layout='vertical'>
      <Form.Item
        label='Select Date'
        name='date'
        rules={[{ required: true, message: 'Please select a date!' }]}
        initialValue={formValues.date ? dayjs(formValues.date, 'YYYY-MM-DD') : null}
      >
        <DatePicker disabledDate={disabledDate} onChange={handleDateChange} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label='Select Time'
        name='time'
        rules={[{ required: true, message: 'Please select a time!' }]}
        initialValue={formValues.time ? dayjs(formValues.time, 'HH:mm') : null}
      >
        <TimePicker onChange={handleTimeChange} format='HH:mm' style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  )
}

export default DateTimeStep
