// DateSelector.tsx
import React from 'react';
import { Form, DatePicker } from 'antd';
import { useIsMobile } from '../hooks/useIsMobile';
import DateSelectorMobile from './DateSelectorMobile'; // Your existing mobile version
import { Dayjs } from 'dayjs';

interface DateSelectorProps {
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    requiredMessage?: string;
    disabledDate?: (currentDate: Dayjs) => boolean;
    allowClear?: boolean;
    format?: string;
    style?: React.CSSProperties;
}

const DateSelector: React.FC<DateSelectorProps> = (props) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <DateSelectorMobile {...props} />;
    }

    // Desktop version using antd DatePicker
    const {
        name = 'date',
        label = 'Date',
        placeholder = 'Select a date',
        required = true,
        requiredMessage = 'Please select a date',
        disabledDate,
        allowClear = true,
        format = 'MMM DD, YYYY',
        style,
    } = props;

    return (
        <Form.Item
            name={name}
            label={label}
            required={required}
            rules={
                required
                    ? [
                        {
                            required: true,
                            message: requiredMessage,
                        },
                    ]
                    : undefined
            }
        >
            <DatePicker
                placeholder={placeholder}
                disabledDate={disabledDate}
                allowClear={allowClear}
                format={format}
                style={{ width: '100%', ...style }}
            />
        </Form.Item>
    );
};

export default DateSelector;