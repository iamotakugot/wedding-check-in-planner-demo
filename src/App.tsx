/**
 * Main App Component
 * จัดการ routing และ authentication
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import AdminLoginPage from '@/pages/AdminLoginPage';
import GuestRSVPApp from '@/card/GuestRSVPApp';
import IntroPage from '@/pages/IntroPage';
import OTPLoginPage from '@/pages/OTPLoginPage';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { AuthService } from '@/services/firebase/AuthService';
import { User } from 'firebase/auth';
// Admin Panel ใหม่ - Lazy load สำหรับ code splitting
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const GuestsPage = lazy(() => import('@/pages/admin/GuestsPage'));
const SeatingPage = lazy(() => import('@/pages/admin/SeatingPage'));
const RSVPsPage = lazy(() => import('@/pages/admin/RSVPsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
// Hooks ใหม่
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useRSVPSync } from '@/hooks/useRSVPSync';
// Services ใหม่
import { getAdminAppState, updateAdminAppState, subscribeAdminAppState } from '@/services/firebase/appState';
import { logger } from '@/utils/logger';

// Security check component that uses App.useApp() hook
const SecurityCheck: React.FC<{
  isAdminPath: boolean;
  authLoading: boolean;
  user: User | null;
  isAdmin: boolean;
  pathname: string;
}> = ({ isAdminPath, authLoading, user, isAdmin, pathname }) => {
  const { message } = AntApp.useApp();

  useEffect(() => {
    if (isAdminPath && !authLoading && user && !isAdmin) {
      const isAdminLoginPage = pathname === '/admin' || pathname === '/admin/';
      if (!isAdminLoginPage) {
        message.warning('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Panel');
        window.location.href = '/';
      }
    }
  }, [isAdminPath, authLoading, user, isAdmin, pathname, message]);

  return null;
};

const App: React.FC = () => {
  // Check URL path
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminPath = pathname.startsWith('/admin');
  const isGuestPath = !isAdminPath;

  // Admin authentication
  const { user, isAdmin, isLoading: authLoading, logout } = useAdminAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [appMode, setAppMode] = useState<'admin' | 'guest'>(isGuestPath ? 'guest' : 'admin');

  // Track state loading
  const isInitialStateLoadedRef = useRef(false);
  const isManualNavigationRef = useRef(false);

  // Check URL path on mount
  useEffect(() => {
    const currentPathname = window.location.pathname;
    if (currentPathname.startsWith('/admin')) {
      setAppMode('admin');
    } else {
      setAppMode('guest');
    }
  }, []);

  // Load and sync admin app state
  useEffect(() => {
    if (!isAdmin || !user) {
      isInitialStateLoadedRef.current = true;
      return;
    }

    let unsubscribeState: (() => void) | null = null;

    // Load initial state
    getAdminAppState(user.uid)
      .then((state) => {
        if (state?.currentView) {
          setCurrentView(state.currentView);
        }
        isInitialStateLoadedRef.current = true;
      })
      .catch((error) => {
        logger.error('Error loading admin app state:', error);
        isInitialStateLoadedRef.current = true;
      });

    // Subscribe to state changes
    unsubscribeState = subscribeAdminAppState(user.uid, (state) => {
      if (!isManualNavigationRef.current && state?.currentView) {
        setCurrentView(state.currentView);
      }
    });

    return () => {
      if (unsubscribeState) {
        unsubscribeState();
      }
    };
  }, [isAdmin, user]);

  // Save currentView to Firebase
  useEffect(() => {
    if (!isAdmin || !user || !isInitialStateLoadedRef.current) return;

    const timeoutId = setTimeout(() => {
      updateAdminAppState(user.uid, { currentView })
        .catch((error) => {
          logger.error('Error saving admin app state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentView, isAdmin, user]);

  // Auto-sync RSVPs to Guests
  useRSVPSync(appMode === 'admin' && isAdmin);

  // Security: Redirect non-admin users from admin pages
  // Note: This will be handled inside AntApp component to use App.useApp() hook

  // Handle page change
  const handlePageChange = (key: string) => {
    isManualNavigationRef.current = true;
    setCurrentView(key);
    setTimeout(() => {
      isManualNavigationRef.current = false;
    }, 1000);
  };

  // Render admin content
  const renderAdminContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><DashboardPage /></Suspense>;
      case 'guests':
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><GuestsPage /></Suspense>;
      case 'seating':
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><SeatingPage /></Suspense>;
      case 'rsvps':
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><RSVPsPage /></Suspense>;
      case 'settings':
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><SettingsPage /></Suspense>;
      default:
        return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}><DashboardPage /></Suspense>;
    }
  };

  // Guest mode: Handle Guest flow (IntroPage → OTPLoginPage → GuestRSVPApp)
  const [guestAuthState, setGuestAuthState] = useState<'intro' | 'login' | 'authenticated' | 'checking'>('checking');
  const [guestUser, setGuestUser] = useState<User | null>(null);
  const isCheckingAuthRef = useRef(false);
  const authCheckAbortRef = useRef<AbortController | null>(null);

  // Check if guest is already authenticated - Fixed race condition
  useEffect(() => {
    if (appMode !== 'guest') {
      return;
    }

    const authService = AuthService.getInstance();
    
    // Prevent multiple simultaneous checks
    if (isCheckingAuthRef.current) {
      return;
    }

    isCheckingAuthRef.current = true;
    const abortController = new AbortController();
    authCheckAbortRef.current = abortController;
    
    setGuestAuthState('checking');

    // Check current user
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      // Check if user is admin
      authService.checkIsAdmin(currentUser.uid)
        .then((isAdmin) => {
          if (abortController.signal.aborted) return;
          
          if (!isAdmin) {
            // Guest user is authenticated
            setGuestUser(currentUser);
            setGuestAuthState('authenticated');
          } else {
            // Admin user in guest path - redirect to admin
            setGuestAuthState('intro');
            window.location.href = '/admin';
          }
          isCheckingAuthRef.current = false;
        })
        .catch((error) => {
          if (abortController.signal.aborted) return;
          
          logger.error('[App] Error checking admin status:', error);
          // If check fails, assume guest (safer default)
          setGuestUser(currentUser);
          setGuestAuthState('authenticated');
          isCheckingAuthRef.current = false;
        });
    } else {
      setGuestAuthState('intro');
      isCheckingAuthRef.current = false;
    }

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (abortController.signal.aborted) return;
      
      if (user) {
        // Prevent multiple simultaneous admin checks
        if (isCheckingAuthRef.current) return;
        isCheckingAuthRef.current = true;
        
        authService.checkIsAdmin(user.uid)
          .then((isAdmin) => {
            if (abortController.signal.aborted) return;
            
            if (!isAdmin) {
              setGuestUser(user);
              setGuestAuthState('authenticated');
            } else {
              // Admin user in guest path - redirect to admin
              setGuestUser(null);
              setGuestAuthState('intro');
              window.location.href = '/admin';
            }
            isCheckingAuthRef.current = false;
          })
          .catch((error) => {
            if (abortController.signal.aborted) return;
            
            logger.error('[App] Error checking admin status in auth state change:', error);
            // If check fails, assume guest
            setGuestUser(user);
            setGuestAuthState('authenticated');
            isCheckingAuthRef.current = false;
          });
      } else {
        setGuestUser(null);
        setGuestAuthState('intro');
        isCheckingAuthRef.current = false;
      }
    });

    return () => {
      abortController.abort();
      unsubscribe();
      isCheckingAuthRef.current = false;
    };
  }, [appMode]);

  if (appMode === 'guest') {
    return (
      <ErrorBoundary>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#5c3a58',
              fontFamily: 'Sarabun, Noto Sans Thai, sans-serif',
              borderRadius: 8,
            },
          }}
        >
          <AntApp>
            {guestAuthState === 'checking' && (
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfcf8] to-white">
                <Spin size="large" />
              </div>
            )}
            {guestAuthState === 'intro' && (
              <IntroPage
                onContinue={() => setGuestAuthState('login')}
              />
            )}
            {guestAuthState === 'login' && (
              <OTPLoginPage
                onBack={() => setGuestAuthState('intro')}
                onLoginSuccess={(user) => {
                  setGuestUser(user);
                  setGuestAuthState('authenticated');
                }}
              />
            )}
            {guestAuthState === 'authenticated' && guestUser && (
              <GuestRSVPApp
                onExitGuestMode={() => {
                  window.location.href = '/admin';
                }}
              />
            )}
          </AntApp>
        </ConfigProvider>
      </ErrorBoundary>
    );
  }

  // Admin mode: Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#ec4899',
            fontFamily: 'Sarabun, Noto Sans Thai, sans-serif',
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <SecurityCheck
            isAdminPath={isAdminPath}
            authLoading={authLoading}
            user={user}
            isAdmin={isAdmin}
            pathname={pathname}
          />
          {isAdmin ? (
            <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
              <AdminLayout
                currentView={currentView}
                setCurrentView={handlePageChange}
                onLogout={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    logger.error('Error logging out:', error);
                  }
                }}
              >
                {renderAdminContent()}
              </AdminLayout>
            </Suspense>
          ) : (
            <AdminLoginPage
              onLoginSuccess={() => {
                // Login success will be handled by useAdminAuth hook
              }}
            />
          )}
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
