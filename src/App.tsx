import React, { useState, useEffect, useRef } from 'react';
import { ConfigProvider, App as AntApp, Spin, message } from 'antd';
import { Guest, Zone, TableData } from '@/types';
import AdminLoginPage from '@/pages/AdminLoginPage';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import GuestListPage from '@/pages/GuestListPage';
import SeatingManagementPage from '@/pages/SeatingManagementPage';
import GuestRSVPApp from '@/components/RSVP/GuestRSVPApp';
import CheckInPage from '@/pages/CheckInPage';
import LinkManagementPage from '@/pages/LinkManagementPage';
import RSVPListPage from '@/pages/RSVPListPage';
import {
  subscribeGuests,
  subscribeZones,
  subscribeTables,
  subscribeRSVPs,
  createGuest,
  updateRSVP,
  type RSVPData,
  onAuthStateChange,
  checkIsAdmin,
  logout,
} from '@/services/firebaseService';

const App: React.FC = () => {
  // Check URL path BEFORE initial render
  // / = Guest RSVP App (หน้าการ์ดเชิญ)
  // /admin = Admin Panel (ต้องล็อคอิน)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminPath = pathname.startsWith('/admin');
  const isGuestPath = !isAdminPath; // Root path (/) is guest mode
  
  // Authentication state - ใช้ Firebase Auth แทน sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appMode, setAppMode] = useState<'admin' | 'guest'>(isGuestPath ? 'guest' : 'admin');
  const [currentView, setCurrentView] = useState(() => {
    try {
      return sessionStorage.getItem('admin_current_view') || '1';
    } catch {
      return '1';
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

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

  // ตรวจสอบ Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setAuthLoading(true);
      
      if (user) {
        // มี user login แล้ว - ตรวจสอบว่าเป็น admin หรือไม่
        try {
          const adminStatus = await checkIsAdmin(user.uid);
          setIsAuthenticated(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAuthenticated(false);
        }
      } else {
        // ไม่มี user login
        setIsAuthenticated(false);
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save currentView to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('admin_current_view', currentView);
    } catch (e) {
      console.error('Error saving current view', e);
    }
  }, [currentView]);

  // Central State Management
  const [guests, setGuests] = useState<Guest[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);

  // Initialize Firebase and load data
  useEffect(() => {
    if (appMode !== 'admin' || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // Max 5 seconds loading

    // Subscribe to real-time updates (admin only)
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

    // Cleanup on unmount
    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeGuests();
      unsubscribeZones();
      unsubscribeTables();
    };
  }, [appMode, isAuthenticated]);

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

  // Track RSVPs being processed to prevent duplicate imports
  const processingRSVPsRef = useRef<Set<string>>(new Set());
  // Use ref to store latest guests to avoid re-subscribing on every guests change
  const guestsRef = useRef<Guest[]>([]);

  // Update guestsRef whenever guests changes
  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);

  // Auto-import RSVP to Guest when RSVP is created/updated with isComing === 'yes'
  useEffect(() => {
    if (!isAuthenticated || appMode !== 'admin') return; // Only run when admin is authenticated

    const unsubscribeRSVPs = subscribeRSVPs(async (rsvps: RSVPData[]) => {
      for (const rsvp of rsvps) {
        // Skip if already imported or not coming
        if (rsvp.guestId || rsvp.isComing !== 'yes') {
          processingRSVPsRef.current.delete(rsvp.id || '');
          continue;
        }

        // Skip if already processing this RSVP
        if (rsvp.id && processingRSVPsRef.current.has(rsvp.id)) {
          continue;
        }

        // Mark as processing
        if (rsvp.id) {
          processingRSVPsRef.current.add(rsvp.id);
        }

        // Check if guest already exists (prevent duplicate) - use ref to get latest guests
        const existingGuest = guestsRef.current.find(
          (g) =>
            g.firstName === rsvp.firstName &&
            g.lastName === rsvp.lastName &&
            g.nickname === rsvp.nickname
        );

        if (existingGuest) {
          // Link RSVP to existing guest
          if (rsvp.id) {
            await updateRSVP(rsvp.id, { guestId: existingGuest.id });
            processingRSVPsRef.current.delete(rsvp.id);
          }
          continue;
        }

        // Create new guest from RSVP
        try {
          const newGuestId = `G${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newGuest: Guest = {
            id: newGuestId,
            firstName: rsvp.firstName,
            lastName: rsvp.lastName,
            nickname: rsvp.nickname,
            age: null,
            gender: 'other',
            relationToCouple: rsvp.relation,
            side: rsvp.side, // RSVP side is 'groom' | 'bride', which matches Guest side
            zoneId: null,
            tableId: null,
            note: rsvp.note || '',
            isComing: true,
            accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
            groupId: null,
            groupName: null,
            checkedInAt: null,
            checkInMethod: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await createGuest(newGuest);
          
          // Link RSVP to new guest
          if (rsvp.id) {
            await updateRSVP(rsvp.id, { guestId: newGuestId });
            processingRSVPsRef.current.delete(rsvp.id);
          }
        } catch (error) {
          console.error('Error auto-importing RSVP:', error);
          if (rsvp.id) {
            processingRSVPsRef.current.delete(rsvp.id);
          }
        }
      }
    });

    return () => {
      unsubscribeRSVPs();
    };
  }, [isAuthenticated, appMode]); // Removed guests from dependency array

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
      case '6':
        return (
          <RSVPListPage
            onImportToGuests={async (rsvp) => {
              try {
                if (rsvp.guestId) {
                  message.warning('รายการนี้ถูกนำเข้าแล้ว');
                  return;
                }

                const newGuestId = `G${Date.now()}`; // Simple ID generation

                const newGuest: Guest = {
                  id: newGuestId,
                  firstName: rsvp.firstName,
                  lastName: rsvp.lastName,
                  nickname: rsvp.nickname,
                  age: null,
                  gender: 'other',
                  relationToCouple: rsvp.relation,
                  side: rsvp.side as 'groom' | 'bride' | 'both',
                  zoneId: null,
                  tableId: null,
                  note: rsvp.note,
                  isComing: rsvp.isComing === 'yes',
                  accompanyingGuestsCount: rsvp.accompanyingGuestsCount,
                  groupId: null,
                  groupName: null,
                  checkedInAt: null,
                  checkInMethod: null,
                  rsvpUid: rsvp.uid || null, // เซ็ต rsvpUid เพื่อให้ผู้ใช้เจ้าของ RSVP สามารถแก้ไขได้
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                await createGuest(newGuest);
                if (rsvp.id) {
                  await updateRSVP(rsvp.id, { guestId: newGuestId });
                }
                message.success('นำเข้าข้อมูลเรียบร้อย');
              } catch (error) {
                console.error('Import error:', error);
                message.error('เกิดข้อผิดพลาดในการนำเข้า');
              }
            }}
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

  // Guest mode: Show GuestRSVPApp immediately (no need to wait for admin data)
  // Root path (/) = Guest RSVP App
  if (appMode === 'guest') {
    return <GuestRSVPApp onExitGuestMode={() => {
      // Redirect to admin when exiting guest mode
      window.location.href = '/admin';
    }} />;
  }

  // Admin mode: Show loading while checking auth or fetching data
  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={authLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'กำลังโหลดข้อมูล...'} />
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
            onLogout={async () => {
              try {
                await logout();
                setIsAuthenticated(false);
              } catch (error) {
                console.error('Error logging out:', error);
                // Force clear state even if logout fails
                setIsAuthenticated(false);
              }
            }}
          >
            {renderAdminContent()}
          </MainLayout>
        ) : (
          <AdminLoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        )}
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
