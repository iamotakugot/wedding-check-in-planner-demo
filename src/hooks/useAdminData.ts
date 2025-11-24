import { useState, useEffect } from 'react';
import { Guest, Zone, TableData, RSVPData } from '@/types';
import {
  subscribeGuests,
  subscribeZones,
  subscribeTables,
  subscribeRSVPs,
} from '@/services/firebaseService';

/**
 * Custom hook สำหรับ subscribe ถึง Guests, Zones, และ Tables
 * ใช้สำหรับ Admin Panel
 */
export const useAdminData = (isEnabled: boolean = true) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // Max 5 seconds loading

    // Subscribe to real-time updates
    const unsubscribeGuests = subscribeGuests((data) => {
      setGuests(data);
      setIsLoading(false);
      clearTimeout(loadingTimeout);
    });

    const unsubscribeZones = subscribeZones((data) => {
      setZones(data);
    });

    const unsubscribeTables = subscribeTables((data) => {
      setTables(data);
    });

    const unsubscribeRSVPs = subscribeRSVPs((data) => {
      console.log('📊 [Admin Data] รับข้อมูล RSVP:', data.length, 'รายการ');
      setRsvps(data);
    });

    // Cleanup on unmount
    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeGuests();
      unsubscribeZones();
      unsubscribeTables();
      unsubscribeRSVPs();
    };
  }, [isEnabled]);

  // Update zone capacity based on tables whenever tables state changes
  useEffect(() => {
    if (!isEnabled) return;

    setZones((prevZones) =>
      prevZones.map((zone) => {
        const totalTableCapacity = tables
          .filter((t) => t.zoneId === zone.zoneId)
          .reduce((acc, t) => acc + t.capacity, 0);
        return { ...zone, capacity: totalTableCapacity };
      }),
    );
  }, [tables, isEnabled]);

  return {
    guests,
    zones,
    tables,
    rsvps,
    isLoading,
    setZones,
    setTables,
  };
};

