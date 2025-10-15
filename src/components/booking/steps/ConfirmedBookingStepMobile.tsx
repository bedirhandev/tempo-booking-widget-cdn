import React from 'react';
import { List } from 'antd-mobile';
import type { ApiBooking } from '@/components/booking/types/index';
import {
  formatUtcDateInZone,
  formatUtcRangeInZone,
} from '@/components/booking/utils/timezoneUtils';

interface ConfirmedBookingMobileStepProps {
  booking: ApiBooking;
}

const ConfirmedBookingMobileStep: React.FC<ConfirmedBookingMobileStepProps> = ({ booking }) => {
  // Detect user timezone
  const userZone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  // Date display
  let dateDisplay = '';
  if (booking.startDatetime) {
    dateDisplay = formatUtcDateInZone(booking.startDatetime, userZone);
  } else if (booking.date) {
    dateDisplay = formatUtcDateInZone(booking.date, userZone);
  }

  // Time display
  let timeDisplay = '';
  if (booking.startDatetime && booking.endDatetime) {
    timeDisplay = formatUtcRangeInZone(booking.startDatetime, booking.endDatetime, userZone);
  } else if (booking.startDatetime) {
    timeDisplay = formatUtcDateInZone(booking.startDatetime, userZone, 'HH:mm');
  } else if (booking.time) {
    timeDisplay = booking.time;
  }

  const priceDisplay = booking.formattedPrice || booking.service?.formattedPrice || '';

  return (
    <div>
      <List mode="card">
        <List.Item
          title="Service"
          description={booking.serviceName || booking.service?.name}
        />
        <List.Item
          title="Price"
          description={priceDisplay}
        />
        <List.Item
          title="Date"
          description={dateDisplay}
        />
        <List.Item
          title="Time"
          description={timeDisplay}
        />
        <List.Item
          title="Employee"
          description={booking.assignedUserName || booking.user?.name || 'Any available'}
        />
        <List.Item
          title="Full Name"
          description={booking.customerName || booking.customer?.fullName}
        />
        <List.Item
          title="Email"
          description={
            <span style={{ wordBreak: 'break-all' }}>
              {booking.customerEmail || booking.customer?.email}
            </span>
          }
        />
        {(booking.customerPhone || booking.customer?.phone) && (
          <List.Item
            title="Phone Number"
            description={booking.customerPhone || booking.customer?.phone}
          />
        )}
        {booking.note && (
          <List.Item
            title="Additional Notes"
            description={
              <span style={{ whiteSpace: 'pre-wrap' }}>
                {booking.note}
              </span>
            }
          />
        )}
      </List>
    </div>
  );
};

export default ConfirmedBookingMobileStep;