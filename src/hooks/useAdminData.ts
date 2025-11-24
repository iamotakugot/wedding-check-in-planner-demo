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

    // Reset loading state
    setIsLoading(true);

    // Track subscription count (use local variables instead of refs since they're scoped to this effect)
    let subscriptionCount = 0;
    const expectedSubscriptions = 4; // guests, zones, tables, rsvps
    const loadedSubscriptions = new Set<string>();

    // Helper function to check if all subscriptions are loaded
    const checkAllLoaded = (subscriptionName: string) => {
      if (loadedSubscriptions.has(subscriptionName)) {
        return; // Already loaded
      }
      
      loadedSubscriptions.add(subscriptionName);
      subscriptionCount += 1;
      
      if (subscriptionCount >= expectedSubscriptions) {
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ [Admin Data] Timeout waiting for subscriptions - some may have failed');
      setIsLoading(false);
    }, 5000); // Max 5 seconds loading

    // Subscribe to real-time updates
    const unsubscribeGuests = subscribeGuests((data) => {
      try {
        setGuests(data);
        checkAllLoaded('guests');
      } catch (error) {
        console.error('❌ [Admin Data] Error in guests subscription callback:', error);
        checkAllLoaded('guests'); // Still mark as loaded to prevent infinite loading
      }
    });

    const unsubscribeZones = subscribeZones((data) => {
      try {
        setZones(data);
        checkAllLoaded('zones');
      } catch (error) {
        console.error('❌ [Admin Data] Error in zones subscription callback:', error);
        checkAllLoaded('zones'); // Still mark as loaded to prevent infinite loading
      }
    });

    const unsubscribeTables = subscribeTables((data) => {
      try {
        setTables(data);
        checkAllLoaded('tables');
      } catch (error) {
        console.error('❌ [Admin Data] Error in tables subscription callback:', error);
        checkAllLoaded('tables'); // Still mark as loaded to prevent infinite loading
      }
    });

    const unsubscribeRSVPs = subscribeRSVPs((data) => {
      try {
        console.log('📊 [Admin Data] รับข้อมูล RSVP:', data.length, 'รายการ');
        setRsvps(data);
        checkAllLoaded('rsvps');
      } catch (error) {
        console.error('❌ [Admin Data] Error in rsvps subscription callback:', error);
        checkAllLoaded('rsvps'); // Still mark as loaded to prevent infinite loading
      }
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

