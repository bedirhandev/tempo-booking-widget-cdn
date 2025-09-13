// ServiceSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { CheckList, Popup } from 'antd-mobile';
import { DownOutline, CloseCircleFill } from 'antd-mobile-icons';
import type { CheckListValue } from 'antd-mobile/es/components/check-list';

interface Service {
  id: number;
  name: string;
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
    const [tempValue, setTempValue] = useState<CheckListValue[]>([]);

    const selectedService = value ? services.find((s) => s.id === Number(value)) : null;

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
          }}
          onClick={handleOpen}
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
              <CloseCircleFill
                style={{
                  color: 'rgba(0, 0, 0, 0.25)',
                  fontSize: 14,
                }}
                onClick={handleClear}
              />
            ) : null}
            <DownOutline
              style={{
                color: 'rgba(0, 0, 0, 0.25)',
                fontSize: 12,
              }}
            />
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
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                Select Service
              </div>
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
            {services.length > 0 ? (
              <CheckList
                value={tempValue}
                onChange={(val: CheckListValue[]) => {
                  // For single selection, replace the array with the new selection
                  setTempValue(val.length > 0 ? [val[val.length - 1]] : []);
                }}
                style={{ '--border-top': 'none', '--border-bottom': 'none' } as any}
              >
                {services.map((service) => (
                  <CheckList.Item key={service.id} value={service.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{service.name}</span>
                      <span style={{ color: '#1677ff', fontWeight: 500 }}>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </CheckList.Item>
                ))}
              </CheckList>
            ) : (
              <div style={{ 
                padding: '40px 16px', 
                textAlign: 'center', 
                color: '#999',
                fontSize: '14px'
              }}>
                No services available
              </div>
            )}
          </div>
        </Popup>
      </>
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