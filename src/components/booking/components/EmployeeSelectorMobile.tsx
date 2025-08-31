// EmployeeSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Form } from 'antd';
import { Picker } from 'antd-mobile';
import { CloseCircleFill, DownOutline } from 'antd-mobile-icons';
import type { PickerColumn } from 'antd-mobile/es/components/picker';

interface Employee {
    id: string;
    name: string;
}

interface AvailableEmployee {
    employee: Employee;
    disabled: boolean;
}

interface EmployeeSelectorMobileProps {
    name?: string;
    label?: string;
    placeholder?: string;
    availableEmployees: AvailableEmployee[];
    required?: boolean;
    requiredMessage?: string;
    allowClear?: boolean;
    style?: React.CSSProperties;
}

interface EmployeeInputProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    placeholder?: string;
    availableEmployees: AvailableEmployee[];
    allowClear?: boolean;
    style?: React.CSSProperties;
}

const EmployeeInput = forwardRef<any, EmployeeInputProps>(
    ({ value, onChange, placeholder, availableEmployees, allowClear, style }, ref) => {
        const [visible, setVisible] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const [isFocused, setIsFocused] = useState(false);

        const selectedEmployee = value
            ? availableEmployees.find(ae => ae.employee.id === value)?.employee
            : null;

        // Transform employees into Picker columns format
        const columns: PickerColumn[] = useMemo(() => {
            const enabledEmployees = availableEmployees.filter(ae => !ae.disabled);

            if (enabledEmployees.length === 0) {
                return [[]]; // Empty column if no employees available
            }

            return [
                enabledEmployees.map(({ employee }) => ({
                    label: employee.name,
                    value: employee.id,
                }))
            ];
        }, [availableEmployees]);

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
                title="Select Employee"
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
                                color: selectedEmployee ? '#000' : 'rgba(0, 0, 0, 0.25)',
                                flex: 1,
                            }}
                        >
                            {selectedEmployee ? selectedEmployee.name : placeholder}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {allowClear && selectedEmployee && isHovered ? (
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
                )}
            </Picker>
        );
    }
);

EmployeeInput.displayName = 'EmployeeInput';

const EmployeeSelectorMobile: React.FC<EmployeeSelectorMobileProps> = ({
    name = 'employee',
    label = 'Employee',
    placeholder = 'Select an employee',
    availableEmployees,
    required = true,
    requiredMessage = 'Please select an employee',
    allowClear = true,
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
            <EmployeeInput
                placeholder={placeholder}
                availableEmployees={availableEmployees}
                allowClear={allowClear}
                style={style}
            />
        </Form.Item>
    );
};

export default EmployeeSelectorMobile;