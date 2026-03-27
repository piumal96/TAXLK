/**
 * Admin Seed Script — One-time setup
 * Creates admin@taxlk.com with role="admin" in Firebase Auth + Firestore.
 *
 * Usage:
 *   node scripts/seed-admin.mjs <path-to-service-account.json>
 *
 * How to get service account key:
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 */

import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Config ───────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@taxlk.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME     = 'TaxLK Admin';
// ──────────────────────────────────────────────────────────

const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error('\n❌  Usage: node scripts/seed-admin.mjs <path-to-service-account.json>\n');
  console.error('   Get it from: Firebase Console → Project Settings → Service accounts\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} catch {
  console.error(`\n❌  Could not read service account file: ${serviceAccountPath}\n`);
  process.exit(1);
}

// Initialize Admin SDK
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const adminAuth = getAuth();
const db = getFirestore();

async function seedAdmin() {
  console.log('\n🔧  Lanka Tax Hub — Admin Seed Script');
  console.log('─────────────────────────────────────');
  console.log(`📧  Email    : ${ADMIN_EMAIL}`);
  console.log(`🔑  Password : ${ADMIN_PASSWORD}`);
  console.log('');

  let uid;

  // Step 1 — Create or get Firebase Auth user
  try {
    const existing = await adminAuth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    console.log(`✅  Auth user already exists  (uid: ${uid})`);

    // Update password in case it changed
    await adminAuth.updateUser(uid, {
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
    });
    console.log('✅  Auth user password/name updated');

  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await adminAuth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`✅  Auth user created  (uid: ${uid})`);
    } else {
      throw err;
    }
  }

  // Step 2 — Write/update Firestore user document with role="admin"
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists()) {
    // Preserve created_at, only update role
    await userRef.update({
      role: 'admin',
      name: ADMIN_NAME,
      last_login: FieldValue.serverTimestamp(),
    });
    console.log('✅  Firestore document updated  (role → admin)');
  } else {
    // Create fresh document
    await userRef.set({
      uid,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      photo_url: null,
      provider: 'email',
      role: 'admin',
      created_at: FieldValue.serverTimestamp(),
      last_login: FieldValue.serverTimestamp(),
    });
    console.log('✅  Firestore document created  (role = admin)');
  }

  console.log('\n🎉  Admin setup complete!');
  console.log('────────────────────────────────────────────────');
  console.log(`   Login URL : http://localhost:5173/login`);
  console.log(`   Email     : ${ADMIN_EMAIL}`);
  console.log(`   Password  : ${ADMIN_PASSWORD}`);
  console.log(`   Panel URL : http://localhost:5173/admin`);
  console.log('────────────────────────────────────────────────\n');
}

seedAdmin().catch((err) => {
  console.error('\n❌  Seed failed:', err.message, '\n');
  process.exit(1);
});
