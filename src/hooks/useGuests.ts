/**
 * Custom hook สำหรับ Guest data
 * ใช้ข้อมูลจาก AdminDataContext
 */

import { useAdminData } from '@/contexts/AdminDataContext';

export const useGuests = (isEnabled: boolean = true) => {
  const { guests, isLoading } = useAdminData();

  if (!isEnabled) {
    return {
      guests: [],
      isLoading: false,
    };
  }

  return {
    guests,
    isLoading,
  };
};

