/**
 * Create Admin User — No service account needed.
 * Uses Firebase Auth REST API + Firestore REST API.
 */

const API_KEY = 'AIzaSyD4FYQTUdFsvnGq8gSOa1jVPWHNocVOF6c';
const PROJECT_ID = 'taxlk-13159';

const ADMIN_EMAIL = 'admin@taxlk.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME = 'TaxLK Admin';

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function main() {
  console.log('\n🔧  Lanka Tax Hub — Admin Setup (No Service Account)\n');

  let uid, idToken;

  // Step 1 — Try to sign up the user
  console.log('1️⃣  Creating auth user...');
  const signUpRes = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      returnSecureToken: true,
    }),
  });

  const signUpData = await signUpRes.json();

  if (signUpRes.ok) {
    uid = signUpData.localId;
    idToken = signUpData.idToken;
    console.log(`   ✅ Auth user created (uid: ${uid})`);
  } else if (signUpData.error?.message === 'EMAIL_EXISTS') {
    // User exists — sign in instead
    console.log('   ℹ️  User already exists, signing in...');
    const signInRes = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        returnSecureToken: true,
      }),
    });
    const signInData = await signInRes.json();
    if (!signInRes.ok) {
      console.error('   ❌ Sign in failed:', signInData.error?.message);
      process.exit(1);
    }
    uid = signInData.localId;
    idToken = signInData.idToken;
    console.log(`   ✅ Signed in (uid: ${uid})`);
  } else {
    console.error('   ❌ Signup failed:', signUpData.error?.message);
    process.exit(1);
  }

  // Step 2 — Update display name if it was a new signup
  console.log('2️⃣  Setting display name...');
  await fetch(`${AUTH_BASE}/accounts:update?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      displayName: ADMIN_NAME,
      returnSecureToken: false,
    }),
  });
  console.log('   ✅ Display name set');

  // Step 3 — Write Firestore document with role=admin
  console.log('3️⃣  Writing Firestore user document (role=admin)...');

  const now = new Date().toISOString();
  const firestoreDoc = {
    fields: {
      uid: { stringValue: uid },
      name: { stringValue: ADMIN_NAME },
      email: { stringValue: ADMIN_EMAIL },
      photo_url: { nullValue: null },
      provider: { stringValue: 'email' },
      role: { stringValue: 'admin' },
      created_at: { timestampValue: now },
      last_login: { timestampValue: now },
    },
  };

  // Use PATCH to create or overwrite the document (document ID = uid)
  const fsRes = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(firestoreDoc),
  });

  const fsData = await fsRes.json();

  if (fsRes.ok) {
    console.log('   ✅ Firestore document created with role=admin');
  } else {
    console.log('   ⚠️  Firestore write failed:', fsData.error?.message || fsData.error?.status);
    console.log('');
    console.log('   This means Firestore security rules are blocking the write.');
    console.log('   The auth user IS created — you can log in, but without admin role.');
    console.log('');
    console.log('   To fix, do ONE of these:');
    console.log('   A) Deploy rules: firebase deploy --only firestore:rules');
    console.log('   B) Set role manually in Firebase Console → Firestore → users/' + uid);
    console.log('   C) Use seed-admin.mjs with a service account key');
    console.log('');

    // Try deploying rules and retrying
    console.log('4️⃣  Attempting to deploy Firestore rules...');
    const { execSync } = await import('child_process');
    try {
      execSync('npx firebase deploy --only firestore:rules', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 30000,
      });
      console.log('   ✅ Rules deployed! Retrying Firestore write...');

      // Retry the write
      const retryRes = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(firestoreDoc),
      });

      if (retryRes.ok) {
        console.log('   ✅ Firestore document created with role=admin');
      } else {
        const retryData = await retryRes.json();
        console.log('   ⚠️  Retry failed:', retryData.error?.message);
        console.log('   → Security rules block setting role=admin from client.');
        console.log('   → Go to Firebase Console → Firestore → users/' + uid);
        console.log('   → Change the "role" field from "user" to "admin"');
        printManualInstructions(uid);
        process.exit(0);
      }
    } catch {
      console.log('   ⚠️  Firebase CLI not available or not logged in.');
      printManualInstructions(uid);
      process.exit(0);
    }
  }

  // Done
  console.log('');
  console.log('🎉  Admin setup complete!');
  console.log('─────────────────────────────────────────');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   UID      : ${uid}`);
  console.log(`   Role     : admin`);
  console.log('─────────────────────────────────────────');
  console.log(`   Login    : http://localhost:5173/login`);
  console.log(`   Admin    : http://localhost:5173/admin`);
  console.log('─────────────────────────────────────────\n');
}

function printManualInstructions(uid) {
  console.log('');
  console.log('───── MANUAL STEP REQUIRED ─────');
  console.log('The auth user was created successfully.');
  console.log('But Firestore needs the admin role set manually:');
  console.log('');
  console.log('  Firebase Console → Firestore Database');
  console.log(`  → Collection: users → Document: ${uid}`);
  console.log('  → Set field "role" to "admin"');
  console.log('────────────────────────────────\n');
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
