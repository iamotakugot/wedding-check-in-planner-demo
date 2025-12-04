/**
 * Custom hook สำหรับ watch RSVPs และ auto-create Guests
 * ใช้ RSVPManager สำหรับ business logic
 */

import { useEffect, useRef } from 'react';
import { RSVPData } from '@/types';
import { RSVPService } from '@/services/firebase/RSVPService';
import { RSVPManager } from '@/managers/RSVPManager';
import { logger } from '@/utils/logger';

// Module-level cache to survive Strict Mode remounts
const globalProcessingSet = new Set<string>();
const globalProcessedSet = new Set<string>();

export const useRSVPSync = (isEnabled: boolean = true) => {
  // Cleanup flag เพื่อป้องกัน async operations หลัง unmount
  const isMountedRef = useRef(true);
  // Manager instance
  const rsvpManagerRef = useRef<RSVPManager | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    isMountedRef.current = true;
    logger.log('🔄 [RSVP Sync] เริ่ม watch RSVPs...');

    // Use global sets
    const processingSet = globalProcessingSet;
    const processedSet = globalProcessedSet;

    if (!rsvpManagerRef.current) {
      rsvpManagerRef.current = new RSVPManager();
    }
    const rsvpManager = rsvpManagerRef.current;
    const rsvpService = RSVPService.getInstance();

    const unsubscribeRSVPs = rsvpService.subscribe(async (rsvps: RSVPData[]) => {
      // ตรวจสอบว่า component ยัง mount อยู่หรือไม่
      if (!isMountedRef.current) return;
      logger.log('📊 [RSVP Sync] รับข้อมูล RSVP:', rsvps.length, 'รายการ');

      // กรอง RSVPs ที่ต้องสร้าง Guest:
      // 1. isComing === 'yes'
      // 2. มี uid
      // 3. ยังไม่ถูกประมวลผล (ใน session นี้)
      const rsvpsToProcess = rsvps.filter((rsvp) => {
        const hasUid = !!rsvp.uid;
        const isComing = rsvp.isComing === 'yes';
        // Note: เราเอา notSynced ออกเพื่อให้ Manager เป็นคนเช็คว่า Guest มีอยู่จริงไหม
        // ถ้า Guest ถูกลบไปแล้ว Manager จะได้สร้างใหม่ให้
        const notProcessing = !processingSet.has(rsvp.uid || '');
        const notProcessed = !processedSet.has(rsvp.uid || '');

        return hasUid && isComing && notProcessing && notProcessed;
      });

      if (rsvpsToProcess.length === 0) {
        return;
      }

      logger.log(`🔄 [RSVP Sync] พบ RSVPs ที่ต้องสร้าง Guest: ${rsvpsToProcess.length} รายการ`);

      // ประมวลผลทีละรายการ (เพื่อป้องกัน race condition)
      for (const rsvp of rsvpsToProcess) {
        const rsvpUid = rsvp.uid;
        if (!rsvpUid || !rsvp.id) continue;

        // 🔒 Double-check locking inside loop (สำคัญมากสำหรับ concurrent processing)
        // เพราะระหว่างที่รอ await ใน loop รอบก่อนหน้า อาจมี instance อื่นเริ่มทำรายการนี้ไปแล้ว
        if (processingSet.has(rsvpUid) || processedSet.has(rsvpUid)) {
          continue;
        }

        // Mark ว่ากำลังประมวลผล
        processingSet.add(rsvpUid);

        try {
          // ตรวจสอบว่า component ยัง mount อยู่หรือไม่
          if (!isMountedRef.current) return;

          // ใช้ RSVPManager เพื่อ sync RSVP เป็น Guest
          await rsvpManager.syncRSVPToGuest(rsvp.id);

          if (!isMountedRef.current) return;

          logger.log(`✅ [RSVP Sync] Sync RSVP สำเร็จสำหรับ RSVP UID: ${rsvpUid}`);

          // Mark ว่าประมวลผลแล้ว
          processedSet.add(rsvpUid);
        } catch (error) {
          if (!isMountedRef.current) return;
          logger.error(`❌ [RSVP Sync] เกิดข้อผิดพลาดในการประมวลผล RSVP UID: ${rsvpUid}`, error);
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
      logger.log('🛑 [RSVP Sync] หยุด watch RSVPs');
      unsubscribeRSVPs();
      // Note: ไม่ clear global sets เพื่อให้จำ state ได้แม้ component จะ remount (Strict Mode)
    };
  }, [isEnabled]);
};
