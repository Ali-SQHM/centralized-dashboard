// src/App.jsx
// This is the main application entry point. It handles Firebase initialization,
// authentication, and then renders the CentralizedDashboard component,
// passing down necessary Firebase instances and user information.

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 

// Import the main dashboard component (now modularized)
import CentralizedDashboard from './components/CentralizedDashboard';

// Main App component (handles global Firebase init and top-level routing)
function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [db, setDb] = useState(null); 
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  // This will hold the specific App ID used for Firestore collection paths.
  // It will be determined based on whether the app is in Canvas or deployed.
  const [firestoreAppId, setFirestoreAppId] = useState(null); 

  // Define colors locally for the loading screen before constants are imported
  const colors = {
    deepGray: '#111827', 
    offWhite: '#F3F4F6', 
  };


  // Firebase Initialization and Authentication (runs once for the whole app)
  useEffect(() => {
    const initFirebase = async () => {
      let firebaseConfigToUse;
      let determinedAppIdForFirestore; 

      try {
        if (typeof __firebase_config !== 'undefined') {
          // Running in Canvas environment: use Canvas-provided config and app ID
          firebaseConfigToUse = JSON.parse(__firebase_config);
          // Canvas specific App ID is in __app_id
          determinedAppIdForFirestore = typeof __app_id !== 'undefined' ? __app_id : 'default-canvas-app-id'; 
          console.log("Firebase: Using config from Canvas environment.");
        } else {
          // Running outside Canvas (e.g., Firebase Hosting): dynamically import config
          console.log("Firebase: __firebase_config not found. Attempting to import from firebase-config.js.");
          // Dynamic import for firebase-config.js (needs to be explicitly imported for non-Canvas)
          const module = await import('./firebase-config'); 
          firebaseConfigToUse = module.firebaseConfig;
          // Use the 'deployedFirestoreAppId' from firebase-config.js for deployed pathing
          determinedAppIdForFirestore = module.deployedFirestoreAppId; 

          if (!firebaseConfigToUse || !firebaseConfigToUse.apiKey || firebaseConfigToUse.apiKey === "YOUR_ACTUAL_API_KEY_FROM_FIREBASE_CONSOLE") {
            // This checks if the imported config is valid or still contains placeholders
            throw new Error("Firebase configuration from firebase-config.js is missing or invalid. Please ensure it's correctly set up with your actual Firebase project details.");
          }
          console.log("Firebase: Successfully imported config from firebase-config.js.");
        }

        // Initialize Firebase App
        const app = initializeApp(firebaseConfigToUse);
        const firebaseAuth = getAuth(app);
        const firestoreDb = getFirestore(app); 

        // Set all state variables after successful initialization
        setDb(firestoreDb); 
        setAuth(firebaseAuth); // Although auth is not directly passed, good to have it in state for consistency
        setFirestoreAppId(determinedAppIdForFirestore); // Set the determined ID for Firestore paths

        console.log("Firebase app initialized successfully. Firestore App ID for paths:", determinedAppIdForFirestore);

        // Authentication logic
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
            console.log("Firebase user authenticated with ID:", user.uid);
          } else {
            console.log("No Firebase user found, attempting sign-in.");
            try {
              if (typeof __initial_auth_token !== 'undefined') {
                // Canvas environment authentication
                await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                console.log("Signed in with custom token (Canvas).");
              } else {
                // Firebase Hosting / other environments authentication (anonymous is common for public apps)
                await signInAnonymously(firebaseAuth);
                console.log("Signed in anonymously (Hosting/Other).");
              }
            } catch (error) {
              console.error("Error during Firebase sign-in:", error);
            }
          }
          setFirebaseReady(true); // Set ready after auth state is determined
        });

        // Cleanup function for auth listener
        return () => unsubscribe();

      } catch (e) {
        // Log critical errors during Firebase initialization
        console.error("Critical error during Firebase initialization:", e.message);
        setFirebaseReady(false); // Ensure firebaseReady is false if initialization fails
      }
    };

    initFirebase();
  }, []); // Empty dependency array, runs once on mount


  // The App component renders CentralizedDashboard once Firebase is ready.
  // We now explicitly check for db and firestoreAppId to be non-null.
  if (!firebaseReady || !db || !firestoreAppId) { 
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.deepGray }}>
        <p className="text-offWhite text-xl">Initializing Firebase...</p>
      </div>
    );
  }

  // Pass db, userId, firebaseReady, and the new firestoreAppId prop down.
  return <CentralizedDashboard db={db} userId={userId} firebaseReady={firebaseReady} firestoreAppId={firestoreAppId} />;
}

export default App;