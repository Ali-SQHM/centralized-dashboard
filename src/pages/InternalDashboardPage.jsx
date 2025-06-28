// src/pages/InternalDashboardPage.jsx
// This component renders the main internal dashboard for authorized staff users.
// It includes a responsive sidebar for navigation and dynamically renders different
// content pages or external links.
//
// All import paths are verified to be correct relative to this file's location.

import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import the new content pages (located in the SAME directory: src/pages/)
import MaterialManagementPage from './MaterialManagementPage';
import MRPPage from './MRPPage';
import SocialMediaHubPage from './SocialMediaHubPage';
import ProductManagementPage from './ProductManagementPage'; // NEW PLACEHOLDER
import KanbanBoardPage from './KanbanBoardPage';             // NEW PLACEHOLDER
import ServiceTemplatesPage from './ServiceTemplatesPage';   // NEW PLACEHOLDER


// Import the placeholder DashboardHome (located one level UP, then into 'components' folder)
import DashboardHome from '../components/DashboardHome'; // <--- THIS IS THE CRITICAL PATH


// Import constants for styling
import { colors } from '../utils/constants';

// Phosphor icons (using inline SVGs for robustness)
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
    <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
    <path d="M200,64H56A8,8,0,0,0,56,80H200a8,8,0,0,0,0-16Z"></path>
    <path d="M200,128H56a8,8,0,0,0,0,16H200a8,8,0,0,0,0-16Z"></path>
    <path d="M200,192H56a8,8,0,0,0,0,16H200a8,8,0,0,0,0-16Z"></path>
  </svg>
);


// Navigation items for the sidebar
const navItems = [
  { id: 'dashboard', name: 'Dashboard Home', type: 'internal' },
  { id: 'materials', name: 'Material Management', type: 'internal' },
  { id: 'mrp', name: 'MRP System', type: 'internal' },
  { id: 'social', name: 'Social Media Hub', type: 'internal' },
  { id: 'product-management', name: 'Product Management', type: 'internal-placeholder' }, // Future internal page
  { id: 'kanban-board', name: 'Kanban Board', type: 'internal-placeholder' },             // Future internal page
  { id: 'service-templates', name: 'Service Templates', type: 'internal-placeholder' },   // Future internal page
  { id: 'gmail', name: 'Gmail', type: 'external', url: 'https://mail.google.com/' },
  { id: 'wix-crm', name: 'Wix Dashboard (CRM)', type: 'external', url: 'https://www.wix.com/my-account/sites' }, // Example Wix URL
  { id: 'financial-tracker', name: 'Financial Tracker', type: 'external', url: 'https://www.example.com/financial-tracker' }, // Placeholder URL
];

const InternalDashboardPage = ({ db, auth, user, firestoreAppId, signOutUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // Default to dashboard home

  // Effect to close sidebar on larger screens if it was opened on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isSidebarOpen) { // md breakpoint in Tailwind is 768px
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (item) => {
    if (item.type === 'external') {
      window.open(item.url, '_blank'); // Open external links in a new tab
    } else {
      setCurrentPage(item.id);
    }
    if (window.innerWidth < 768) { // Close sidebar on mobile after selection
      setIsSidebarOpen(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'materials':
        return <MaterialManagementPage db={db} firestoreAppId={firestoreAppId} />;
      case 'mrp':
        return <MRPPage db={db} firestoreAppId={firestoreAppId} />;
      case 'social':
        return <SocialMediaHubPage db={db} firestoreAppId={firestoreAppId} />;
      case 'product-management':
        return <ProductManagementPage db={db} firestoreAppId={firestoreAppId} />;
      case 'kanban-board':
        return <KanbanBoardPage db={db} firestoreAppId={firestoreAppId} />;
      case 'service-templates':
        return <ServiceTemplatesPage db={db} firestoreAppId={firestoreAppId} />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:relative md:flex-shrink-0 md:flex md:flex-col rounded-r-lg shadow-xl`}
        style={{ backgroundColor: colors.deepGray }}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {/* HM Manufacturing Title - Responsive Font Size */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-wrap leading-tight">
            HM Manufacturing
          </h2>
          {/* Close button for mobile sidebar */}
          <button onClick={toggleSidebar} className="md:hidden text-white hover:text-gray-300 focus:outline-none">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <li key={item.id} className="mb-2">
                {item.type === 'external' ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-4 py-2 rounded-lg text-left transition duration-200 hover:bg-gray-700 text-gray-300 hover:text-white"
                  >
                    {item.name}
                    {/* Optional: Add an external link icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 0 002 2h10a2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <button
                    onClick={() => handlePageChange(item)}
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-left transition duration-200 ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout Button */}
        <div className="p-4 border-t border-gray-700 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2 truncate max-w-full" title={user?.email}>
            Logged in as: {user?.email}
          </p>
          <button
            onClick={signOutUser}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8">
        {/* Mobile Navbar with Hamburger Icon */}
        <header className="md:hidden flex justify-between items-center bg-gray-800 p-3 rounded-lg shadow-lg mb-4" style={{ backgroundColor: colors.deepGray }}>
          <button onClick={toggleSidebar} className="text-white hover:text-gray-300 focus:outline-none">
            <MenuIcon />
          </button>
          {/* Title on mobile header, adapts to space */}
          <h1 className="text-xl font-bold text-white text-center flex-grow mx-2 truncate">
            HM Manufacturing
          </h1>
          {/* Logout button duplicated for mobile convenience */}
          <button
            onClick={signOutUser}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg shadow-md transition duration-300 ease-in-out"
          >
            Logout
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 rounded-xl p-4 md:p-6 shadow-inner bg-gray-800 border border-gray-700 overflow-auto" style={{ backgroundColor: colors.deepGray }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default InternalDashboardPage;