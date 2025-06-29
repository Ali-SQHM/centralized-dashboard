// src/pages/InternalDashboardPage.jsx
// This component acts as the main layout for the internal ERP/MRP dashboard.
// It includes the sidebar navigation and dynamically renders content based on the selected page.
// It consumes Firebase instances and user status passed as props from App.jsx.
//
// Updates:
// 1. **FINAL MAIN PAGE HEADER (H2) PADDING FIX:**
//    - Removed all padding from the `<header>` element.
//    - Added `mb-6` to the `<header>` element for consistent bottom margin.
//    - Applied `pl-4 md:pl-6` (padding-left) to the `h2` element itself to push it from the left edge.
// 2. Final & Robust Layout Solution for Desktop Excessive Spacing (from previous fix) is retained.
// 3. Mobile hamburger overlap fix and overlay functionality retained.
// 4. Corrected import path for `AICreativeStudioPage`.
// 5. Sidebar layout refinements (scrollability, title centering) are retained.

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// All icon imports confirmed for react-icons/fa6
import {
  FaCube, FaChartBar, FaClipboardList, FaRightFromBracket, FaGear,
  FaQuoteLeft, FaHandshake, FaBoxesPacking, FaSwatchbook, FaShareNodes,
  FaFileInvoiceDollar,
  FaBars // Hamburger icon
} from 'react-icons/fa6';

// Import all application pages
import MaterialManagementPage from './MaterialManagementPage';
import MRPPage from './MRPPage';
import SalesOrdersPage from './SalesOrdersPage';
import SettingsPage from './SettingsPage';
import InstantQuoteAppPage from './InstantQuoteAppPage'; // Consolidated quote page
import KanbanBoardPage from './KanbanBoardPage'; // Kanban board

// New placeholder pages
import CashflowCostTrackerPage from './CashflowCostTrackerPage';
import AICreativeStudioPage from './AICreativeStudioPage'; // Corrected import path
import MarketingKanbanPage from './MarketingKanbanPage';
import MarketingAnalyticsPage from './MarketingAnalyticsPage';
import ProductManagementPage from './ProductManagementPage';
import ServiceTemplatesPage from './ServiceTemplatesPage';
import SocialMediaHubPage from './SocialMediaHubPage';

// Import color constants
import { colors } from '../utils/constants';

function InternalDashboardPage({ db, auth, user, firestoreAppId }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [currentPage, setCurrentPage] = useState('salesOrders');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on larger screens

  // Listen for auth state changes to keep currentUser updated
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (!user) {
          console.log("InternalDashboardPage: User logged out, App.jsx will handle redirection.");
        }
      });
      return () => unsubscribe();
    }
  }, [auth]);

  // Effect to handle initial sidebar state on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // Tailwind's 'md' breakpoint is 768px
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        console.log("InternalDashboardPage: User signed out successfully.");
      } catch (error) {
        console.error("InternalDashboardPage: Error signing out:", error);
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'materialManagement':
        return <MaterialManagementPage db={db} firestoreAppId={firestoreAppId} />;
      case 'mrp':
        return <MRPPage db={db} firestoreAppId={firestoreAppId} />;
      case 'salesOrders':
        return <SalesOrdersPage db={db} firestoreAppId={firestoreAppId} currentUser={currentUser} />;
      case 'internalSalesQuote':
        return (
          <InstantQuoteAppPage
            db={db}
            firestoreAppId={firestoreAppId}
            auth={auth}
            currentUser={currentUser}
            isAuthorizedStaff={true}
            navigateTo={() => setCurrentPage('internalSalesQuote')}
          />
        );
      case 'customerWebQuotePreview':
        return (
          <InstantQuoteAppPage
            db={db}
            firestoreAppId={firestoreAppId}
            auth={auth}
            currentUser={currentUser}
            isAuthorizedStaff={false}
            navigateTo={() => setCurrentPage('customerWebQuotePreview')}
          />
        );
      case 'productManagement':
        return <ProductManagementPage db={db} firestoreAppId={firestoreAppId} />;
      case 'serviceTemplates':
        return <ServiceTemplatesPage db={db} firestoreAppId={firestoreAppId} />;
      case 'cashflowCostTracker':
        return <CashflowCostTrackerPage db={db} firestoreAppId={firestoreAppId} />;
      case 'aiCreativeStudio':
        return <AICreativeStudioPage db={db} firestoreAppId={firestoreAppId} />;
      case 'marketingKanban':
        return <MarketingKanbanPage db={db} firestoreAppId={firestoreAppId} />;
      case 'marketingAnalytics':
        return <MarketingAnalyticsPage db={db} firestoreAppId={firestoreAppId} />;
      case 'socialMediaHub':
        return <SocialMediaHubPage db={db} firestoreAppId={firestoreAppId} />;
      case 'kanbanBoard':
          return <KanbanBoardPage db={db} firestoreAppId={firestoreAppId} currentUser={currentUser} />;
      case 'settings':
        return <SettingsPage db={db} firestoreAppId={firestoreAppId} />;
      default:
        // Default page when no specific page is selected
        return (
          <div className="w-full h-full text-offWhite flex flex-col items-center justify-center p-4 md:p-6">
            <h3 className="text-2xl font-bold mb-4">Welcome to Your Dashboard!</h3>
            <p>Select a module from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-deepGray text-offWhite relative">
      {/* Hamburger Icon for Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-full bg-darkGray text-offWhite shadow-lg"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Sidebar Navigation */}
      {/* Added overflow-y-auto here to ensure scrollability of sidebar content */}
      <nav className={`fixed inset-y-0 left-0 w-64 bg-darkGray p-4 flex flex-col justify-between shadow-lg z-40
                       transition-transform duration-300 ease-in-out overflow-y-auto
                       ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* This div just manages flex distribution; its parent nav provides padding */}
        <div className="flex-1">
          {/* H1 title in sidebar - Reverted to text-center and original margins */}
          <h1 className="text-3xl font-bold mb-8 text-blue-400 text-center" style={{ color: colors.blue[400] }}>HM ERP</h1>
          <ul>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('salesOrders')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'salesOrders' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaClipboardList className="mr-3 text-xl" /> Sales Orders
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('materialManagement')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'materialManagement' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaCube className="mr-3 text-xl" /> Material Mgmt.
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('mrp')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'mrp' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaChartBar className="mr-3 text-xl" /> MRP & Planning
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('kanbanBoard')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'kanbanBoard' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaBoxesPacking className="mr-3 text-xl" /> Production Kanban
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('productManagement')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'productManagement' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaSwatchbook className="mr-3 text-xl" /> Product Mgmt.
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('serviceTemplates')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'serviceTemplates' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaHandshake className="mr-3 text-xl" /> Service Templates
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('cashflowCostTracker')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'cashflowCostTracker' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaFileInvoiceDollar className="mr-3 text-xl" /> Cashflow/Cost Tracker
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('aiCreativeStudio')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'aiCreativeStudio' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaCube className="mr-3 text-xl" /> AI Creative Studio
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('marketingKanban')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'marketingKanban' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaClipboardList className="mr-3 text-xl" /> Marketing Kanban
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('marketingAnalytics')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'marketingAnalytics' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaChartBar className="mr-3 text-xl" /> Marketing Analytics
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('socialMediaHub')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'socialMediaHub' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaShareNodes className="mr-3 text-xl" /> Social Media Hub
              </button>
            </li>
            <li className="mb-2 border-t border-gray-700 pt-2 mt-2"> {/* Separator for Quote Tools */}
              <button
                onClick={() => setCurrentPage('internalSalesQuote')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'internalSalesQuote' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaFileInvoiceDollar className="mr-3 text-xl" /> Internal Sales Quote
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentPage('customerWebQuotePreview')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'customerWebQuotePreview' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
              >
                <FaQuoteLeft className="mr-3 text-xl" /> Customer Web Quote Preview
              </button>
            </li>
            <li className="mb-2">
            <button
                onClick={() => setCurrentPage('settings')}
                className={`flex items-center w-full p-3 rounded-xl text-left font-semibold transition-colors duration-200
                ${currentPage === 'settings' ? 'bg-lightGreen text-deepGray shadow-md' : 'text-offWhite hover:bg-lightGreen hover:text-deepGray'}`}
            >
              <FaGear className="mr-3 text-xl" /> Settings
            </button>
          </li>
        </ul>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Logged in as: <span className="font-semibold text-offWhite">{currentUser?.email || currentUser?.uid}</span></p>
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-xl text-left font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
          >
            <FaRightFromBracket className="mr-3 text-xl" /> Logout
          </button>
        </div>
      </nav>

      {/* Mobile Overlay when sidebar is open */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
        ></div>
      )}

      {/* Main Content Area - This container manages the overall layout and push from sidebar */}
      {/* Uses md:pl-64 to explicitly push content over for the fixed sidebar. */}
      <div className={`flex-1 flex flex-col p-4 md:pl-64 md:pr-6 md:pt-6 md:pb-6 transition-all duration-300 ease-in-out
                       ${window.innerWidth < 768 ? 'pt-16' : ''} z-10 min-w-0`}>
        {/* Header for main content area - Removed internal padding. */}
        <header className="mb-6"> {/* Removed px-4 md:px-6 pt-4 md:pt-6 from here */}
          {/* H2 title for main page - Now has its own padding to push it from the left edge */}
          <h2 className="text-3xl font-bold text-offWhite pl-4 md:pl-6"> {/* Added pl-4 md:pl-6 */}
            {/* Dynamic Header Title */}
            {currentPage === 'materialManagement' && 'Material Management'}
            {currentPage === 'mrp' && 'MRP & Production Planning'}
            {currentPage === 'salesOrders' && 'Sales Orders'}
            {currentPage === 'internalSalesQuote' && 'Internal Sales Quote'}
            {currentPage === 'customerWebQuotePreview' && 'Customer Web Quote Preview'}
            {currentPage === 'productManagement' && 'Product Management'}
            {currentPage === 'serviceTemplates' && 'Service Templates'}
            {currentPage === 'cashflowCostTracker' && 'Cashflow & Cost Tracker'}
            {currentPage === 'aiCreativeStudio' && 'AI Creative Studio'}
            {currentPage === 'marketingKanban' && 'Marketing Kanban'}
            {currentPage === 'marketingAnalytics' && 'Marketing Analytics'}
            {currentPage === 'socialMediaHub' && 'Social Media Hub'}
            {currentPage === 'kanbanBoard' && 'Production Kanban Board'}
            {currentPage === 'settings' && 'Settings'}
            {/* Default title if none match */}
            {currentPage === 'salesOrders' && !currentPage && 'Dashboard'}
          </h2>
        </header>

        {/* Dynamic content rendering container - This is where the individual page component lives */}
        {/* It applies the common background, border, shadow, takes full width/height of its parent, AND internal padding. */}
        <div className="rounded-xl shadow-md border border-gray-700 w-full bg-darkGray h-full p-4 md:p-6">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default InternalDashboardPage;