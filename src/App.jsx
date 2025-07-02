// src/App.jsx
// This is the main application component, now with:
// - Conditional sidebar rendering: hidden for public Instant Quote page.
// - REFINED MAIN CONTENT AREA SCROLLING HIERARCHY.
// - Robust Firebase Initialization, Authentication, and Staff Authorization.
// - Top-level routing.
// - FIX: Ensure firestoreAppId correctly resolves to "default-app-id" for Firestore paths.
// - FIX: Replaced FaBoxesPacking with FaBox to resolve SVG path error.
// - FIX: Corrected scope of renderMainContentPage function.

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Import Firebase configuration for deployed environments
import { firebaseConfig as prodFirebaseConfig, deployedFirestoreAppId as prodAppId } from './firebase-config';

// Import all application pages
import AuthPage from './pages/AuthPage';
import InternalDashboardPage from './pages/InternalDashboardPage';
import InstantQuoteAppPage from './pages/InstantQuoteAppPage';
import MaterialManagementPage from './pages/MaterialManagementPage';
import MRPPage from './pages/MRPPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import SettingsPage from './pages/SettingsPage';
import CashflowCostTrackerPage from './pages/CashflowCostTrackerPage';
import AICreativeStudioPage from './pages/AICreativeStudioPage';
import MarketingKanbanPage from './pages/MarketingKanbanPage';
import SocialMediaHubPage from './pages/SocialMediaHubPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import MarketingAnalyticsPage from './pages/MarketingAnalyticsPage';
import ProductManagementPage from './pages/ProductManagementPage';

// Import icons for the sidebar
import {
  FaChartBar, FaFileInvoiceDollar, FaQuoteLeft, FaBox, FaCube,
  FaMoneyBillWave, FaPalette, FaClipboardList, FaShareNodes, FaGear,
  FaRightFromBracket, FaGoogle, FaChartLine, FaBoxOpen
} from 'react-icons/fa6';


function App() {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthorizedStaff, setIsAuthorizedStaff] = useState(false);
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [firebaseInitError, setFirebaseInitError] = useState(null);

  const [firestoreAppId, setFirestoreAppId] = useState('');
  const [currentPage, setCurrentPage] = useState('instantQuote'); // Default to instantQuote

  const navigateTo = useCallback((pageName) => {
    setCurrentPage(pageName);
    console.log(`App.jsx: Navigating to page: ${pageName}`);
  }, []);

  // --- Firebase Initialization and Authentication Listener ---
  useEffect(() => {
    let firebaseAppInstance;
    let authInstance;
    let firestoreInstance;
    let unsubscribeAuth = () => {};

    try {
      let currentFirebaseConfig;
      let currentAppId;

      // Prioritize Canvas globals if available (for IDE environment)
      if (typeof __firebase_config !== 'undefined' && typeof __app_id !== 'undefined') {
        currentFirebaseConfig = JSON.parse(__firebase_config);
        currentAppId = __app_id;
        console.log("App.jsx: Using Canvas globals for Firebase config and App ID.");
      } else {
        // Fallback to local firebase-config.js for deployed environment
        currentFirebaseConfig = prodFirebaseConfig;
        currentAppId = prodAppId; // This will now be "default-app-id" from firebase-config.js
        console.log("App.jsx: Using src/firebase-config.js for Firebase config and App ID.");
      }

      // CRITICAL: Ensure currentAppId is 'default-app-id' if that's where Firestore data lives
      // This explicit check ensures it's always 'default-app-id' for Firestore paths if needed
      // based on user's confirmed Firestore structure.
      if (currentAppId !== "default-app-id") {
          console.warn(`App.jsx: Overriding currentAppId from '${currentAppId}' to 'default-app-id' to match Firestore data path.`);
          currentAppId = "default-app-id";
      }


      if (!currentFirebaseConfig || !currentFirebaseConfig.projectId) {
        throw new Error("App.jsx: Critical Error: Firebase config or projectId is missing. Cannot initialize Firebase.");
      }

      if (getApps().length === 0) {
        firebaseAppInstance = initializeApp(currentFirebaseConfig);
        console.log("App.jsx: Firebase app initialized for the first time.");
      } else {
        firebaseAppInstance = getApp();
        console.log("App.jsx: Firebase app already initialized, retrieving existing instance.");
      }

      firestoreInstance = getFirestore(firebaseAppInstance);
      authInstance = getAuth(firebaseAppInstance);

      setApp(firebaseAppInstance);
      setDb(firestoreInstance);
      setAuth(authInstance);
      setFirestoreAppId(currentAppId); // Set the firestoreAppId here

      unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        setCurrentUser(user);

        if (user) {
          console.log(`App.jsx: User authenticated: ${user.uid}. Checking authorization...`);
          // Use the determined currentAppId for the Firestore path
          const userDocRef = doc(firestoreInstance, `artifacts/${currentAppId}/app_config/users/users_allowed`, user.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setIsAuthorizedStaff(true);
              console.log(`App.jsx: Authorization for UID ${user.uid}: Authorized`);
            } else {
              setIsAuthorizedStaff(false);
              console.warn(`App.jsx: Authorization for UID ${user.uid}: Not Authorized (not in allowlist)`);
              // If not authorized, redirect to public quote page
              navigateTo('instantQuote');
            }
          } catch (authzError) {
            console.error("App.jsx: Error checking user authorization from Firestore:", authzError);
            setIsAuthorizedStaff(false);
            // On error, treat as unauthorized and redirect
            navigateTo('instantQuote');
          }
        } else {
          console.log("App.jsx: No user currently authenticated.");
          setIsAuthorizedStaff(false);
          // If no user, ensure we are on a public page or auth page
          if (currentPage !== 'instantQuote' && currentPage !== 'authPage') {
            navigateTo('instantQuote');
          }
        }
        setLoadingFirebase(false);
        setIsAuthReady(true);
      });

    } catch (error) {
      console.error("App.jsx: Global Error during Firebase initialization or auth setup:", error);
      setFirebaseInitError(error);
      setLoadingFirebase(false);
      setDb(null);
      setAuth(null);
      setCurrentUser(null);
      setIsAuthorizedStaff(false);
    }

    return () => {
      unsubscribeAuth();
    };
  }, []);


  // --- Authentication Handlers ---
  const handleGoogleSignIn = async () => {
    if (!auth) {
      console.error("Auth service not available for Google Sign-In.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("App.jsx: Google Sign-In initiated. Auth state listener will handle routing.");
      // Auth state listener will handle navigation after successful login
    } catch (error) {
      console.error("App.jsx: Google Sign-In error:", error);
      // If sign-in fails, the auth state listener will keep currentUser null
      // and isAuthorizedStaff false, keeping the user in the public view.
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
        console.log("App.jsx: Successfully signed out from Firebase Auth.");
        navigateTo('instantQuote'); // Redirect to public quote page after logout
        // window.location.reload(); // Removed reload, rely on state change for re-render
      } catch (error) {
        console.error("App.jsx: Error signing out:", error);
        setFirebaseInitError(new Error(`Error signing out: ${error.message}`));
      }
    } else {
      console.warn("App.jsx: Auth object not available for sign out.");
    }
  };

  // --- Render Logic (Loading, Error) ---
  if (loadingFirebase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-deepGray text-offWhite text-xl">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-lightGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading application services...
      </div>
    );
  }

  if (firebaseInitError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-deepGray text-errorRed p-4 text-center">
        <h3 className="text-2xl font-bold mb-4">Critical Application Error</h3>
        <p className="text-lg mb-6">{firebaseInitError.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-offWhite font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Determine if sidebar should be visible
  const showSidebar = !(currentPage === 'instantQuote' && !isAuthorizedStaff);

  // --- Main Application Routing based on currentPage state ---
  // Moved renderMainContentPage function definition outside the return statement
  const renderMainContentPage = () => {
    // Publicly accessible Instant Quote page (always rendered via this path)
    if (currentPage === 'instantQuote') {
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
    // Auth Page - only shown if explicitly navigated to and not logged in
    else if (currentPage === 'authPage' && !currentUser) {
        return <AuthPage onGoogleSignIn={handleGoogleSignIn} navigateTo={navigateTo} />;
    }
    // Staff-only pages - only accessible if authorized
    else if (isAuthorizedStaff) {
      switch (currentPage) {
        case 'internalDashboard':
          return (
            <InternalDashboardPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
              navigateTo={navigateTo}
            />
          );
        case 'salesOrders':
          return (
            <SalesOrdersPage
               db={db}
               auth={auth}
               user={currentUser}
               firestoreAppId={firestoreAppId}
            />
          );
        case 'materialManagement':
          return (
            <MaterialManagementPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'mrp': // Production Planning
          return (
            <MRPPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'cashflowCostTracker':
          return (
            <CashflowCostTrackerPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'aiCreativeStudio':
          return (
            <AICreativeStudioPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'marketingKanban':
          return (
            <MarketingKanbanPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'socialMediaHub':
          return (
            <SocialMediaHubPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'kanbanBoard': // Production Kanban Board
          return (
            <KanbanBoardPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'settings':
          return (
            <SettingsPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'marketingAnalytics':
          return (
            <MarketingAnalyticsPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        case 'productManagement': // This will be the SKU Generator page
          return (
            <ProductManagementPage
              db={db}
              auth={auth}
              user={currentUser}
              firestoreAppId={firestoreAppId}
            />
          );
        default:
          return (
            <div className="flex items-center justify-center h-full bg-darkGray rounded-xl shadow-md p-6">
                <h2 className="text-3xl text-gray-400">Page Not Implemented: {currentPage}</h2>
            </div>
          );
      }
    }
    // If not authorized and trying to access a staff-only page, show access denied.
    else {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-darkGray rounded-xl shadow-md p-6 text-center">
           <h2 className="text-3xl text-errorRed mb-4">Access Denied</h2>
           <p className="text-lg text-offWhite">You do not have permission to view this page. Please log in with an authorized staff account or navigate to the public Instant Quote page.</p>
           <button
             onClick={() => navigateTo('instantQuote')}
             className="mt-6 bg-lightGreen text-deepGray font-bold py-3 px-6 rounded-xl hover:bg-darkGreen transition duration-200 shadow-lg"
           >
             Go to Instant Quote
           </button>
        </div>
      );
    }
  };

  return (
    // Outer container: flex row, full viewport height
    <div className="flex h-screen bg-deepGray text-offWhite font-poppins">
      {/* Conditional Sidebar Rendering */}
      {showSidebar && (
        <aside className="w-64 bg-darkGray p-6 shadow-lg flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          <div>
            <h2 className="text-3xl font-bold text-lightGreen mb-8 text-center">ERP/MRP</h2>
            <nav>
              <ul>
                {/* Dashboard - Accessible to all (content may vary based on auth) */}
                <li className="mb-4">
                  <button
                    onClick={() => navigateTo('internalDashboard')}
                    className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                      currentPage === 'internalDashboard' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                    }`}
                  >
                    <FaChartBar className="mr-3" /> Dashboard
                  </button>
                </li>
                {/* Sales Orders - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('salesOrders')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'salesOrders' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaFileInvoiceDollar className="mr-3" /> Sales Orders
                    </button>
                  </li>
                )}
                {/* Instant Quote - Public Access (always visible in sidebar when sidebar is shown) */}
                <li className="mb-4">
                  <button
                    onClick={() => navigateTo('instantQuote')}
                    className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                      currentPage === 'instantQuote' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                    }`}
                  >
                    <FaQuoteLeft className="mr-3" /> Instant Quote
                  </button>
                </li>
                {/* Material Management - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('materialManagement')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'materialManagement' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaBox className="mr-3" /> Material Management
                    </button>
                  </li>
                )}
                {/* Production Planning (MRP) - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('mrp')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'mrp' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaCube className="mr-3" /> MRP & Production Planning
                    </button>
                  </li>
                )}
                {/* Product Management (SKU Generator) - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('productManagement')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'productManagement' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaBoxOpen className="mr-3" /> Product Management
                    </button>
                  </li>
                )}
                {/* Cashflow & Cost Tracker - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('cashflowCostTracker')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'cashflowCostTracker' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaMoneyBillWave className="mr-3" /> Cashflow & Cost Tracker
                    </button>
                  </li>
                )}
                {/* AI Creative Studio - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('aiCreativeStudio')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'aiCreativeStudio' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaPalette className="mr-3" /> AI Creative Studio
                    </button>
                  </li>
                )}
                {/* Marketing Kanban - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('marketingKanban')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'marketingKanban' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaClipboardList className="mr-3" /> Marketing Kanban
                    </button>
                  </li>
                )}
                {/* Marketing Analytics - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('marketingAnalytics')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'marketingAnalytics' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaChartLine className="mr-3" /> Marketing Analytics
                    </button>
                  </li>
                )}
                {/* Social Media Hub - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('socialMediaHub')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'socialMediaHub' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaShareNodes className="mr-3" /> Social Media Hub
                    </button>
                  </li>
                )}
                {/* Production Kanban Board - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('kanbanBoard')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'kanbanBoard' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaClipboardList className="mr-3" /> Production Kanban Board
                    </button>
                  </li>
                )}
                {/* Settings - Staff Only */}
                {isAuthorizedStaff && (
                  <li className="mb-4">
                    <button
                      onClick={() => navigateTo('settings')}
                      className={`w-full text-left py-3 px-4 rounded-lg transition duration-200 flex items-center ${
                        currentPage === 'settings' ? 'bg-mediumGreen text-offWhite font-semibold' : 'hover:bg-gray-700 text-offWhite'
                      }`}
                    >
                      <FaGear className="mr-3" /> Settings
                    </button>
                  </li>
                )}
                {/* Google Calendar (External Link) */}
                <li className="mb-4">
                  <a
                    href="https://calendar.google.com/" // Placeholder URL
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-700 text-offWhite flex items-center"
                  >
                    <FaChartBar className="mr-3" /> Google Calendar
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          {/* User Info and Auth Buttons */}
          <div className="mt-8 pt-4 border-t border-gray-700 text-center">
            {currentUser ? (
              <>
                <p className="text-sm text-gray-400 mb-2">Logged in as:</p>
                <p className="font-semibold text-offWhite break-all text-sm mb-4">{currentUser.email || currentUser.uid}</p>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-red-700 transition duration-200 shadow-lg flex items-center justify-center"
                >
                  <FaRightFromBracket className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-2">Not logged in.</p>
                {/* Staff login button in sidebar, only visible when sidebar is shown */}
                <button
                  onClick={() => navigateTo('authPage')}
                  className="w-full bg-blue-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center"
                >
                  <FaGoogle className="mr-2" /> Staff Login
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area - Adjust width based on sidebar visibility */}
      {/* This main element now correctly takes the remaining height and its content will scroll */}
      <main className={`flex-1 p-6 flex flex-col ${showSidebar ? 'ml-0' : 'w-full'}`}>
        {/* This div is the actual scrollable container for the page content */}
        <div className="flex-1 overflow-y-auto">
          {renderMainContentPage()}
        </div>
      </main>
    </div>
  );
}

export default App;