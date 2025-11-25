/**
 * Custom hook สำหรับ Countdown Timer
 * คำนวณเวลาที่เหลือจนถึงวันงานแต่งงานและอัปเดตทุก 1 วินาที
 */

import { useEffect, useState } from 'react';

function getTimeDiff(weddingDate: string) {
  // Support both ISO format และ slash format
  const targetDate = new Date(weddingDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, targetDate - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  
  return { days, hours, mins, secs };
}

export function useCountdown(weddingDate: string | null | undefined) {
  const [time, setTime] = useState(() => {
    if (!weddingDate) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return getTimeDiff(weddingDate);
  });

  useEffect(() => {
    if (!weddingDate) return;
    
    const timer = setInterval(() => {
      setTime(getTimeDiff(weddingDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  return time;
}

