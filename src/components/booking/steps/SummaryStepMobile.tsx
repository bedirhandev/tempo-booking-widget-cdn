// SummaryStepMobile.tsx
import React from 'react'
import { List } from 'antd-mobile'
import type { FormValues } from '@/components/booking/types'
import { useFinancialSettings } from '@/components/booking/financial/FinancialSettingsProvider'

interface SummaryStepMobileProps {
    formValues: FormValues
}

const SummaryStepMobile: React.FC<SummaryStepMobileProps> = ({ formValues }) => {
    const { currencySymbol } = useFinancialSettings()
    const priceDisplay = React.useMemo(() => {
        const v: any = formValues.price
        if (v == null || v === '') return undefined
        const num = typeof v === 'number' ? v : parseFloat(String(v))
        if (!isNaN(num)) return `${currencySymbol}${num.toFixed(2)}`
        return `${currencySymbol}${v}`
    }, [formValues.price, currencySymbol])

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