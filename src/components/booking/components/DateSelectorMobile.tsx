// DateSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { DatePicker as MobileDatePicker } from 'antd-mobile';
import { CalendarOutlined, CloseCircleFilled } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface DateSelectorMobileProps {
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

interface DateInputProps {
  value?: Dayjs;
  onChange?: (value: Dayjs | undefined) => void;
  placeholder?: string;
  disabledDate?: (currentDate: Dayjs) => boolean;
  allowClear?: boolean;
  format?: string;
  style?: React.CSSProperties;
}

// DateSelector.tsx or DateSelectorMobile.tsx
const DateInput = forwardRef<any, DateInputProps>(
  ({ value, onChange, placeholder, disabledDate, allowClear, format = 'MMM DD, YYYY', style }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => {
        setVisible(true);
        setIsFocused(true);
      },
      blur: () => {
        setVisible(false);
        setIsFocused(false);
      },
    }));

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
    };

    // Convert disabledDate function for antd-mobile DatePicker
    const mobileFilter = disabledDate
      ? {
        day: (_val: number, extend: { date: Date }) => {
          const dayjsDate = dayjs(extend.date);
          return !disabledDate(dayjsDate); // Note: antd-mobile filter returns true for enabled dates
        }
      }
      : undefined;

    return (
      <>
        <div
          style={{
            border: `1px solid ${isFocused ? '#40a9ff' : '#d9d9d9'}`,
            borderRadius: '4px',
            padding: '4px 11px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            cursor: 'pointer',
            minHeight: '32px',
            fontSize: '14px',
            position: 'relative',
            transition: 'border-color 0.3s',
            boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
            ...style,
          }}
          onClick={() => {
            setVisible(true);
            setIsFocused(true);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            style={{
              color: value ? '#000' : 'rgba(0, 0, 0, 0.25)',
              flex: 1,
            }}
          >
            {value ? value.format(format) : placeholder}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {allowClear && value && isHovered ? (
              <CloseCircleFilled
                style={{
                  color: 'rgba(0, 0, 0, 0.25)',
                  fontSize: 14,
                }}
                onClick={handleClear}
              />
            ) : null}
            <CalendarOutlined
              style={{
                color: 'rgba(0, 0, 0, 0.25)',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <MobileDatePicker
          visible={visible}
          onClose={() => {
            setVisible(false);
            setIsFocused(false);
          }}
          value={value ? value.toDate() : undefined}
          onConfirm={(date) => {
            onChange?.(date ? dayjs(date) : undefined);
            setVisible(false);
            setIsFocused(false);
          }}
          filter={mobileFilter}
          min={dayjs().toDate()} // Today as minimum date
          max={dayjs().add(1, 'year').toDate()} // One year from now as max
          precision="day"
          title="Select Date"
          confirmText="Confirm"
          cancelText="Cancel"
        />
      </>
    );
  }
);

DateInput.displayName = 'DateInput';

const DateSelectorMobile: React.FC<DateSelectorMobileProps> = ({
  name = 'date',
  label = 'Date',
  placeholder = 'Select a date',
  required = true,
  requiredMessage = 'Please select a date',
  disabledDate,
  allowClear = true,
  format,
  style,
}) => {
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
      <DateInput
        placeholder={placeholder}
        disabledDate={disabledDate}
        allowClear={allowClear}
        format={format}
        style={style}
      />
    </Form.Item>
  );
};

export default DateSelectorMobile;