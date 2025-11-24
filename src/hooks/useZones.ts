/**
 * Custom hook สำหรับ Zone data
 * ใช้ ZoneService instance
 */

import { useState, useEffect } from 'react';
import { Zone } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';

export const useZones = (isEnabled: boolean = true) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const zoneService = ZoneService.getInstance();

    // Load initial data
    zoneService.getAll()
      .then((data) => {
        setZones(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading zones:', error);
        setIsLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = zoneService.subscribe((data) => {
      setZones(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isEnabled]);

  return {
    zones,
    isLoading,
  };
};

