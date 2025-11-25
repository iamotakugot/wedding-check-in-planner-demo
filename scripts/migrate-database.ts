/**
 * Database Migration Script
 * แปลงข้อมูลเก่าเป็นรูปแบบใหม่
 * 
 * Usage: npx ts-node scripts/migrate-database.ts
 */

import { ref, get, update } from 'firebase/database';
import { database } from '../src/firebase/config';

interface OldGuest {
  rsvpUid?: string | null;
  [key: string]: unknown;
}

interface OldRSVP {
  uid?: string;
  [key: string]: unknown;
}

/**
 * Migration: เพิ่ม rsvpId ใน Guest (ถ้ายังไม่มี)
 * และอัปเดต RSVP ให้มี guestId (ถ้ายังไม่มี)
 */
async function migrateGuestRSVPLinks() {
  console.log('🔄 [Migration] เริ่ม migration Guest-RSVP links...');

  try {
    // ดึงข้อมูล Guests
    const guestsSnapshot = await get(ref(database, 'guests'));
    if (!guestsSnapshot.exists()) {
      console.log('✅ [Migration] ไม่พบ Guests ในระบบ');
      return;
    }

    const guests = guestsSnapshot.val();
    const guestIds = Object.keys(guests);

    // ดึงข้อมูล RSVPs
    const rsvpsSnapshot = await get(ref(database, 'rsvps'));
    if (!rsvpsSnapshot.exists()) {
      console.log('✅ [Migration] ไม่พบ RSVPs ในระบบ');
      return;
    }

    const rsvps = rsvpsSnapshot.val();
    const rsvpIds = Object.keys(rsvps);

    let updatedGuests = 0;
    let updatedRSVPs = 0;

    // อัปเดต Guests: เพิ่ม rsvpId จาก rsvpUid
    for (const guestId of guestIds) {
      const guest = guests[guestId] as OldGuest;
      if (guest.rsvpUid && !guest.rsvpId) {
        // หา RSVP ที่มี uid ตรงกับ rsvpUid
        const matchingRSVP = rsvpIds.find(rsvpId => {
          const rsvp = rsvps[rsvpId] as OldRSVP;
          return rsvp.uid === guest.rsvpUid;
        });

        if (matchingRSVP) {
          await update(ref(database, `guests/${guestId}`), {
            rsvpId: matchingRSVP,
          });
          updatedGuests++;
          console.log(`✅ [Migration] อัปเดต Guest ${guestId}: เพิ่ม rsvpId = ${matchingRSVP}`);
        }
      }
    }

    // อัปเดต RSVPs: เพิ่ม guestId (ถ้ายังไม่มี)
    for (const rsvpId of rsvpIds) {
      const rsvp = rsvps[rsvpId] as OldRSVP;
      if (rsvp.uid && !rsvp.guestId) {
        // หา Guest ที่มี rsvpUid ตรงกับ rsvp.uid
        const matchingGuest = guestIds.find(guestId => {
          const guest = guests[guestId] as OldGuest;
          return guest.rsvpUid === rsvp.uid;
        });

        if (matchingGuest) {
          await update(ref(database, `rsvps/${rsvpId}`), {
            guestId: matchingGuest,
          });
          updatedRSVPs++;
          console.log(`✅ [Migration] อัปเดต RSVP ${rsvpId}: เพิ่ม guestId = ${matchingGuest}`);
        }
      }
    }

    console.log(`✅ [Migration] Migration เสร็จสิ้น:`);
    console.log(`   - อัปเดต Guests: ${updatedGuests} รายการ`);
    console.log(`   - อัปเดต RSVPs: ${updatedRSVPs} รายการ`);
  } catch (error) {
    console.error('❌ [Migration] เกิดข้อผิดพลาด:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 [Migration] เริ่ม migration database...');
  console.log('⚠️  [Migration] กรุณาตรวจสอบว่าได้ backup ข้อมูลแล้ว');

  try {
    await migrateGuestRSVPLinks();
    console.log('✅ [Migration] Migration เสร็จสิ้นทั้งหมด');
  } catch (error) {
    console.error('❌ [Migration] Migration ล้มเหลว:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

export { migrateGuestRSVPLinks };

