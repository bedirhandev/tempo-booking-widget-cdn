// PersonalInfoStepMobile.tsx
import React, { useImperativeHandle, useState } from 'react'
import { Input, TextArea } from 'antd-mobile'
import type { FormValues } from '../types'

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
  form?: any
  initialFormValues?: any
  onValuesChange?: () => void
}

const PersonalInfoStepMobile: React.FC<PersonalInfoStepMobileProps> = ({
  formRef,
  setFormValues,
  customerValues,
  setCustomerValues
}) => {
  const [values, setValues] = useState({
    fullName: customerValues.FullName,
    email: customerValues.Email,
    phoneNumber: customerValues.Phone,
    additionalNotes: customerValues.Notes
  })

  const [errors, setErrors] = useState<any>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useImperativeHandle(formRef, () => ({
    validateFields: async () => {
      const newErrors: any = {}

      if (!values.fullName) {
        newErrors.fullName = 'Please enter your full name.'
      }

      if (!values.email) {
        newErrors.email = 'Please enter your email.'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        newErrors.email = 'Please enter a valid email.'
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
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))
    updateFormValues(newValues)
    updateCustomerValues(newValues)
  }

  const updateFormValues = (allValues: any) => {
    setFormValues((prevValues: any) => ({
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

  // Custom styled input wrapper - matching other fields exactly
  const inputWrapperStyle = (fieldName: string, hasError: boolean = false) => ({
    border: `1px solid ${hasError ? '#ff4d4f' :
      focusedField === fieldName ? '#40a9ff' : '#d9d9d9'
      }`,
    borderRadius: '4px',
    backgroundColor: '#fff',
    transition: 'border-color 0.3s',
    boxShadow: focusedField === fieldName ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '0 11px', // Horizontal padding only
    minHeight: '32px',
  })

  const textAreaWrapperStyle = (fieldName: string) => ({
    border: `1px solid ${focusedField === fieldName ? '#40a9ff' : '#d9d9d9'}`,
    borderRadius: '4px',
    backgroundColor: '#fff',
    transition: 'border-color 0.3s',
    boxShadow: focusedField === fieldName ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
    padding: '8px 11px', // Keep padding for textarea
  })

  // Label style matching other fields
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: '#000',
  }

  return (
    <div>
      {/* Full Name Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Full Name</span>
        </div>
        <div style={inputWrapperStyle('fullName', !!errors.fullName)}>
          <Input
            value={values.fullName}
            onChange={(val) => handleChange('fullName', val)}
            placeholder='Enter your full name'
            onFocus={() => setFocusedField('fullName')}
            onBlur={() => setFocusedField(null)}
            clearable
            style={{
              '--font-size': '14px',
              '--color': '#000',
              '--placeholder-color': 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              width: '100%',
              padding: 0,
              margin: 0,
              lineHeight: '32px',
            } as any}
          />
        </div>
        {errors.fullName && (
          <div style={{
            color: '#ff4d4f',
            fontSize: 12,
            marginTop: 4,
            textAlign: 'left'  // Add this line
          }}>
            {errors.fullName}
          </div>
        )}
      </div>

      {/* Email Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Email</span>
        </div>
        <div style={inputWrapperStyle('email', !!errors.email)}>
          <Input
            value={values.email}
            onChange={(val) => handleChange('email', val)}
            placeholder='Enter your email'
            type='email'
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            clearable
            style={{
              '--font-size': '14px',
              '--color': '#000',
              '--placeholder-color': 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              width: '100%',
              padding: 0,
              margin: 0,
              lineHeight: '32px',
            } as any}
          />
        </div>
        {errors.email && (
          <div style={{
            color: '#ff4d4f',
            fontSize: 12,
            marginTop: 4,
            textAlign: 'left'  // Add this line
          }}>
            {errors.email}
          </div>
        )}
      </div>

      {/* Phone Number Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span>Phone Number</span>
        </div>
        <div style={inputWrapperStyle('phoneNumber')}>
          <Input
            value={values.phoneNumber}
            onChange={(val) => handleChange('phoneNumber', val)}
            placeholder='Enter your phone number'
            type='tel'
            onFocus={() => setFocusedField('phoneNumber')}
            onBlur={() => setFocusedField(null)}
            clearable
            style={{
              '--font-size': '14px',
              '--color': '#000',
              '--placeholder-color': 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              width: '100%',
              padding: 0,
              margin: 0,
              lineHeight: '32px',
            } as any}
          />
        </div>
      </div>

      {/* Additional Notes Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span>Additional Notes</span>
        </div>
        <div style={textAreaWrapperStyle('additionalNotes')}>
          <TextArea
            value={values.additionalNotes}
            onChange={(val) => handleChange('additionalNotes', val)}
            placeholder='Any additional notes'
            onFocus={() => setFocusedField('additionalNotes')}
            onBlur={() => setFocusedField(null)}
            rows={4}
            maxLength={400}
            showCount
            style={{
              '--font-size': '14px',
              '--color': '#000',
              '--placeholder-color': 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              padding: 0,
              margin: 0,
            } as any}
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoStepMobile