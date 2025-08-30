// PersonalInfoStepMobile.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react'
import { Input, TextArea } from 'antd-mobile'
import { CloseCircleFilled } from '@ant-design/icons'
import type { FormValues } from '@/components/booking/types'

interface Customer {
  id: string
  FullName: string
  Email: string
  Phone?: string
  Notes?: string
  isRegistered?: boolean
}

interface PersonalInfoStepMobileProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  customerValues: Customer
  setCustomerValues: React.Dispatch<React.SetStateAction<Customer>>
  form?: any // Make optional
  initialFormValues?: any // Make optional
  onValuesChange?: () => void // Make optional
}

const PersonalInfoStepMobile: React.FC<PersonalInfoStepMobileProps> = ({
  formRef,
  setFormValues,
  customerValues,
  setCustomerValues
}) => {
  // Don't use antd Form, manage state directly
  const [values, setValues] = useState({
    fullName: customerValues.FullName,
    email: customerValues.Email,
    phoneNumber: customerValues.Phone,
    additionalNotes: customerValues.Notes
  })

  const [errors, setErrors] = useState<any>({})

  // Create a ref that mimics antd Form's API
  useImperativeHandle(formRef, () => ({
    validateFields: async () => {
      const newErrors: any = {}

      if (!values.fullName) {
        newErrors.fullName = 'Please enter your full name!'
      }

      if (!values.email) {
        newErrors.email = 'Please enter your email!'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        newErrors.email = 'Please enter a valid email!'
      }

      setErrors(newErrors)

      if (Object.keys(newErrors).length > 0) {
        throw newErrors
      }

      return values
    },
    getFieldsValue: () => values,
    setFieldsValue: (newValues: any) => {
      setValues(prev => ({ ...prev, ...newValues }))
    }
  }))

  const handleChange = (field: string, value: string) => {
    const newValues = { ...values, [field]: value }
    setValues(newValues)

    // Clear error for this field
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))

    // Update parent state
    updateFormValues(newValues)
    updateCustomerValues(newValues)
  }

  const updateFormValues = (allValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      fullName: allValues.fullName,
      email: allValues.email,
      phoneNumber: allValues.phoneNumber,
      additionalNotes: allValues.additionalNotes
    }))
  }

  const updateCustomerValues = (allValues: any) => {
    setCustomerValues((prevValues) => ({
      ...prevValues,
      FullName: allValues.fullName,
      Email: allValues.email,
      Phone: allValues.phoneNumber,
      Notes: allValues.additionalNotes
    }))
  }

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          Full Name <span style={{ color: 'red' }}>*</span>
        </label>
        <Input
          value={values.fullName}
          onChange={(val) => handleChange('fullName', val)}
          placeholder='Enter your full name'
          clearable
        />
        {errors.fullName && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
            {errors.fullName}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          Email <span style={{ color: 'red' }}>*</span>
        </label>
        <Input
          value={values.email}
          onChange={(val) => handleChange('email', val)}
          placeholder='Enter your email'
          type='email'
          clearable
        />
        {errors.email && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
            {errors.email}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          Phone Number
        </label>
        <Input
          value={values.phoneNumber}
          onChange={(val) => handleChange('phoneNumber', val)}
          placeholder='Enter your phone number'
          type='tel'
          clearable
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          Additional Notes
        </label>
        <TextArea
          value={values.additionalNotes}
          onChange={(val) => handleChange('additionalNotes', val)}
          placeholder='Any additional notes'
          rows={4}
          maxLength={400}
          showCount
        />
      </div>
    </div>
  )
}

export default PersonalInfoStepMobile