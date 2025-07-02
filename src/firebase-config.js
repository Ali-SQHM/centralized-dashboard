// src/firebase-config.js
// This file stores your actual Firebase project configuration for deployment.
// It is now configured to specifically use "default-app-id" for Firestore paths,
// matching your existing data structure.
//
// This configuration is used when the application is deployed directly to Firebase Hosting,
// as the Canvas IDE's __firebase_config and __app_id globals are not available there.
//
// CRITICAL: 'deployedFirestoreAppId' is explicitly set to "default-app-id"
// to ensure the application accesses your data at the correct Firestore path.

export const firebaseConfig = {
  apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
  authDomain: "hm-canvases-alliem-art.firebaseapp.com",
  projectId: "hm-canvases-alliem-art", // Your actual Project ID (used for Firebase SDK init)
  storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
  messagingSenderId: "544423481137",
  // Your actual Firebase App ID (from Firebase Console -> Project settings -> General -> Your apps)
  appId: "1:544423481137:web:9d0cb650642dd8f1b2ea10",
  measurementId: "G-D23Z6GBTH0"
};

// IMPORTANT: This 'deployedFirestoreAppId' is explicitly set to "default-app-id"
// because your Firestore data is located at /artifacts/default-app-id/...
// This overrides the default behavior of using projectId for the artifact path.
export const deployedFirestoreAppId = "default-app-id";
