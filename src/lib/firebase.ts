import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug log to verify keys are loaded
console.log("🔥 Firebase Config Debug:", {
    apiKey: firebaseConfig.apiKey ? "✅ Set (" + firebaseConfig.apiKey.substring(0, 5) + "...)" : "❌ MISSING",
    authDomain: firebaseConfig.authDomain || "❌ MISSING",
    projectId: firebaseConfig.projectId || "❌ MISSING",
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use long polling to fix "client offline" errors
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Initialize Firebase Storage for profile photos
export const storage = getStorage(app);

// Debug: Listen to auth state changes
onAuthStateChanged(auth, (user) => {
    console.log("🔐 AUTH STATE CHANGED:", user ? `✅ Logged in as ${user.email}` : "❌ Not logged in");
});

export default app;
