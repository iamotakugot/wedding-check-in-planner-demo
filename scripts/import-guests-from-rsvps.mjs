/**
 * Import Guests from RSVPs (One-time script)
 * สร้าง Guest entries จาก RSVPs ที่ตอบรับมา
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin
const serviceAccount = require('../wedding-planner-firebase-adminsdk.json');

initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

const db = getDatabase();

function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function importGuestsFromRSVPs() {
    console.log('🔍 Reading RSVPs from database...\n');

    const rsvpsRef = db.ref('rsvps');
    const snapshot = await rsvpsRef.once('value');
    const rsvpsData = snapshot.val();

    if (!rsvpsData) {
        console.log('❌ No RSVPs found');
        return;
    }

    const rsvps = Object.values(rsvpsData);
    console.log(`📊 Total RSVPs: ${rsvps.length}`);

    // Filter only 'yes' responses
    const comingRSVPs = rsvps.filter(r => r.isComing === 'yes');
    console.log(`✅ Coming: ${comingRSVPs.length}`);
    console.log(`❌ Not coming: ${rsvps.length - comingRSVPs.length}\n`);

    // Calculate expected guest count
    let expectedCount = 0;
    comingRSVPs.forEach(rsvp => {
        expectedCount += 1; // Main guest
        expectedCount += (rsvp.accompanyingGuestsCount || 0); // Accompanying
    });

    console.log(`👥 Expected guests: ${expectedCount}\n`);
    console.log('📝 Creating guest entries...\n');

    const guestsRef = db.ref('guests');
    let createdCount = 0;

    for (const rsvp of comingRSVPs) {
        const groupId = `GROUP_${generateId()}`;
        const groupName = `${rsvp.firstName} ${rsvp.lastName}`;

        // Create main guest
        const mainGuestId = generateId();
        const mainGuest = {
            id: mainGuestId,
            firstName: rsvp.firstName,
            lastName: rsvp.lastName,
            nickname: rsvp.nickname || '',
            age: null,
            gender: 'other',
            relationToCouple: rsvp.relation || '',
            side: rsvp.side,
            zoneId: null,
            tableId: null,
            note: rsvp.note || '',
            isComing: true,
            accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
            groupId: groupId,
            groupName: groupName,
            checkedInAt: null,
            checkInMethod: null,
            rsvpUid: rsvp.uid,
            rsvpId: rsvp.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await guestsRef.child(mainGuestId).set(mainGuest);
        createdCount++;

        // Create accompanying guests
        if (rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0) {
            for (let i = 0; i < rsvp.accompanyingGuests.length; i++) {
                const acc = rsvp.accompanyingGuests[i];
                const accGuestId = generateId();

                const accGuest = {
                    id: accGuestId,
                    firstName: acc.name || `คนที่ ${i + 1}`,
                    lastName: '',
                    nickname: '',
                    age: null,
                    gender: 'other',
                    relationToCouple: acc.relationToMain || '',
                    side: rsvp.side,
                    zoneId: null,
                    tableId: null,
                    note: '',
                    isComing: true,
                    accompanyingGuestsCount: 0,
                    groupId: groupId,
                    groupName: groupName,
                    checkedInAt: null,
                    checkInMethod: null,
                    rsvpUid: rsvp.uid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                await guestsRef.child(accGuestId).set(accGuest);
                createdCount++;
            }
        }

        // Update RSVP with guestId link
        await rsvpsRef.child(rsvp.id).update({ guestId: mainGuestId });

        console.log(`  ✓ ${groupName} (${1 + (rsvp.accompanyingGuestsCount || 0)} guests)`);
    }

    console.log(`\n✨ Done! Created ${createdCount} guests`);
    console.log(`   Expected: ${expectedCount}`);
    console.log(`   Match: ${createdCount === expectedCount ? '✅' : '❌'}`);
}

// Run the script
importGuestsFromRSVPs()
    .then(() => {
        console.log('\n🎉 Import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
