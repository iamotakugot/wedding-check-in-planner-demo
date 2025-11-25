/**
 * Main App Component
 * จัดการ routing และ authentication
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ConfigProvider, App as AntApp, Spin, message } from 'antd';
import AdminLoginPage from '@/pages/AdminLoginPage';
import GuestRSVPApp from '@/card/GuestRSVPApp';
import ErrorBoundary from '@/components/common/ErrorBoundary';
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
  useEffect(() => {
    if (isAdminPath && !authLoading && user && !isAdmin) {
      const isAdminLoginPage = pathname === '/admin' || pathname === '/admin/';
      if (!isAdminLoginPage) {
        message.warning('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Panel');
        window.location.href = '/';
      }
    }
  }, [isAdminPath, authLoading, user, isAdmin, pathname]);

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
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><DashboardPage /></Suspense>;
      case 'guests':
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><GuestsPage /></Suspense>;
      case 'seating':
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><SeatingPage /></Suspense>;
      case 'rsvps':
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><RSVPsPage /></Suspense>;
      case 'settings':
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><SettingsPage /></Suspense>;
      default:
        return <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}><DashboardPage /></Suspense>;
    }
  };

  // Guest mode: Show GuestRSVPApp
  if (appMode === 'guest') {
    return (
      <ErrorBoundary>
        <GuestRSVPApp
          onExitGuestMode={() => {
            window.location.href = '/admin';
          }}
        />
      </ErrorBoundary>
    );
  }

  // Admin mode: Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="กำลังตรวจสอบสิทธิ์..." />
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
          {isAdmin ? (
            <Suspense fallback={<Spin size="large" tip="กำลังโหลด..." />}>
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
