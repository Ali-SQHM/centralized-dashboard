// src/App.jsx
// This version introduces a multi-page structure using state for navigation
// It includes placeholders for MRP and Social Media Hub pages.
// NOW INCLUDES MATERIAL MANAGEMENT FUNCTIONALITY WITH FIRESTORE, USING YOUR SPECIFIC HEADERS.
// UPDATED COMMON UNITS FOR DROPDOWNS.
// FIXED: Missing closing brace in DashboardCard's <p> element's style attribute.
// FIXED: Dropdown styling for better readability (white text on white background issue).
// UPDATED: Attempted to change dropdown highlight to lightGreen using focus styles.
// FIXED: Dashboard links not working correctly (differentiated internal/external navigation).
// FIXED: ReferenceError: PlaceholderBadge is not defined by moving its definition outside DashboardCard.
// NEW: Added 'Material Type' field with specific categories.
// NEW: Added Search and Filter functionality to MaterialManagementPage.
// FIXED: Unified form input field background colors to bg-white/10 and text to text-offWhite.
// UPDATED: Added 'Sheet Materials' to the materialTypes array.
// NEW: Formatted conversionFactor and mcp in the table to display with six decimal places.

import React, { useState, useEffect } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore'; 

// Define a custom color palette inspired by the logo's dark green
const colors = {
  darkGreen: '#1A4D2E', // A deep, rich green for main background
  mediumGreen: '#4F6C4C', // A slightly lighter green for accents/card backgrounds
  lightGreen: '#738C71', // A lighter green for text or softer accents
  accentGold: '#FFC200', // A contrasting vibrant color (can be changed to orange, blue etc.)
  offWhite: '#F3F4F6', // Off-white for main content background or contrasting text
  darkGray: '#1F2937', // A dark gray for text or secondary elements on light backgrounds
  deepGray: '#111827', // A near-black for darkest elements or background accents
};


// --- dashboardCardsData ---
const dashboardCardsData = [
  // --- Sidebar Cards --- (These are intentionally kept to essential links)
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
    icon: "M20.25 8.515 17.5 10.758V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h11.75a1.5 1.5 0 0 0 1.5-1.5V13.5l3.75 2.25V8.515ZM12 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12.75a.75.75 0 0 1-.75-.75V7.5ZM6.75 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V7.5Zm3 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H10.5a.75.75 0 0 1-.75-.75V15Z",
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


  // --- Main Content Cards --- (These include internal navigation)
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


// --- CalendarComponent ---
function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="p-2 text-center text-offWhite/30"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`p-2 text-center rounded-lg transition-colors duration-200 cursor-pointer`}
          style={{
            backgroundColor: isToday ? colors.accentGold : 'transparent',
            color: isToday ? colors.deepGray : colors.offWhite, 
          }}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com/', '_blank');
  };

  return (
    <div
      className="rounded-xl p-6 shadow-xl flex flex-col"
      style={{ minHeight: '300px', backgroundColor: colors.mediumGreen }}
    >
      {/* Calendar Header: Month, Year, and Navigation Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-lightGreen hover:text-deepGray transition-colors duration-200"
          style={{ backgroundColor: colors.darkGreen, color: colors.offWhite }}
        >
          &lt;
        </button>
        <h3 className="text-xl font-bold" style={{ color: colors.offWhite }}>
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-lightGreen hover:text-deepGray transition-colors duration-200"
          style={{ backgroundColor: colors.darkGreen, color: colors.offWhite }}
        >
          &gt;
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdayNames.map(day => (
          <div key={day} className="text-center font-semibold text-sm" style={{ color: colors.lightGreen }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {generateDays()}
      </div>

      <button
        onClick={openGoogleCalendar}
        className="mt-4 p-3 rounded-lg font-semibold transition-colors duration-200"
        style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
      >
        Go to Google Calendar
      </button>
    </div>
  );
}


// --- PlaceholderBadge Component (Moved outside DashboardCard) ---
const PlaceholderBadge = () => (
  <span className="absolute top-2 right-2 bg-accentGold text-deepGray text-xs font-semibold px-2.5 py-0.5 rounded-full">
    Coming Soon
  </span>
);


// --- DashboardCard Component ---
function DashboardCard({ title, description, icon, link, isPlaceholder = false, cardBgColor, iconBgColor, textColor, descColor, onInternalNav }) {
  // Determine if it's an external link
  const isExternalLink = link.startsWith('http://') || link.startsWith('https://');

  const handleClick = (e) => {
    if (isPlaceholder) {
      e.preventDefault(); // Prevent navigation for placeholders
      console.log(`${title} is coming soon!`);
    } else if (!isExternalLink && onInternalNav) { // Only call onInternalNav for internal links
      e.preventDefault(); // Prevent default <a> behavior for internal links
      onInternalNav(link);
    }
    // If it's an external link, do nothing here; let the default <a> behavior handle it.
  };

  return (
    <a
      // If it's a placeholder or internal link, use # and let handleClick manage.
      // If it's an external link, use the actual link and target="_blank".
      href={isPlaceholder || !isExternalLink ? "#" : link}
      target={isExternalLink ? "_blank" : "_self"}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      className={`relative flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
        ${isPlaceholder ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ backgroundColor: cardBgColor }}
      onClick={handleClick}
    >
      {isPlaceholder && <PlaceholderBadge />}
      <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 text-accentGold" style={{ backgroundColor: iconBgColor }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-center mb-2" style={{ color: textColor }}>{title}</h3>
      <p className="text-center text-sm" style={{ color: descColor }}>
        {description}
      </p>
    </a>
  );
}


// --- Placeholder Components for different pages ---

// Component for the Main Dashboard Content
function DashboardContent({ onInternalNav, mainCards }) { 
  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left">
        <div className="md:w-1/2 mb-4 md:mb-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-offWhite">
            HM Canvases & Alliem Art
          </h1>
          <p className="text-xl sm:text-2xl text-lightGreen font-semibold">
            Operations Dashboard
          </p>
        </div>

        <div className="md:w-1/2 flex justify-center md:justify-end">
          <img 
            src="/Original on Transparent.png" 
            alt="HM Canvases & Alliem Art Logo" 
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/200x80/1A4D2E/F3F4F6?text=Logo" }} 
            className="max-h-24 md:max-h-32 w-auto rounded-lg shadow-md" 
          />
        </div>
      </header>

      {/* Dashboard Overview Heading */}
      <h2 className="text-3xl font-extrabold text-offWhite mb-8">Dashboard Overview</h2>

      {/* Dynamic Main Content Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {mainCards.map(card => (
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
            onInternalNav={onInternalNav} 
          />
        ))}
        
        {/* Placeholder for Monthly Sales Graph */}
        <div className="bg-mediumGreen rounded-xl p-6 shadow-xl flex flex-col justify-between" style={{ minHeight: '300px' }}>
          <h3 className="text-xl font-bold text-offWhite mb-2">Monthly Sales (Graph Placeholder)</h3>
          <p className="text-lightGreen">Visualizing canvases made...</p>
          <div className="h-48 bg-white/10 rounded-lg mt-4 flex items-center justify-center text-white/50 text-sm">
              [ Graph ]
          </div>
        </div>

        {/* Google Calendar */}
        <CalendarComponent />
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-offWhite/70 text-sm">
        <p>&copy; {new Date().getFullYear()} HM Canvases Ltd. All rights reserved.</p>
        <p>Powered by Google Workspace & Firebase</p>
      </footer>
    </div>
  );
}

// Component for the MRP System Page
function MRPPage({ onInternalNav }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <h1 className="text-4xl font-extrabold text-offWhite mb-8">MRP System</h1>
      <p className="text-lightGreen mb-6">Manage your materials, sales orders, and production processes here.</p>

      {/* Navigation within MRP System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <DashboardCard
            title="Materials Management"
            description="Add, edit, and view raw materials."
            icon="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-16.5-7.5h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Zm4.5 0h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Zm4.5 0h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Z" 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="material_management" 
        />
        <DashboardCard
            title="Sales Orders"
            description="View and process customer orders."
            icon="M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="sales_orders" 
            isPlaceholder={true} 
        />
        <DashboardCard
            title="Production Planning"
            description="Plan and track manufacturing batches."
            icon="M12 21a9 9 0 0 0 9-9c0-.73-.09-1.44-.26-2.12M15 15a3 3 0 0 1-3 3c-1.44 0-2.73-.56-3.75-1.47M3 11.25a9 9 0 0 1 18 0c0 .73-.09 1.44-.26 2.12M9 9a3 3 0 0 0 3-3c1.44 0 2.73.56 3.75 1.47M4.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75H4.5ZM19.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-.75ZM9 15.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6Z" 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="production_planning" 
            isPlaceholder={true} 
        />
      </div>

      {/* Button to go back to main dashboard */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('dashboard')}
          className="p-3 rounded-lg font-semibold transition-colors duration-200"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// Component for the Social Media Hub Page
function SocialMediaHubPage({ onInternalNav }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <h1 className="text-4xl font-extrabold text-offWhite mb-8">AI Social Media Hub</h1>
      <p className="text-lightGreen mb-6">Access AI-powered content generation and social media management tools here.</p>
      {/* Content for Social Media Hub will go here */}

      {/* Button to go back to main dashboard */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('dashboard')}
          className="p-3 rounded-lg font-semibold transition-colors duration-200"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// Define a list of common units based on user's request
const commonUnits = [
  '', // Empty option for initial selection
  'mm', 'cm', 'm',
  'cm2', 'cm3', 'm3',
  'ltr',
  'ea', // Each
  'sht', // Sheet
  'roll',
  'box',
];

// Define material types - UPDATED
const materialTypes = [
  '', // Empty option for initial selection (for filter)
  'Wood',
  'Fabric',
  'Sheet Materials', // Added 'Sheet Materials'
  'Packaging',
  'Hardware/Components',
  'Mediums/Coatings',
  'Bought-in Profiles',
];


// Material Management Page - Now with Form and Table (Expanded)
function MaterialManagementPage({ onInternalNav, db, userId }) { 
  const [materials, setMaterials] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [formData, setFormData] = useState({ 
    code: '',
    description: '',
    materialType: '', // New field for material type
    puom: '', 
    pcp: '', 
    muom: '', 
    conversionFactor: '',
    mcp: '', 
    currentStock: '', 
    minStock: '',     
    supplier: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null); 
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterialType, setFilterMaterialType] = useState('');


  // Firestore collection reference
  const getMaterialsCollectionRef = () => {
    if (!db || !userId) {
      console.error("Firestore DB or User ID not available for collection reference.");
      return null;
    }
    // IMPORTANT: Access the Firebase App ID from the firebaseConfig object directly
    // This is the correct way for deployed apps outside the Canvas global variables
    const firebaseConfig = {
      apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
      authDomain: "hm-canvases-alliem-art.firebaseapp.com",
      projectId: "hm-canvases-alliem-art",
      storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
      messagingSenderId: "544423481137",
      appId: "1:544423481137:web:9d0cb650642dd8f1b2ea10",
      measurementId: "G-D23Z6GBTH0"
    };
    const appId = firebaseConfig.appId; // Use the appId from the defined config

    return collection(db, `artifacts/${appId}/users/${userId}/materials`); 
  };

  // Fetch materials from Firestore in real-time
  useEffect(() => {
    if (!db || !userId) {
      console.log("Skipping material fetch: DB or userId not ready.");
      return;
    }

    const materialsColRef = getMaterialsCollectionRef();
    if (!materialsColRef) {
      setError("Firestore collection reference could not be established.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(materialsColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(materialsList);
      setLoading(false);
      setError(null); 
    }, (err) => {
      console.error("Error fetching materials:", err);
      setError(`Failed to load materials: ${err.message}. Please check your Firebase rules and internet connection.`);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [db, userId]); 

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      console.error("Firebase not initialized or user not authenticated.");
      // In a real app, you'd show a modal or toast notification.
      return;
    }

    try {
      const materialsColRef = getMaterialsCollectionRef();
      if (!materialsColRef) return;

      const materialData = {
        code: formData.code,
        description: formData.description,
        materialType: formData.materialType, // Save material type
        puom: formData.puom,
        pcp: parseFloat(formData.pcp), // Parse as float
        muom: formData.muom,
        conversionFactor: parseFloat(formData.conversionFactor), // Parse as float
        mcp: parseFloat(formData.mcp), // Parse as float
        currentStock: parseFloat(formData.currentStock || 0), // Default to 0 if empty
        minStock: parseFloat(formData.minStock || 0),         // Default to 0 if empty
        supplier: formData.supplier,
        lastUpdated: new Date().toISOString()
      };

      if (editingMaterialId) {
        // Update existing material
        const materialDocRef = doc(db, materialsColRef.path, editingMaterialId);
        await updateDoc(materialDocRef, materialData);
        console.log("Material updated with ID: ", editingMaterialId);
      } else {
        // Add new material
        const docRef = await addDoc(materialsColRef, materialData);
        console.log("Material added with ID: ", docRef.id);
      }

      // Clear form and reset editing state
      setFormData({
        code: '', description: '', materialType: '', puom: '', pcp: '', muom: '', conversionFactor: '',
        mcp: '', currentStock: '', minStock: '', supplier: '',
      });
      setEditingMaterialId(null);
    } catch (e) {
      console.error("Error adding/updating material: ", e);
      setError(`Failed to save material: ${e.message}`);
    }
  };

  // Handle Edit button click
  const handleEdit = (material) => {
    setFormData({
      code: material.code || '',
      description: material.description || '',
      materialType: material.materialType || '', // Load material type for editing
      puom: material.puom || '', 
      pcp: material.pcp || '', 
      muom: material.muom || '', 
      conversionFactor: material.conversionFactor || '',
      mcp: material.mcp || '', 
      currentStock: material.currentStock || '',
      minStock: material.minStock || '',
      supplier: material.supplier || '',
    });
    setEditingMaterialId(material.id);
  };

  // Handle Delete button click
  const handleDelete = async (id) => {
    if (!db || !userId) {
      console.error("Firebase not initialized or user not authenticated.");
      return;
    }
    // Using window.confirm as a temporary replacement for proper modal.
    const confirmDelete = window.confirm("Are you sure you want to delete this material?"); 
    if (!confirmDelete) {
      return;
    }

    try {
      const materialsColRef = getMaterialsCollectionRef();
      if (!materialsColRef) return;

      await deleteDoc(doc(db, materialsColRef.path, id));
      console.log("Material deleted with ID: ", id);
    } catch (e) {
      console.error("Error deleting material: ", e);
      setError(`Failed to delete material: ${e.message}`);
    }
  };

  // Filtered materials based on search term and material type
  const filteredMaterials = materials.filter(material => {
    const matchesSearchTerm = searchTerm === '' ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMaterialType = filterMaterialType === '' ||
      material.materialType === filterMaterialType;
    
    return matchesSearchTerm && matchesMaterialType;
  });


  return (
    <div className="flex-1 p-8 overflow-auto">
      <h1 className="text-4xl font-extrabold text-offWhite mb-8">Materials Management</h1>
      <p className="text-lightGreen mb-6">Manage your raw material inventory. Add, edit, and delete materials.</p>

      {/* Material Entry/Edit Form */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">{editingMaterialId ? 'Edit Material' : 'Add New Material'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className="block text-offWhite text-sm font-bold mb-1">Code</label>
            <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="description" className="block text-offWhite text-sm font-bold mb-1">Description</label>
            <input type="text" id="description" name="description" value={formData.description} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="materialType" className="block text-offWhite text-sm font-bold mb-1">Material Type</label>
            <select id="materialType" name="materialType" value={formData.materialType} onChange={handleInputChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10">
              {materialTypes.map(type => (
                // Changed option class to reflect consistent styling
                <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="puom" className="block text-offWhite text-sm font-bold mb-1">Purchase Unit of Measure (PUOM)</label>
            <select id="puom" name="puom" value={formData.puom} onChange={handleInputChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10">
              {commonUnits.map(unit => (
                // Changed option class to reflect consistent styling
                <option key={unit} value={unit} className="text-deepGray bg-offWhite">{unit}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pcp" className="block text-offWhite text-sm font-bold mb-1">Purchase Cost Price (PCP)</label>
            <input type="number" step="0.0001" id="pcp" name="pcp" value={formData.pcp} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="muom" className="block text-offWhite text-sm font-bold mb-1">Manufacturing Unit of Measure (MUOM)</label>
            <select id="muom" name="muom" value={formData.muom} onChange={handleInputChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10">
              {commonUnits.map(unit => (
                // Changed option class to reflect consistent styling
                <option key={unit} value={unit} className="text-deepGray bg-offWhite">{unit}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="conversionFactor" className="block text-offWhite text-sm font-bold mb-1">Conversion Factor (PUOM to MUOM incl. Overhead)</label>
            <input type="number" step="0.000000001" id="conversionFactor" name="conversionFactor" value={formData.conversionFactor} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="mcp" className="block text-offWhite text-sm font-bold mb-1">Manufacturing Cost Price (MCP)</label>
            <input type="number" step="0.0001" id="mcp" name="mcp" value={formData.mcp} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="currentStock" className="block text-offWhite text-sm font-bold mb-1">Current Stock (in MUOM)</label>
            <input type="number" step="0.01" id="currentStock" name="currentStock" value={formData.currentStock} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="minStock" className="block text-offWhite text-sm font-bold mb-1">Minimum Stock (in MUOM)</label>
            <input type="number" step="0.01" id="minStock" name="minStock" value={formData.minStock} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="supplier" className="block text-offWhite text-sm font-bold mb-1">Supplier</label>
            <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange}
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
            {editingMaterialId && (
              <button
                type="button"
                onClick={() => {
                  setEditingMaterialId(null);
                  setFormData({ 
                    code: '', description: '', materialType: '', puom: '', pcp: '', muom: '', conversionFactor: '',
                    mcp: '', currentStock: '', minStock: '', supplier: '', 
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-offWhite font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="bg-accentGold hover:bg-yellow-600 text-deepGray font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
            >
              {editingMaterialId ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-offWhite text-sm font-bold mb-1">Search by Code or Description</label>
          <input
            type="text"
            id="search"
            placeholder="e.g., WOOD-001, Oak Timber"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="filterMaterialType" className="block text-offWhite text-sm font-bold mb-1">Filter by Material Type</label>
          <select
            id="filterMaterialType"
            value={filterMaterialType}
            onChange={(e) => setFilterMaterialType(e.target.value)}
            // Unified styling for select elements
            className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10"
          >
            {/* Add an empty option to clear the filter */}
            <option value="" className="text-deepGray bg-offWhite">All Types</option> 
            {materialTypes.slice(1).map(type => ( // Slice to skip the initial empty option
              // Changed option class to reflect consistent styling
              <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List/Table */}
      <div className="bg-darkGreen p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Current Materials</h2>
        {loading && <p className="text-lightGreen">Loading materials...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && materials.length === 0 && !error && (
          <p className="text-offWhite/70">No materials added yet. Use the form above to add your first material!</p>
        )}
        {!loading && filteredMaterials.length === 0 && materials.length > 0 && !error && (
          <p className="text-offWhite/70">No materials match your current search and filter criteria.</p>
        )}
        {!loading && filteredMaterials.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mediumGreen">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Material Type</th> {/* New header */}
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">PUOM</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">PCP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">MUOM</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Conversion Factor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">MCP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Current Stock (MUOM)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Min Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Supplier</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mediumGreen">
                {filteredMaterials.map(material => (
                  <tr key={material.id} className="hover:bg-mediumGreen transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-offWhite">{material.code}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.description}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.materialType}</td> {/* Display material type */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.puom}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">£{material.pcp?.toFixed(4)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.muom}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.conversionFactor?.toFixed(6)}</td> {/* Formatted to 6 decimal places */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">£{material.mcp?.toFixed(6)}</td> {/* Formatted to 6 decimal places */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.currentStock}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.minStock}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.supplier}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-accentGold hover:text-yellow-400 mr-3 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="text-red-400 hover:text-red-500 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Button to go back to MRP page */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('mrp')}
          className="p-3 rounded-lg font-semibold transition-colors duration-200"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to MRP System
        </button>
      </div>
    </div>
  );
}


// Main App component
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); 
  const [db, setDb] = useState(null); 

  const sidebarCards = dashboardCardsData.filter(card => card.location === 'sidebar');
  const mainCards = dashboardCardsData.filter(card => card.location === 'main');


  // Firebase Initialization and Authentication
  useEffect(() => {
    // IMPORTANT: Use your actual Firebase project configuration directly here for deployed apps.
    // The __app_id, __firebase_config, and __initial_auth_token are only available in the Canvas environment.
    const firebaseConfig = {
      apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
      authDomain: "hm-canvases-alliem-art.firebaseapp.com",
      projectId: "hm-canvases-alliem-art",
      storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
      messagingSenderId: "544423481137",
      appId: "1:544423481137:web:9d0cb650642dd8f1b2ea10",
      measurementId: "G-D23Z6GBTH0"
    };

    // We still need a valid appId string, which we can take from the firebaseConfig directly.
    const appId = firebaseConfig.appId; 

    // No initialAuthToken for standard deployments; we'll rely on signInAnonymously.
    const initialAuthToken = null; 
    
    // Log the configuration being used
    console.log("Using Firebase App ID:", appId);
    console.log("Using Firebase Config:", firebaseConfig);
    console.log("Initial Auth Token present:", !!initialAuthToken);
    
    // Proceed with Firebase initialization if config is valid
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase configuration is missing or invalid. Cannot initialize Firebase.");
      setFirebaseReady(true); 
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestoreDb = getFirestore(app); 
      setDb(firestoreDb); 
      console.log("Firebase app initialized successfully.");

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setFirebaseReady(true);
          console.log("Firebase user authenticated with ID:", user.uid);
        } else {
          console.log("No Firebase user found, attempting anonymous sign-in.");
          try {
            // Since initialAuthToken is null (for deployed app), this will always sign in anonymously.
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          } catch (error) {
            console.error("Error during Firebase anonymous sign-in:", error);
            setFirebaseReady(true); 
          }
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase app:", e);
      setFirebaseReady(true); 
    }
  }, []); 

  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      window.open(googleSearchUrl, '_blank');
      setSearchTerm('');
    }
  };

  const handleInternalNavigation = (pageName) => {
    setCurrentPage(pageName);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent onInternalNav={handleInternalNavigation} mainCards={mainCards} />; 
      case 'mrp':
        return <MRPPage onInternalNav={handleInternalNavigation} />;
      case 'social_media_hub':
        return <SocialMediaHubPage onInternalNav={handleInternalNavigation} />;
      case 'material_management': 
        return <MaterialManagementPage onInternalNav={handleInternalNavigation} db={db} userId={userId} />;
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
        return <DashboardContent onInternalNav={handleInternalNavigation} mainCards={mainCards} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Poppins']" style={{ backgroundColor: colors.deepGray }}>
      
      {/* Sidebar */}
      <div className="w-full md:w-1/4 min-w-[200px] max-w-[300px] bg-gradient-to-b from-darkGreen to-mediumGreen p-6 flex flex-col items-center rounded-b-none md:rounded-b-none md:rounded-r-3xl shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-white text-center">Dashboard Insights</h2>
        
        {/* Display User ID */}
        {firebaseReady && userId ? (
          <p className="text-offWhite text-xs mb-4">User ID: {userId}</p>
        ) : (
          <p className="text-offWhite text-xs mb-4">Authenticating...</p>
        )}

        {/* Search Bar */}
        <input 
          type="text" 
          placeholder="Search Google..." 
          className="p-2 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold w-full mb-6" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          onKeyPress={handleSearch} 
        />

        {/* Dynamic Sidebar Cards (now include internal navigation) */}
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
              // Do NOT pass onInternalNav to sidebar cards, let them handle external links naturally
            />
          ))}

          {/* Placeholder for "Random Thought of the Day" */}
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

export default App;