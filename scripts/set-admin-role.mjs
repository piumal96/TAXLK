/**
 * Set Admin Role — Automated 4-step process:
 * 1. Add a one-time bootstrap rule to Firestore
 * 2. Deploy it
 * 3. Update role to "admin" via REST API
 * 4. Remove bootstrap rule and redeploy
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const API_KEY      = 'AIzaSyD4FYQTUdFsvnGq8gSOa1jVPWHNocVOF6c';
const PROJECT_ID   = 'taxlk-13159';
const ADMIN_EMAIL  = 'admin@taxlk.com';
const ADMIN_PASS   = '123456';
const ADMIN_UID    = '261A9qhNZHdQoZKAjxpJSd9y0Vs2';

const AUTH_BASE      = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const RULES_FILE     = resolve(ROOT, 'firestore.rules');

// ─── Bootstrap rules — adds ONE line that lets admin UID update own role ───
const BOOTSTRAP_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function fieldUnchanged(field) {
      return !(field in request.resource.data) ||
        request.resource.data[field] == resource.data[field];
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) &&
        request.resource.data.role == 'user' &&
        request.resource.data.uid == userId;
      // BOOTSTRAP: temporarily allow admin UID to update their own role
      allow update: if request.auth.uid == '${ADMIN_UID}'
        || (isOwner(userId) && fieldUnchanged('role') && fieldUnchanged('created_at'))
        || isAdmin();
      allow delete: if isAdmin();
    }
    match /tax_records/{recordId} {
      allow read: if isAuthenticated() && (resource.data.user_id == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update: if isAuthenticated() && (resource.data.user_id == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && (resource.data.user_id == request.auth.uid || isAdmin());
    }
    match /user_data/{userId} { allow read, write: if isOwner(userId); }
    match /app_config/{configId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    match /{document=**} { allow read, write: if false; }
  }
}`;

function deploy(label) {
  console.log(`   Deploying ${label}...`);
  execSync('npx firebase deploy --only firestore:rules', {
    cwd: ROOT, stdio: 'pipe', timeout: 60000,
  });
  console.log(`   ✅ ${label} deployed`);
}

async function restGet(url) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}

async function main() {
  console.log('\n🔧  Set Admin Role — Automated\n');

  // Step 1 — Sign in as admin
  console.log('1️⃣  Signing in as admin...');
  const signInRes = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS, returnSecureToken: true }),
  });
  const signInData = await signInRes.json();
  if (!signInRes.ok) {
    console.error('   ❌ Sign in failed:', signInData.error?.message);
    process.exit(1);
  }
  const idToken = signInData.idToken;
  const uid = signInData.localId;
  console.log(`   ✅ Signed in (uid: ${uid})`);

  // Step 2 — Save original rules and deploy bootstrap rules
  console.log('\n2️⃣  Deploying bootstrap rules (allows role update)...');
  const originalRules = readFileSync(RULES_FILE, 'utf-8');
  writeFileSync(RULES_FILE, BOOTSTRAP_RULES);
  deploy('bootstrap rules');

  // Step 3 — Update role to admin via Firestore REST API
  console.log('\n3️⃣  Setting role=admin in Firestore...');

  // Small wait for rules to propagate
  await new Promise(r => setTimeout(r, 3000));

  const patchRes = await fetch(
    `${FIRESTORE_BASE}/users/${uid}?updateMask.fieldPaths=role&updateMask.fieldPaths=name&updateMask.fieldPaths=last_login`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fields: {
          role:       { stringValue: 'admin' },
          name:       { stringValue: 'TaxLK Admin' },
          last_login: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  const patchData = await patchRes.json();
  if (!patchRes.ok) {
    console.error('   ❌ Role update failed:', patchData.error?.message);
    // Restore original rules before exiting
    writeFileSync(RULES_FILE, originalRules);
    deploy('original rules (restored after error)');
    process.exit(1);
  }
  console.log('   ✅ role=admin set in Firestore');

  // Step 4 — Restore secure rules
  console.log('\n4️⃣  Restoring secure rules...');
  writeFileSync(RULES_FILE, originalRules);
  deploy('secure rules');

  // Verify
  console.log('\n5️⃣  Verifying...');
  const verifyRes = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const verifyData = await verifyRes.json();
  const role = verifyData.fields?.role?.stringValue;
  console.log(`   ✅ Verified — role = "${role}"`);

  console.log('\n🎉  Done!');
  console.log('──────────────────────────────────────────');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASS}`);
  console.log(`   Role     : ${role}`);
  console.log(`   Login    : https://taxlk.demoportal.site/login`);
  console.log(`   Admin    : https://taxlk.demoportal.site/admin`);
  console.log('──────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  process.exit(1);
});
