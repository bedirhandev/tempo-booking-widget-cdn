import React from 'react';
import { Skeleton, Row, Col, Form } from 'antd';

const ServiceStepSkeleton: React.FC = () => {
	return (
		<Form layout='vertical'>
			{/* Service Field */}
			<Form.Item label='Service' required={true}>
				<Skeleton.Input active block size='default' />
			</Form.Item>
			{/* Date and Time Fields */}
			<Row gutter={16}>
				<Col span={12}>
					<Form.Item label='Date' required={true}>
						<Skeleton.Input active block size='default' />
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item label='Time' required={true}>
						<Skeleton.Input active block size='default' />
					</Form.Item>
				</Col>
			</Row>
			{/* Employee Field */}
			<Form.Item label='Employee' required={true}>
				<Skeleton.Input active block size='default' />
			</Form.Item>
		</Form>
	);
};

export default ServiceStepSkeleton;
