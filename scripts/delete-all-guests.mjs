/**
 * Script to delete all guests from Firebase Realtime Database
 * This will NOT affect:
 * - RSVPs data
 * - Guest profiles (login)
 * - Authentication
 * - Wedding card data
 * - Tables/Zones
 * 
 * SAFE TO RUN: Can be rolled back from backup export file
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as readline from 'readline';

// Initialize Firebase Admin
const serviceAccount = require('../wedding-planner-firebase-adminsdk.json');

initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

const db = getDatabase();

async function confirmDeletion(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('\n⚠️  Are you SURE you want to delete ALL guests? (yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function deleteAllGuests() {
    console.log('🔍 Checking guests data...\n');

    const guestsRef = db.ref('guests');
    const snapshot = await guestsRef.once('value');
    const guests = snapshot.val();

    if (!guests) {
        console.log('✅ No guests data found. Nothing to delete.');
        return;
    }

    const guestCount = Object.keys(guests).length;
    console.log(`📊 Found ${guestCount} guests in database`);
    console.log('📂 Backup file: got-nan-wedding-default-rtdb-export.json\n');

    const confirmed = await confirmDeletion();

    if (!confirmed) {
        console.log('\n❌ Deletion cancelled. No changes made.');
        process.exit(0);
    }

    console.log('\n🗑️  Deleting all guests...');

    try {
        await guestsRef.remove();
        console.log('✅ Successfully deleted all guests!');
        console.log('\n📝 Next steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Check the guest count (should show 0)');
        console.log('   3. Wait for RSVP data to auto-sync');
        console.log('\n💡 To rollback: Import got-nan-wedding-default-rtdb-export.json in Firebase Console');
    } catch (error) {
        console.error('❌ Error deleting guests:', error);
        process.exit(1);
    }
}

// Run the script
deleteAllGuests()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
