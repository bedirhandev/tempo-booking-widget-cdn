// TimeSelectorMobile.tsx (Using native Picker - no scrollbar)
import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Form } from 'antd';
import { Picker } from 'antd-mobile';
import { ClockCircleOutlined, CloseCircleFilled } from '@ant-design/icons';
import type { PickerColumn } from 'antd-mobile/es/components/picker';
import dayjs from 'dayjs';

interface AvailableTime {
  time: string;
  disabled: boolean;
  injected?: boolean;
}

interface TimeSelectorMobileProps {
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  availableTimes: AvailableTime[];
  serviceDuration?: number;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

interface TimeInputProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  availableTimes: AvailableTime[];
  serviceDuration?: number;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

const TimeInput = forwardRef<any, TimeInputProps>(
  ({ 
    value, 
    onChange, 
    placeholder, 
    availableTimes,
    serviceDuration = 0,
    allowClear,
    style 
  }, ref) => {
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

    // Transform available times into picker columns
    const columns: PickerColumn[] = useMemo(() => {
      const enabledTimes = availableTimes.filter(t => !t.disabled);
      
      if (enabledTimes.length === 0) {
        return [[]]; // Empty column if no times available
      }

      return [
        enabledTimes.map(({ time, injected }) => {
          const startTimeMoment = dayjs(time, 'HH:mm');
          const endTimeMoment = startTimeMoment.add(serviceDuration, 'minute');
          const timeDisplay = serviceDuration > 0 
            ? `${time} - ${endTimeMoment.format('HH:mm')}`
            : time;

          return {
            label: injected 
              ? `${timeDisplay} (original)` 
              : timeDisplay,
            value: time,
          };
        })
      ];
    }, [availableTimes, serviceDuration]);

    // Get display text for selected value
    const displayText = useMemo(() => {
      if (!value) return null;
      
      const selectedTime = availableTimes.find(t => t.time === value);
      if (!selectedTime) return value;

      const startTimeMoment = dayjs(value, 'HH:mm');
      const endTimeMoment = startTimeMoment.add(serviceDuration, 'minute');
      const timeDisplay = serviceDuration > 0 
        ? `${value} - ${endTimeMoment.format('HH:mm')}`
        : value;

      return selectedTime.injected 
        ? `${timeDisplay} (original)` 
        : timeDisplay;
    }, [value, availableTimes, serviceDuration]);

    return (
      <Picker
        columns={columns}
        visible={visible}
        value={value ? [value] : []}
        onClose={() => {
          setVisible(false);
          setIsFocused(false);
        }}
        onConfirm={(pickerValue) => {
          onChange?.(pickerValue[0] as string);
          setVisible(false);
          setIsFocused(false);
        }}
        title="Select Time"
        confirmText="OK"
        cancelText="Cancel"
      >
        {() => (
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
              {displayText || placeholder}
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
              <ClockCircleOutlined
                style={{
                  color: 'rgba(0, 0, 0, 0.25)',
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        )}
      </Picker>
    );
  }
);

TimeInput.displayName = 'TimeInput';

const TimeSelectorMobile: React.FC<TimeSelectorMobileProps> = ({
  name = 'time',
  label = 'Time',
  placeholder = 'Select a time',
  required = true,
  requiredMessage = 'Please select a time',
  availableTimes,
  serviceDuration = 0,
  allowClear = true,
  style,
}) => {
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
        <TimeInput
          placeholder={placeholder}
          availableTimes={availableTimes}
          serviceDuration={serviceDuration}
          allowClear={allowClear}
          style={style}
        />
      </>
    </Form.Item>
  );
};

export default TimeSelectorMobile;