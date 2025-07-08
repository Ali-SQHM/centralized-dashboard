
// This component acts as the main content area of the dashboard.
// It dynamically renders different pages (e.g., MaterialManagementPage)
// based on the `currentPage` prop.
// It now uses the new `PageLayout` component to provide consistent
// page titles and mobile top padding.
//
// FIX: Corrected import path for SettingsPage.

import React from 'react';
import MaterialManagementPage from '../pages/MaterialManagementPage';
// Import other pages as needed
import InternalDashboardPage from '../pages/InternalDashboardPage';
import InstantQuoteAppPage from '../pages/InstantQuoteAppPage';
import MRPPage from '../pages/MRPPage';
import SalesOrdersPage from '../pages/SalesOrdersPage';
import CashflowCostTrackerPage from '../pages/CashflowCostTrackerPage'; // Corrected path
import AICreativeStudioPage from '../pages/AICreativeStudioPage'; // Corrected path
import MarketingKanbanPage from '../pages/MarketingKanbanPage'; // Corrected path
import SocialMediaHubPage from '../pages/SocialMediaHubPage'; // Corrected path
import KanbanBoardPage from '../pages/KanbanBoardPage'; // Corrected path
import MarketingAnalyticsPage from '../pages/MarketingAnalyticsPage'; // Corrected path
import ProductManagementPage from '../pages/ProductManagementPage'; // Corrected path

// CORRECTED IMPORT PATH for SettingsPage
import SettingsPage from '../pages/SettingsPage';

// NEW IMPORT: PageLayout component
import PageLayout from './PageLayout';


function DashboardContent({ currentPage, db, userId, firestoreAppId }) {
  // This function now only returns the *content* of the page,
  // without its title or outer styling.
  const renderPageContent = () => {
    switch (currentPage) {
      case 'instantQuote':
        return <InstantQuoteAppPage db={db} />; // InstantQuote is a public page, might not use PageLayout's title
      case 'internalDashboard':
        return <InternalDashboardPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'materialManagement':
        return <MaterialManagementPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'mrp':
        return <MRPPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'salesOrders':
        return <SalesOrdersPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'settings':
        return <SettingsPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'cashflowCostTracker':
        return <CashflowCostTrackerPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'aiCreativeStudio':
        return <AICreativeStudioPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'marketingKanban':
        return <MarketingKanbanPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'socialMediaHub':
        return <SocialMediaHubPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'kanbanBoard':
        return <KanbanBoardPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'marketingAnalytics':
        return <MarketingAnalyticsPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      case 'productManagement':
        return <ProductManagementPage db={db} userId={userId} firestoreAppId={firestoreAppId} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-offWhite text-2xl">
            <p>Welcome to your Dashboard! Select a module from the sidebar.</p>
          </div>
        );
    }
  };

  // Map page paths to their display titles for the PageLayout component
  const pageTitles = {
    'internalDashboard': 'Internal Dashboard',
    'materialManagement': 'Material Management',
    'mrp': 'MRP & Production Planning',
    'salesOrders': 'Sales Orders',
    'settings': 'Settings',
    'cashflowCostTracker': 'Cashflow & Cost Tracker',
    'aiCreativeStudio': 'AI Creative Studio',
    'marketingKanban': 'Marketing Kanban',
    'socialMediaHub': 'Social Media Hub',
    'kanbanBoard': 'Production Kanban Board',
    'marketingAnalytics': 'Marketing Analytics',
    'productManagement': 'Product Management',
    'instantQuote': 'Instant Quote' // Even public pages can have a title
  };

  // Get the title for the current page, default to 'Dashboard' if not found
  const currentPageTitle = pageTitles[currentPage] || 'Dashboard';

  return (
    // This div is the main content area container. It provides the overall
    // padding, background, and shadow for the displayed page.
    <div className="w-full h-full p-4 md:p-6 bg-deepGray rounded-xl shadow-md">
      {/* Now, wrap the actual page content with the PageLayout component. */}
      {/* The PageLayout will handle the page title and mobile top padding. */}
      <PageLayout pageTitle={currentPageTitle}>
        {renderPageContent()}
      </PageLayout>
    </div>
  );
}

export default DashboardContent;
