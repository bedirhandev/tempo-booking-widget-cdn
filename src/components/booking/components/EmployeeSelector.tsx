// EmployeeSelector.tsx
import React from 'react';
import { Form, Select } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useIsMobile } from '../hooks/useIsMobile';
import EmployeeSelectorMobile from './EmployeeSelectorMobile'; // Your existing mobile version

interface Employee {
    id: string;
    name: string;
}

interface AvailableEmployee {
    employee: Employee;
    disabled: boolean;
}

interface EmployeeSelectorProps {
    name?: string;
    label?: string;
    placeholder?: string;
    availableEmployees: AvailableEmployee[];
    required?: boolean;
    requiredMessage?: string;
    allowClear?: boolean;
    style?: React.CSSProperties;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = (props) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <EmployeeSelectorMobile {...props} />;
    }

    // Desktop version using antd Select
    const {
        name = 'employee',
        label = 'Employee',
        placeholder = 'Select an employee',
        availableEmployees,
        required = true,
        requiredMessage = 'Please select an employee',
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
                suffixIcon={<UserOutlined />}
                options={availableEmployees.map(({ employee, disabled }) => ({
                    value: employee.id,
                    label: employee.name,
                    disabled,
                }))}
            />
        </Form.Item>
    );
};

export default EmployeeSelector;