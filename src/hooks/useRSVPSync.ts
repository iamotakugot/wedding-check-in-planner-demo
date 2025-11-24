import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { RSVPData, Guest } from '@/types';
import {
  subscribeRSVPs,
  createGuest,
  updateRSVP,
  getGuestByRsvpUid,
} from '@/services/firebaseService';

/**
 * Custom hook สำหรับ watch RSVPs และ auto-create Guests
 * ตรวจสอบ duplicate ก่อนสร้างเพื่อป้องกัน infinite loops
 */
export const useRSVPSync = (isEnabled: boolean = true) => {
  // Track RSVPs ที่กำลังประมวลผลอยู่ (ป้องกัน duplicate processing)
  const processingRsvpUidsRef = useRef<Set<string>>(new Set());
  // Track RSVPs ที่สร้าง Guest แล้ว (idempotency)
  const processedRsvpUidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEnabled) return;

    console.log('🔄 [RSVP Sync] เริ่ม watch RSVPs...');

    const unsubscribeRSVPs = subscribeRSVPs(async (rsvps: RSVPData[]) => {
      console.log('📊 [RSVP Sync] รับข้อมูล RSVP:', rsvps.length, 'รายการ');

      // กรอง RSVPs ที่ต้องสร้าง Guest:
      // 1. isComing === 'yes'
      // 2. ยังไม่มี guestId
      // 3. มี uid
      // 4. ยังไม่เคยประมวลผล
      const rsvpsToProcess = rsvps.filter((rsvp) => {
        const hasUid = !!rsvp.uid;
        const isComing = rsvp.isComing === 'yes';
        const hasNoGuestId = !rsvp.guestId;
        const notProcessing = !processingRsvpUidsRef.current.has(rsvp.uid || '');
        const notProcessed = !processedRsvpUidsRef.current.has(rsvp.uid || '');

        return hasUid && isComing && hasNoGuestId && notProcessing && notProcessed;
      });

      if (rsvpsToProcess.length === 0) {
        return;
      }

      console.log(`🔄 [RSVP Sync] พบ RSVPs ที่ต้องสร้าง Guest: ${rsvpsToProcess.length} รายการ`);

      // ประมวลผลทีละรายการ (เพื่อป้องกัน race condition)
      for (const rsvp of rsvpsToProcess) {
        const rsvpUid = rsvp.uid;
        if (!rsvpUid) continue;

        // Mark ว่ากำลังประมวลผล
        processingRsvpUidsRef.current.add(rsvpUid);

        try {
          // 🔧 Idempotency Check: เช็คว่ามี Guest ที่มี rsvpUid นี้อยู่แล้วหรือไม่
          console.log(`🔍 [RSVP Sync] กำลังตรวจสอบ Guest ที่มีอยู่แล้วสำหรับ RSVP UID: ${rsvpUid}`);
          const existingGuest = await getGuestByRsvpUid(rsvpUid);

          if (existingGuest) {
            console.log(`✅ [RSVP Sync] พบ Guest ที่มีอยู่แล้ว: ${existingGuest.id} - เชื่อมโยง RSVP`);
            
            // Link RSVP กับ Guest ที่มีอยู่
            if (rsvp.id) {
              await updateRSVP(rsvp.id, { guestId: existingGuest.id });
            }
            
            // Mark ว่าประมวลผลแล้ว
            processedRsvpUidsRef.current.add(rsvpUid);
            processingRsvpUidsRef.current.delete(rsvpUid);
            continue;
          }

          // สร้าง Guest ใหม่
          console.log(`🔄 [RSVP Sync] กำลังสร้าง Guest สำหรับ RSVP UID: ${rsvpUid}`);

          // สร้างกลุ่ม (Group) จาก RSVP
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
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
            isComing: true,
            accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
            groupId: groupId,
            groupName: groupName,
            checkedInAt: null,
            checkInMethod: null,
            rsvpUid: rsvpUid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await createGuest(mainGuest);
          console.log(`✅ [RSVP Sync] สร้าง Guest หลักสำเร็จ: ${mainGuestId}`);

          // 2. สร้าง Guest สำหรับผู้ติดตาม (accompanyingGuests)
          if (rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0) {
            console.log(`🔄 [RSVP Sync] กำลังสร้าง Guest ผู้ติดตาม ${rsvp.accompanyingGuests.length} คน...`);
            
            for (let i = 0; i < rsvp.accompanyingGuests.length; i++) {
              try {
                const accGuest = rsvp.accompanyingGuests[i];
                const accGuestId = `G${timestamp}_${random}_${i}`;
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
                  rsvpUid: rsvpUid,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await createGuest(accGuestData);
                console.log(`✅ [RSVP Sync] สร้าง Guest ผู้ติดตาม ${i + 1}/${rsvp.accompanyingGuests.length} สำเร็จ: ${accGuestId}`);
              } catch (accError: unknown) {
                console.error(`❌ [RSVP Sync] เกิดข้อผิดพลาดในการสร้าง Guest ผู้ติดตาม ${i + 1}:`, accError);
                // ยังคงดำเนินการต่อแม้ว่าจะเกิด error
                if (accError && typeof accError === 'object' && 'code' in accError && accError.code === 'PERMISSION_DENIED') {
                  console.error(`🚫 [RSVP Sync] Permission denied สำหรับ Guest ผู้ติดตาม ${i + 1} - ตรวจสอบ Firebase Rules`);
                }
              }
            }
            console.log(`✅ [RSVP Sync] สร้าง Guest ผู้ติดตามเสร็จสิ้น (${rsvp.accompanyingGuests.length} คน)`);
          }

          // 3. Link RSVP กับ Guest หลัก
          if (rsvp.id) {
            await updateRSVP(rsvp.id, { guestId: mainGuestId });
          }

          console.log(`✅ [RSVP Sync] สร้าง Guest สำเร็จสำหรับ RSVP UID: ${rsvpUid} (${totalGuests} คน)`);
          
          // Mark ว่าประมวลผลแล้ว
          processedRsvpUidsRef.current.add(rsvpUid);
        } catch (error) {
          console.error(`❌ [RSVP Sync] เกิดข้อผิดพลาดในการประมวลผล RSVP UID: ${rsvpUid}`, error);
          // ไม่แสดง message เพื่อไม่รบกวนผู้ใช้ (เป็น background process)
        } finally {
          // ลบออกจาก processing set
          processingRsvpUidsRef.current.delete(rsvpUid);
        }
      }
    });

    return () => {
      console.log('🛑 [RSVP Sync] หยุด watch RSVPs');
      unsubscribeRSVPs();
      // Reset processing sets
      processingRsvpUidsRef.current.clear();
      processedRsvpUidsRef.current.clear();
    };
  }, [isEnabled]);
};


