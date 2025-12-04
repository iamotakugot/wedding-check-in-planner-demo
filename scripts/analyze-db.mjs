import fs from 'fs';

// Read the exported JSON
const data = JSON.parse(fs.readFileSync('got-nan-wedding-default-rtdb-export.json', 'utf-8'));

const guests = data.guests || {};
const rsvps = data.rsvps || {};

console.log('=== DATABASE ANALYSIS ===\n');

// Count guests
const guestIds = Object.keys(guests);
console.log(`Total Guests: ${guestIds.length}`);

// Count RSVPs  
const rsvpIds = Object.keys(rsvps);
console.log(`Total RSVPs: ${rsvpIds.length}\n`);

// Count guests by isComing status
const guestsComingTrue = guestIds.filter(id => guests[id].isComing === true).length;
const guestsComingFalse = guestIds.filter(id => guests[id].isComing === false).length;
const guestsComingUndefined = guestIds.filter(id => guests[id].isComing === undefined).length;

console.log('=== GUESTS BY isComing STATUS ===');
console.log(`isComing === true: ${guestsComingTrue}`);
console.log(`isComing === false: ${guestsComingFalse}`);
console.log(`isComing === undefined: ${guestsComingUndefined}\n`);

// Count RSVPs by isComing status
const rsvpsYes = rsvpIds.filter(id => rsvps[id].isComing === 'yes').length;
const rsvpsNo = rsvpIds.filter(id => rsvps[id].isComing === 'no').length;

console.log('=== RSVPs BY STATUS ===');
console.log(`isComing === 'yes': ${rsvpsYes}`);
console.log(`isComing === 'no': ${rsvpsNo}\n`);

// Calculate expected guest count from RSVPs
let expectedFromRSVPs = 0;
rsvpIds.forEach(id => {
    const rsvp = rsvps[id];
    if (rsvp.isComing === 'yes') {
        // Main guest + accompanying guests
        expectedFromRSVPs += 1 + (rsvp.accompanyingGuestsCount || 0);
    }
});

console.log('=== EXPECTED COUNTS ===');
console.log(`Expected guests from RSVPs (yes): ${expectedFromRSVPs}`);
console.log(`Actual guests with isComing=true: ${guestsComingTrue}`);
console.log(`Difference: ${guestsComingTrue - expectedFromRSVPs}\n`);

// Find duplicate guests (same rsvpUid)
const guestsByRsvpUid = {};
guestIds.forEach(id => {
    const guest = guests[id];
    if (guest.rsvpUid) {
        if (!guestsByRsvpUid[guest.rsvpUid]) {
            guestsByRsvpUid[guest.rsvpUid] = [];
        }
        guestsByRsvpUid[guest.rsvpUid].push(id);
    }
});

console.log('=== DUPLICATE DETECTION ===');
const duplicates = Object.entries(guestsByRsvpUid).filter(([_, ids]) => ids.length > 5); // More than expected for a group
console.log(`RSVPs with suspicious guest counts (>5): ${duplicates.length}`);
duplicates.forEach(([rsvpUid, ids]) => {
    console.log(`  - RSVP ${rsvpUid}: ${ids.length} guests`);
});

console.log('\n=== RECOMMENDATION ===');
if (guestsComingTrue === expectedFromRSVPs) {
    console.log('✅ Data is correct! No cleanup needed.');
} else if (guestsComingTrue < expectedFromRSVPs) {
    console.log('⚠️  Missing guests. Should sync from RSVPs.');
} else {
    console.log(`❌ ${guestsComingTrue - expectedFromRSVPs} duplicate/extra guests detected!`);
    console.log('   Recommendation: Delete all guests and re-sync from RSVPs');
}
