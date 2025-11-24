import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getUserAppState, 
  updateUserAppState, 
  subscribeUserAppState,
  getCurrentUser,
  onAuthStateChange
} from '@/services/firebaseService';

// Music Playlist Configuration
const PLAYLIST = [
  { 
    id: '7fKN5KWuAAQ', // รักนาน ๆ - พัด Vorapat x Dome Jaruwat
    title: 'รักนาน ๆ', 
    artist: 'พัด Vorapat x Dome Jaruwat',
    cover: 'https://img.youtube.com/vi/7fKN5KWuAAQ/0.jpg'
  }
];

export interface MusicPlayerControls {
  isPlaying: boolean;
  currentTrack: typeof PLAYLIST[0];
  onToggleMusic: () => void;
  onNext: () => void;
  onPrev: () => void;
}

interface MusicPlayerProps {
  showIntro: boolean;
  onStart: () => void;
  children: (controls: MusicPlayerControls) => React.ReactNode;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ showIntro, onStart, children }) => {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  
  // Refs เพื่อป้องกัน infinite loop
  const isManualControlRef = React.useRef(false);
  const lastMusicStateRef = React.useRef(musicPlaying);
  const autoPlayAttemptedRef = React.useRef(false);
  
  const currentTrack = PLAYLIST[currentTrackIndex];
  
  // Helper to send commands to YouTube iframe
  const sendCommand = useCallback((func: string, args: unknown[] = [], requireReady = false) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      if (!requireReady || iframeReady) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }), 
          '*'
        );
      }
    }
  }, [iframeReady]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setTimeout(() => {
      setIframeReady(true);
    }, 1500);
  };

  // Load และ sync music state จาก Firebase Realtime Database เมื่อ login
  useEffect(() => {
    let isMounted = true;
    let unsubscribeState: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChange((user) => {
      if (!isMounted) return;
      
      if (unsubscribeState) {
        unsubscribeState();
        unsubscribeState = null;
      }
      
      if (user) {
        getUserAppState(user.uid)
          .then((state) => {
            if (!isMounted) return;
            if (state) {
              if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
              if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
            }
          })
          .catch((error) => {
            console.error('Error loading app state:', error);
          });

        unsubscribeState = subscribeUserAppState(user.uid, (state) => {
          if (!isMounted) return;
          if (state) {
            if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
            if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
          }
        });
      } else {
        setMusicPlaying(false);
        setCurrentTrackIndex(0);
      }
    });

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
    const user = getCurrentUser();
    if (!user) return;
    
    const timeoutId = setTimeout(() => {
      updateUserAppState(user.uid, { musicPlaying })
        .catch((error) => {
          console.error('Error saving musicPlaying state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [musicPlaying]);

  // Save currentTrackIndex ไปยัง Firebase Realtime Database
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    
    const timeoutId = setTimeout(() => {
      updateUserAppState(user.uid, { currentTrackIndex })
        .catch((error) => {
          console.error('Error saving currentTrackIndex state:', error);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentTrackIndex]);

  const handleStart = () => {
    isManualControlRef.current = true;
    setMusicPlaying(true);
    lastMusicStateRef.current = true;
    autoPlayAttemptedRef.current = false;
    setTimeout(() => {
      sendCommand('playVideo', [], false);
      setTimeout(() => {
        isManualControlRef.current = false;
      }, 500);
    }, 100);
    onStart();
  };

  const onToggleMusic = () => {
    isManualControlRef.current = true;
    
    const newState = !musicPlaying;
    
    if (newState) {
      sendCommand('playVideo', [], false);
    } else {
      sendCommand('pauseVideo', [], false);
    }
    
    setMusicPlaying(newState);
    lastMusicStateRef.current = newState;
    
    setTimeout(() => {
      isManualControlRef.current = false;
    }, 500);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    sendCommand('loadVideoById', [PLAYLIST[nextIndex].id], false);
    if (!musicPlaying) setMusicPlaying(true);
  };

  const handlePrev = () => {
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    sendCommand('loadVideoById', [PLAYLIST[prevIndex].id], false);
    if (!musicPlaying) setMusicPlaying(true);
  };
  
  // รวม logic การเล่นเพลงทั้งหมดใน useEffect เดียวเพื่อป้องกัน infinite loop
  useEffect(() => {
    if (isManualControlRef.current) {
      return;
    }
    
    if (lastMusicStateRef.current === musicPlaying) {
      return;
    }
    
    lastMusicStateRef.current = musicPlaying;
    
    if (showIntro || !iframeRef.current) {
      return;
    }
    
    if (musicPlaying && !autoPlayAttemptedRef.current && iframeReady) {
      let attempts = 0;
      const maxAttempts = 5;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      const tryPlay = () => {
        if (isManualControlRef.current || !iframeRef.current || !iframeReady) {
          return;
        }
        
        attempts++;
        if (attempts <= maxAttempts) {
          sendCommand('playVideo', [], true);
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(tryPlay, 500 + (attempts * 200));
          } else {
            autoPlayAttemptedRef.current = true;
          }
        } else {
          autoPlayAttemptedRef.current = true;
        }
      };
      
      timeoutId = setTimeout(() => {
        tryPlay();
      }, 800);
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else if (!musicPlaying && iframeReady) {
      sendCommand('pauseVideo', [], false);
      autoPlayAttemptedRef.current = false;
    } else if (musicPlaying && iframeReady && !autoPlayAttemptedRef.current) {
      sendCommand('playVideo', [], false);
    }
    
    if (!musicPlaying) {
      autoPlayAttemptedRef.current = false;
    }
  }, [musicPlaying, showIntro, iframeReady, sendCommand]);

  // Listen for YouTube player state changes to sync UI
  useEffect(() => {
    if (!showIntro && iframeRef.current) {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://www.youtube.com') return;
        
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.event === 'onStateChange') {
            if (data.info === 1) {
              setMusicPlaying(true);
            } else if (data.info === 2) {
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
      {/* Hidden YouTube Player for Audio */}
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

