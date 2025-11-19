import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AuthUser, RSVPData } from '@/types';
import WeddingCardSection from './WeddingCardSection';
import AuthGateSection from './AuthGateSection';
import RSVPFormSection from './RSVPFormSection';
import DashboardTicket from './DashboardTicket';
import { apiGetInviteConfig, apiGetRSVP, apiPostRSVP } from '@/services/api';

interface GuestRSVPAppProps {
  onExitGuestMode: () => void;
}

const STORAGE_KEY = 'invitation_config_v1';
const RSVP_STORAGE_KEY = 'rsvp_database';

const GuestRSVPApp: React.FC<GuestRSVPAppProps> = ({ onExitGuestMode }) => {
  const [mode, setMode] = useState<'auth' | 'form' | 'dashboard'>('auth');
  const [formSection, setFormSection] = useState<'all' | 'personal' | 'guests'>('all');
  const [loading, setLoading] = useState(false);
  const [authUserData, setAuthUserData] = useState<AuthUser | null>(null);
  const [currentUserRSVPData, setCurrentUserRSVPData] = useState<RSVPData | null>(null);
  const [inviteConfig, setInviteConfig] = useState<any>(undefined);

  const actionSectionRef = useRef<HTMLDivElement>(null);

  const scrollToActions = () => {
    actionSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (user: AuthUser) => {
    setAuthUserData(user);
    try {
      const existing = await apiGetRSVP(user.id);
      if (existing) {
        setCurrentUserRSVPData(existing);
        setMode('dashboard');
      } else {
        setFormSection('all');
        setMode('form');
      }
    } catch {
      // fallback localStorage
      try {
        const saved = localStorage.getItem(RSVP_STORAGE_KEY);
        const db = saved ? JSON.parse(saved) : {};
        const existingData = db[user.id] || null;
        if (existingData) {
          setCurrentUserRSVPData(existingData);
          setMode('dashboard');
        } else {
          setFormSection('all');
          setMode('form');
        }
      } catch {
        setFormSection('all');
        setMode('form');
      }
    }
    scrollToActions();
  };

  const handleFormFinish = async (values: any) => {
    if (!authUserData) return;
    setLoading(true);

    const accompanyingGuests = values.accompanyingGuests || [];
    const submittedData: RSVPData = {
      ...values,
      accompanyingGuestsCount: accompanyingGuests.length,
      accompanyingGuests: accompanyingGuests,
    };

    try {
      await apiPostRSVP(authUserData.id, submittedData);
    } catch {
      // fallback localStorage
      try {
        const saved = localStorage.getItem(RSVP_STORAGE_KEY);
        const db = saved ? JSON.parse(saved) : {};
        db[authUserData.id] = submittedData;
        localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(db));
      } catch {}
    }

    setLoading(false);
    setCurrentUserRSVPData(submittedData);
    setMode('dashboard');
    scrollToActions();
  };

  const handleEditPersonal = () => {
    setFormSection('personal');
    setMode('form');
    scrollToActions();
  };

  const handleEditGuests = () => {
    setFormSection('guests');
    setMode('form');
    scrollToActions();
  };

  const handleCancelEdit = () => {
    setMode('dashboard');
    scrollToActions();
  };

  const handleLogout = () => {
    setAuthUserData(null);
    setCurrentUserRSVPData(null);
    setMode('auth');
    scrollToTop();
  };

  const getInitialFormValues = (): Partial<RSVPData> => {
    if (currentUserRSVPData) return currentUserRSVPData;
    if (authUserData)
      return {
        firstName: authUserData.firstName,
        lastName: authUserData.lastName,
        nickname: authUserData.nickname,
        isComing: 'yes',
        side: 'groom',
        accompanyingGuestsCount: 0,
        accompanyingGuests: [],
      };
    return { isComing: 'yes', accompanyingGuestsCount: 0, accompanyingGuests: [] };
  };

  // Load invitation config (API first, fallback localStorage)
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetInviteConfig();
        setInviteConfig(data);
      } catch {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) setInviteConfig(JSON.parse(saved));
        } catch {
          setInviteConfig(undefined);
        }
      }
    })();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Back to Admin Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          type="primary"
          danger
          shape="round"
          icon={<ArrowLeftOutlined />}
          onClick={onExitGuestMode}
        >
          กลับสู่ Admin Panel
        </Button>
      </div>

      {/* Section 1: Wedding Card (Full Height) */}
      <WeddingCardSection onScrollToAction={scrollToActions} config={inviteConfig} />

      {/* Section 2: Dynamic Actions (Auth / Form / Dashboard) */}
      <div
        ref={actionSectionRef}
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 -mt-6 rounded-t-[40px] relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        {/* Decorative Pull Bar */}
        <div className="w-16 h-1.5 bg-gray-300 rounded-full mt-6 mb-2"></div>

        <div className="w-full max-w-lg">
          {mode === 'auth' && (
            <div className="py-10 px-4">
              <AuthGateSection onAuthSuccess={handleAuthSuccess} />
            </div>
          )}

          {mode === 'form' && authUserData && (
            <RSVPFormSection
              initialValues={getInitialFormValues()}
              onFinish={handleFormFinish}
              loading={loading}
              isEditing={!!currentUserRSVPData}
              loggedInName={`${authUserData.firstName} ${authUserData.lastName}`}
              activeSection={formSection}
              onCancel={handleCancelEdit}
            />
          )}

          {mode === 'dashboard' && currentUserRSVPData && (
            <DashboardTicket
              data={currentUserRSVPData}
              onEditPersonal={handleEditPersonal}
              onEditGuests={handleEditGuests}
              onLogout={handleLogout}
              onScrollTop={scrollToTop}
            />
          )}
        </div>

        <div className="mt-auto pb-6 text-center text-gray-400 text-xs">
          Powered by WeddingPlanner App
        </div>
      </div>
    </div>
  );
};

export default GuestRSVPApp;
