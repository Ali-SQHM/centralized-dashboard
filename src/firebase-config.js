// src/firebase-config.js
// This file stores your actual Firebase project configuration for deployment.
// DO NOT share this file or its contents publicly (e.g., on GitHub) if it contains sensitive keys.

export const firebaseConfig = {
  apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
  authDomain: "hm-canvases-alliem-art.firebaseapp.com",
  projectId: "hm-canvases-alliem-art",
  storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
  messagingSenderId: "544423481137",
  appId: "1:544423481137:web:9d0cb650642dd8f1b2ea10",
  measurementId: "G-D23Z6GBTH0" // This is your web app's App ID from Firebase Console -> Project settings -> Your apps
  // measurementId: "YOUR_ACTUAL_MEASUREMENT_ID" // Optional: Uncomment and replace if you use Google Analytics
};

// This export is specifically for your deployed app to use a consistent App ID
// for Firestore paths (e.g., artifacts/{appId}/public/data/materials).
// You can use your Firebase Web App's actual App ID (from the console, same as above appId)
// or choose any consistent, descriptive string here for your deployed app's data.
// For consistency, using the same `appId` from `firebaseConfig` is generally recommended.
export const deployedFirestoreAppId = "default-app-id";