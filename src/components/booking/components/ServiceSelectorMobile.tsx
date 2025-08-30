// ServiceSelectorMobile.tsx (Updated with focus state)
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { Picker } from 'antd-mobile';
import { DownOutlined, CloseCircleFilled } from '@ant-design/icons';
import type { PickerColumn } from 'antd-mobile/es/components/picker';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface ServiceSelectorMobileProps {
  name?: string;
  label?: string;
  placeholder?: string;
  services: Service[];
  required?: boolean;
  requiredMessage?: string;
  formatPrice?: (price: number, currency?: string) => string;
  allowClear?: boolean;
}

interface ServiceInputProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  services: Service[];
  placeholder?: string;
  formatPrice: (price: number, currency?: string) => string;
  allowClear?: boolean;
}

const ServiceInput = forwardRef<any, ServiceInputProps>(
  ({ value, onChange, services, placeholder, formatPrice, allowClear }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const selectedService = value ? services.find((s) => s.id === value) : null;

    const columns: PickerColumn[] = [
      services.map((service) => ({
        label: `${service.name} (${formatPrice(service.price)})`,
        value: service.id,
      })),
    ];

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
                color: selectedService ? '#000' : 'rgba(0, 0, 0, 0.25)',
                flex: 1,
              }}
            >
              {selectedService
                ? `${selectedService.name} (${formatPrice(selectedService.price)})`
                : placeholder}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {allowClear && selectedService && isHovered ? (
                <CloseCircleFilled
                  style={{
                    color: 'rgba(0, 0, 0, 0.25)',
                    fontSize: 14,
                  }}
                  onClick={handleClear}
                />
              ) : null}
              <DownOutlined
                style={{
                  color: 'rgba(0, 0, 0, 0.25)',
                  fontSize: 12,
                }}
              />
            </div>
          </div>
        )}
      </Picker>
    );
  }
);

ServiceInput.displayName = 'ServiceInput';

const ServiceSelectorMobile: React.FC<ServiceSelectorMobileProps> = ({
  name = 'service',
  label = 'Service',
  placeholder = 'Select a service',
  services,
  required = true,
  requiredMessage = 'Please select a service',
  formatPrice = (price) => `$${price.toFixed(2)}`,
  allowClear = true,
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
      <ServiceInput
        services={services}
        placeholder={placeholder}
        formatPrice={formatPrice}
        allowClear={allowClear}
      />
    </Form.Item>
  );
};

export default ServiceSelectorMobile;