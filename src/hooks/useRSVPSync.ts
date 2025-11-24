/**
 * Custom hook สำหรับ watch RSVPs และ auto-create Guests
 * ใช้ RSVPManager สำหรับ business logic
 */

import { useEffect, useRef } from 'react';
import { RSVPData } from '@/types';
import { RSVPService } from '@/services/firebase/RSVPService';
import { RSVPManager } from '@/managers/RSVPManager';

export const useRSVPSync = (isEnabled: boolean = true) => {
  // Track RSVPs ที่กำลังประมวลผลอยู่ (ป้องกัน duplicate processing)
  const processingRsvpUidsRef = useRef<Set<string>>(new Set());
  // Track RSVPs ที่สร้าง Guest แล้ว (idempotency)
  const processedRsvpUidsRef = useRef<Set<string>>(new Set());
  // Cleanup flag เพื่อป้องกัน async operations หลัง unmount
  const isMountedRef = useRef(true);
  // Manager instance
  const rsvpManagerRef = useRef<RSVPManager | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    isMountedRef.current = true;
    console.log('🔄 [RSVP Sync] เริ่ม watch RSVPs...');
    const processingSet = processingRsvpUidsRef.current;
    const processedSet = processedRsvpUidsRef.current;
    
    if (!rsvpManagerRef.current) {
      rsvpManagerRef.current = new RSVPManager();
    }
    const rsvpManager = rsvpManagerRef.current;
    const rsvpService = RSVPService.getInstance();

    const unsubscribeRSVPs = rsvpService.subscribe(async (rsvps: RSVPData[]) => {
      // ตรวจสอบว่า component ยัง mount อยู่หรือไม่
      if (!isMountedRef.current) return;
      console.log('📊 [RSVP Sync] รับข้อมูล RSVP:', rsvps.length, 'รายการ');

      // กรอง RSVPs ที่ต้องสร้าง Guest:
      // 1. isComing === 'yes'
      // 2. มี uid
      // 3. ยังไม่ถูกประมวลผล
      const rsvpsToProcess = rsvps.filter((rsvp) => {
        const hasUid = !!rsvp.uid;
        const isComing = rsvp.isComing === 'yes';
        const notProcessing = !processingSet.has(rsvp.uid || '');
        const notProcessed = !processedSet.has(rsvp.uid || '');

        return hasUid && isComing && notProcessing && notProcessed;
      });

      if (rsvpsToProcess.length === 0) {
        return;
      }

      console.log(`🔄 [RSVP Sync] พบ RSVPs ที่ต้องสร้าง Guest: ${rsvpsToProcess.length} รายการ`);

      // ประมวลผลทีละรายการ (เพื่อป้องกัน race condition)
      for (const rsvp of rsvpsToProcess) {
        const rsvpUid = rsvp.uid;
        if (!rsvpUid || !rsvp.id) continue;

        // Mark ว่ากำลังประมวลผล
        processingSet.add(rsvpUid);

        try {
          // ตรวจสอบว่า component ยัง mount อยู่หรือไม่
          if (!isMountedRef.current) return;
          
          // ใช้ RSVPManager เพื่อ sync RSVP เป็น Guest
          await rsvpManager.syncRSVPToGuest(rsvp.id);
          
          if (!isMountedRef.current) return;
          
          console.log(`✅ [RSVP Sync] Sync RSVP สำเร็จสำหรับ RSVP UID: ${rsvpUid}`);
          
          // Mark ว่าประมวลผลแล้ว
          processedSet.add(rsvpUid);
        } catch (error) {
          if (!isMountedRef.current) return;
          console.error(`❌ [RSVP Sync] เกิดข้อผิดพลาดในการประมวลผล RSVP UID: ${rsvpUid}`, error);
          // ไม่แสดง message เพื่อไม่รบกวนผู้ใช้ (เป็น background process)
        } finally {
          // ลบออกจาก processing set (ถ้ายัง mount อยู่)
          if (isMountedRef.current) {
            processingSet.delete(rsvpUid);
          }
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      console.log('🛑 [RSVP Sync] หยุด watch RSVPs');
      unsubscribeRSVPs();
      // Reset processing sets
      processingSet.clear();
      processedSet.clear();
    };
  }, [isEnabled]);
};
