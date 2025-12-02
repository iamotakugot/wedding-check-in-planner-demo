/**
 * Custom hook สำหรับ RSVP data
 * ใช้ข้อมูลจาก AdminDataContext
 */

import { useAdminData } from '@/contexts/AdminDataContext';

export const useRSVPs = (isEnabled: boolean = true) => {
  const { rsvps, isLoading } = useAdminData();

  if (!isEnabled) {
    return {
      rsvps: [],
      isLoading: false,
    };
  }

  return {
    rsvps,
    isLoading,
  };
};

