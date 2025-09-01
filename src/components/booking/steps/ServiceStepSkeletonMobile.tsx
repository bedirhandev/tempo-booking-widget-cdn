// ServiceStepSkeletonMobile.tsx
import React from 'react';
import { Skeleton } from 'antd-mobile';

const ServiceStepSkeletonMobile: React.FC = () => {
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: '#000',
  };

  return (
    <div>
      {/* Service Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Service</span>
        </div>
        <Skeleton animated style={{ height: 32, width: '100%' }} />
      </div>

      {/* Date Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Date</span>
        </div>
        <Skeleton animated style={{ height: 32, width: '100%' }} />
      </div>

      {/* Time Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Time</span>
        </div>
        <Skeleton animated style={{ height: 32, width: '100%' }} />
      </div>

      {/* Employee Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Employee</span>
        </div>
        <Skeleton animated style={{ height: 32, width: '100%' }} />
      </div>
    </div>
  );
};

export default ServiceStepSkeletonMobile;