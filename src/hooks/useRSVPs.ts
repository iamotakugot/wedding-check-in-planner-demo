/**
 * Custom hook สำหรับ RSVP data
 * ใช้ RSVPService instance
 */

import { useState, useEffect } from 'react';
import { RSVPData } from '@/types';
import { RSVPService } from '@/services/firebase/RSVPService';
import { logger } from '@/utils/logger';

export const useRSVPs = (isEnabled: boolean = true) => {
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const rsvpService = RSVPService.getInstance();

    // Load initial data
    rsvpService.getAll()
      .then((data) => {
        setRsvps(data);
        setIsLoading(false);
      })
      .catch((error) => {
        logger.error('Error loading RSVPs:', error);
        setIsLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = rsvpService.subscribe((data) => {
      setRsvps(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isEnabled]);

  return {
    rsvps,
    isLoading,
  };
};

