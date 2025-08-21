import React, { useEffect } from 'react'
import { Form, Input, Row, Col } from 'antd'
import type { FormValues } from '@/components/booking/types'

interface Customer {
  id: string
  FullName: string
  Email: string
  Phone?: string
  Notes?: string
  isRegistered?: boolean
}

interface PersonalInfoStepProps {
  formRef: React.RefObject<any>
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>
  customerValues: Customer
  setCustomerValues: React.Dispatch<React.SetStateAction<Customer>>
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formRef, setFormValues, customerValues, setCustomerValues }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    formRef.current = form;
  }, [form, formRef])

  const initialFormValues = {
    fullName: customerValues.FullName,
    email: customerValues.Email,
    phoneNumber: customerValues.Phone,
    additionalNotes: customerValues.Notes
  }

  const onValuesChange = (changedValues: any) => {
    // Fetch the updated form values after resetting the time field
    const allValues = form.getFieldsValue()

    updateCustomerValues(allValues)
    updateFormValues(allValues)
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
    <Form form={form} layout='vertical' initialValues={initialFormValues} onValuesChange={onValuesChange}>
      <Form.Item label='Full Name' name='fullName' rules={[{ required: true, message: 'Please enter your full name!' }]}>
        <Input name='fullName' placeholder='Enter your full name' allowClear />
      </Form.Item>
      {/*<Row gutter={16}>
        <Col span={12}>
          <Form.Item label='First Name' name='firstName' rules={[{ required: true, message: 'Please enter your first name!' }]}>
            <Input name='firstName' placeholder='Enter your first name' allowClear />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label='Last Name' name='lastName' rules={[{ required: true, message: 'Please enter your last name!' }]}>
            <Input name='lastName' placeholder='Enter your last name' allowClear />
          </Form.Item>
        </Col>
      </Row>*/}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Email'
            name='email'
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input name='email' placeholder='Enter your email' allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label='Phone Number' name='phoneNumber'>
            <Input name='phoneNumber' placeholder='Enter your phone number' allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label='Additional Notes' name='additionalNotes'>
        <Input.TextArea name='additionalNotes' placeholder='Any additional notes' rows={4} maxLength={400} allowClear />
      </Form.Item>
    </Form>
  )
}

export default PersonalInfoStep
