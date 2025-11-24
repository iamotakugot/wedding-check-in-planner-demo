import React, { useState, useEffect, useRef } from 'react';
import { ConfigProvider, App as AntApp, Spin, message } from 'antd';
import { Guest, Zone, TableData, RSVPData } from '@/types';
import AdminLoginPage from '@/pages/AdminLoginPage';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import GuestListPage from '@/pages/GuestListPage';
import SeatingManagementPage from '@/pages/SeatingManagementPage';
import GuestRSVPApp from '@/components/RSVP/GuestRSVPApp';
import CheckInPage from '@/pages/CheckInPage';
import CardManagementPage from '@/pages/CardManagementPage';
import RSVPListPage from '@/pages/RSVPListPage';
import {
  subscribeGuests,
  subscribeZones,
  subscribeTables,
  subscribeRSVPs,
  createGuest,
  updateRSVP,
  onAuthStateChange,
  checkIsAdmin,
  logout,
  getAdminAppState,
  updateAdminAppState,
  subscribeAdminAppState,
  getCurrentUser,
  getGuestByRsvpUid,
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
  const [currentView, setCurrentView] = useState('1');
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Track ว่า initial state โหลดเสร็จแล้วหรือยัง (ป้องกัน race condition ระหว่าง load และ save)
  const isInitialStateLoadedRef = useRef(false);
  
  // 🔧 DevOps Fix: Track ว่า user เปลี่ยนหน้าเองหรือไม่ (ป้องกัน navigation bounce)
  const isManualNavigationRef = useRef(false);

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

  // ตรวจสอบ Firebase Authentication state และ load admin app state
  useEffect(() => {
    let unsubscribeState: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChange((user) => {
      setAuthLoading(true);
      
      // Reset flag เมื่อเริ่ม auth state ใหม่
      isInitialStateLoadedRef.current = false;
      
      // Unsubscribe จาก subscription เก่าก่อน (ป้องกัน memory leak เมื่อ token refresh)
      if (unsubscribeState) {
        unsubscribeState();
        unsubscribeState = null;
      }
      
      if (user) {
        // มี user login แล้ว - ตรวจสอบว่าเป็น admin หรือไม่
        // ใช้ promise chain แทน async/await เพราะ Firebase Auth callback ไม่รองรับ async
        checkIsAdmin(user.uid)
          .then((adminStatus) => {
            setIsAuthenticated(adminStatus);
            
            // 🔒 Security: ถ้าอยู่ในหน้า /admin แต่ไม่ใช่ admin
            const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
            const isAdminPath = currentPathname.startsWith('/admin');
            const isAdminLoginPage = currentPathname === '/admin' || currentPathname === '/admin/';
            
            // อนุญาตให้ Guest เข้าหน้า Admin Login ได้ (เพื่อ logout และ login ด้วย admin account)
            // แต่ถ้าไม่ใช่หน้า Admin Login และไม่ใช่ admin → redirect ไปหน้า guest
            if (isAdminPath && !adminStatus && !isAdminLoginPage) {
              console.log('🚫 [Security] User ทั่วไปพยายามเข้า Admin Panel - redirect ไปหน้า guest');
              message.warning('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Panel');
              window.location.href = '/';
              return;
            }
            
            // ถ้าเป็น Guest ที่ล็อคอินแล้วและอยู่ที่หน้า Admin Login → อนุญาตให้เข้าหน้า login ได้
            // (ไม่ต้อง redirect เพื่อให้สามารถ logout และ login ด้วย admin account ได้)
            // Note: isAuthenticated จะเป็น false สำหรับ Guest (เพราะ adminStatus เป็น false)
            // ดังนั้นจะแสดง AdminLoginPage เพื่อให้ logout และ login ใหม่
            
            // 🔧 DevOps: อนุญาตให้ Admin เข้าหน้า Guest ได้ (เพื่อดูหน้าการ์ด)
            // ไม่ redirect admin จาก / ไป /admin (ให้ admin สามารถดูหน้าการ์ดได้)
            
            // ถ้าเป็น admin ให้ load และ subscribe app state
            if (adminStatus) {
              
              // Load initial state จาก Firebase
              getAdminAppState(user.uid)
                .then((state) => {
                  if (state?.currentView) {
                    setCurrentView(state.currentView);
                  }
                  // Mark ว่า initial state โหลดเสร็จแล้ว (แม้จะไม่มี state ก็ถือว่าโหลดเสร็จ)
                  isInitialStateLoadedRef.current = true;
                })
                .catch((error) => {
                  console.error('Error loading admin app state:', error);
                  // Mark ว่าโหลดเสร็จแล้วแม้จะ error (เพื่อไม่ให้ block การบันทึกถัดไป)
                  isInitialStateLoadedRef.current = true;
                });

              // Subscribe to state changes จาก Firebase (sync ระหว่างแท็บ/อุปกรณ์)
              unsubscribeState = subscribeAdminAppState(user.uid, (state) => {
                // 🔧 DevOps Fix: ไม่ load currentView ถ้า user เปลี่ยนหน้าเอง
                if (!isManualNavigationRef.current && state?.currentView) {
                  setCurrentView(state.currentView);
                }
              });
            } else {
              // ไม่ใช่ admin - mark ว่าโหลดเสร็จแล้ว
              isInitialStateLoadedRef.current = true;
            }
            
            setAuthLoading(false);
          })
          .catch((error) => {
            console.error('Error checking admin status:', error);
            setIsAuthenticated(false);
            isInitialStateLoadedRef.current = true; // Mark ว่าเสร็จแล้วแม้จะ error
            setAuthLoading(false);
          });
      } else {
        // ไม่มี user login - reset state
        setIsAuthenticated(false);
        setCurrentView('1');
        isInitialStateLoadedRef.current = true; // Mark ว่าเสร็จแล้ว
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeState) {
        unsubscribeState();
      }
    };
  }, []);

  // Save currentView ไปยัง Firebase Realtime Database
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Skip การบันทึกถ้ายังไม่โหลด initial state เสร็จ (ป้องกัน race condition)
    if (!isInitialStateLoadedRef.current) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Debounce เพื่อป้องกันการ update บ่อยเกินไป
    const timeoutId = setTimeout(() => {
      updateAdminAppState(user.uid, { currentView })
        .catch((error) => {
          console.error('Error saving admin app state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentView, isAuthenticated]);

  // Central State Management
  const [guests, setGuests] = useState<Guest[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [rsvps, setRsvps] = useState<RSVPData[]>([]); // 🔧 DevOps: เพิ่ม RSVP state

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

    // 🔧 DevOps: Subscribe to RSVPs
    const unsubscribeRSVPs = subscribeRSVPs((data) => {
      console.log('📊 [Dashboard] รับข้อมูล RSVP:', data.length, 'รายการ');
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

  // 🔧 DevOps Fix: ปิด auto-import เพราะ GuestRSVPApp สร้าง Guest เองแล้ว
  // เพื่อป้องกัน duplicate Guest creation และ race condition
  // GuestRSVPApp จะสร้าง Guest อัตโนมัติเมื่อ isComing === 'yes'
  // Admin สามารถ import RSVP แบบ manual ได้ที่ RSVPListPage

  // 🔧 DevOps Fix: Handler สำหรับเปลี่ยนหน้า (ป้องกัน navigation bounce)
  const handlePageChange = (key: string) => {
    isManualNavigationRef.current = true;
    setCurrentView(key);
    // Reset flag หลังจาก 1 วินาที
    setTimeout(() => {
      isManualNavigationRef.current = false;
    }, 1000);
  };

  const renderAdminContent = () => {
    switch (currentView) {
      case '1':
        return (
          <DashboardPage
            onChangePage={handlePageChange}
            guests={guests}
            zones={zones}
            tables={tables}
            rsvps={rsvps}
          />
        );
          case '2':
            return (
              <GuestListPage
                guests={guests}
                zones={zones}
                tables={tables}
                rsvps={rsvps}
              />
            );
      case '3':
        return (
          <SeatingManagementPage
            guests={guests}
            zones={zones}
            setZones={setZones}
            tables={tables}
            setTables={setTables}
            rsvps={rsvps}
          />
        );
          case '4':
            return (
              <CheckInPage
                guests={guests}
                zones={zones}
                tables={tables}
                rsvps={rsvps}
              />
            );
      case '5':
        return <CardManagementPage onPreview={() => setAppMode('guest')} />;
      case '6':
        return (
          <RSVPListPage
            rsvps={rsvps}
            onImportToGuests={async (rsvp) => {
              try {
                if (rsvp.guestId) {
                  message.warning('รายการนี้ถูกนำเข้าแล้ว');
                  return;
                }

                // 🔧 DevOps Fix: เช็ค idempotency ก่อนสร้าง Guest
                const existingGuest = await getGuestByRsvpUid(rsvp.uid || '');
                
                if (existingGuest) {
                  // ถ้ามี Guest อยู่แล้ว → link RSVP กับ Guest ที่มีอยู่
                  if (rsvp.id) {
                    await updateRSVP(rsvp.id, { guestId: existingGuest.id });
                  }
                  message.success('นำเข้าข้อมูลเรียบร้อย (เชื่อมโยงกับ Guest ที่มีอยู่แล้ว)');
                  return;
                }

                // 🔧 DevOps: สร้างกลุ่ม (Group) จาก RSVP
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 1000000); // เพิ่ม random เพื่อป้องกัน ID ซ้ำ
                const groupId = `GROUP_${timestamp}_${random}`;
                const groupName = `${rsvp.firstName} ${rsvp.lastName}`;
                const totalGuests = 1 + (rsvp.accompanyingGuestsCount || 0);
                
                // 1. สร้าง Guest หลัก (ตัวเอง)
                const mainGuestId = `G${timestamp}_${random}`;
                const mainGuest: Guest = {
                  id: mainGuestId,
                  firstName: rsvp.firstName,
                  lastName: rsvp.lastName,
                  nickname: rsvp.nickname || '',
                  age: null,
                  gender: 'other',
                  relationToCouple: rsvp.relation || '',
                  side: rsvp.side as 'groom' | 'bride' | 'both',
                  zoneId: null,
                  tableId: null,
                  note: rsvp.note || '',
                  isComing: rsvp.isComing === 'yes',
                  accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
                  groupId: groupId,
                  groupName: groupName,
                  checkedInAt: null,
                  checkInMethod: null,
                  rsvpUid: rsvp.uid || null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                await createGuest(mainGuest);

                // 2. สร้าง Guest สำหรับผู้ติดตาม (accompanyingGuests)
                if (rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0) {
                  console.log(`🔄 [Import] กำลังสร้าง Guest ผู้ติดตาม ${rsvp.accompanyingGuests.length} คน...`);
                  for (let i = 0; i < rsvp.accompanyingGuests.length; i++) {
                    try {
                      const accGuest = rsvp.accompanyingGuests[i];
                      const accGuestId = `G${timestamp}_${random}_${i}`; // ใช้ timestamp และ random เดียวกัน
                      const accGuestData: Guest = {
                        id: accGuestId,
                        firstName: accGuest.name || `คนที่ ${i + 1}`,
                        lastName: '',
                        nickname: '',
                        age: null,
                        gender: 'other',
                        relationToCouple: accGuest.relationToMain || '',
                        side: rsvp.side as 'groom' | 'bride' | 'both',
                        zoneId: null,
                        tableId: null,
                        note: '',
                        isComing: true,
                        accompanyingGuestsCount: 0,
                        groupId: groupId,
                        groupName: groupName,
                        checkedInAt: null,
                        checkInMethod: null,
                        rsvpUid: rsvp.uid || null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      await createGuest(accGuestData);
                      console.log(`✅ [Import] สร้าง Guest ผู้ติดตาม ${i + 1}/${rsvp.accompanyingGuests.length} สำเร็จ:`, accGuestId, accGuest.name || `คนที่ ${i + 1}`);
                    } catch (accError: unknown) {
                      console.error(`❌ [Import] เกิดข้อผิดพลาดในการสร้าง Guest ผู้ติดตาม ${i + 1}:`, accError);
                      // ยังคงดำเนินการต่อแม้ว่าจะเกิด error (ไม่ throw เพื่อให้สร้าง Guest คนอื่นต่อได้)
                      if (accError && typeof accError === 'object' && 'code' in accError && accError.code === 'PERMISSION_DENIED') {
                        console.error(`🚫 [Import] Permission denied สำหรับ Guest ผู้ติดตาม ${i + 1} - ตรวจสอบ Firebase Rules`);
                      }
                    }
                  }
                  console.log(`✅ [Import] สร้าง Guest ผู้ติดตามเสร็จสิ้น (${rsvp.accompanyingGuests.length} คน)`);
                }

                // 3. Link RSVP กับ Guest หลัก
                if (rsvp.id) {
                  await updateRSVP(rsvp.id, { guestId: mainGuestId });
                }
                
                message.success(`นำเข้าข้อมูลเรียบร้อย (${totalGuests} คน)`);
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
            rsvps={rsvps} // 🔧 DevOps: ส่ง RSVP data
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
            setCurrentView={handlePageChange}
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
