// src/pages/InternalDashboardPage.jsx
// This component renders the main internal dashboard for authorized staff users.
// It includes a responsive sidebar for navigation and dynamically renders different
// content pages or external links.
//
// Updates:
// 1. CRITICAL BUILD FIX: Meticulously re-typed the 'className' for the sidebar (<aside>)
//    to resolve "Expected '...' but found '}'" error, ensuring no hidden characters
//    or JSX parsing issues.
// 2. Confirmed and applied definitive styling for dashboard shell:
//    - Main background: bg-deepGray
//    - Sidebar background: bg-darkGray
//    - Main content area background: bg-darkGray
//    - Borders and shadows applied consistently.
//    - Rounded-xl consistency across dashboard shell.
// 3. SVG Icon paths re-confirmed (CloseIcon, MenuIcon) as a prior fix.

import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import all content pages
import MaterialManagementPage from './MaterialManagementPage';
import MRPPage from './MRPPage';
import SocialMediaHubPage from './SocialMediaHubPage';
import ProductManagementPage from './ProductManagementPage';
import KanbanBoardPage from './KanbanBoardPage';
import ServiceTemplatesPage from './ServiceTemplatesPage';
import InstantQuoteAppPage from './InstantQuoteAppPage'; // Correct import for your existing page
import DashboardHome from '../components/DashboardHome';

import { colors } from '../utils/constants';

// Phosphor icons (using inline SVGs with CORRECT paths)
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
    <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.32l-66.34,66.34a8,8,0,0,1-11.32-11.32L116.68,128,50.34,61.66a8,8,0,0,1,11.32-11.32L128,116.68l66.34-66.34a8,8,0,0,1,11.32,11.32L139.32,128Z"></path>
  </svg>
);

// Navigation sections for the sidebar
const navSections = [
  {
    title: null,
    items: [
      { id: 'dashboard', name: 'Dashboard Home', type: 'internal' },
    ]
  },
  {
    title: 'Manufacturing Operations',
    items: [
      { id: 'materials', name: 'Material Management', type: 'internal' },
      { id: 'mrp', name: 'MRP System', type: 'internal' },
      { id: 'product-management', name: 'Product Management', type: 'internal-placeholder' },
      { id: 'kanban-board', name: 'Kanban Board', type: 'internal-placeholder' },
    ]
  },
  {
    title: 'Sales & Service',
    items: [
      { id: 'instant-quote-app', name: 'Internal Quote App', type: 'internal' }, // <--- ID CHANGED TO MATCH YOUR PAGE
      { id: 'service-templates', name: 'Service Templates', type: 'internal-placeholder' },
    ]
  },
  {
    title: 'Marketing & Communication',
    items: [
      { id: 'social', name: 'Social Media Hub', type: 'internal' },
    ]
  },
  {
    title: 'External Tools',
    items: [
      { id: 'gmail', name: 'Gmail', type: 'external', url: 'https://mail.google.com/' },
      { id: 'wix-crm', name: 'Wix Dashboard (CRM)', type: 'external', url: 'https://www.wix.com/my-account/sites' },
      { id: 'financial-tracker', name: 'Financial Tracker', type: 'external', url: 'https://www.example.com/financial-tracker' },
      { id: 'adobe-express', name: 'Adobe Express (Social)', type: 'external', url: 'https://new.express.adobe.com/' },
    ]
  },
  {
    title: 'Admin & Settings',
    items: [
      { id: 'user-management', name: 'User Management', type: 'internal-placeholder' },
    ]
  }
];

const InternalDashboardPage = ({ db, auth, user, firestoreAppId, signOutUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isSidebarOpen) {
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
      window.open(item.url, '_blank');
    } else {
      setCurrentPage(item.id);
    }
    if (window.innerWidth < 768) {
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
      case 'instant-quote-app': // CORRECTLY ROUTING TO YOUR EXISTING PAGE
        return <InstantQuoteAppPage db={db} firestoreAppId={firestoreAppId} />;
      case 'user-management':
        return (
          <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl"> {/* Consistent outer container */}
            <h2 className="text-3xl font-bold text-white mb-6">User Management</h2> {/* Consistent heading */}
            <p className="text-gray-300">This is where you will manage staff accounts for dashboard access.</p>
            <div className="mt-8 p-6 bg-darkGray rounded-xl shadow-lg border border-gray-700"> {/* Consistent card style */}
              <h3 className="text-xl font-semibold text-white mb-4">Coming in Phase 2!</h3>
              <p className="text-gray-300">You'll be able to add, remove, and view authorized staff members here.</p>
            </div>
          </div>
        );
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-deepGray text-offWhite"> {/* Main background color */}
      {/* Sidebar - Desktop & Mobile */}
      <aside
        // CRITICAL FIX FOR className BELOW: Meticulously re-typed to resolve the parsing error.
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-darkGray transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:relative md:flex-shrink-0 md:flex md:flex-col rounded-r-xl shadow-xl`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-wrap leading-tight">
            HM Manufacturing
          </h2>
          <button onClick={toggleSidebar} className="md:hidden text-offWhite hover:text-gray-300 focus:outline-none">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navSections.map((section, index) => (
            <div key={index} className="mb-4 last:mb-0">
              {section.title && (
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-4 mb-2 px-2">
                  {section.title}
                </h3>
              )}
              <ul>
                {section.items.map((item) => (
                  <li key={item.id} className="mb-2">
                    {item.type === 'external' ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 rounded-xl text-left transition duration-200 hover:bg-gray-700 text-gray-300 hover:text-white"
                      >
                        {item.name}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 0 002 2h10a2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <button
                        onClick={() => handlePageChange(item)}
                        className={`flex items-center w-full px-4 py-2 rounded-xl text-left transition duration-200 ${
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
            </div>
          ))}
        </nav>

        {/* User Info & Logout Button */}
        <div className="p-4 border-t border-gray-700 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2 truncate max-w-full" title={user?.email}>
            Logged in as: {user?.email}
          </p>
          <button
            onClick={signOutUser}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8">
        {/* Mobile Navbar with Hamburger Icon */}
        <header className="md:hidden flex justify-between items-center bg-darkGray p-3 rounded-xl shadow-lg mb-4">
          <button onClick={toggleSidebar} className="text-offWhite hover:text-gray-300 focus:outline-none">
            <MenuIcon />
          </button>
          <h1 className="text-xl font-bold text-offWhite text-center flex-grow mx-2 truncate">
            HM Manufacturing
          </h1>
          <button
            onClick={signOutUser}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl shadow-md transition duration-300 ease-in-out"
          >
            Logout
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 rounded-xl p-4 md:p-6 shadow-inner bg-darkGray border border-gray-700 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default InternalDashboardPage;