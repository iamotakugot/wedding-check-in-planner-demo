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
}

const RSVPStatusTag: React.FC<RSVPStatusTagProps> = ({ guest, rsvpMap, showText = true }) => {
  const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
  const statusText = getRSVPStatusText(rsvpStatus);

  if (rsvpStatus === 'yes') {
    return <Tag color="green">{showText ? statusText : 'ยินดีร่วมงาน'}</Tag>;
  } else if (rsvpStatus === 'no') {
    return <Tag color="red">{showText ? statusText : 'ไม่สะดวก'}</Tag>;
  }
  
  return <Tag>{showText ? statusText : 'ยังไม่ตอบรับ'}</Tag>;
};

export default RSVPStatusTag;

