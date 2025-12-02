/**
 * Custom hook สำหรับ Table data
 * ใช้ข้อมูลจาก AdminDataContext
 */

import { useAdminData } from '@/contexts/AdminDataContext';

export const useTables = (isEnabled: boolean = true) => {
  const { tables, isLoading } = useAdminData();

  if (!isEnabled) {
    return {
      tables: [],
      isLoading: false,
    };
  }

  return {
    tables,
    isLoading,
  };
};

