import React from 'react';
import { Form, Select } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useIsMobile } from '../hooks/useIsMobile';
import TimeSelectorMobile from './TimeSelectorMobile';
import type { AvailableTime } from '@/components/booking/types/index';

interface TimeSelectorProps {
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    requiredMessage?: string;
    availableTimes: AvailableTime[];
    allowClear?: boolean;
    style?: React.CSSProperties;
}

const TimeSelector: React.FC<TimeSelectorProps> = (props) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <TimeSelectorMobile {...props} />;
    }

    // Desktop version using antd Select
    const {
        name = 'time',
        label = 'Time',
        placeholder = 'Select a time',
        required = true,
        requiredMessage = 'Please select a time',
        availableTimes,
        allowClear = true,
        style,
    } = props;

    const hasInjectedTime = availableTimes.some(t => t.injected);

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
            <>
                {hasInjectedTime && (
                    <div style={{ color: '#d46b08', marginBottom: 8 }}>
                        <span role="img" aria-label="warning" style={{ marginRight: 4 }}>
                            ⚠️
                        </span>
                        This booking was created with a time that does not match the current slot settings.
                        You can keep this time or select a new valid slot.
                    </div>
                )}
                <Select
                    placeholder={placeholder}
                    allowClear={allowClear}
                    style={style}
                    suffixIcon={<ClockCircleOutlined />}
                    options={availableTimes.map(({ time, disabled, injected, business_datetime_start }) => ({
                        value: business_datetime_start,      // ✅ store the ISO
                        label: injected ? `${time} (original)` : time,  // ✅ show local time
                        disabled,
                    }))}
                />
            </>
        </Form.Item>
    );
};

export default TimeSelector;