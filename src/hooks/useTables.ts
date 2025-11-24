/**
 * Custom hook สำหรับ Table data
 * ใช้ TableService instance
 */

import { useState, useEffect } from 'react';
import { TableData } from '@/types';
import { TableService } from '@/services/firebase/TableService';

export const useTables = (isEnabled: boolean = true) => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const tableService = TableService.getInstance();

    // Load initial data
    tableService.getAll()
      .then((data) => {
        setTables(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading tables:', error);
        setIsLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = tableService.subscribe((data) => {
      setTables(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isEnabled]);

  return {
    tables,
    isLoading,
  };
};

