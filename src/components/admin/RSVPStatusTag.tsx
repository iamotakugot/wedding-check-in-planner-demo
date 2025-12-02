/**
 * RSVP Status Tag Component
 * แสดงสถานะการตอบรับของแขก
 */

import React from 'react';
import { Tag } from 'antd';
import { Guest, RSVPData } from '@/types';
import { getGuestRSVPStatus, getRSVPStatusText } from '@/utils/guestHelpers';

interface RSVPStatusTagProps {
  guest: Guest;
  rsvpMap: Map<string, RSVPData>;
  showText?: boolean;
  size?: 'small' | 'default';
}

const RSVPStatusTag: React.FC<RSVPStatusTagProps> = ({ guest, rsvpMap, showText = true, size = 'default' }) => {
  const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
  const statusText = getRSVPStatusText(rsvpStatus);
  const className = size === 'small' ? 'text-xs m-0 px-1.5 py-0' : '';

  if (rsvpStatus === 'yes') {
    return <Tag color="green" className={className}>{showText ? statusText : 'ยินดีร่วมงาน'}</Tag>;
  } else if (rsvpStatus === 'no') {
    return <Tag color="red" className={className}>{showText ? statusText : 'ไม่สะดวก'}</Tag>;
  }

  return <Tag className={className}>{showText ? statusText : 'ยังไม่ตอบรับ'}</Tag>;
};

export default RSVPStatusTag;

