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

  const skeletonInputStyle = {
    height: 32,
    borderRadius: 4,
  };

  return (
    <div>
      {/* Service Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Service</span>
        </div>
        <Skeleton animated style={skeletonInputStyle} />
      </div>

      {/* Date and Time Fields - Side by side */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>
            <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
            <span>Date</span>
          </div>
          <Skeleton animated style={skeletonInputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>
            <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
            <span>Time</span>
          </div>
          <Skeleton animated style={skeletonInputStyle} />
        </div>
      </div>

      {/* Employee Field */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          <span>Employee</span>
        </div>
        <Skeleton animated style={skeletonInputStyle} />
      </div>
    </div>
  );
};

export default ServiceStepSkeletonMobile;