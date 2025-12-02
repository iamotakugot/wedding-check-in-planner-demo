/**
 * Custom hook สำหรับ GuestGroup data
 * ใช้ข้อมูลจาก AdminDataContext
 */

import { useAdminData } from '@/contexts/AdminDataContext';

export const useGuestGroups = (isEnabled: boolean = true) => {
  const { guestGroups, isLoading } = useAdminData();

  if (!isEnabled) {
    return {
      guestGroups: [],
      isLoading: false,
    };
  }

  return {
    guestGroups,
    isLoading,
  };
};

