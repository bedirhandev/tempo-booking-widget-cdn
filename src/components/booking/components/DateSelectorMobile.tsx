// DateSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { CalendarPicker } from 'antd-mobile';
import { CalendarOutline, CloseCircleFill } from 'antd-mobile-icons';
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

const DateInput = forwardRef<any, DateInputProps>(
  ({ value, onChange, placeholder, disabledDate, allowClear, format = 'MMM DD, YYYY', style }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    // Add local state to track the calendar selection
    const [tempValue, setTempValue] = useState<Date | null>(null);

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
      setTempValue(null);
    };

    // Convert disabledDate function for antd-mobile CalendarPicker
    const shouldDisableDate = (date: Date) => {
      if (!disabledDate) return false;
      return disabledDate(dayjs(date));
    };

    // When opening the calendar, set the temp value to the current value
    const handleOpen = () => {
      setTempValue(value ? value.toDate() : null);
      setVisible(true);
      setIsFocused(true);
    };

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
          onClick={handleOpen}
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
              <CloseCircleFill
                style={{
                  color: 'rgba(0, 0, 0, 0.25)',
                  fontSize: 14,
                }}
                onClick={handleClear}
              />
            ) : null}
            <CalendarOutline
              style={{
                color: 'rgba(0, 0, 0, 0.25)',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <CalendarPicker
          visible={visible}
          selectionMode="single"
          value={tempValue}
          onChange={(val) => {
            // Update temp value as user selects dates
            setTempValue(val as Date | null);
          }}
          onConfirm={(date) => {
            // For single selection mode, date will be a Date or null
            onChange?.(date ? dayjs(date as Date) : undefined);
            setTempValue(date as Date | null);
            setVisible(false);
            setIsFocused(false);
          }}
          onClose={() => {
            setVisible(false);
            setIsFocused(false);
            // Reset temp value when closing without confirming
            setTempValue(value ? value.toDate() : null);
          }}
          shouldDisableDate={disabledDate ? shouldDisableDate : undefined}
          min={dayjs().toDate()} // Today as minimum date
          max={dayjs().add(1, 'year').toDate()} // One year from now as max
          title="Select Date"
          confirmText="Confirm"
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