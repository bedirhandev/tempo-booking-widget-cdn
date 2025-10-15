import React from 'react';
import { Descriptions, Grid } from 'antd';
import type { ApiBooking } from '@/components/booking/types/index';
import { formatUtcDateInZone, formatUtcRangeInZone } from '@/components/booking/utils/timezoneUtils';
// Remove dayjs import - no longer needed

const { useBreakpoint } = Grid;

interface ConfirmedBookingStepProps {
  booking: ApiBooking;
}

const ConfirmedBookingStep: React.FC<ConfirmedBookingStepProps> = ({ booking }) => {
  const screens = useBreakpoint();

  // Detect user timezone
  const userZone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  // Date: Use localized, formatted startDatetime if available, else booking.date
  let dateDisplay = '';
  if (booking.startDatetime) {
    dateDisplay = formatUtcDateInZone(booking.startDatetime, userZone);
  } else if (booking.date) {
    // Assume booking.date is UTC and format accordingly
    dateDisplay = formatUtcDateInZone(booking.date, userZone);
  }

  // Time: Use localized, formatted range if available, else localized start time
  let timeDisplay = '';
  if (booking.startDatetime && booking.endDatetime) {
    timeDisplay = formatUtcRangeInZone(booking.startDatetime, booking.endDatetime, userZone);
  } else if (booking.startDatetime) {
    timeDisplay = formatUtcDateInZone(booking.startDatetime, userZone, 'HH:mm');
  } else if (booking.time) {
    timeDisplay = booking.time; // fallback, but unlikely
  }

  return (
    <Descriptions
      bordered
      column={1}
      size={screens.xs ? 'small' : 'middle'}
      layout={screens.xs ? 'vertical' : 'horizontal'}
      labelStyle={{
        textAlign: screens.xs ? 'center' : 'right'
      }}
      contentStyle={{
        textAlign: screens.xs ? 'center' : 'left'
      }}
    >
      <Descriptions.Item label="Service">{booking.serviceName || booking.service?.name}</Descriptions.Item>
      <Descriptions.Item label="Price">{booking.formattedPrice || booking.service?.formattedPrice}</Descriptions.Item>
      <Descriptions.Item label="Date">{dateDisplay}</Descriptions.Item>
      <Descriptions.Item label="Time">{timeDisplay}</Descriptions.Item>
      <Descriptions.Item label="Employee">
        {booking.assignedUserName || booking.user?.name || 'Any available'}
      </Descriptions.Item>
      <Descriptions.Item label="Full Name">{booking.customerName || booking.customer?.fullName}</Descriptions.Item>
      <Descriptions.Item label="Email">
        <span style={{ wordBreak: 'break-all' }}>
          {booking.customerEmail || booking.customer?.email}
        </span>
      </Descriptions.Item>
      {(booking.customerPhone || booking.customer?.phone) && (
        <Descriptions.Item label="Phone Number">
          {booking.customerPhone || booking.customer?.phone}
        </Descriptions.Item>
      )}
      {booking.note && (
        <Descriptions.Item label="Additional Notes">
          <span style={{ whiteSpace: 'pre-wrap' }}>{booking.note}</span>
        </Descriptions.Item>
      )}
    </Descriptions>
  );
};

export default ConfirmedBookingStep;