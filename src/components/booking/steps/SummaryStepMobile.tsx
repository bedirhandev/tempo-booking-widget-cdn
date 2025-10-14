// SummaryStepMobile.tsx
import React from 'react'
import { List } from 'antd-mobile'
import type { FormValues, Service } from '@/components/booking/types/index'

interface SummaryStepMobileProps {
    formValues: FormValues
    service?: Service
}

const SummaryStepMobile: React.FC<SummaryStepMobileProps> = ({ formValues, service }) => {
    const priceDisplay = service?.formattedPrice ?? ''

    return (
        <div>
            <List mode='card'>
                <List.Item
                    title='Service'
                    description={formValues.service}
                />
                <List.Item
                    title='Price'
                    description={priceDisplay}
                />
                <List.Item
                    title='Date'
                    description={formValues.date}
                />
                <List.Item
                    title='Time'
                    description={formValues.time}
                />
                <List.Item
                    title='Employee'
                    description={formValues.employee || 'Any available'}
                />
                <List.Item
                    title='Full Name'
                    description={formValues.fullName}
                />
                <List.Item
                    title='Email'
                    description={
                        <span style={{ wordBreak: 'break-all' }}>
                            {formValues.email}
                        </span>
                    }
                />
                {formValues.phoneNumber && (
                    <List.Item
                        title='Phone Number'
                        description={formValues.phoneNumber}
                    />
                )}
                {formValues.additionalNotes && (
                    <List.Item
                        title='Additional Notes'
                        description={
                            <span style={{ whiteSpace: 'pre-wrap' }}>
                                {formValues.additionalNotes}
                            </span>
                        }
                    />
                )}
            </List>
        </div>
    )
}

export default SummaryStepMobile