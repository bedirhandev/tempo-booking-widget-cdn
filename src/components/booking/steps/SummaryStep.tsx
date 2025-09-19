import React from 'react'
import { Descriptions, Grid } from 'antd'
import type { FormValues } from '@/components/booking/types'

const { useBreakpoint } = Grid

interface SummaryStepProps {
  formValues: FormValues
}

const SummaryStep: React.FC<SummaryStepProps> = ({ formValues }) => {
  const screens = useBreakpoint()

  return (
    <Descriptions
      bordered
      column={1}
      size={screens.xs ? 'small' : 'middle'}
      layout={screens.xs ? 'vertical' : 'horizontal'}
      labelStyle={{
        textAlign: screens.xs ? 'center' : 'right'
      }}
      contentStyle={{
        textAlign: screens.xs ? 'center' : 'left'
      }}
    >
      <Descriptions.Item label='Service'>{formValues.service}</Descriptions.Item>
      <Descriptions.Item label='Price'>{formValues.price}</Descriptions.Item>
      <Descriptions.Item label='Date'>{formValues.date}</Descriptions.Item>
      <Descriptions.Item label='Time'>{formValues.time}</Descriptions.Item>
      <Descriptions.Item label='Employee'>{formValues.employee || 'Any available'}</Descriptions.Item>
      <Descriptions.Item label='Full Name'>{formValues.fullName}</Descriptions.Item>
      <Descriptions.Item label='Email'>
        <span style={{ wordBreak: 'break-all' }}>{formValues.email}</span>
      </Descriptions.Item>
      {formValues.phoneNumber && (
        <Descriptions.Item label='Phone Number'>{formValues.phoneNumber}</Descriptions.Item>
      )}
      {formValues.additionalNotes && (
        <Descriptions.Item label='Additional Notes'>
          <span style={{ whiteSpace: 'pre-wrap' }}>{formValues.additionalNotes}</span>
        </Descriptions.Item>
      )}
    </Descriptions>
  )
}

export default SummaryStep