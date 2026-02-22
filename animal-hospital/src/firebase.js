import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ─── HOW TO SET UP SHARED DATA (cross-device sync) ───────────────────────────
//
//  1. Go to https://console.firebase.google.com  (free Google account)
//  2. Click "Add project" → give it any name → Continue
//  3. Click the </> Web icon → register the app → copy the firebaseConfig values
//  4. In the left sidebar: Build → Realtime Database → Create database
//     → choose a location → "Start in test mode" → Done
//  5. Replace every "PASTE_HERE" below with your actual values
//
// Once done, all devices that open the app will share the SAME patient data
// in real time — no more needing to be on the same device!
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "PASTE_HERE",
  authDomain:        "PASTE_HERE",
  databaseURL:       "PASTE_HERE",   // must end with .firebaseio.com
  projectId:         "PASTE_HERE",
  storageBucket:     "PASTE_HERE",
  messagingSenderId: "PASTE_HERE",
  appId:             "PASTE_HERE",
};

export const IS_CONFIGURED = firebaseConfig.apiKey !== "PASTE_HERE";

export let db = null;

if (IS_CONFIGURED) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.error('Firebase init error:', e);
  }
}
