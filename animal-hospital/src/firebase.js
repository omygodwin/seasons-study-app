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
  apiKey:            "AIzaSyDteMx6A0f0jf0peeAvEMWTMvUVPOCYynA",
  authDomain:        "roseruthclinic.firebaseapp.com",
  databaseURL:       "https://roseruthclinic-default-rtdb.firebaseio.com",   // must end with .firebaseio.com
  projectId:         "roseruthclinic",
  storageBucket:     "roseruthclinic.firebasestorage.app",
  messagingSenderId: "739476924225",
  appId:             "1:739476924225:web:9777db16912272a95ba3c0",
  measurementId: "G-WW7QMN54D3"
};

export const IS_CONFIGURED = firebaseConfig.apiKey !== "AIzaSyDteMx6A0f0jf0peeAvEMWTMvUVPOCYynA";

export let db = null;

if (IS_CONFIGURED) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.error('Firebase init error:', e);
  }
}
