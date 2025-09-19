// TimeSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Form } from 'antd';
import { CheckList, Popup } from 'antd-mobile';
import { ClockCircleOutline, CloseCircleFill } from 'antd-mobile-icons';
import type { CheckListValue } from 'antd-mobile/es/components/check-list';
import type { AvailableTime } from '@/components/booking/types/index'; // <-- use your shared type

interface TimeSelectorMobileProps {
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  availableTimes: AvailableTime[]; // includes business_datetime_start, time, disabled, injected?
  allowClear?: boolean;
  style?: React.CSSProperties;
}

interface TimeInputProps {
  value?: string; // business_datetime_start
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  availableTimes: AvailableTime[];
  allowClear?: boolean;
  style?: React.CSSProperties;
}

const TimeInput = forwardRef<any, TimeInputProps>(
  ({ value, onChange, placeholder, availableTimes, allowClear, style }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [tempValue, setTempValue] = useState<CheckListValue[]>([]);

    const enabledTimes = useMemo(
      () => availableTimes.filter(t => !t.disabled),
      [availableTimes]
    );

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

    const handleOpen = () => {
      setTempValue(value ? [value] : []);
      setVisible(true);
      setIsFocused(true);
    };

    const handleConfirm = () => {
      const selectedValue = tempValue[0];
      onChange?.(selectedValue ? String(selectedValue) : undefined);
      setVisible(false);
      setIsFocused(false);
    };

    const handleCancel = () => {
      setVisible(false);
      setIsFocused(false);
      setTempValue(value ? [value] : []);
    };

    const getLabel = (slot: AvailableTime) =>
      slot.injected ? `${slot.time} (original)` : slot.time;

    const displayText = useMemo(() => {
      if (!value) return null;
      const slot = availableTimes.find(s => s.business_datetime_start === value);
      return slot ? getLabel(slot) : placeholder ?? null;
    }, [value, availableTimes, placeholder]);

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
            {displayText || placeholder}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {allowClear && value && isHovered ? (
              <CloseCircleFill
                style={{ color: 'rgba(0, 0, 0, 0.25)', fontSize: 14 }}
                onClick={handleClear}
              />
            ) : null}
            <ClockCircleOutline style={{ color: 'rgba(0, 0, 0, 0.25)', fontSize: 14 }} />
          </div>
        </div>

        <Popup
          visible={visible}
          onMaskClick={handleCancel}
          position="bottom"
          bodyStyle={{
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            minHeight: '40vh',
            maxHeight: '70vh',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={handleCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  fontSize: '14px',
                  padding: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>Select Time</div>
              <button
                onClick={handleConfirm}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1677ff',
                  fontSize: '14px',
                  padding: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                OK
              </button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)' }}>
            {enabledTimes.length > 0 ? (
              <CheckList
                value={tempValue}
                onChange={(val: CheckListValue[]) => {
                  setTempValue(val.length > 0 ? [val[val.length - 1]] : []);
                }}
                style={{ '--border-top': 'none', '--border-bottom': 'none' } as any}
              >
                {enabledTimes.map((slot) => (
                  <CheckList.Item
                    key={slot.business_datetime_start}
                    value={slot.business_datetime_start} // store ISO in the form
                  >
                    {getLabel(slot)} {/* show localized label */}
                  </CheckList.Item>
                ))}
              </CheckList>
            ) : (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                No time slots available
              </div>
            )}
          </div>
        </Popup>
      </>
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
          ? [{ required: true, message: requiredMessage }]
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
          allowClear={allowClear}
          style={style}
        />
      </>
    </Form.Item>
  );
};

export default TimeSelectorMobile;