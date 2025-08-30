import React from 'react'
import { Spin, Typography } from 'antd'

const { Text } = Typography

interface SummaryStepSkeletonProps {
  loadingText?: string
  subText?: string
}

const SummaryStepSkeleton: React.FC<SummaryStepSkeletonProps> = ({
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
      <Spin size="large" />
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: 14, color: '#262626' }}>
          {loadingText}
        </Text>
        {subText && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {subText}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryStepSkeleton