// นำเข้า React hooks ที่จำเป็น
import React, { useState, useEffect, useCallback } from 'react';
// นำเข้า Firebase service functions สำหรับจัดการ app state
import { getUserAppState, updateUserAppState, subscribeUserAppState } from '@/services/firebase/appState';
import { AuthService } from '@/services/firebase/AuthService';
import { logger } from '@/utils/logger';

// Music Playlist Configuration - รายการเพลงที่ใช้ในงานแต่งงาน
const PLAYLIST = [
  { 
    id: '7fKN5KWuAAQ', // รักนาน ๆ - พัด Vorapat x Dome Jaruwat
    title: 'รักนาน ๆ', 
    artist: 'พัด Vorapat x Dome Jaruwat',
    cover: 'https://img.youtube.com/vi/7fKN5KWuAAQ/0.jpg'
  }
];

// Interface สำหรับ controls ที่ส่งให้ children component
export interface MusicPlayerControls {
  isPlaying: boolean; // สถานะการเล่นเพลง
  currentTrack: typeof PLAYLIST[0]; // เพลงปัจจุบัน
  onToggleMusic: () => void; // ฟังก์ชันสำหรับเปิด/ปิดเพลง
  onNext: () => void; // ฟังก์ชันสำหรับเล่นเพลงถัดไป
  onPrev: () => void; // ฟังก์ชันสำหรับเล่นเพลงก่อนหน้า
}

// Interface สำหรับ props ของ MusicPlayer
interface MusicPlayerProps {
  showIntro: boolean; // แสดง intro หรือไม่
  children: (controls: MusicPlayerControls) => React.ReactNode; // Render prop pattern
}

// Component สำหรับเล่นเพลงผ่าน YouTube iframe
export const MusicPlayer: React.FC<MusicPlayerProps> = ({ showIntro, children }) => {
  // State สำหรับสถานะการเล่นเพลง
  const [musicPlaying, setMusicPlaying] = useState(false);
  // State สำหรับ index ของเพลงปัจจุบัน
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  // Ref สำหรับ YouTube iframe
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  // State สำหรับตรวจสอบว่า iframe พร้อมใช้งานหรือไม่
  const [iframeReady, setIframeReady] = useState(false);
  
  // Refs เพื่อป้องกัน infinite loop
  const isManualControlRef = React.useRef(false); // ตรวจสอบว่าผู้ใช้ควบคุมเองหรือไม่
  const lastMusicStateRef = React.useRef(musicPlaying); // เก็บสถานะล่าสุด
  const autoPlayAttemptedRef = React.useRef(false); // ตรวจสอบว่าได้ลอง autoplay แล้วหรือไม่
  
  // eslint-disable-next-line security/detect-object-injection
  const currentTrack = PLAYLIST[currentTrackIndex];
  
  // Helper function สำหรับส่งคำสั่งไปยัง YouTube iframe
  const sendCommand = useCallback((func: string, args: unknown[] = [], requireReady = false) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      if (!requireReady || iframeReady) {
        // ส่งคำสั่งผ่าน postMessage API
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }), 
          '*'
        );
      }
    }
  }, [iframeReady]);

  // Handle iframe load event - เมื่อ iframe โหลดเสร็จ
  const handleIframeLoad = () => {
    // รอ 1.5 วินาทีเพื่อให้ YouTube player พร้อมใช้งาน
    setTimeout(() => {
      setIframeReady(true);
    }, 1500);
  };

  // Load และ sync music state จาก Firebase Realtime Database เมื่อ login
  useEffect(() => {
    let isMounted = true;
    let unsubscribeState: (() => void) | null = null;

    // Subscribe เพื่อรับการเปลี่ยนแปลง authentication state
    const unsubscribeAuth = AuthService.getInstance().onAuthStateChange((user) => {
      if (!isMounted) return;
      
      // Unsubscribe จาก state subscription เก่าก่อน
      if (unsubscribeState) {
        unsubscribeState();
        unsubscribeState = null;
      }
      
      if (user) {
        // Load initial state จาก Firebase
        getUserAppState(user.uid)
          .then((state) => {
            if (!isMounted) return;
            if (state) {
              if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
              if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
            }
          })
          .catch((error) => {
            logger.error('Error loading app state:', error);
          });

        // Subscribe เพื่อรับการเปลี่ยนแปลง state แบบ real-time
        unsubscribeState = subscribeUserAppState(user.uid, (state) => {
          if (!isMounted) return;
          if (state) {
            if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
            if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
          }
        });
      } else {
        // ถ้าไม่มี user ให้ reset state
        setMusicPlaying(false);
        setCurrentTrackIndex(0);
      }
    });

    // Cleanup เมื่อ component unmount
    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeState) {
        unsubscribeState();
        unsubscribeState = null;
      }
    };
  }, []);

  // Save music playing state ไปยัง Firebase Realtime Database
  useEffect(() => {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) return;
    
    // ใช้ debounce เพื่อป้องกันการ update บ่อยเกินไป
    const timeoutId = setTimeout(() => {
      updateUserAppState(user.uid, { musicPlaying })
        .catch((error) => {
          logger.error('Error saving musicPlaying state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [musicPlaying]);

  // Save currentTrackIndex ไปยัง Firebase Realtime Database
  useEffect(() => {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) return;
    
    // ใช้ debounce เพื่อป้องกันการ update บ่อยเกินไป
    const timeoutId = setTimeout(() => {
      updateUserAppState(user.uid, { currentTrackIndex })
        .catch((error) => {
          logger.error('Error saving currentTrackIndex state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentTrackIndex]);

  // handleStart function removed - not used in the component

  // ฟังก์ชันสำหรับเปิด/ปิดเพลง
  const onToggleMusic = () => {
    isManualControlRef.current = true;
    
    const newState = !musicPlaying;
    
    // ส่งคำสั่งไปยัง YouTube iframe
    if (newState) {
      sendCommand('playVideo', [], false);
    } else {
      sendCommand('pauseVideo', [], false);
    }
    
    setMusicPlaying(newState);
    lastMusicStateRef.current = newState;
    
    // Reset flag หลังจาก 500ms
    setTimeout(() => {
      isManualControlRef.current = false;
    }, 500);
  };

  // ฟังก์ชันสำหรับเล่นเพลงถัดไป
  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    // eslint-disable-next-line security/detect-object-injection
    sendCommand('loadVideoById', [PLAYLIST[nextIndex].id], false);
    if (!musicPlaying) setMusicPlaying(true);
  };

  // ฟังก์ชันสำหรับเล่นเพลงก่อนหน้า
  const handlePrev = () => {
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    // eslint-disable-next-line security/detect-object-injection
    sendCommand('loadVideoById', [PLAYLIST[prevIndex].id], false);
    if (!musicPlaying) setMusicPlaying(true);
  };
  
  // รวม logic การเล่นเพลงทั้งหมดใน useEffect เดียวเพื่อป้องกัน infinite loop
  useEffect(() => {
    // ข้ามถ้าผู้ใช้ควบคุมเอง
    if (isManualControlRef.current) {
      return;
    }
    
    // ข้ามถ้าสถานะไม่เปลี่ยน
    if (lastMusicStateRef.current === musicPlaying) {
      return;
    }
    
    lastMusicStateRef.current = musicPlaying;
    
    // ข้ามถ้ายังแสดง intro หรือ iframe ยังไม่พร้อม
    if (showIntro || !iframeRef.current) {
      return;
    }
    
    // ถ้าต้องการเล่นเพลงและยังไม่ได้ลอง autoplay
    if (musicPlaying && !autoPlayAttemptedRef.current && iframeReady) {
      let attempts = 0;
      const maxAttempts = 5;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // ฟังก์ชันสำหรับลองเล่นเพลง (retry mechanism)
      const tryPlay = () => {
        if (isManualControlRef.current || !iframeRef.current || !iframeReady) {
          return;
        }
        
        attempts++;
        if (attempts <= maxAttempts) {
          sendCommand('playVideo', [], true);
          if (attempts < maxAttempts) {
            // Retry ด้วย delay ที่เพิ่มขึ้น
            timeoutId = setTimeout(tryPlay, 500 + (attempts * 200));
          } else {
            autoPlayAttemptedRef.current = true;
          }
        } else {
          autoPlayAttemptedRef.current = true;
        }
      };
      
      // เริ่มลองเล่นหลังจาก 800ms
      timeoutId = setTimeout(() => {
        tryPlay();
      }, 800);
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else if (!musicPlaying && iframeReady) {
      // ถ้าต้องการหยุดเพลง
      sendCommand('pauseVideo', [], false);
      autoPlayAttemptedRef.current = false;
    } else if (musicPlaying && iframeReady) {
      // ถ้าต้องการเล่นเพลง (กรณีที่ autoplay ล้มเหลว)
      sendCommand('playVideo', [], false);
    }
    
    if (!musicPlaying) {
      autoPlayAttemptedRef.current = false;
    }
  }, [musicPlaying, showIntro, iframeReady, sendCommand]);

  // Listen for YouTube player state changes to sync UI
  useEffect(() => {
    if (!showIntro && iframeRef.current) {
      // Handler สำหรับรับ message จาก YouTube iframe
      const handleMessage = (event: MessageEvent) => {
        // ตรวจสอบ origin เพื่อความปลอดภัย
        if (event.origin !== 'https://www.youtube.com') return;
        
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // ตรวจสอบ state change event
          if (data.event === 'onStateChange') {
            if (data.info === 1) {
              // State 1 = playing
              setMusicPlaying(true);
            } else if (data.info === 2) {
              // State 2 = paused
              setMusicPlaying(false);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [showIntro]);

  return (
    <>
      {/* Hidden YouTube Player for Audio - YouTube iframe ที่ซ่อนไว้สำหรับเล่นเสียง */}
      <div style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0.01, zIndex: 50, bottom: 0, right: 0, pointerEvents: 'none' }}>
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${PLAYLIST[0].id}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&origin=${window.location.origin}`}
          title="Wedding Music"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      </div>
      {/* Render children component พร้อม controls */}
      {children({
        isPlaying: musicPlaying,
        currentTrack,
        onToggleMusic,
        onNext: handleNext,
        onPrev: handlePrev,
      })}
    </>
  );
};

export { PLAYLIST };
