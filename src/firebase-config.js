// src/firebase-config.js
// This file stores your actual Firebase project configuration for deployment.
// DO NOT share this file or its contents publicly (e.g., on GitHub) if it contains sensitive keys.
//
// This configuration is used when the application is deployed directly to Firebase Hosting,
// as the Canvas IDE's __firebase_config and __app_id globals are not available there.
//
// CRITICAL: The 'appId' property within firebaseConfig is explicitly set to "default-app-id".
// This forces the application to use this ID for Firestore paths during initialization,
// ensuring consistency with where your data is stored in Firestore.

export const firebaseConfig = {
  apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
  authDomain: "hm-canvases-alliem-art.firebaseapp.com",
  projectId: "hm-canvases-alliem-art",
  storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
  messagingSenderId: "544423481137",
  // IMPORTANT: This appId is explicitly set to "default-app-id" to match your Firestore data paths.
  // This ensures the Firebase SDK initializes using this ID for its internal operations,
  // preventing "Missing or insufficient permissions" errors.
  appId: "default-app-id", 
  measurementId: "G-D23Z6GBTH0"
};

// This 'deployedFirestoreAppId' is exported for clarity and used as a fallback
// in App.jsx's logic for determining the Firestore path prefix. It should also
// be consistent with "default-app-id".
export const deployedFirestoreAppId = "default-app-id";