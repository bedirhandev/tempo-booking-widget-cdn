import React from 'react'
import { Descriptions } from 'antd'
import type { FormValues } from '@/components/booking/types'

interface SummaryStepProps {
  formValues: FormValues
}

const SummaryStep: React.FC<SummaryStepProps> = ({ formValues }) => {
  return (
    <Descriptions bordered column={1} title='Appointment Summary'>
      <Descriptions.Item label='Service'>{formValues.service}</Descriptions.Item>
      <Descriptions.Item label='Price'>{formValues.price}</Descriptions.Item>
      <Descriptions.Item label='Date'>{formValues.date}</Descriptions.Item>
      <Descriptions.Item label='Time'>{formValues.time}</Descriptions.Item>
      <Descriptions.Item label='Employee'>{formValues.employee || 'Any available'}</Descriptions.Item>
      <Descriptions.Item label='Full Name'>{formValues.fullName}</Descriptions.Item>
      {/*<Descriptions.Item label='First Name'>{formValues.firstName}</Descriptions.Item>
      <Descriptions.Item label='Last Name'>{formValues.lastName}</Descriptions.Item>*/}
      <Descriptions.Item label='Email'>{formValues.email}</Descriptions.Item>
      {formValues.phoneNumber && <Descriptions.Item label='Phone Number'>{formValues.phoneNumber}</Descriptions.Item>}
      {formValues.additionalNotes && <Descriptions.Item label='Additional Notes'>{formValues.additionalNotes}</Descriptions.Item>}
    </Descriptions>
  )
}

export default SummaryStep
