import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { Guest, Zone, TableData } from '@/types';
import { initialGuests, initialZones, initialTables } from '@/data/mockData';
import LoginPage from '@/pages/LoginPage';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import GuestListPage from '@/pages/GuestListPage';
import SeatingManagementPage from '@/pages/SeatingManagementPage';
import GuestRSVPApp from '@/components/RSVP/GuestRSVPApp';
import CheckInPage from '@/pages/CheckInPage';
import LinkManagementPage from '@/pages/LinkManagementPage';
import {
  subscribeGuests,
  subscribeZones,
  subscribeTables,
  migrateInitialData,
} from '@/services/firebaseService';

const App: React.FC = () => {
  // Check URL path BEFORE initial render
  // / = Guest RSVP App (หน้าการ์ดเชิญ)
  // /admin = Admin Panel (ต้องล็อคอิน)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminPath = pathname.startsWith('/admin');
  const isGuestPath = !isAdminPath; // Root path (/) is guest mode
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appMode, setAppMode] = useState<'admin' | 'guest'>(isGuestPath ? 'guest' : 'admin');
  const [currentView, setCurrentView] = useState('1');
  const [isLoading, setIsLoading] = useState(true);

  // Also check URL path on mount (for navigation)
  useEffect(() => {
    const currentPathname = window.location.pathname;
    
    // /admin = admin mode, / = guest mode
    if (currentPathname.startsWith('/admin')) {
      setAppMode('admin');
    } else {
      setAppMode('guest');
    }
  }, []);

  // Central State Management
  const [guests, setGuests] = useState<Guest[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);

  // Initialize Firebase and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Migrate initial data if needed (only first time)
        await migrateInitialData(initialGuests, initialZones, initialTables);

        // Subscribe to real-time updates
        const unsubscribeGuests = subscribeGuests((data) => {
          setGuests(data);
          setIsLoading(false);
        });

        const unsubscribeZones = subscribeZones((data) => {
          setZones(data);
        });

        const unsubscribeTables = subscribeTables((data) => {
          setTables(data);
        });

        // Cleanup on unmount
        return () => {
          unsubscribeGuests();
          unsubscribeZones();
          unsubscribeTables();
        };
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Fallback to mock data
        setGuests(initialGuests);
        setZones(initialZones);
        setTables(initialTables);
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Update zone capacity based on tables whenever tables state changes
  useEffect(() => {
    setZones((prevZones) =>
      prevZones.map((zone) => {
        const totalTableCapacity = tables
          .filter((t) => t.zoneId === zone.zoneId)
          .reduce((acc, t) => acc + t.capacity, 0);
        return { ...zone, capacity: totalTableCapacity };
      }),
    );
  }, [tables]);

  const renderAdminContent = () => {
    switch (currentView) {
      case '1':
        return (
          <DashboardPage
            onChangePage={setCurrentView}
            guests={guests}
            zones={zones}
            tables={tables}
          />
        );
      case '2':
        return (
          <GuestListPage
            guests={guests}
            setGuests={setGuests}
            zones={zones}
            tables={tables}
          />
        );
      case '3':
        return (
          <SeatingManagementPage
            guests={guests}
            setGuests={setGuests}
            zones={zones}
            setZones={setZones}
            tables={tables}
            setTables={setTables}
          />
        );
      case '4':
        return (
          <CheckInPage
            guests={guests}
            setGuests={setGuests}
            zones={zones}
            tables={tables}
          />
        );
      case '5':
        return <LinkManagementPage onPreview={() => setAppMode('guest')} />;
      default:
        return (
          <DashboardPage
            onChangePage={setCurrentView}
            guests={guests}
            zones={zones}
            tables={tables}
          />
        );
    }
  };

  // Guest mode: Show GuestRSVPApp immediately (no need to wait for admin data)
  // Root path (/) = Guest RSVP App
  if (appMode === 'guest') {
    return <GuestRSVPApp onExitGuestMode={() => {
      // Redirect to admin when exiting guest mode
      window.location.href = '/admin';
    }} />;
  }

  // Admin mode: Show loading while fetching data
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ec4899', // Pink-500
          fontFamily: 'Sarabun, Noto Sans Thai, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        {isAuthenticated ? (
          <MainLayout
            currentView={currentView}
            setCurrentView={setCurrentView}
            onLogout={() => setIsAuthenticated(false)}
          >
            {renderAdminContent()}
          </MainLayout>
        ) : (
          <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        )}
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
