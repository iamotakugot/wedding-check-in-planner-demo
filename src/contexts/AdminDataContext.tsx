import React, { createContext, useContext, useMemo } from 'react';
import { Guest, RSVPData, Zone, TableData, GuestGroup } from '@/types';
import { useGuestsSource } from '@/hooks/useGuestsSource';
import { useRSVPsSource } from '@/hooks/useRSVPsSource';
import { useZonesSource } from '@/hooks/useZonesSource';
import { useTablesSource } from '@/hooks/useTablesSource';
import { mapRSVPsToGuestGroups } from '@/utils/groupHelpers';

interface AdminDataContextType {
    guests: Guest[];
    rsvps: RSVPData[];
    zones: Zone[];
    tables: TableData[];
    guestGroups: GuestGroup[];
    isLoading: boolean;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use Source hooks to fetch data
    const { guests, isLoading: guestsLoading } = useGuestsSource();
    const { rsvps, isLoading: rsvpsLoading } = useRSVPsSource();
    const { zones, isLoading: zonesLoading } = useZonesSource();
    const { tables, isLoading: tablesLoading } = useTablesSource();

    // Calculate guestGroups
    const guestGroups = useMemo(() => {
        if (rsvps.length === 0 || guests.length === 0) {
            return [];
        }
        return mapRSVPsToGuestGroups(rsvps, guests, tables, zones);
    }, [rsvps, guests, tables, zones]);

    const isLoading = guestsLoading || rsvpsLoading || zonesLoading || tablesLoading;

    const value = {
        guests,
        rsvps,
        zones,
        tables,
        guestGroups,
        isLoading,
    };

    return (
        <AdminDataContext.Provider value={value}>
            {children}
        </AdminDataContext.Provider>
    );
};

export const useAdminData = () => {
    const context = useContext(AdminDataContext);
    if (context === undefined) {
        throw new Error('useAdminData must be used within an AdminDataProvider');
    }
    return context;
};
