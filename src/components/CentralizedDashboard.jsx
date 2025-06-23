// src/components/CentralizedDashboard.jsx
// Main component for the centralized dashboard layout.
// Handles internal routing and displays the sidebar with navigation and search.
// FIX: Corrected SVG path for Google Chat icon.

import React, { useState } from 'react';
import DashboardCard from './DashboardCard';
import DashboardContent from './DashboardContent';
import MRPPage from './MRPPage';
import SocialMediaHubPage from './SocialMediaHubPage';
import MaterialManagementPage from './MaterialManagementPage';
import InstantQuoteAppPage from './InstantQuoteAppPage';
import { colors } from '../utils/constants'; // Import colors from centralized constants

// --- dashboardCardsData ---
// This data defines the cards displayed on the sidebar and main content area.
const dashboardCardsData = [
  // --- Sidebar Cards ---
  {
    id: 'sidebar-gmail',
    title: 'Gmail',
    description: 'Manage business emails.',
    icon: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75M21.75 6.75a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6.75m18.75 0v2.625a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75m18.75 0a3.75 3.75 0 0 0-3.75-3.75H9.75a3.75 3.75 0 0 0-3.75 3.75m6.75 0a5.25 5.25 0 0 0-5.25 5.25v2.25m-3.75 7.5v-2.25m11.25 7.5v-2.25m-6.75 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
    link: "https://mail.google.com/",
    cardBgColor: colors.darkGreen,
    iconBgColor: colors.mediumGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'sidebar'
  },
  {
    id: 'sidebar-chat',
    title: 'Google Chat',
    description: 'Collaborate on tasks.',
    // FIX: Removed the extra '=' sign in the SVG path data here.
    icon: "M20.25 8.515 17.5 10.758V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h11.75a1.5 1.5 0 1 1.5-1.5V13.5l3.75 2.25V8.515ZM12 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12.75a.75.75 0 0 1-.75-.75V7.5ZM6.75 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V7.5ZM3 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V15Z",
    link: "https://chat.google.com/",
    cardBgColor: colors.darkGreen,
    iconBgColor: colors.mediumGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'sidebar'
  },
  {
    id: 'sidebar-drive',
    title: 'Google Drive',
    description: 'Access business files.',
    icon: "M13.5 6.75L12 9.75m-3.75-5.25L3 7.5m1.5 4.5l4.5 4.5m4.5-12.75l4.5 4.5M12 18.75l3-3.75m-3-6l2.25 2.25M6.75 15l-3 3.75m15-3.75l-3 3.75m-9.75-9.75l3 3.75M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    link: "https://drive.google.com/",
    cardBgColor: colors.darkGreen,
    iconBgColor: colors.mediumGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'sidebar'
  },

  // --- Main Content Cards ---
  {
    id: 'main-financial-tracker',
    title: 'Financial Operations Tracker',
    description: 'Your centralized sheet for cash flow, costs & transfers.',
    icon: "M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z",
    link: "#", 
    isPlaceholder: true,
    cardBgColor: colors.mediumGreen,
    iconBgColor: colors.darkGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'main'
  },
  {
    id: 'main-wix-dashboard',
    title: 'Wix Dashboard',
    description: 'Manage your website, orders, and CRM.',
    icon: "M19.5 12h-2.625a2.25 2.25 0 0 1-2.25-2.25V7.5m-18.75 4.5H5.25a2.25 2.25 0 0 0 2.25-2.25V7.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM1.5 12H5.25m-.75 7.5V12m14.25 4.5v-4.5m10.5 0H21a.75.75 0 0 0-.75-.75m-18 0v-2.25A2.25 2.25 0 0 1 3.75 6a2.25 2.25 0 0 1 2.25 2.25v.75m.75-3.75v.75m0 3.75h-.75M12 10.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
    link: "https://manage.wix.com/",
    isPlaceholder: false,
    cardBgColor: colors.mediumGreen,
    iconBgColor: colors.darkGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'main'
  },
  {
    id: 'main-erp-mrp',
    title: 'ERP/MRP System',
    description: 'Automate manufacturing costs & inventory.',
    icon: "M12 21a9 9 0 0 0 9-9c0-.73-.09-1.44-.26-2.12M15 15a3 3 0 0 1-3 3c-1.44 0-2.73-.56-3.75-1.47M3 11.25a9 9 0 0 1 18 0c0 .73-.09 1.44-.26 2.12M9 9a3 3 0 0 0 3-3c1.44 0 2.73.56 3.75 1.47M4.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75H4.5ZM19.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-.75ZM9 15.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6Z", // Manufacturing icon
    link: "mrp", 
    isPlaceholder: false, 
    cardBgColor: colors.mediumGreen,
    iconBgColor: colors.darkGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'main'
  },
  {
    id: 'main-ai-hub',
    title: 'AI Social Media Hub',
    description: 'Generate content & manage social media.',
    icon: "M18 1.5c2.982 0 5.467 2.225 5.953 5.176c-.453-.162-.93-.264-1.428-.314l-.078.002a2.895 2.895 0 0 0-2.316 2.684v1.5a.75.75 0 0 0 1.5 0v-1.5a1.395 1.395 0 0 1 1.117-1.295c.787-.139 1.487.054 1.838.411A.75.75 0 0 0 21 8.25c0 .385-.205.702-.505.882c-2.485 1.405-5.337 1.947-8.25 1.947c-3.153 0-6.195-.716-8.25-1.947C3.205 8.952 3 8.635 3 8.25a.75.75 0 0 0 .505-.882c.351-.357 1.051-.55 1.838-.411a1.395 1.395 0 0 1 1.117 1.295v1.5a.75.75 0 0 0 1.5 0v-1.5A2.895 2.895 0 0 0 4.047 6.676C4.533 3.725 7.018 1.5 10 1.5h8Zm-9 6a3 3 0 0 0-3 3v2.25a.75.75 0 0 0 1.5 0v-2.25a1.5 1.5 0 0 1 1.5-1.5H12a1.5 1.5 0 0 1 1.5 1.5v2.25a.75.75 0 0 0 1.5 0v-2.25a3 3 0 0 0-3-3h-2Z",
    link: "social_media_hub", 
    isPlaceholder: false, 
    cardBgColor: colors.mediumGreen,
    iconBgColor: colors.darkGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'main'
  },
];


// Centralized Dashboard Component
function CentralizedDashboard({ db, userId, firebaseReady, firestoreAppId }) { 
  const [currentPage, setCurrentPage] = useState('dashboard'); 
  const [searchTerm, setSearchTerm] = useState(''); // State for search bar in sidebar

  const sidebarCards = dashboardCardsData.filter(card => card.location === 'sidebar');
  const mainCards = dashboardCardsData.filter(card => card.location === 'main');

  const handleInternalNavigation = (pageName) => {
    setCurrentPage(pageName);
  };

  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      window.open(googleSearchUrl, '_blank');
      setSearchTerm('');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        // Pass relevant props to DashboardContent
        return <DashboardContent onInternalNav={handleInternalNavigation} mainCards={mainCards} userId={userId} firebaseReady={firebaseReady} />; 
      case 'mrp':
        return <MRPPage onInternalNav={handleInternalNavigation} />;
      case 'social_media_hub':
        return <SocialMediaHubPage onInternalNav={handleInternalNavigation} />;
      case 'material_management': 
        // Pass db and firestoreAppId to MaterialManagementPage
        return <MaterialManagementPage onInternalNav={handleInternalNavigation} db={db} firestoreAppId={firestoreAppId} />; 
      case 'instant_quote_app': 
        // Pass db and firestoreAppId to InstantQuoteAppPage
        return <InstantQuoteAppPage db={db} onInternalNav={handleInternalNavigation} firestoreAppId={firestoreAppId} />; 
      case 'sales_orders': 
        return (
          <div className="flex-1 p-8 overflow-auto">
            <h1 className="text-4xl font-extrabold text-offWhite mb-8">Sales Orders</h1>
            <p className="text-lightGreen mb-6">Sales Order management coming soon!</p>
            <button
              onClick={() => handleInternalNavigation('mrp')}
              className="p-3 rounded-lg font-semibold transition-colors duration-200"
              style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
            >
              Back to MRP System
            </button>
          </div>
        );
      case 'production_planning': 
        return (
          <div className="flex-1 p-8 overflow-auto">
            <h1 className="text-4xl font-extrabold text-offWhite mb-8">Production Planning</h1>
            <p className="text-lightGreen mb-6">Production Planning coming soon!</p>
            <button
              onClick={() => handleInternalNavigation('mrp')}
              className="p-3 rounded-lg font-semibold transition-colors duration-200"
              style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
            >
              Back to MRP System
            </button>
          </div>
        );
      default:
        return <DashboardContent onInternalNav={handleInternalNavigation} mainCards={mainCards} userId={userId} firebaseReady={firebaseReady} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Poppins']" style={{ backgroundColor: colors.deepGray }}>
      
      {/* Sidebar */}
      <div className="w-full md:w-1/4 min-w-[200px] max-w-[300px] bg-gradient-to-b from-darkGreen to-mediumGreen p-6 flex flex-col items-center rounded-b-none md:rounded-b-none md:rounded-r-3xl shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-white text-center">Dashboard Insights</h2>
        
        {/* Search Bar for Google Search */}
        <div className="mb-6 w-full">
            <input 
                type="text" 
                placeholder="Search Google..." 
                className="p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen w-full placeholder-offWhite/70" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyPress={handleSearch} 
            />
        </div>

        {/* Dynamic Sidebar Cards */}
        <div className="space-y-4 w-full">
          {sidebarCards.map(card => ( 
            <DashboardCard
              key={card.id} 
              title={card.title}
              description={card.description}
              icon={card.icon}
              link={card.link}
              isPlaceholder={card.isPlaceholder}
              cardBgColor={card.cardBgColor}
              iconBgColor={card.iconBgColor}
              textColor={card.textColor}
              descColor={card.descColor}
              // onInternalNav is not passed here as sidebar links are either external or root paths
            />
          ))}

          {/* Placeholder for "Random Thought of the Day" - To be enhanced */}
          <div className="bg-white/10 rounded-xl p-4 text-center shadow-lg">
            <p className="font-semibold mb-2" style={{ color: colors.accentGold, fontSize: '0.875rem' }}>Thought of the Day</p>
            <p className="italic" style={{ color: colors.offWhite, fontSize: '0.75rem', opacity: '0.8' }}>"Creativity is intelligence having fun."</p>
          </div>
        </div>
      </div>

      {/* Main Content Area (conditionally rendered page) */}
      {renderPage()}

    </div>
  );
}

export default CentralizedDashboard;