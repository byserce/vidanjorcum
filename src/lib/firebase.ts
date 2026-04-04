import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-384F0KP5PY", // Google Analytics ID
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'tr'; // SMS'ler Türkçe gitsin

let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  // Config eksikse Analytics'in çökmesini engelle
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Analytics initialization failed:", e);
    }
  }
}

export { app, auth, analytics };
