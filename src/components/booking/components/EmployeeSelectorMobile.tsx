// EmployeeSelectorMobile.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { CheckList, Popup } from 'antd-mobile';
import { CloseCircleFill, DownOutline } from 'antd-mobile-icons';
import type { CheckListValue } from 'antd-mobile/es/components/check-list';

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
        const [tempValue, setTempValue] = useState<CheckListValue[]>([]);

        const selectedEmployee = value
            ? availableEmployees.find(ae => ae.employee.id === value)?.employee
            : null;

        // Filter only enabled employees
        const enabledEmployees = availableEmployees.filter(ae => !ae.disabled);

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
                        ...style,
                    }}
                    onClick={handleOpen}
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
                                Select Employee
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
                        {enabledEmployees.length > 0 ? (
                            <CheckList
                                value={tempValue}
                                onChange={(val: CheckListValue[]) => {
                                    // For single selection, replace the array with the new selection
                                    setTempValue(val.length > 0 ? [val[val.length - 1]] : []);
                                }}
                                style={{ '--border-top': 'none', '--border-bottom': 'none' } as any}
                            >
                                {enabledEmployees.map(({ employee }) => (
                                    <CheckList.Item key={employee.id} value={employee.id}>
                                        {employee.name}
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
                                No employees available
                            </div>
                        )}
                    </div>
                </Popup>
            </>
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