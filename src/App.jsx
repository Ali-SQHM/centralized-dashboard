// src/App.jsx
// This is the root component of the application. It handles Firebase initialization,
// user authentication (Google Sign-In), authorization checks, and routes users
// to either the public-facing quote page, the internal authenticated dashboard,
// or an access denied page based on their login and authorization status.
//
// FIX: Added a direct, inline 'DEFAULT_FIREBASE_CONFIG' as an ultimate fallback
// to ensure Firebase initialization never fails due to an empty config.
// The external firebase-config.js is still used as the primary fallback when
// __firebase_config is not available.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';

// Import your page components
import PublicQuotePage from './pages/PublicQuotePage';
import InternalDashboardPage from './pages/InternalDashboardPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Import constants for styling
import { colors } from './utils/constants';

// Define a DEFAULT_FIREBASE_CONFIG as a guaranteed fallback.
// This should match your src/firebase-config.js 'firebaseConfig' object EXACTLY.
// This ensures that even if dynamic import or window.__firebase_config fails,
// the app always has a valid config to initialize Firebase.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
  authDomain: "hm-canvases-alliem-art.firebaseapp.com",
  projectId: "hm-canvases-alliem-art",
  storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
  messagingSenderId: "544423481137",
  appId: "default-app-id", // Use default-app-id as the app's internal ID
  measurementId: "G-D23Z6GBTH0"
};

const DEFAULT_FIREBASE_APP_ID_FOR_PATHS = "default-app-id";

function App() {
  // State for Firebase instances and user authentication
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Tracks initial auth state loading
  const [isAuthorized, setIsAuthorized] = useState(false); // Tracks if authenticated user is on allowlist

  // State to hold Firebase config loaded from external file (if needed)
  const [externalFirebaseConfig, setExternalFirebaseConfig] = useState({});
  const [externalDeployedFirestoreAppId, setExternalDeployedFirestoreAppId] = useState('default-app-id');

  // Dynamically import firebase-config.js. This ensures it's loaded only once and asynchronously.
  useEffect(() => {
    const loadFirebaseConfig = async () => {
      try {
        const firebaseConfigModule = await import('./firebase-config.js');
        if (firebaseConfigModule && firebaseConfigModule.firebaseConfig) {
          setExternalFirebaseConfig(firebaseConfigModule.firebaseConfig);
          if (firebaseConfigModule.deployedFirestoreAppId) {
            setExternalDeployedFirestoreAppId(firebaseConfigModule.deployedFirestoreAppId);
            console.log("Firebase: Successfully loaded config and deployedFirestoreAppId from firebase-config.js.");
          } else {
            setExternalDeployedFirestoreAppId(firebaseConfigModule.firebaseConfig.appId || 'default-app-id');
            console.warn("Firebase: firebase-config.js found but 'deployedFirestoreAppId' export missing. Using appId from config or default.");
          }
        } else {
          console.warn("Firebase: firebase-config.js found but 'firebaseConfig' export missing.");
        }
      } catch (error) {
        console.warn("Firebase: firebase-config.js not found or error importing. This is expected if running in Canvas IDE directly without local setup.");
        console.warn("Error details:", error.message);
      }
    };
    loadFirebaseConfig();
  }, []); // Run only once on mount

  // Determine Firebase config to use: prioritize global Canvas variable, then local file, then default inline
  const firebaseConfigToUse = useMemo(() => {
    let config = {};
    if (typeof window.__firebase_config !== 'undefined' && typeof window.__firebase_config === 'string') {
      try {
        config = JSON.parse(window.__firebase_config);
      } catch (e) {
        console.error("Error parsing window.__firebase_config:", e);
      }
    }
    // If Canvas global is empty, try the external config, otherwise use the DEFAULT_FIREBASE_CONFIG
    if (Object.keys(config).length === 0) {
      if (Object.keys(externalFirebaseConfig).length > 0) {
        config = externalFirebaseConfig;
      } else {
        config = DEFAULT_FIREBASE_CONFIG; // Ultimate fallback
        console.warn("Firebase: Using DEFAULT_FIREBASE_CONFIG as no other config was found.");
      }
    }
    return config;
  }, [externalFirebaseConfig]); // Dependency on externalFirebaseConfig ensures update when it loads

  // Determine App ID for Firestore paths: prioritize global Canvas variable, then explicitly deployedFirestoreAppId, then default inline
  const firestoreAppId = useMemo(() => {
    let id = DEFAULT_FIREBASE_APP_ID_FOR_PATHS; // Ultimate fallback
    if (typeof window.__app_id !== 'undefined' && typeof window.__app_id === 'string') {
      id = window.__app_id;
    } else if (externalDeployedFirestoreAppId && externalDeployedFirestoreAppId !== DEFAULT_FIREBASE_APP_ID_FOR_PATHS) {
      id = externalDeployedFirestoreAppId;
    } else if (externalFirebaseConfig.appId) {
      id = externalFirebaseConfig.appId;
    }
    return id;
  }, [externalDeployedFirestoreAppId, externalFirebaseConfig]);


  // Memoize firebase initialization to run only once
  useEffect(() => {
    // This check is now mostly defensive, as firebaseConfigToUse should always have content now
    if (Object.keys(firebaseConfigToUse).length === 0) {
      console.error("Firebase config is empty. Should not happen with inline fallback. Cannot initialize Firebase.");
      setLoadingAuth(false);
      return;
    }

    if (!app) {
      try {
        const firebaseApp = initializeApp(firebaseConfigToUse);
        const firestoreDb = getFirestore(firebaseApp);
        const firebaseAuth = getAuth(firebaseApp);

        setApp(firebaseApp);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        console.log("Firebase app initialized successfully. Firestore App ID for paths:", firestoreAppId);
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        setLoadingAuth(false);
      }
    }
  }, [app, firestoreAppId, firebaseConfigToUse, loadingAuth]);


  const checkAuthorization = useCallback(async (uid) => {
    if (!db) {
      console.warn("Firestore DB not available for authorization check.");
      return false;
    }
    try {
      if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
        console.log("Development environment: Bypassing user allowlist check.");
        return true;
      }
      const allowedUsersRef = doc(db, `artifacts/${firestoreAppId}/app_config/users/users_allowed`, uid);
      const docSnap = await getDoc(allowedUsersRef);
      const authorized = docSnap.exists();
      console.log(`Authorization check for UID ${uid}: ${authorized ? 'Authorized' : 'NOT Authorized'}`);
      return authorized;
    } catch (error) {
      console.error("Error checking user authorization:", error);
      return false;
    }
  }, [db, firestoreAppId]);

  useEffect(() => {
    if (!auth || !db) return;

    const anonymousSignIn = async () => {
      if (typeof window.__initial_auth_token === 'undefined' || !window.__initial_auth_token) {
        try {
          await signInAnonymously(auth);
          console.log("Signed in anonymously for public access.");
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        } finally {
          if (user === null) setLoadingAuth(false);
        }
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log("Firebase user authenticated with ID:", currentUser.uid);

        if (!currentUser.isAnonymous) {
            const authorized = await checkAuthorization(currentUser.uid);
            setIsAuthorized(authorized);
            if (!authorized) {
                console.warn("User is authenticated but NOT authorized to access internal dashboard.");
            }
        } else {
            setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
        console.log("No Firebase user authenticated.");
        anonymousSignIn();
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [auth, db, checkAuthorization]);

  useEffect(() => {
    if (auth && typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
      const handleCustomTokenLogin = async () => {
        try {
          await signInWithCustomToken(auth, window.__initial_auth_token);
          console.log("Firebase user authenticated with custom token.");
        } catch (error) {
          console.error("Error signing in with custom token:", error);
          setLoadingAuth(false);
        }
      };
      handleCustomTokenLogin();
    } else if (auth && typeof window.__initial_auth_token === 'undefined' && loadingAuth) {
        setLoadingAuth(false);
    }
  }, [auth, loadingAuth]);


  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      return;
    }
    setLoadingAuth(true);
    const provider = new GoogleAuthProvider();
    try {
      if (auth.currentUser) {
        await signOut(auth);
        console.log("Signed out current user before Google sign-in.");
      }
      await signInWithPopup(auth, provider);
      console.log("Google Sign-In successful.");
    } catch (error) {
      console.error("Google Sign-In failed:", error.code, error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup closed by user.");
      } else {
        console.error("An unexpected error occurred during Google Sign-In.");
      }
      setLoadingAuth(false);
    }
  }, [auth]);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthorized(false);
      console.log("User signed out.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [auth]);

  if (loadingAuth || !app || !db || !auth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.deepGray, color: colors.offWhite }}>
        <p className="text-xl">Loading application...</p>
      </div>
    );
  }

  if (user && !user.isAnonymous && isAuthorized) {
    return (
      <InternalDashboardPage
        db={db}
        auth={auth}
        user={user}
        firestoreAppId={firestoreAppId}
        signOutUser={signOutUser}
      />
    );
  }

  if (user && !user.isAnonymous && !isAuthorized) {
    return (
      <AccessDeniedPage
        signOutUser={signOutUser}
      />
    );
  }

  return (
    <PublicQuotePage
      signInWithGoogle={signInWithGoogle}
      db={db}
      firestoreAppId={firestoreAppId}
      userId={user ? user.uid : null}
    />
  );
}

export default App;
