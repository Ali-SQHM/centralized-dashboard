// src/App.jsx
// This version implements the finalized logic for Material Management:
// - Removed Percentage Waste.
// - Simplified MCP calculation (PCP / Unit Conversion Factor * Overhead Factor).
// - Stores and displays both PUOM and MUOM stock levels, distinct from Conversion Factor.
// - Stock Level Graph uses PUOM for clarity.
// - CSV upload aligned with new header and calculations.

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth'; 
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, onSnapshot, writeBatch } from 'firebase/firestore'; 

// Define a custom color palette inspired by the logo's dark green
const colors = {
  darkGreen: '#1A4D2E', // A deep, rich green for main background
  mediumGreen: '#4F6C4C', // A slightly lighter green for accents/card backgrounds
  lightGreen: '#738C71', // A lighter green for text or softer accents
  accentGold: '#FFC200', // A contrasting vibrant color
  offWhite: '#F3F4F6', // Off-white for main content background or contrasting text
  darkGray: '#1F2937', // A dark gray for text or secondary elements on light backgrounds
  deepGray: '#111827', // A near-black for darkest elements or background accents
};

// --- dashboardCardsData ---
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
    icon: "M20.25 8.515 17.5 10.758V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h11.75a1.5 1.5 0 0 0 1.5-1.5V13.5l3.75 2.25V8.515ZM12 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12.75a.75.75 0 0 1-.75-.75V7.5ZM6.75 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V7.5ZM3 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V15Z",
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
  // Determine if it's an external link or a root path link
  const isExternalLink = link.startsWith('http://') || link.startsWith('https://');
  const isRootPathLink = link.startsWith('/'); // e.g., /quote

  const handleClick = (e) => {
    if (isPlaceholder) {
      e.preventDefault(); // Prevent navigation for placeholders
      console.log(`${title} is coming soon!`);
    } else if (isRootPathLink) {
        e.preventDefault(); // Prevent default <a> behavior for root path links
        // For root path links, we directly set window.location.href to trigger a full page reload,
        // which helps in correctly initializing the new "app" (Dashboard or Quote App).
        window.location.href = link;
    } else if (!isExternalLink && onInternalNav) { // Only call onInternalNav for internal links like "mrp", "material_management"
        e.preventDefault(); 
        onInternalNav(link);
    }
  };

  return (
    <a
      // If it's a placeholder or internal link, use # and let handleClick manage.
      // If it's an external link or root path link, use the actual link.
      href={isPlaceholder || (!isExternalLink && !isRootPathLink) ? "#" : link}
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
function DashboardContent({ onInternalNav, mainCards, userId, firebaseReady }) { 
  // searchTerm and handleSearch for Google Search are now managed in CentralizedDashboard
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

      {/* Display User ID for authenticated dashboard view */}
      {firebaseReady && userId ? (
        <p className="text-offWhite text-xs mb-4">User ID: {userId}</p>
      ) : (
        <p className="text-offWhite text-xs mb-4">Authenticating Dashboard...</p>
      )}

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
        {/* NEW: Instant Quote App card added to MRP Page */}
        <DashboardCard
            id="mrp-instant-quote"
            title="Instant Quote App"
            description="Generate real-time bespoke canvas quotes."
            icon="M12 6v12m-3-2.25 3 3 3-3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" // Dollar sign icon
            link="instant_quote_app" // Internal link within the dashboard
            isPlaceholder={false} 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
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
  'Profile', // Added 'Profile' material type
];

// --- StockLevelChart Component ---
// Now uses PUOM for display
function StockLevelChart({ materials, materialTypes, colors }) {
  const [selectedMaterialType, setSelectedMaterialType] = useState('');

  const filteredChartMaterials = materials.filter(material => {
    return selectedMaterialType === '' || material.materialType === selectedMaterialType;
  });

  // Calculate max stock for scaling the chart, considering both current and min stock (in PUOM) for better scaling
  const maxStock = Math.max(
    ...filteredChartMaterials.map(m => Math.max(m.currentStockPUOM || 0, m.minStockPUOM || 0)),
    1 // Ensure at least 1 to avoid division by zero if all stocks are zero
  );

  return (
    <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-offWhite mb-4">Stock Levels Overview (in Purchase Units)</h2>
      <div className="mb-4">
        <label htmlFor="chartMaterialTypeFilter" className="block text-offWhite text-sm font-bold mb-1">Filter by Material Type:</label>
        <select
          id="chartMaterialTypeFilter"
          value={selectedMaterialType}
          onChange={(e) => setSelectedMaterialType(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10"
        >
          <option value="" className="text-deepGray bg-offWhite">All Types</option>
          {materialTypes.slice(1).map(type => ( // Slice to skip the initial empty option
            <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option>
          ))}
        </select>
      </div>

      {filteredChartMaterials.length === 0 ? (
        <p className="text-offWhite/70">No materials to display for the selected type or no materials added yet.</p>
      ) : (
        <div className="flex items-end justify-start h-64 overflow-x-auto p-2 border border-lightGreen rounded-lg bg-white/5">
          {filteredChartMaterials.map((material, index) => {
            const barHeight = (material.currentStockPUOM / maxStock) * 100; // Percentage of max height
            const minStockHeight = (material.minStockPUOM / maxStock) * 100; // Percentage of max height
            const isBelowMin = material.currentStockPUOM < material.minStockPUOM;

            return (
              <div key={material.id} className="relative mx-1 h-full flex flex-col justify-end items-center" style={{ minWidth: '60px', flexShrink: 0 }}>
                {/* Min Stock Line */}
                {material.minStockPUOM > 0 && (
                  <div
                    className="absolute w-full border-b-2 border-dashed"
                    style={{
                      bottom: `${minStockHeight}%`,
                      borderColor: colors.accentGold,
                      zIndex: 10,
                    }}
                  ></div>
                )}
                
                {/* Current Stock Bar */}
                <div
                  className={`w-4/5 rounded-t-sm transition-all duration-300 relative`}
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: isBelowMin ? '#EF4444' : colors.lightGreen, // Red for below min, lightGreen otherwise
                    zIndex: 5,
                  }}
                  title={`Code: ${material.code}\nStock: ${material.currentStockPUOM} ${material.puom}\nMin: ${material.minStockPUOM} ${material.puom}`}
                >
                  <span className="absolute -top-6 text-xs text-offWhite" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                    {material.currentStockPUOM}
                  </span>
                </div>
                <span className="text-xs mt-1 text-offWhite text-center w-full truncate">{material.code}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Material Management Page - Now with Form and Table (Expanded) and persistent headings
function MaterialManagementPage({ onInternalNav, db }) { 
  const [materials, setMaterials] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [formData, setFormData] = useState({ 
    code: '',
    description: '',
    materialType: '', 
    puom: '', 
    pcp: '', 
    muom: '', 
    unitConversionFactor: '', // NEW
    overheadFactor: '',       // NEW
    currentStockPUOM: '', 
    minStockPUOM: '',     
    supplier: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null); 
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterialType, setFilterMaterialType] = useState('');
  // State for CSV upload messages
  const [csvMessage, setCsvMessage] = useState('');
  const [csvMessageType, setCsvMessageType] = useState(''); // 'success' or 'error'


  // Firestore collection reference (Now public for all materials for quoting)
  const getPublicMaterialsCollectionRef = () => {
    if (!db) {
      console.error("Firestore DB not available for collection reference.");
      return null;
    }
    // Correctly get appId from the global scope (provided by Canvas)
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 

    // Store in public/data for the quoting app to access
    return collection(db, `artifacts/${appId}/public/data/materials`); 
  };

  // Fetch materials from Firestore in real-time
  useEffect(() => {
    if (!db) { 
      console.log("Skipping material fetch: DB not ready.");
      return;
    }

    const materialsColRef = getPublicMaterialsCollectionRef();
    if (!materialsColRef) {
      setError("Firestore collection reference could not be established. Check Firebase DB connection.");
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
      console.log("Materials fetched successfully for Material Management:", materialsList); 
    }, (err) => {
      console.error("Error fetching materials:", err);
      setError(`Failed to load materials: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/{your_app_id}/public/data/materials.`);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [db]); 

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to calculate MUOM stock and MCP
  const calculateDerivedValues = (data) => {
    const pcp = parseFloat(data.pcp || 0);
    const unitConversionFactor = parseFloat(data.unitConversionFactor || 0); // NEW
    const overheadFactor = parseFloat(data.overheadFactor || 0);             // NEW
    const currentStockPUOM = parseFloat(data.currentStockPUOM || 0);
    const minStockPUOM = parseFloat(data.minStockPUOM || 0);

    // Calculate MCP: (PCP / Unit Conversion Factor) * Overhead Factor
    const mcp = (unitConversionFactor > 0) 
        ? (pcp / unitConversionFactor) * overheadFactor 
        : 0; 

    // Calculate MUOM stock: PUOM Stock * Unit Conversion Factor
    const currentStockMUOM = currentStockPUOM * unitConversionFactor;
    const minStockMUOM = minStockPUOM * unitConversionFactor;

    return { mcp, currentStockMUOM, minStockMUOM };
  };

  // Handle form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) { 
      console.error("Firebase not initialized.");
      return;
    }

    try {
      const materialsColRef = getPublicMaterialsCollectionRef();
      if (!materialsColRef) return;

      const { mcp, currentStockMUOM, minStockMUOM } = calculateDerivedValues(formData);

      const materialData = {
        code: formData.code,
        description: formData.description,
        materialType: formData.materialType, 
        puom: formData.puom,
        pcp: parseFloat(formData.pcp), 
        muom: formData.muom,
        unitConversionFactor: parseFloat(formData.unitConversionFactor), // Store new field
        overheadFactor: parseFloat(formData.overheadFactor),             // Store new field
        currentStockPUOM: parseFloat(formData.currentStockPUOM || 0), 
        minStockPUOM: parseFloat(formData.minStockPUOM || 0),         
        currentStockMUOM: currentStockMUOM, 
        minStockMUOM: minStockMUOM,         
        mcp: mcp,                           
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
        code: '', description: '', materialType: '', puom: '', pcp: '', muom: '', 
        unitConversionFactor: '', overheadFactor: '', // Clear new fields
        currentStockPUOM: '', minStockPUOM: '', supplier: '',
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
      materialType: material.materialType || '', 
      puom: material.puom || '', 
      pcp: material.pcp || '', 
      muom: material.muom || '', 
      unitConversionFactor: material.unitConversionFactor || '', // Load new field
      overheadFactor: material.overheadFactor || '',             // Load new field
      currentStockPUOM: material.currentStockPUOM || '', 
      minStockPUOM: material.minStockPUOM || '',         
      supplier: material.supplier || '',
    });
    setEditingMaterialId(material.id);
  };

  // Handle Delete button click
  const handleDelete = async (id) => {
    if (!db) { 
      console.error("Firebase not initialized.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this material?"); 
    if (!confirmDelete) {
      return;
    }

    try {
      const materialsColRef = getPublicMaterialsCollectionRef();
      if (!materialsColRef) return;

      await deleteDoc(doc(db, materialsColRef.path, id));
      console.log("Material deleted with ID: ", id);
    } catch (e) {
      console.error("Error deleting material: ", e);
      setError(`Failed to delete material: ${e.message}`);
    }
  };

  // CSV Parsing and Upload Logic
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setCsvMessage('No file selected.');
      setCsvMessageType('error');
      return;
    }

    if (file.type !== 'text/csv') {
      setCsvMessage('Please upload a CSV file.');
      setCsvMessageType('error');
      return;
    }

    setCsvMessage('Uploading and processing CSV...');
    setCsvMessageType('info');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      try {
        const parsedData = parseCSV(text);
        let recordsAdded = 0;
        let recordsFailed = 0;
        const materialsColRef = getPublicMaterialsCollectionRef();

        if (!materialsColRef) {
          throw new Error("Firestore materials collection reference is not available.");
        }

        const batch = writeBatch(db); // Initialize a Firestore batch

        parsedData.forEach((record, index) => {
          // Basic validation for required fields (pcp, muom, puom, unitConversionFactor, overheadFactor, currentStockPUOM, minStockPUOM)
          if (record.code && record.description && record.materialType && record.puom && 
              record.pcp && record.muom && record.unitConversionFactor && record.overheadFactor &&
              record.currentStockPUOM && record.minStockPUOM) {
            
            // Calculate derived values for each record
            const { mcp, currentStockMUOM, minStockMUOM } = calculateDerivedValues({
                pcp: record.pcp,
                unitConversionFactor: record.unitConversionFactor,
                overheadFactor: record.overheadFactor,
                currentStockPUOM: record.currentStockPUOM,
                minStockPUOM: record.minStockPUOM
            });

            const materialToSave = {
              code: record.code,
              description: record.description,
              materialType: record.materialType,
              puom: record.puom,
              pcp: parseFloat(record.pcp || 0),
              muom: record.muom,
              unitConversionFactor: parseFloat(record.unitConversionFactor || 0), // Store new field
              overheadFactor: parseFloat(record.overheadFactor || 0),             // Store new field
              currentStockPUOM: parseFloat(record.currentStockPUOM || 0),
              minStockPUOM: parseFloat(record.minStockPUOM || 0),
              currentStockMUOM: currentStockMUOM, 
              minStockMUOM: minStockMUOM,         
              mcp: mcp,                           
              supplier: record.supplier || '',
              lastUpdated: new Date().toISOString()
            };
            batch.set(doc(materialsColRef), materialToSave); // Add to batch
            recordsAdded++;
          } else {
            console.warn(`Skipping invalid record at row ${index + 1} due to missing data:`, record);
            recordsFailed++;
          }
        });

        if (recordsAdded > 0) {
            await batch.commit(); // Commit the batch write
            setCsvMessage(`Successfully added ${recordsAdded} materials from CSV. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
            setCsvMessageType('success');
        } else {
            setCsvMessage(`No valid materials found in CSV to add. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
            setCsvMessageType('error');
        }
      } catch (err) {
        console.error("Error processing CSV:", err);
        setCsvMessage(`Failed to process CSV: ${err.message}`);
        setCsvMessageType('error');
      }
    };
    reader.readAsText(file);
  };

  // Simple CSV parser function (client-side)
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1} has mismatched column count and will be skipped.`);
        continue;
      }
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = values[index];
      });
      data.push(rowObject);
    }
    return data;
  };

  // Filtered materials based on search term and material type for the table
  const filteredMaterialsTable = materials.filter(material => {
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
      <p className="text-lightGreen mb-6">Manage your raw material inventory. Add, edit, and delete materials. These materials will be accessible to the Instant Quote App.</p>

      {/* 1. Stock Levels Overview Chart */}
      <StockLevelChart materials={materials} materialTypes={materialTypes} colors={colors} />

      {/* 2. Filter and Search Bar for the Table */}
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
            {materialTypes.map(type => ( // Note: Do not slice here, we need the initial empty option
              // Changed option class to reflect consistent styling
              <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Upload Materials from CSV</h2>
        <p className="text-lightGreen text-sm mb-4">
          Upload a CSV file containing your materials. The CSV must have the following header row:<br/>
          <code className="text-offWhite bg-darkGreen px-2 py-1 rounded text-xs">code,description,materialType,puom,pcp,muom,unitConversionFactor,overheadFactor,currentStockPUOM,minStockPUOM,supplier</code>
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-offWhite file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-darkGreen file:text-offWhite hover:file:bg-lightGreen hover:file:text-deepGray transition-colors duration-200 cursor-pointer"
          />
        </div>
        {csvMessage && (
          <p className={`mt-4 text-sm font-semibold ${csvMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {csvMessage}
          </p>
        )}
      </div>

      {/* 3. Materials List/Table - Now with persistent headings */}
      <div className="bg-darkGreen p-6 rounded-xl shadow-lg mb-8"> {/* Added mb-8 for spacing */}
        <h2 className="text-2xl font-bold text-offWhite mb-4">Current Materials</h2>
        {loading && <p className="text-lightGreen">Loading materials...</p>}
        {error && <p className="text-red-400">{error}</p>}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-mediumGreen">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Material Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">PUOM</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">PCP</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">MUOM</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Unit Conversion Factor</th> {/* Updated label */}
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Overhead Factor</th> {/* New heading */}
                <th className="px-4 py-2 whitespace-nowrap text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Current Stock (PUOM)</th> 
                <th className="px-4 py-2 whitespace-nowrap text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Current Stock (MUOM)</th> 
                <th className="px-4 py-2 whitespace-nowrap text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Min Stock (PUOM)</th> 
                <th className="px-4 py-2 whitespace-nowrap text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Min Stock (MUOM)</th> 
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">MCP</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Supplier</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider bg-mediumGreen text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredMaterialsTable.length === 0 && !error && (
                <tr>
                  <td colSpan="15" className="px-4 py-2 text-center text-offWhite/70">
                    No materials added yet. Use the form below or upload a CSV to add your first material!
                  </td>
                </tr>
              )}
              {filteredMaterialsTable.map(material => (
                <tr key={material.id} className="hover:bg-mediumGreen transition-colors duration-150">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-offWhite">{material.code}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.description}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.materialType}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.puom}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">£{material.pcp?.toFixed(4)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.muom}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{typeof material.unitConversionFactor === 'number' ? material.unitConversionFactor.toFixed(6) : material.unitConversionFactor}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{typeof material.overheadFactor === 'number' ? material.overheadFactor.toFixed(2) : material.overheadFactor}</td> {/* Display Overhead Factor */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.currentStockPUOM}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.currentStockMUOM?.toFixed(2)}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.minStockPUOM}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">{material.minStockMUOM?.toFixed(2)}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-offWhite">£{typeof material.mcp === 'number' ? material.mcp.toFixed(6) : material.mcp}</td> 
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
      </div>

      {/* 4. Material Entry/Edit Form */}
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
                <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="puom" className="block text-offWhite text-sm font-bold mb-1">Purchase Unit of Measure (PUOM)</label>
            <select id="puom" name="puom" value={formData.puom} onChange={handleInputChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen bg-white/10">
              {commonUnits.map(unit => (
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
                <option key={unit} value={unit} className="bg-deepGray text-offWhite">{unit}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unitConversionFactor" className="block text-offWhite text-sm font-bold mb-1">Unit Conversion Factor (PUOM to MUOM)</label> {/* Updated label */}
            <input type="number" step="0.000000001" id="unitConversionFactor" name="unitConversionFactor" value={formData.unitConversionFactor} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="overheadFactor" className="block text-offWhite text-sm font-bold mb-1">Overhead Factor (e.g., 1.25 for 25% overhead)</label> {/* New label */}
            <input type="number" step="0.01" id="overheadFactor" name="overheadFactor" value={formData.overheadFactor} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="currentStockPUOM" className="block text-offWhite text-sm font-bold mb-1">Current Stock (in PUOM)</label>
            <input type="number" step="0.01" id="currentStockPUOM" name="currentStockPUOM" value={formData.currentStockPUOM} onChange={handleInputChange} required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:shadow-outline bg-white/10" />
          </div>
          <div>
            <label htmlFor="minStockPUOM" className="block text-offWhite text-sm font-bold mb-1">Minimum Stock (in PUOM)</label>
            <input type="number" step="0.01" id="minStockPUOM" name="minStockPUOM" value={formData.minStockPUOM} onChange={handleInputChange} required
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
                    code: '', description: '', materialType: '', puom: '', pcp: '', muom: '', unitConversionFactor: '', overheadFactor: '',
                    currentStockPUOM: '', minStockPUOM: '', supplier: '', 
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


// InstantQuoteAppPage component - Now integrated into the Dashboard
function InstantQuoteAppPage({ db, onInternalNav }) { // db and onInternalNav are passed
  const [productType, setProductType] = useState('CAN'); // Default to Canvas
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState(''); // For Round
  const [majorAxis, setMajorAxis] = useState(''); // For Oval
  const [minorAxis, setMinorAxis] = useState(''); // For Oval
  const [depth, setDepth] = useState('');
  const [unit, setUnit] = useState('CM');
  const [fabricType, setFabricType] = useState('');
  const [finish, setFinish] = useState('');
  const [trayFrameAddon, setTrayFrameAddon] = useState('');
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
  const [sku, setSku] = useState('');
  const [quotePrice, setQuotePrice] = useState(null);
  const [materialsData, setMaterialsData] = useState([]); // All materials from Firestore
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [errorMaterials, setErrorMaterials] = useState(null);

  // Firestore collection reference for materials (PUBLICLY ACCESSIBLE)
  const getPublicMaterialsCollectionRef = () => {
    if (!db) {
      console.error("Firestore DB not available for public materials reference.");
      return null;
    }
    // Correctly get appId from the global scope (provided by Canvas)
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 
    // THIS IS THE PUBLIC PATH for materials
    return collection(db, `artifacts/${appId}/public/data/materials`);
  };

  // Fetch all materials on component mount
  useEffect(() => {
    if (!db) {
      console.log("Skipping material fetch for Quote App: DB not ready.");
      return;
    }

    const materialsColRef = getPublicMaterialsCollectionRef();
    if (!materialsColRef) {
      setErrorMaterials("Firestore materials collection reference could not be established. Check Firebase DB connection.");
      setLoadingMaterials(false);
      return;
    }

    setLoadingMaterials(true);
    const q = query(materialsColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMaterials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterialsData(fetchedMaterials);
      setLoadingMaterials(false);
      setErrorMaterials(null);
      console.log("Materials fetched successfully for Quote App:", fetchedMaterials);
    }, (err) => {
      console.error("Error fetching materials for Quote App:", err);
      setErrorMaterials(`Failed to load material options: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/{your_app_id}/public/data/materials.`);
      setLoadingMaterials(false);
    });

    return () => unsubscribe();
  }, [db]); // Only depend on db


  // Helper to filter materials by type
  const getMaterialsByType = (type) => {
    return materialsData.filter(m => m.materialType === type);
  };

  // Helper to get material code/data from code (for dynamic dropdowns and calculations)
  const getMaterialByCode = (code) => materialsData.find(m => m.code === code);

  // SKU Generation Logic (Complex based on blueprint)
  useEffect(() => {
    let generatedSku = '';
    let currentPrice = 0; // For preliminary quote

    // Function to safely parse float, return 0 if invalid
    const parseNum = (value) => parseFloat(value) || 0;

    // Preliminary price calculation for Canvas (mock)
    const calculatePreliminaryPrice = () => {
        let totalCost = 0;

        // Base cost (e.g., handling, labor)
        totalCost += 10.00; // Small fixed base cost

        // Dimensions based cost (area)
        let areaCm2 = 0;
        if (unit === 'IN') { // Convert dimensions to CM if unit is inches for consistent calculation
            const heightCm = parseNum(height) * 2.54;
            const widthCm = parseNum(width) * 2.54;
            const diameterCm = parseNum(diameter) * 2.54;
            const majorAxisCm = parseNum(majorAxis) * 2.54;
            const minorAxisCm = parseNum(minorAxis) * 2.54;

            if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') {
                areaCm2 = heightCm * widthCm;
            } else if (productType === 'RND') {
                areaCm2 = Math.PI * Math.pow(diameterCm / 2, 2);
            } else if (productType === 'OVL') {
                areaCm2 = Math.PI * (majorAxisCm / 2) * (minorAxisCm / 2);
            }
        } else { // Unit is CM
            if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') {
                areaCm2 = parseNum(height) * parseNum(width);
            } else if (productType === 'RND') {
                areaCm2 = Math.PI * Math.pow(parseNum(diameter) / 2, 2);
            } else if (productType === 'OVL') {
                areaCm2 = Math.PI * (parseNum(majorAxis) / 2) * (parseNum(minorAxis) / 2);
            }
        }
        
        // Use MUOM values (which are in cm, cm2, etc.) for calculations
        // Assuming mcp for fabric/finish is per cm2 (or suitable MUOM)
        const selectedFabric = getMaterialByCode(fabricType);
        if (selectedFabric && areaCm2 > 0) {
            totalCost += (selectedFabric.mcp || 0) * (areaCm2); // MCP is already per MUOM (cm2)
        }

        const selectedFinish = getMaterialByCode(finish);
        if (selectedFinish && areaCm2 > 0) {
            totalCost += (selectedFinish.mcp || 0) * (areaCm2); // MCP is already per MUOM (cm2)
        }

        const selectedDepthProfile = getMaterialByCode(`D${depth}`); 
        if (selectedDepthProfile) {
            let perimeterCm = 0;
            const currentHeight = (unit === 'IN') ? parseNum(height) * 2.54 : parseNum(height);
            const currentWidth = (unit === 'IN') ? parseNum(width) * 2.54 : parseNum(width);
            const currentDiameter = (unit === 'IN') ? parseNum(diameter) * 2.54 : parseNum(diameter);
            const currentMajorAxis = (unit === 'IN') ? parseNum(majorAxis) * 2.54 : parseNum(majorAxis);
            const currentMinorAxis = (unit === 'IN') ? parseNum(minorAxis) * 2.54 : parseNum(minorAxis);


            if (productType === 'CAN' || productType === 'PAN' || productType === 'STB') {
                perimeterCm = 2 * (currentHeight + currentWidth);
            } else if (productType === 'RND') {
                perimeterCm = Math.PI * currentDiameter;
            } else if (productType === 'OVL') {
                const a = currentMajorAxis / 2;
                const b = currentMinorAxis / 2;
                perimeterCm = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
            }
            totalCost += (selectedDepthProfile.mcp || 0) * perimeterCm; // Assuming MCP for profile is per cm
        }

        const selectedTrayFrame = getMaterialByCode(trayFrameAddon);
        if (selectedTrayFrame) {
            // Need to determine how many tray frame units are needed based on product dimensions
            // For now, a placeholder calculation. This needs a more precise rule from the blueprint.
            totalCost += (selectedTrayFrame.mcp || 0) * 1; // Assuming 1 unit of tray frame material per product
        }

        // Custom braces
        const braceMaterial = getMaterialsByType('Wood').find(m => m.code.includes('BRACE')); // Assuming a generic brace material
        if (braceMaterial && (parseNum(customHBraces) > 0 || parseNum(customWBraces) > 0)) {
            const totalBraceLengthCm = 
                (parseNum(customHBraces) * ((unit === 'IN' ? parseNum(width) * 2.54 : parseNum(width)))) + 
                (parseNum(customWBraces) * ((unit === 'IN' ? parseNum(height) * 2.54 : parseNum(height))));
            totalCost += (braceMaterial.mcp || 0) * totalBraceLengthCm; // Assuming MCP for braces is per cm
        }

        // Add a general markup/profit margin (e.g., 20%)
        totalCost *= 1.20;

        // Apply a floor price or minimum
        totalCost = Math.max(totalCost, 25.00); // Minimum £25.00 for any quote

        return totalCost;
    };


    switch (productType) {
      case 'CAN': // Canvas
        const canvasDepths = {
          '25': 'D25', '32': 'D32', '40': 'D40', '44': 'D44'
        };
        const selectedDepthAbbr = canvasDepths[depth] || '';

        const fabricObj = getMaterialByCode(fabricType); // Get full material object
        const finishObj = getMaterialByCode(finish);   // Get full material object

        let fabricAbbr = fabricObj?.code || ''; 
        let finishAbbr = finishObj?.code || ''; 
        
        // Handle specific finishes in SKU as per blueprint (UP, WPR, BPR, CLR, NAT)
        if (finishAbbr === 'WPR') finishAbbr = 'PRW'; 
        if (finishAbbr === 'BPR') finishAbbr = 'PRB';
        if (finishAbbr === 'CLR') finishAbbr = 'CSL'; 

        // Apply compatibility rules for finishes
        if ((fabricAbbr === 'OIL' || fabricAbbr === 'SUP') && finishAbbr !== 'NAT') {
            finishAbbr = 'NAT'; 
        } else if (fabricAbbr === '12OZ' && !['UP', 'PRW', 'PRB'].includes(finishAbbr)) {
            finishAbbr = 'UP'; 
        } else if (fabricAbbr === 'LIN' && !['UP', 'PRW', 'CSL'].includes(finishAbbr)) {
            finishAbbr = 'UP'; 
        }

        let trayFramePart = '';
        const trayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; // Use '44' from state
        if (trayFrameAddon && trayFrameValid) { 
          trayFramePart = `-${trayFrameAddon}`; 
        }

        let customBracingPart = '';
        const totalCustomBraces = parseNum(customHBraces) + parseNum(customWBraces);
        if (totalCustomBraces > 0 && totalCustomBraces <= 6) { // Max 6 braces
          customBracingPart = `-H${parseNum(customHBraces)}W${parseNum(customWBraces)}`;
        }

        // Basic validation for dimensions
        const validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
        const validDepth = selectedDepthAbbr !== '';
        const validFabric = fabricAbbr !== '';
        const validFinish = finishAbbr !== '';

        if (validDimensions && validDepth && validFabric && validFinish) {
            generatedSku = `CAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}-${fabricAbbr}-${finishAbbr}${trayFramePart}${customBracingPart}`;
            currentPrice = calculatePreliminaryPrice();
        } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
        }

        break;
      // Add other product types here later: PAN, RND, OVL, TRA, STB
      case 'PAN': // Painting Panel - Simplified for now
          const panelDepths = {
            '25': 'D25', '32': 'D32', '44': 'D44'
          };
          const panelDepthAbbr = panelDepths[depth] || 'DXX';
          const panelFabricObj = getMaterialByCode(fabricType);
          const panelFabricAbbr = panelFabricObj?.code || 'BARE'; // Assuming 'BARE' if no fabric
          const panelFinishObj = getMaterialByCode(finish);
          let panelFinishAbbr = panelFinishObj?.code || 'NAT'; // Assuming 'NAT' if no finish
            if (panelFinishAbbr === 'WPR') panelFinishAbbr = 'PRW'; 
            if (panelFinishAbbr === 'BPR') panelFinishAbbr = 'PRB';
            if (panelFinishAbbr === 'CLR') panelFinishAbbr = 'CSL'; 

          const panelTrayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; // Use '44' from state
          const panelTrayFramePart = (trayFrameAddon && panelTrayFrameValid) ? `-${trayFrameAddon}` : '';

          if (parseNum(height) > 0 && parseNum(width) > 0 && panelDepthAbbr !== 'DXX') {
            generatedSku = `PAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${panelDepthAbbr}-${unit}-${panelFabricAbbr}-${panelFinishAbbr}${panelTrayFramePart}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'RND': // Round - Simplified for now
          const rndDepths = {
            '24': 'D24', '30': 'D30', '36': 'D36', '42': 'D42'
          };
          const rndDepthAbbr = rndDepths[depth] || 'DXX'; // Prefix D for SKU
          const rndFabricObj = getMaterialByCode(fabricType);
          const rndFabricAbbr = rndFabricObj?.code || '12OZ'; // Default for round/oval if no specific material
          const rndFinishObj = getMaterialByCode(finish);
          let rndFinishAbbr = rndFinishObj?.code || '';
            if (rndFinishAbbr === 'WPR') rndFinishAbbr = 'PRW'; 
            if (rndFinishAbbr === 'BPR') rndFinishAbbr = 'PRB';
            if (rndFinishAbbr === 'CLR') rndFinishAbbr = 'CSL'; 
          
          if (parseNum(diameter) > 0 && rndDepthAbbr !== 'DXX') {
            generatedSku = `RND-${parseNum(diameter).toFixed(1)}-${rndDepthAbbr}-${unit}-${rndFabricAbbr}${rndFinishAbbr ? '-' + rndFinishAbbr : ''}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'OVL': // Oval - Simplified for now
          const ovlDepths = {
            '24': 'D24', '30': 'D30', '36': 'D36', '42': 'D42'
          };
          const ovlDepthAbbr = ovlDepths[depth] || 'DXX'; // Prefix D for SKU
          const ovlFabricObj = getMaterialByCode(fabricType);
          const ovlFabricAbbr = ovlFabricObj?.code || '12OZ'; // Default for round/oval if no specific material
          const ovlFinishObj = getMaterialByCode(finish);
          let ovlFinishAbbr = ovlFinishObj?.code || '';
            if (ovlFinishAbbr === 'WPR') ovlFinishAbbr = 'PRW'; 
            if (ovlFinishAbbr === 'BPR') ovlFinishAbbr = 'PRB';
            if (ovlFinishAbbr === 'CLR') ovlFinishAbbr = 'CSL'; 

          if (parseNum(majorAxis) > 0 && parseNum(minorAxis) > 0 && ovlDepthAbbr !== 'DXX') {
            generatedSku = `OVL-${parseNum(majorAxis).toFixed(1)}-${parseNum(minorAxis).toFixed(1)}-${ovlDepthAbbr}-${unit}-${ovlFabricAbbr}${ovlFinishAbbr ? '-' + ovlFinishAbbr : ''}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'TRA': // Tray Frame - Simplified for now
          const trayFinishObj = getMaterialByCode(finish);
          let trayFinishAbbr = trayFinishObj?.code || 'NAT';
            if (trayFinishAbbr === 'WPR') trayFinishAbbr = 'PRW'; 
            if (trayFinishAbbr === 'BPR') trayFinishAbbr = 'PRB';
            if (trayFinishAbbr === 'CLR') trayFinishAbbr = 'CSL'; 

          if (parseNum(height) > 0 && parseNum(width) > 0) {
            generatedSku = `TRA-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-PXX-${unit}-${trayFinishAbbr}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'STB': // Stretcher Bar Frame - Simplified for now
          const stbDepths = {
            '25': 'D25', '32': 'D32', '40': 'D40', '44': 'D44'
          };
          const stbDepthAbbr = stbDepths[depth] || 'DXX'; // Prefix D for SKU
          const stbTotalCustomBraces = parseNum(customHBraces) + parseNum(customWBraces);
          const stbCustomBracingPart = (stbTotalCustomBraces > 0 && stbTotalCustomBraces <= 6) ? `-H${parseNum(customHBraces)}W${parseNum(customWBraces)}` : '';

          if (parseNum(height) > 0 && parseNum(width) > 0 && stbDepthAbbr !== 'DXX') {
            generatedSku = `STB-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${stbDepthAbbr}-${unit}${stbCustomBracingPart}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      default:
        generatedSku = 'Select a product type';
        currentPrice = null;
    }

    setSku(generatedSku);
    setQuotePrice(currentPrice !== null ? `£${currentPrice.toFixed(2)}` : null);

  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, customHBraces, customWBraces, materialsData]); 


  // Reset fields when product type changes
  useEffect(() => {
    setHeight('');
    setWidth('');
    setDiameter('');
    setMajorAxis('');
    setMinorAxis('');
    setDepth('');
    setUnit('CM');
    setFabricType('');
    setFinish('');
    setTrayFrameAddon('');
    setCustomHBraces(0);
    setCustomWBraces(0);
    setSku('');
    setQuotePrice(null);
  }, [productType]);


  // Define specific dropdown options based on fetched materials and blueprint rules
  const getDepthOptions = () => {
    switch (productType) {
      case 'CAN': return ['25', '32', '40', '44']; // Use numeric values for depth in state
      case 'PAN': return ['25', '32', '44'];
      case 'RND':
      case 'OVL': return ['24', '30', '36', '42'];
      case 'STB': return ['25', '32', '40', '44'];
      default: return [];
    }
  };

  const getFabricOptions = () => {
    const fabrics = getMaterialsByType('Fabric');
    switch (productType) {
      case 'CAN':
      case 'PAN': return fabrics.map(f => f.code); // All fabric codes
      case 'RND':
      case 'OVL': return fabrics.filter(f => f.code === '12OZ').map(f => f.code); // Only 12OZ for Rounds/Ovals (as per doc)
      default: return [];
    }
  };

  const getFinishOptions = () => {
    const finishes = getMaterialsByType('Mediums/Coatings'); // Finishes are mediums/coatings
    const allowedFinishes = finishes.map(f => f.code); 

    // Filter based on selected fabric type (Canvas and Panel rules)
    if (productType === 'CAN' || productType === 'PAN') {
        if (fabricType === 'SUP' || fabricType === 'OIL') {
            return allowedFinishes.filter(f => f === 'NAT');
        } else if (fabricType === '12OZ') {
            return allowedFinishes.filter(f => ['UP', 'WPR', 'BPR'].includes(f));
        } else if (fabricType === 'LIN') {
            return allowedFinishes.filter(f => ['UP', 'WPR', 'CSL'].includes(f));
        }
    } else if (productType === 'RND' || productType === 'OVL') {
        // For Round/Oval, if fabric covered, only PRW/PRB
        if (fabricType === '12OZ') {
            return allowedFinishes.filter(f => ['WPR', 'BPR'].includes(f));
        } else { // Bare panels, based on similar options as Panel
            return allowedFinishes.filter(f => ['NAT', 'CLR', 'WPR', 'BPR'].includes(f)); 
        }
    }
    return allowedFinishes; 
  };

  const getTrayFrameAddonOptions = () => {
      // Filter for actual tray frame materials like T25N, T32W etc.
      const trayFrames = materialsData.filter(m => m.code.startsWith('T25') || m.code.startsWith('T32'));
      
      // Tray frame is invalid if Canvas/Panel depth is D44
      if ((productType === 'CAN' || productType === 'PAN') && depth === '44') return []; // Use '44' from state
      
      // Only show T25x for D25, T32x for D32/D40
      if (productType === 'CAN' || productType === 'PAN') {
          if (depth === '25') return trayFrames.filter(tf => tf.code.startsWith('T25')).map(tf => tf.code);
          if (depth === '32' || depth === '40') return trayFrames.filter(tf => tf.code.startsWith('T32')).map(tf => tf.code);
      }
      return []; 
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-['Poppins']" style={{ backgroundColor: colors.deepGray }}>
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2" style={{ color: colors.offWhite }}>
          HM Instant Quote
        </h1>
        <p className="text-xl sm:text-2xl font-semibold" style={{ color: colors.lightGreen }}>
          Your bespoke canvas cost estimator
        </p>
      </header>

      {loadingMaterials && <p className="text-lightGreen mb-4">Loading material options...</p>}
      {errorMaterials && <p className="text-red-400 mb-4">{errorMaterials}</p>}

      <div className="bg-mediumGreen rounded-xl shadow-lg p-8 w-full max-w-lg"> {/* Increased max-width */}
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.offWhite }}>
          Product Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type Selection */}
          <div>
            <label htmlFor="productType" className="block text-offWhite text-sm font-semibold mb-2">
              Product Type
            </label>
            <select
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
            >
              <option value="CAN" className="bg-deepGray text-offWhite">Canvas (CAN)</option>
              <option value="PAN" className="bg-deepGray text-offWhite">Painting Panel (PAN)</option>
              <option value="RND" className="bg-deepGray text-offWhite">Round (RND)</option>
              <option value="OVL" className="bg-deepGray text-offWhite">Oval (OVL)</option>
              <option value="TRA" className="bg-deepGray text-offWhite">Tray Frame (TRA)</option>
              <option value="STB" className="bg-deepGray text-offWhite">Stretcher Bar Frame (STB)</option>
            </select>
          </div>

          {/* Unit Selection */}
          <div>
            <label htmlFor="unit" className="block text-offWhite text-sm font-semibold mb-2">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
            >
              <option value="CM" className="bg-deepGray text-offWhite">CM</option>
              <option value="IN" className="bg-deepGray text-offWhite">IN</option>
            </select>
          </div>

          {/* Conditional Dimension Inputs based on Product Type */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') && (
            <>
              <div>
                <label htmlFor="height" className="block text-offWhite text-sm font-semibold mb-2">
                  Height ({unit})
                </label>
                <input
                  type="number" step="0.1" id="height" value={height} onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold placeholder-offWhite/70"
                  placeholder="e.g., 80.0"
                />
              </div>
              <div>
                <label htmlFor="width" className="block text-offWhite text-sm font-semibold mb-2">
                  Width ({unit})
                </label>
                <input
                  type="number" step="0.1" id="width" value={width} onChange={(e) => setWidth(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold placeholder-offWhite/70"
                  placeholder="e.g., 60.0"
                />
              </div>
            </>
          )}

          {productType === 'RND' && (
            <div>
              <label htmlFor="diameter" className="block text-offWhite text-sm font-semibold mb-2">
                Diameter ({unit})
              </label>
              <input
                type="number" step="0.1" id="diameter" value={diameter} onChange={(e) => setDiameter(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold placeholder-offWhite/70"
                placeholder="e.g., 120.0"
              />
            </div>
          )}

          {productType === 'OVL' && (
            <>
              <div>
                <label htmlFor="majorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                  Major Axis ({unit})
                </label>
                <input
                  type="number" step="0.1" id="majorAxis" value={majorAxis} onChange={(e) => setMajorAxis(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold placeholder-offWhite/70"
                  placeholder="e.g., 100.0"
                />
              </div>
              <div>
                <label htmlFor="minorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                  Minor Axis ({unit})
                </label>
                <input
                  type="number" step="0.1" id="minorAxis" value={minorAxis} onChange={(e) => setMinorAxis(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold placeholder-offWhite/70"
                  placeholder="e.g., 70.0"
                />
              </div>
            </>
          )}

          {/* Depth Selection (Common for most) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL' || productType === 'STB') && (
            <div>
              <label htmlFor="depth" className="block text-offWhite text-sm font-semibold mb-2">
                Depth
              </label>
              <select
                id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
              >
                <option value="">Select Depth</option>
                {getDepthOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{`D${opt}`}</option> 
                ))}
              </select>
            </div>
          )}

          {/* Fabric Type Selection (Canvas, Panel, Round, Oval) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL') && (
            <div>
              <label htmlFor="fabricType" className="block text-offWhite text-sm font-semibold mb-2">
                Fabric Type
              </label>
              <select
                id="fabricType" value={fabricType} onChange={(e) => setFabricType(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
              >
                <option value="">Select Fabric</option>
                {getFabricOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Finish Selection (Canvas, Panel, Round, Oval) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL') && (
            <div>
              <label htmlFor="finish" className="block text-offWhite text-sm font-semibold mb-2">
                Finish
              </label>
              <select
                id="finish" value={finish} onChange={(e) => setFinish(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
              >
                <option value="">Select Finish</option>
                {getFinishOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tray Frame Add-on (Canvas, Panel) */}
          {(productType === 'CAN' || productType === 'PAN') && (
            <div>
              <label htmlFor="trayFrameAddon" className="block text-offWhite text-sm font-semibold mb-2">
                Tray Frame Add-on
              </label>
              <select
                id="trayFrameAddon" value={trayFrameAddon} onChange={(e) => setTrayFrameAddon(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
                disabled={depth === '44'} // Disable if depth is D44
              >
                <option value="">No Tray Frame</option>
                {getTrayFrameAddonOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
              {depth === '44' && (
                  <p className="text-red-300 text-xs mt-1">Tray Frame not compatible with D44 depth.</p>
              )}
            </div>
          )}

          {/* Custom Cross Braces (Canvas, Stretcher Bar Frame) */}
          {(productType === 'CAN' || productType === 'STB') && (
            <>
              <div>
                <label htmlFor="customHBraces" className="block text-offWhite text-sm font-semibold mb-2">
                  Custom Horizontal Braces (0-3)
                </label>
                <input
                  type="number" step="1" min="0" max="3" id="customHBraces" value={customHBraces} onChange={(e) => setCustomHBraces(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
                />
              </div>
              <div>
                <label htmlFor="customWBraces" className="block text-offWhite text-sm font-semibold mb-2">
                  Custom Vertical Braces (0-3)
                </label>
                <input
                  type="number" step="1" min="0" max="3" id="customWBraces" value={customWBraces} onChange={(e) => setCustomWBraces(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold"
                />
              </div>
              {(parseInt(customHBraces) + parseInt(customWBraces) > 6) && (
                  <p className="text-red-300 text-xs mt-1 md:col-span-2">Total braces cannot exceed 6.</p>
              )}
            </>
          )}

        </div>

        {/* Generated SKU and Quote Price */}
        <div className="mt-8 text-center">
          <h3 className="text-2xl font-bold" style={{ color: colors.offWhite }}>
            Generated SKU:
          </h3>
          <p className="text-xl font-extrabold mt-2 text-lightGreen break-all">
            {sku || 'Configure product...'}
          </p>

          <h3 className="text-2xl font-bold mt-4" style={{ color: colors.offWhite }}>
            Estimated Price:
          </h3>
          <p className="text-4xl font-extrabold mt-2" style={{ color: colors.accentGold }}>
            {quotePrice || '£0.00'}
          </p>
        </div>
      </div>

      {/* Link back to MRP System (using onInternalNav) */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('mrp')} // Use onInternalNav to go back to MRP
          className="p-3 rounded-lg font-semibold transition-colors duration-200 inline-block"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to MRP System
        </button>
      </div>
    </div>
  );
}


// Component that encapsulates the Centralized Dashboard (excluding the router part)
function CentralizedDashboard({ db, userId, firebaseReady }) {
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
        return <DashboardContent onInternalNav={handleInternalNavigation} mainCards={mainCards} userId={userId} firebaseReady={firebaseReady} />; 
      case 'mrp':
        return <MRPPage onInternalNav={handleInternalNavigation} />;
      case 'social_media_hub':
        return <SocialMediaHubPage onInternalNav={handleInternalNavigation} />;
      case 'material_management': 
        return <MaterialManagementPage onInternalNav={handleInternalNavigation} db={db} />; // Pass db
      case 'instant_quote_app': // NEW CASE for Instant Quote App
        return <InstantQuoteAppPage db={db} onInternalNav={handleInternalNavigation} />; // Pass db and onInternalNav
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
        
        {/* Search Bar for Google Search - MOVED HERE */}
        <div className="mb-6 w-full">
            <input 
                type="text" 
                placeholder="Search Google..." 
                className="p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold w-full placeholder-offWhite/70" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyPress={handleSearch} 
            />
        </div>

        {/* Dynamic Sidebar Cards (now only external links and root path links handled via href) */}
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


// Main App component (handles global Firebase init and top-level routing)
function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [db, setDb] = useState(null); 
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  // Firebase Initialization and Authentication (runs once for the whole app)
  useEffect(() => {
    // RESTORING previous firebaseConfig (user provided), as __firebase_config was causing issues.
    // The __app_id variable will still be used for constructing Firestore paths dynamically.
    const firebaseConfig = {
      apiKey: "AIzaSyDwiZCSXUm-zOwXbkTL_yI8Vn-B2xNtaU8",
      authDomain: "hm-canvases-alliem-art.firebaseapp.com",
      projectId: "hm-canvases-alliem-art",
      storageBucket: "hm-canvases-alliem-art.firebasestorage.app",
      messagingSenderId: "544423481137",
      appId: "1:544423481137:web:9d0cb650642dd8f1b2ea10",
      measurementId: "G-D23Z6GBTH0"
    };

    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase configuration is missing or invalid. Cannot initialize Firebase.");
      setFirebaseReady(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firebaseAuth = getAuth(app);
      const firestoreDb = getFirestore(app); 
      setDb(firestoreDb); 
      setAuth(firebaseAuth);
      console.log("Firebase app initialized successfully.");

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Firebase user authenticated with ID:", user.uid);
        } else {
          console.log("No Firebase user found, attempting anonymous sign-in for initial app load.");
          try {
            // MANDATORY: Use __initial_auth_token or signInAnonymously
            // This global variable is provided by the Canvas environment.
            if (typeof __initial_auth_token !== 'undefined') {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
              console.log("Signed in with custom token.");
            } else {
              await signInAnonymously(firebaseAuth);
              console.log("Signed in anonymously.");
            }
          } catch (error) {
            console.error("Error during Firebase sign-in:", error);
          }
        }
        setFirebaseReady(true);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase app:", e);
      setFirebaseReady(false);
    }
  }, []); 

  // The App component now always renders the CentralizedDashboard.
  // Internal navigation is handled within CentralizedDashboard using state.
  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.deepGray }}>
        <p className="text-offWhite text-xl">Initializing Firebase...</p>
      </div>
    );
  }

  // Always render the CentralizedDashboard, which handles its own internal routing.
  return <CentralizedDashboard db={db} userId={userId} firebaseReady={firebaseReady} />;
}

export default App;