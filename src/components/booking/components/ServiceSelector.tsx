import React from 'react';
import { Form, Select } from 'antd';
import { useIsMobile } from '../hooks/useIsMobile';
import ServiceSelectorMobile from './ServiceSelectorMobile';
import type { Service } from '@/components/booking/types/index'

interface ServiceSelectorProps {
  name?: string;
  label?: string;
  placeholder?: string;
  services: Service[];
  required?: boolean;
  requiredMessage?: string;
  formatPrice?: (service: Service) => string;
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
    formatPrice = (service: Service) => service.formattedPrice ?? `$${service.price}`, // Default: use formattedPrice
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
          label: `${service.name} (${formatPrice(service)})`, // Use formatPrice(service)
        }))}
      />
    </Form.Item>
  );
};

export default ServiceSelector;