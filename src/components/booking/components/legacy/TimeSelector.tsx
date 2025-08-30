// TimeSelector.tsx (Enhanced Version with visual disabled times)
import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Form } from 'antd';
import { Selector } from 'antd-mobile';
import { ClockCircleOutlined, CloseCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';

interface AvailableTime {
  time: string;
  disabled: boolean;
  injected?: boolean;
}

interface TimeSelectorProps {
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  availableTimes: AvailableTime[];
  serviceDuration?: number;
  allowClear?: boolean;
  style?: React.CSSProperties;
  showDisabled?: boolean; // Show disabled times in the list
}

interface TimeInputProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  availableTimes: AvailableTime[];
  serviceDuration?: number;
  allowClear?: boolean;
  style?: React.CSSProperties;
  showDisabled?: boolean;
}

const TimeInput = forwardRef<any, TimeInputProps>(
  ({ 
    value, 
    onChange, 
    placeholder, 
    availableTimes,
    serviceDuration = 0,
    allowClear,
    style,
    showDisabled = false
  }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => setVisible(true),
      blur: () => setVisible(false),
    }));

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
    };

    // Create time slot options
    const timeOptions = useMemo(() => {
      const times = showDisabled ? availableTimes : availableTimes.filter(t => !t.disabled);
      
      return times.map(({ time, disabled, injected }) => {
        const startTimeMoment = dayjs(time, 'HH:mm');
        const endTimeMoment = startTimeMoment.add(serviceDuration, 'minute');
        const timeDisplay = serviceDuration > 0 
          ? `${time} - ${endTimeMoment.format('HH:mm')}`
          : time;

        return {
          label: (
            <div style={{ 
              opacity: disabled ? 0.4 : 1,
              color: injected ? '#d46b08' : undefined,
              fontWeight: injected ? 600 : undefined,
            }}>
              {timeDisplay}
              {injected && <span style={{ fontSize: 12, marginLeft: 4 }}>(original)</span>}
            </div>
          ),
          value: time,
          disabled: disabled,
        };
      });
    }, [availableTimes, serviceDuration, showDisabled]);

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

        {/* Mobile-style selector popup */}
        {visible && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            }}
            onClick={() => {
              setVisible(false);
              setIsFocused(false);
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '12px 12px 0 0',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                fontWeight: 500,
                fontSize: 16,
              }}>
                Select Time
              </div>
              <div style={{ padding: '16px' }}>
                <Selector
                  options={timeOptions}
                  value={value ? [value] : []}
                  onChange={(values) => {
                    onChange?.(values[0] as string);
                    setVisible(false);
                    setIsFocused(false);
                  }}
                  multiple={false}
                  columns={3}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

TimeInput.displayName = 'TimeInput';

const TimeSelector: React.FC<TimeSelectorProps> = ({
  name = 'time',
  label = 'Time',
  placeholder = 'Select a time',
  required = true,
  requiredMessage = 'Please select a time',
  availableTimes,
  serviceDuration = 0,
  allowClear = true,
  style,
  showDisabled = false,
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
          showDisabled={showDisabled}
        />
      </>
    </Form.Item>
  );
};

export default TimeSelector;