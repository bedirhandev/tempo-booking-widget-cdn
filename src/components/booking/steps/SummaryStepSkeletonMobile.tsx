// SummaryStepSkeletonMobile.tsx
import React from 'react'
import { SpinLoading } from 'antd-mobile'

interface SummaryStepSkeletonMobileProps {
  loadingText?: string
  subText?: string
}

const SummaryStepSkeletonMobile: React.FC<SummaryStepSkeletonMobileProps> = ({
  loadingText = "Loading booking details...",
  subText
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 300,
      gap: 16,
      padding: '40px 20px',
      backgroundColor: '#fafafa',
      borderRadius: 8
    }}>
      <SpinLoading style={{ '--size': '48px' }} color='primary' />
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: 14, 
          color: '#262626',
          lineHeight: 1.5
        }}>
          {loadingText}
        </div>
        {subText && (
          <div style={{ 
            marginTop: 4,
            fontSize: 12,
            color: '#999',
            lineHeight: 1.5
          }}>
            {subText}
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryStepSkeletonMobile