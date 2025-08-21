// SummaryStepSkeleton.tsx
import React from 'react'
import { Skeleton, Descriptions } from 'antd'

const SummaryStepSkeleton: React.FC = () => {
  return (
    <>
      {/* Skeleton for the success message */}
      {/*<Skeleton active paragraph={{ rows: 1, width: '60%' }} style={{ marginBottom: 16 }} />*/}
      <Descriptions bordered column={1} size={'middle'} title={<Skeleton.Input active size={'small'} style={{ width: 200 }} />}>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 200 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 100 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 150 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 100 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 200 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 200 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 250 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 150 }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Skeleton.Input active style={{ width: 100 }} />}>
          <Skeleton.Input active style={{ width: 150 }} />
          {/*<Skeleton active paragraph={{ rows: 2 }} />*/}
        </Descriptions.Item>
      </Descriptions>
    </>
  )
}

export default SummaryStepSkeleton
