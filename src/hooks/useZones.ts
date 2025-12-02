/**
 * Custom hook สำหรับ Zone data
 * ใช้ข้อมูลจาก AdminDataContext
 */

import { useAdminData } from '@/contexts/AdminDataContext';

export const useZones = (isEnabled: boolean = true) => {
  const { zones, isLoading } = useAdminData();

  if (!isEnabled) {
    return {
      zones: [],
      isLoading: false,
    };
  }

  return {
    zones,
    isLoading,
  };
};

