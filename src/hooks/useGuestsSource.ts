/**
 * Custom hook สำหรับ Guest data (Source)
 * ใช้ GuestService instance
 */

import { useState, useEffect } from 'react';
import { Guest } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';
import { logger } from '@/utils/logger';

export const useGuestsSource = (isEnabled: boolean = true) => {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isEnabled) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const guestService = GuestService.getInstance();

        // Load initial data
        guestService.getAll()
            .then((data) => {
                setGuests(data);
                setIsLoading(false);
            })
            .catch((error) => {
                logger.error('Error loading guests:', error);
                setIsLoading(false);
            });

        // Subscribe to real-time updates
        const unsubscribe = guestService.subscribe((data) => {
            setGuests(data);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [isEnabled]);

    return {
        guests,
        isLoading,
    };
};
