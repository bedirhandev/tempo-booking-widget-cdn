// ServiceSelector.tsx
import React from 'react';
import { Form, Select } from 'antd';
import { useIsMobile } from '../hooks/useIsMobile';
import ServiceSelectorMobile from './ServiceSelectorMobile';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface ServiceSelectorProps {
  name?: string;
  label?: string;
  placeholder?: string;
  services: Service[];
  required?: boolean;
  requiredMessage?: string;
  formatPrice?: (price: number, currency?: string) => string; // Add this
  allowClear?: boolean;
  style?: React.CSSProperties;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = (props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <ServiceSelectorMobile {...props} />;
  }

  // Desktop version using antd Select
  const {
    name = 'service',
    label = 'Service',
    placeholder = 'Select a service',
    services,
    required = true,
    requiredMessage = 'Please select a service',
    formatPrice = (price) => `$${price.toFixed(2)}`, // Add default formatter
    allowClear = true,
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
      <Select
        placeholder={placeholder}
        allowClear={allowClear}
        style={style}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={services.map((service) => ({
          value: service.id,
          label: `${service.name} (${formatPrice(service.price)})`, // Use formatPrice here
        }))}
      />
    </Form.Item>
  );
};

export default ServiceSelector;