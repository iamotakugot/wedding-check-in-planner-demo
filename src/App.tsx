import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { Guest, Zone, TableData } from '@/types';
import { initialGuests, initialZones, initialTables } from '@/data/mockData';
import LoginPage from '@/pages/LoginPage';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import GuestListPage from '@/pages/GuestListPage';
import SeatingManagementPage from '@/pages/SeatingManagementPage';
import LinkManagerPage from '@/pages/LinkManagerPage';
import GuestRSVPApp from '@/components/RSVP/GuestRSVPApp';
import CheckInPage from '@/pages/CheckInPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appMode, setAppMode] = useState<'admin' | 'guest'>('admin');
  const [currentView, setCurrentView] = useState('1');

  // Central State Management
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [tables, setTables] = useState<TableData[]>(initialTables);

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
        return <LinkManagerPage onPreview={() => setAppMode('guest')} />;
      case '5':
        return (
          <CheckInPage
            guests={guests}
            setGuests={setGuests}
            zones={zones}
            tables={tables}
          />
        );
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

  if (appMode === 'guest') {
    return <GuestRSVPApp onExitGuestMode={() => setAppMode('admin')} />;
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
