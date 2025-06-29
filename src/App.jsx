// src/App.jsx
// This is the main application component, responsible for:
// 1. **Robust, Centralized Firebase Initialization and Authentication.**
// 2. **Staff Allowlist Authorization.**
// 3. **CRITICAL: Top-level routing and navigation management between main application sections.**
//    - InstantQuoteAppPage is now the single quote page, handling both public and internal views.
//    - AuthPage is the designated staff login page.
//    - InternalDashboardPage is for authenticated, authorized staff.
//    - Authenticated but unauthorized users are redirected to InstantQuoteAppPage (public view).
//
// Updates:
// 1. `InstantQuoteAppPage` is now the primary quote component for all scenarios.
// 2. Removed `PublicQuotePage` and `AccessDeniedPage` imports/rendering logic.
// 3. Simplified `renderTopLevelPage` logic for clearer routing.

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Import Firebase configuration for deployed environments
import { firebaseConfig as prodFirebaseConfig, deployedFirestoreAppId as prodAppId } from './firebase-config';

// Import all application pages
import AuthPage from './pages/AuthPage';
import InternalDashboardPage from './pages/InternalDashboardPage';
import InstantQuoteAppPage from './pages/InstantQuoteAppPage'; // Now the consolidated quote page

// Note: Removed AccessDeniedPage and PublicQuotePage as they are no longer directly used
// or their functionality is absorbed into InstantQuoteAppPage.

// New placeholder pages (imported but not directly rendered by App.jsx, passed to InternalDashboardPage)
import CashflowCostTrackerPage from './pages/CashflowCostTrackerPage';
import AICreativeStudioPage from './pages/AICreativeStudioPage';
import MarketingKanbanPage from './pages/MarketingKanbanPage';
import MarketingAnalyticsPage from './pages/MarketingAnalyticsPage'; // Corrected import to MarketingKanbanPage, was pointing to itself
import ProductManagementPage from './pages/ProductManagementPage';
import ServiceTemplatesPage from './pages/ServiceTemplatesPage';
import SocialMediaHubPage from './pages/SocialMediaHubPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import MaterialManagementPage from './pages/MaterialManagementPage';
import MRPPage from './pages/MRPPage';
import SettingsPage from './pages/SettingsPage';


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [firestoreAppId, setFirestoreAppId] = useState('');
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [isAuthorizedStaff, setIsAuthorizedStaff] = useState(false);
  const [firebaseInitError, setFirebaseInitError] = useState(null);
  // New: State to manage the primary view/page being displayed by App.jsx
  // Default to 'quoteApp' as per consolidated blueprint.
  const [currentPage, setCurrentPage] = useState('quoteApp');

  // Callback to navigate between top-level sections managed by App.jsx
  const navigateTo = useCallback((pageName) => {
    setCurrentPage(pageName);
    console.log(`App.jsx: Navigating to top-level page: ${pageName}`);
  }, []);

  useEffect(() => {
    let firebaseAppInstance;
    let authInstance;
    let firestoreInstance;
    let unsubscribeAuth = () => {};

    try {
      let currentFirebaseConfig;
      let currentAppId;

      if (typeof __firebase_config !== 'undefined' && typeof __app_id !== 'undefined') {
        currentFirebaseConfig = JSON.parse(__firebase_config);
        currentAppId = __app_id;
        console.log("App.jsx: Using Canvas globals for Firebase config and App ID.");
      } else {
        currentFirebaseConfig = prodFirebaseConfig;
        currentAppId = prodAppId;
        console.log("App.jsx: Using src/firebase-config.js for Firebase config and App ID.");
      }

      if (getApps().length === 0) {
        if (currentFirebaseConfig) {
          firebaseAppInstance = initializeApp(currentFirebaseConfig);
          console.log("App.jsx: Firebase app initialized for the first time.");
        } else {
          throw new Error("App.jsx: Critical Error: currentFirebaseConfig is undefined. Cannot initialize Firebase.");
        }
      } else {
        firebaseAppInstance = getApp();
        console.log("App.jsx: Firebase app already initialized, retrieving existing instance.");
      }

      firestoreInstance = getFirestore(firebaseAppInstance);
      authInstance = getAuth(firebaseAppInstance);

      setDb(firestoreInstance);
      setAuth(authInstance);
      setFirestoreAppId(currentAppId);

      unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        setCurrentUser(user); // Set the current authenticated user

        if (user) {
          console.log(`App.jsx: User authenticated: ${user.uid}. Checking authorization...`);
          // Use the correct, confirmed Firestore path for allowlist
          const userDocRef = doc(firestoreInstance, `artifacts/${currentAppId}/app_config/users/users_allowed`, user.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setIsAuthorizedStaff(true);
              console.log(`App.jsx: Authorization for UID ${user.uid}: Authorized`);
              setCurrentPage('internalDashboard'); // Authorized staff goes to dashboard
            } else {
              setIsAuthorizedStaff(false);
              console.warn(`App.jsx: Authorization for UID ${user.uid}: Not Authorized (not in allowlist)`);
              setCurrentPage('quoteApp'); // Unauthorized staff go to public view of quote app
            }
          } catch (authzError) {
            console.error("App.jsx: Error checking user authorization:", authzError);
            setIsAuthorizedStaff(false);
            setCurrentPage('quoteApp'); // On error, treat as unauthorized and go to public view
          }
        } else {
          console.log("App.jsx: No user currently authenticated.");
          setIsAuthorizedStaff(false);
          // When no user, always default to quote app (public view) or AuthPage if navigated there.
          if (currentPage !== 'authPage') { // Don't override if explicitly on auth page
            setCurrentPage('quoteApp');
          }
        }
        setLoadingFirebase(false); // Firebase initialization and initial auth/authz check complete
      });

    } catch (error) {
      console.error("App.jsx: Global Error during Firebase initialization or auth setup:", error);
      setFirebaseInitError(error);
      setLoadingFirebase(false);
      setDb(null);
      setAuth(null);
      setCurrentUser(null);
      setIsAuthorizedStaff(false);
      setCurrentPage('errorPage'); // A new error state page could be useful
    }

    return () => {
      unsubscribeAuth();
    };
  }, [navigateTo, currentPage]); // Added currentPage as a dependency to react to its changes

  // Handler for Google Sign-In, to be passed to AuthPage.
  const handleGoogleSignIn = async () => {
    if (!auth) {
      console.error("Auth service not available for Google Sign-In.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("App.jsx: Google Sign-In initiated. Auth state listener will handle routing.");
      // onAuthStateChanged will pick up the new user and route accordingly
    } catch (error) {
      console.error("App.jsx: Google Sign-In error:", error);
      // You can implement more specific error handling here or pass it to AuthPage
      // For now, if sign-in fails, stay on auth page or navigate back to public quote app.
      if (error.code !== 'auth/popup-closed-by-user') { // Ignore if user just closed popup
        setCurrentPage('quoteApp'); // Go back to quote app if login fails for other reasons
      }
    }
  };

  if (loadingFirebase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-deepGray text-offWhite">
        <p>Loading application services...</p>
      </div>
    );
  }

  if (firebaseInitError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-800 text-white p-4 text-center">
        <p className="text-xl font-bold">Critical Application Error</p>
        <p className="mt-2 text-sm">Failed to initialize Firebase services. Please contact support.</p>
        <p className="mt-1 text-xs italic">Details: {firebaseInitError.message}</p>
      </div>
    );
  }

  if (!db || !auth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-800 text-white">
        <p className="text-xl">Critical Error: Firebase instances are missing.</p>
      </div>
    );
  }

  // --- Main Application Routing based on currentPage state ---
  const renderTopLevelPage = () => {
    if (currentPage === 'authPage' && !currentUser) {
      // Dedicated staff login page (only accessible when not logged in)
      return <AuthPage onGoogleSignIn={handleGoogleSignIn} navigateTo={navigateTo} />;
    } else if (currentUser && isAuthorizedStaff && currentPage === 'internalDashboard') {
      // Authenticated and authorized staff sees the dashboard
      return (
        <InternalDashboardPage
          db={db}
          auth={auth}
          user={currentUser}
          firestoreAppId={firestoreAppId}
        />
      );
    } else { // Default or fallback: InstantQuoteAppPage
      // This covers:
      // - Unauthenticated users (default view)
      // - Authenticated but unauthorized users (redirected here for public view)
      // - Authenticated and authorized users who navigate back to the quote page from the dashboard
      return (
        <InstantQuoteAppPage
          db={db}
          firestoreAppId={firestoreAppId}
          auth={auth}
          currentUser={currentUser}
          isAuthorizedStaff={isAuthorizedStaff}
          navigateTo={navigateTo}
        />
      );
    }
  };

  return renderTopLevelPage();
}

export default App;