// src/App.jsx
// This is the main application component, now with:
// - **CRITICAL FIX**: The onAuthStateChanged listener now explicitly sets the
//   `currentPage` based on the user's authentication and authorization status
//   *after* `isAuthReady` is true. This resolves the missing sidebar issue
//   by ensuring the app navigates to the correct default page (e.g., dashboard)
//   immediately after login and authorization are confirmed.
// - Using signInWithPopup for Google Sign-In, which is more robust against browser privacy settings.
// - Footer is positioned correctly outside the `main` content area.
// - Removed top padding from the `main` element; top padding is handled by PageLayout or AuthPage directly.
// - Sidebar dropdowns are now closed by default.
// - Mobile responsiveness: Hamburger menu for sidebar toggle on small screens.
// - Sidebar slides in/out on mobile with an overlay.
// - Main sidebar title changed to "HM ERP".
// - "Dashboard" as a direct, non-collapsible link without a bullet point.
// - Google Calendar link moved into the "Sales" department.
// - Sidebar hidden when on the AuthPage.
// - Default landing page set to Instant Quote initially, then updated by auth state.
// - Department-based sidebar navigation with collapsible sections.
// - Refined main content area scrolling hierarchy.
// - Robust Firebase Initialization, Authentication, and Staff Authorization.
// - Top-level routing.
// - FIX: Ensure firestoreAppId correctly resolves to "default-app-id" for Firestore paths.
// - FIX: Corrected scope of renderMainContentPage function.
// - FIX: Corrected import path for AICreativeStudioPage.
// - Ensured the "Staff Login" button in the sidebar footer is only visible when `!currentUser`.
// - Explicitly passed `navigateTo` to `AuthPage`.
// - Hamburger button position remains `top-4 left-4`.

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

// Import all icons that are part of Font Awesome 6 (fa6)
import {
  FaChartBar, FaFileInvoiceDollar, FaQuoteLeft, FaBox, FaCube,
  FaDollarSign, FaPalette, FaClipboardList, FaLink, FaGear,
  FaRightFromBracket, FaGoogle, FaChartLine, FaBoxOpen,
  FaChevronDown, FaChevronUp, // Chevrons
  FaBuilding, FaCoins, FaHandshake, FaIndustry, FaChartPie, FaUserGear // Department icons (FaUserGear is fa6)
} from 'react-icons/fa6';

// Import specific icons that are reliably found in Font Awesome 5 (fa)
import { FaBars, FaTimes } from 'react-icons/fa'; // Hamburger and close icons


// Define the structure of departments and their pages
const departments = [
  {
    name: 'Sales',
    icon: FaHandshake,
    pages: [
      { name: 'Instant Quote', path: 'instantQuote', icon: FaQuoteLeft, staffOnly: false }, // Public page
      { name: 'Sales Orders', path: 'salesOrders', icon: FaFileInvoiceDollar, staffOnly: true },
      // Moved Google Calendar here
      { name: 'Google Calendar', path: 'https://calendar.google.com/', icon: FaChartBar, staffOnly: true, external: true },
    ],
  },
  {
    name: 'Manufacturing',
    icon: FaIndustry,
    pages: [
      { name: 'Material Management', path: 'materialManagement', icon: FaBox, staffOnly: true },
      { name: 'Product Management', path: 'productManagement', icon: FaBoxOpen, staffOnly: true }, // SKU Generator
      { name: 'MRP & Production Planning', path: 'mrp', icon: FaCube, staffOnly: true },
      { name: 'Production Kanban Board', path: 'kanbanBoard', icon: FaClipboardList, staffOnly: true },
    ],
  },
  {
    name: 'Marketing',
    icon: FaPalette,
    pages: [
      { name: 'AI Creative Studio', path: 'aiCreativeStudio', icon: FaPalette, staffOnly: true },
      { name: 'Marketing Kanban', path: 'marketingKanban', icon: FaClipboardList, staffOnly: true },
      { name: 'Marketing Analytics', path: 'marketingAnalytics', icon: FaChartLine, staffOnly: true },
      { name: 'Social Media Hub', path: 'socialMediaHub', icon: FaLink, staffOnly: true },
    ],
  },
  {
    name: 'Financial',
    icon: FaCoins,
    pages: [
      { name: 'Cashflow & Cost Tracker', path: 'cashflowCostTracker', icon: FaDollarSign, staffOnly: true },
    ],
  },
  {
    name: 'App Admin',
    icon: FaUserGear,
    pages: [
      { name: 'Settings', path: 'settings', icon: FaGear, staffOnly: true },
    ],
  },
];


function App() {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthorizedStaff, setIsAuthorizedStaff] = useState(false);
  const [firebaseInitError, setFirebaseInitError] = useState(null);

  const [firestoreAppId, setFirestoreAppId] = useState('');
  const [currentPage, setCurrentPage] = useState('instantQuote'); // Default to public page

  // State to manage expanded/collapsed status of departments
  const [expandedDepartments, setExpandedDepartments] = useState({});
  // New state for mobile sidebar visibility
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize all departments as CLOSED by default on first load
  useEffect(() => {
    const initialExpandedState = {};
    departments.forEach(dept => {
      initialExpandedState[dept.name] = false; // All set to false (closed) by default
    });
    setExpandedDepartments(initialExpandedState);
  }, []);

  const toggleDepartment = (departmentName) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [departmentName]: !prev[departmentName],
    }));
  };

  const navigateTo = useCallback((pageName) => {
    setCurrentPage(pageName);
    // Close mobile sidebar on navigation
    setIsMobileSidebarOpen(false);
    console.log(`App.jsx: Navigating to page: ${pageName}`);
  }, []);

  // --- Firebase Initialization and Authentication Listener ---
  useEffect(() => {
    let firebaseAppInstance;
    let authInstance;
    let firestoreInstance;
    let unsubscribeAuth = () => {};

    const initializeFirebaseAndAuth = async () => { // Make this async
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
            // This explicit check and override is important for consistency with Firestore rules.
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
            setFirestoreAppId(currentAppId);

            // Set up the persistent auth state listener.
            // This listener will be the single source of truth for auth state changes.
            unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
                setCurrentUser(user);
                let authorized = false; // Local variable to hold authorization status
                if (user) {
                    console.log(`App.jsx: User authenticated: ${user.uid}. Checking authorization...`);
                    // Use the determined currentAppId for the Firestore path
                    // This path is correct: /artifacts/default-app-id/app_config/users/users_allowed
                    const userDocRef = doc(firestoreInstance, `artifacts/${currentAppId}/app_config/users/users_allowed`, user.uid);
                    try {
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            authorized = true;
                            console.log(`App.jsx: Authorization for UID ${user.uid}: Authorized`);
                        } else {
                            console.warn(`App.jsx: Authorization for UID ${user.uid}: Not Authorized (not in allowlist)`);
                        }
                    } catch (authzError) {
                        console.error("App.jsx: Error checking user authorization from Firestore:", authzError);
                        // If there's an error checking authorization, treat as unauthorized for safety
                        authorized = false;
                    }
                } else {
                    console.log("App.jsx: No user currently authenticated.");
                }
                setIsAuthorizedStaff(authorized); // Update state with final authorization status
                setIsAuthReady(true); // Mark auth system as ready

                // After auth state is ready and authorization is checked, set the initial page
                // This ensures the sidebar visibility is correctly determined on load/login
                if (authorized) {
                    navigateTo('internalDashboard');
                } else {
                    navigateTo('instantQuote');
                }
            });

        } catch (error) {
            console.error("App.jsx: Firebase Initialization or Auth Listener Error:", error);
            setFirebaseInitError(error.message);
            setIsAuthReady(true); // Mark ready even on error to display error message
        }
    };

    initializeFirebaseAndAuth(); // Call the async function

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [navigateTo]); // navigateTo is stable due to useCallback

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Using signInWithPopup instead of signInWithRedirect
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will now handle the user state after the popup closes.
      console.log("App.jsx: Google Sign-In popup initiated. Waiting for onAuthStateChanged to update state.");
    } catch (error) {
      console.error("App.jsx: Google Sign-In Error:", error);
      // Handle specific errors for popups, e.g., popup closed by user
      if (error.code === 'auth/popup-closed-by-user') {
        setFirebaseInitError("Sign-in popup closed. Please try again.");
      } else {
        setFirebaseInitError("Google Sign-In failed: " + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged listener will handle navigation after successful sign-out
      console.log("App.jsx: User sign out initiated. Waiting for onAuthStateChanged to update state.");
    } catch (error) {
      console.error("App.jsx: Sign-Out Error:", error);
      setFirebaseInitError("Sign-Out failed: " + error.message);
    }
  };

  // Function to render the main content page based on current authentication state and currentPage
  const renderMainContentPage = useCallback(() => {
    // Show loading spinner until Firebase auth state is determined
    if (!isAuthReady) {
      return (
        <div className="flex items-center justify-center h-full text-offWhite text-xl">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-lightGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading application...
        </div>
      );
    }

    // Display Firebase initialization errors
    if (firebaseInitError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500 text-xl text-center p-4">
          <p>Error initializing Firebase: {firebaseInitError}. Please check your configuration and network connection.</p>
        </div>
      );
    }

    // Logic for rendering pages based on authentication and authorization
    if (isAuthorizedStaff) {
      // If staff is authorized, they can access internal pages or the dashboard
      switch (currentPage) {
        case 'internalDashboard':
          return <InternalDashboardPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'materialManagement':
          return <MaterialManagementPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'mrp':
          return <MRPPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'salesOrders':
          return <SalesOrdersPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'settings':
          return <SettingsPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'cashflowCostTracker':
          return <CashflowCostTrackerPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'aiCreativeStudio':
          return <AICreativeStudioPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'marketingKanban':
          return <MarketingKanbanPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'socialMediaHub':
          return <SocialMediaHubPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'kanbanBoard':
          return <KanbanBoardPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'marketingAnalytics':
          return <MarketingAnalyticsPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'productManagement':
          return <ProductManagementPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        case 'instantQuote': // If authorized staff navigates to Instant Quote, they can see it
          return <InstantQuoteAppPage db={db} isAuthorizedStaff={isAuthorizedStaff} navigateTo={navigateTo} />;
        case 'authPage': // If authorized staff somehow lands on auth page, redirect to dashboard
          return <InternalDashboardPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
        default:
          // Default for authorized staff is the dashboard
          return <InternalDashboardPage db={db} userId={currentUser?.uid} firestoreAppId={firestoreAppId} />;
      }
    } else {
      // If not authorized staff (or no user), they can only access public pages or the auth page
      if (currentPage === 'authPage') {
        return <AuthPage onSignIn={handleGoogleSignIn} navigateTo={navigateTo} />;
      } else {
        // Default for non-authorized users is the Instant Quote page
        return <InstantQuoteAppPage db={db} isAuthorizedStaff={isAuthorizedStaff} navigateTo={navigateTo} />;
      }
    }
  }, [currentPage, isAuthReady, firebaseInitError, isAuthorizedStaff, db, currentUser, firestoreAppId, handleGoogleSignIn, navigateTo]);


  // Determine if sidebar should be shown
  // Sidebar is hidden on AuthPage and InstantQuoteAppPage (unless logged in and authorized)
  const showSidebar = currentPage !== 'authPage' &&
                      !(currentPage === 'instantQuote' && !isAuthorizedStaff);

  // Render the main application layout
  return (
    // Main container for the whole app, takes full screen height and is a flex row
    <div className="flex h-screen bg-darkGray text-offWhite font-inter">
      {/* Conditional Sidebar Rendering */}
      {showSidebar && (
        <>
          {/* Desktop Sidebar */}
          <aside className={`hidden md:flex flex-col flex-shrink-0 bg-mediumGray w-64 p-4 shadow-lg overflow-y-auto transition-all duration-300 ease-in-out`}>
            <h1 className="text-3xl font-bold text-lightGreen mb-6 text-center">HM ERP</h1>
            <nav className="flex-1">
              <ul>
                {/* Dashboard Link - Always visible for staff, not collapsible */}
                {isAuthorizedStaff && (
                  <li className="mb-2">
                    <button
                      onClick={() => navigateTo('internalDashboard')}
                      className={`w-full text-left py-2 px-4 rounded-xl transition duration-200
                        ${currentPage === 'internalDashboard' ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                    >
                      Dashboard
                    </button>
                  </li>
                )}

                {/* Department-based Navigation */}
                {departments.map((department) => (
                  <li key={department.name} className="mb-2">
                    <button
                      onClick={() => toggleDepartment(department.name)}
                      className="w-full text-left py-2 px-4 rounded-xl hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <department.icon className="mr-2" />
                        {department.name}
                      </span>
                      {expandedDepartments[department.name] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {expandedDepartments[department.name] && (
                      <ul className="ml-4 mt-2 border-l border-gray-600 pl-4">
                        {department.pages.map((page) => {
                          // Only show staffOnly pages to authorized staff
                          if (page.staffOnly && !isAuthorizedStaff) {
                            return null;
                          }
                          return (
                            <li key={page.path} className="mb-1">
                              {page.external ? (
                                <a
                                  href={page.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-left py-1 px-2 rounded-xl text-sm hover:bg-gray-700 flex items-center"
                                >
                                  <page.icon className="mr-2" />
                                  {page.name} <FaLink className="ml-auto text-xs" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => navigateTo(page.path)}
                                  className={`w-full text-left py-1 px-2 rounded-xl text-sm transition duration-200 flex items-center
                                    ${currentPage === page.path ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                                >
                                  <page.icon className="mr-2" />
                                  {page.name}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Staff Login/Logout in sidebar */}
            <div className="mt-auto p-4 border-t border-gray-700">
              {isAuthReady && currentUser ? (
                <>
                  <p className="text-sm text-gray-400 mb-2">Logged in as: {currentUser.displayName || currentUser.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-red-700 transition duration-200 shadow-lg flex items-center justify-center"
                  >
                    <FaRightFromBracket className="mr-2" /> Sign Out
                  </button>
                </>
              ) : (
                // Only show Staff Login button if not currently logged in
                isAuthReady && !currentUser && (
                  <>
                    <p className="text-sm text-gray-400 mb-2">Not logged in.</p>
                    <button
                      onClick={() => navigateTo('authPage')}
                      className="w-full bg-blue-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center"
                    >
                      <FaGoogle className="mr-2" /> Staff Login
                    </button>
                  </>
                )
              )}
            </div>
          </aside>

          {/* Mobile Sidebar Toggle Button (Hamburger) */}
          {/* Positioned top-4 left-4 */}
          <button
            className="md:hidden fixed top-4 left-4 z-40 bg-mediumGray p-3 rounded-full shadow-lg text-lightGreen"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Mobile Sidebar (Conditional visibility) */}
          <aside className={`fixed inset-y-0 left-0 bg-mediumGray w-64 p-4 shadow-lg z-40 transform transition-transform duration-300 ease-in-out md:hidden
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-end mb-4">
              <button
                className="text-offWhite"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <FaTimes size={24} />
              </button>
            </div>
            <h1 className="text-3xl font-bold text-lightGreen mb-6 text-center">HM ERP</h1>
            <nav className="flex-1 overflow-y-auto">
              <ul>
                {/* Dashboard Link - Always visible for staff, not collapsible */}
                {isAuthorizedStaff && (
                  <li className="mb-2">
                    <button
                      onClick={() => navigateTo('internalDashboard')}
                      className={`w-full text-left py-2 px-4 rounded-xl transition duration-200
                        ${currentPage === 'internalDashboard' ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                    >
                      Dashboard
                    </button>
                  </li>
                )}

                {/* Department-based Navigation */}
                {departments.map((department) => (
                  <li key={department.name} className="mb-2">
                    <button
                      onClick={() => toggleDepartment(department.name)}
                      className="w-full text-left py-2 px-4 rounded-xl hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <department.icon className="mr-2" />
                        {department.name}
                      </span>
                      {expandedDepartments[department.name] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {expandedDepartments[department.name] && (
                      <ul className="ml-4 mt-2 border-l border-gray-600 pl-4">
                        {department.pages.map((page) => {
                          // Only show staffOnly pages to authorized staff
                          if (page.staffOnly && !isAuthorizedStaff) {
                            return null;
                          }
                          return (
                            <li key={page.path} className="mb-1">
                              {page.external ? (
                                <a
                                  href={page.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-left py-1 px-2 rounded-xl text-sm hover:bg-gray-700 flex items-center"
                                >
                                  <page.icon className="mr-2" />
                                  {page.name} <FaLink className="ml-auto text-xs" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => navigateTo(page.path)}
                                  className={`w-full text-left py-1 px-2 rounded-xl text-sm transition duration-200 flex items-center
                                    ${currentPage === page.path ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                                >
                                  <page.icon className="mr-2" />
                                  {page.name}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Staff Login/Logout in sidebar */}
            <div className="mt-auto p-4 border-t border-gray-700">
              {isAuthReady && currentUser ? (
                <>
                  <p className="text-sm text-gray-400 mb-2">Logged in as: {currentUser.displayName || currentUser.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-red-700 transition duration-200 shadow-lg flex items-center justify-center"
                  >
                    <FaRightFromBracket className="mr-2" /> Sign Out
                  </button>
                </>
              ) : (
                // Only show Staff Login button if not currently logged in
                isAuthReady && !currentUser && (
                  <>
                    <p className="text-sm text-gray-400 mb-2">Not logged in.</p>
                    <button
                      onClick={() => navigateTo('authPage')}
                      className="w-full bg-blue-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center"
                    >
                      <FaGoogle className="mr-2" /> Staff Login
                    </button>
                  </>
                )
              )}
            </div>
          </aside>

          {/* Mobile Sidebar Toggle Button (Hamburger) */}
          {/* Positioned top-4 left-4 */}
          <button
            className="md:hidden fixed top-4 left-4 z-40 bg-mediumGray p-3 rounded-full shadow-lg text-lightGreen"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Mobile Sidebar (Conditional visibility) */}
          <aside className={`fixed inset-y-0 left-0 bg-mediumGray w-64 p-4 shadow-lg z-40 transform transition-transform duration-300 ease-in-out md:hidden
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-end mb-4">
              <button
                className="text-offWhite"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <FaTimes size={24} />
              </button>
            </div>
            <h1 className="text-3xl font-bold text-lightGreen mb-6 text-center">HM ERP</h1>
            <nav className="flex-1 overflow-y-auto">
              <ul>
                {/* Dashboard Link - Always visible for staff, not collapsible */}
                {isAuthorizedStaff && (
                  <li className="mb-2">
                    <button
                      onClick={() => navigateTo('internalDashboard')}
                      className={`w-full text-left py-2 px-4 rounded-xl transition duration-200
                        ${currentPage === 'internalDashboard' ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                    >
                      Dashboard
                    </button>
                  </li>
                )}

                {/* Department-based Navigation */}
                {departments.map((department) => (
                  <li key={department.name} className="mb-2">
                    <button
                      onClick={() => toggleDepartment(department.name)}
                      className="w-full text-left py-2 px-4 rounded-xl hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <department.icon className="mr-2" />
                        {department.name}
                      </span>
                      {expandedDepartments[department.name] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {expandedDepartments[department.name] && (
                      <ul className="ml-4 mt-2 border-l border-gray-600 pl-4">
                        {department.pages.map((page) => {
                          // Only show staffOnly pages to authorized staff
                          if (page.staffOnly && !isAuthorizedStaff) {
                            return null;
                          }
                          return (
                            <li key={page.path} className="mb-1">
                              {page.external ? (
                                <a
                                  href={page.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-left py-1 px-2 rounded-xl text-sm hover:bg-gray-700 flex items-center"
                                >
                                  <page.icon className="mr-2" />
                                  {page.name} <FaLink className="ml-auto text-xs" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => navigateTo(page.path)}
                                  className={`w-full text-left py-1 px-2 rounded-xl text-sm transition duration-200 flex items-center
                                    ${currentPage === page.path ? 'bg-lightGreen text-deepGray font-bold' : 'hover:bg-gray-700'}`}
                                >
                                  <page.icon className="mr-2" />
                                  {page.name}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Staff Login/Logout in sidebar */}
            <div className="mt-auto p-4 border-t border-gray-700">
              {isAuthReady && currentUser ? (
                <>
                  <p className="text-sm text-gray-400 mb-2">Logged in as: {currentUser.displayName || currentUser.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-red-700 transition duration-200 shadow-lg flex items-center justify-center"
                  >
                    <FaRightFromBracket className="mr-2" /> Sign Out
                  </button>
                </>
              ) : (
                // Only show Staff Login button if not currently logged in
                isAuthReady && !currentUser && (
                  <>
                    <p className="text-sm text-gray-400 mb-2">Not logged in.</p>
                    <button
                      onClick={() => navigateTo('authPage')}
                      className="w-full bg-blue-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center"
                    >
                      <FaGoogle className="mr-2" /> Staff Login
                    </button>
                  </>
                )
              )}
            </div>
          </aside>

          {/* Overlay for mobile sidebar */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            ></div>
          )}
        </>
      )}

      {/* Main Content Area - flex-1 to take remaining horizontal space, flex-col for vertical layout */}
      {/* Simplified margin logic for desktop, relying on flexbox for positioning */}
      <main className={`flex-1 p-6 flex flex-col transition-all duration-300 ease-in-out\
                       ${showSidebar ? 'md:ml-0' : 'md:ml-0'} ml-0`}> {/* Removed explicit md:ml-64 */}
        <div className="flex-1 overflow-y-auto">
          {renderMainContentPage()}
        </div>
        {/* Footer - Moved outside the flex-grow content div to ensure it's always at the bottom */}
        <footer className="w-full bg-mediumGray text-gray-400 text-center py-3 text-sm flex-shrink-0 border-t border-gray-700">
          <p>&copy; {new Date().getFullYear()} HM ERP. All rights reserved.</p>
        </footer>
      </main>

    </div>
  );
}

export default App;
