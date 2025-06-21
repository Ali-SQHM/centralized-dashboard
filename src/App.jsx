// src/App.jsx
// This version combines all necessary components and data into a single file
// to resolve persistent "Could not resolve" import errors.

import React, { useState, useEffect } from 'react';

// Firebase imports (still external, as they are npm packages)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore if you plan to use it later

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


// --- INLINED: dashboardCardsData (originally from src/dashboardData.js) ---
const dashboardCardsData = [
  // --- Sidebar Cards ---
  {
    id: 'sidebar-gmail', // Unique ID for the card
    title: 'Gmail',
    description: 'Manage business emails.',
    icon: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75M21.75 6.75a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6.75m18.75 0v2.625a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75m18.75 0a3.75 3.75 0 0 0-3.75-3.75H9.75a3.75 3.75 0 0 0-3.75 3.75m6.75 0a5.25 5.25 0 0 0-5.25 5.25v2.25m-3.75 7.5v-2.25m11.25 7.5v-2.25m-6.75 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
    link: "https://mail.google.com/",
    cardBgColor: colors.darkGreen,
    iconBgColor: colors.mediumGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'sidebar' // Custom property to indicate location
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

  // --- Main Content Cards ---
  {
    id: 'main-financial-tracker',
    title: 'Financial Operations Tracker',
    description: 'Your centralized sheet for cash flow, costs & transfers.',
    icon: "M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z",
    link: "#", // Placeholder
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
    icon: "M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z",
    link: "#", // Placeholder
    isPlaceholder: true,
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
    link: "#", // Placeholder
    isPlaceholder: true,
    cardBgColor: colors.mediumGreen,
    iconBgColor: colors.darkGreen,
    textColor: colors.offWhite,
    descColor: colors.lightGreen,
    location: 'main'
  },
];


// --- INLINED: CalendarComponent (originally from src/CalendarComponent.jsx) ---
function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date()); // State to keep track of the current month being viewed

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed month

  // Get the first day of the month (e.g., a Monday, Sunday)
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
  // Get the number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Array of month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Array of weekday names for headers
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Function to generate the days for the calendar grid
  const generateDays = () => {
    const days = [];
    
    // Add empty cells for the days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="p-2 text-center text-offWhite/30"></div>);
    }

    // Add actual days of the month
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
            color: isToday ? colors.deepGray : colors.offWhite, // Ensure text color is based on theme
          }}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  // Handler for navigating to the previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  // Handler for navigating to the next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  // Handler to open Google Calendar in a new tab
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

      {/* NEW: Button to open Google Calendar */}
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


// --- DashboardCard Component (unchanged, still part of App.jsx) ---
function DashboardCard({ title, description, icon, link, isPlaceholder = false, cardBgColor, iconBgColor, textColor, descColor }) {
  const PlaceholderBadge = () => (
    <span className="absolute top-2 right-2 bg-accentGold text-deepGray text-xs font-semibold px-2.5 py-0.5 rounded-full">
      Coming Soon
    </span>
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
        ${isPlaceholder ? 'opacity-80 cursor-not-allowed' : ''}
      `}
      style={{ backgroundColor: cardBgColor }}
      onClick={(e) => isPlaceholder && e.preventDefault()}
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
      <p className="text-center text-sm" style={{ color: descColor }}>{description}</p>
    </a>
  );
}


// Main App component for the Centralized Operations Dashboard
function App() {
  const [searchTerm, setSearchTerm] = useState(''); // State for the search bar input
  const [userId, setUserId] = useState(null); // State to store the authenticated user's ID
  const [firebaseReady, setFirebaseReady] = useState(false); // State to track Firebase initialization

  // Firebase Initialization and Authentication
  useEffect(() => {
    // These global variables are provided by the Canvas environment.
    // __firebase_config contains your Firebase project's configuration.
    // __initial_auth_token is a custom token for initial authentication.
    // __app_id is the unique ID for this Canvas app instance.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null; // Corrected: Use initialAuthToken variable

    if (!firebaseConfig.apiKey) {
      console.error("Firebase configuration is missing. Cannot initialize Firebase.");
      // Set Firebase ready to true even if config is missing to avoid indefinite loading state
      setFirebaseReady(true);
      return;
    }

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app); // Initialize Firestore (even if not used immediately)

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        setUserId(user.uid);
        setFirebaseReady(true);
        console.log("Firebase user ID:", user.uid);
      } else {
        // User is signed out or not yet authenticated.
        // Attempt to sign in anonymously or with custom token
        try {
          // If a custom token is provided by the environment, use it.
          // Otherwise, sign in anonymously (creates a new anonymous user or re-uses existing one).
          if (initialAuthToken) {
            await signInAnonymously(auth, initialAuthToken); 
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Error during Firebase anonymous sign-in:", error);
          // Handle cases where sign-in fails (e.g., display a message to the user)
        }
        setFirebaseReady(true); // Firebase is ready, even if sign-in failed
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // Handle Google search when Enter is pressed
  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      window.open(googleSearchUrl, '_blank');
      setSearchTerm('');
    }
  };

  // Filter cards for sidebar and main content
  const sidebarCards = dashboardCardsData.filter(card => card.location === 'sidebar');
  const mainCards = dashboardCardsData.filter(card => card.location === 'main');

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Poppins']" style={{ backgroundColor: colors.deepGray }}>
      
      {/* Tall Box / Sidebar Alternative (left side) - Adjusted for responsiveness */}
      <div className="w-full md:w-1/4 min-w-[200px] max-w-[300px] bg-gradient-to-b from-darkGreen to-mediumGreen p-6 flex flex-col items-center rounded-b-none md:rounded-b-none md:rounded-r-3xl shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-white text-center">Dashboard Insights</h2>
        
        {/* Display User ID (Optional, but good for debugging/multi-user identification) */}
        {firebaseReady && userId ? (
          <p className="text-offWhite text-xs mb-4">User ID: {userId}</p>
        ) : (
          <p className="text-offWhite text-xs mb-4">Authenticating...</p>
        )}

        {/* Search Bar now triggers Google search on Enter */}
        <input 
          type="text" 
          placeholder="Search Google..." 
          className="p-2 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold w-full mb-6" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          onKeyPress={handleSearch} 
        />

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
            />
          ))}

          {/* Placeholder for "Random Thought of the Day" */}
          <div className="bg-white/10 rounded-xl p-4 text-center shadow-lg">
            <p className="font-semibold mb-2" style={{ color: colors.accentGold, fontSize: '0.875rem' }}>Thought of the Day</p>
            <p className="italic" style={{ color: colors.offWhite, fontSize: '0.75rem', opacity: '0.8' }}>"Creativity is intelligence having fun."</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Dashboard Header - adapted for dark theme with two columns and logo */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left">
          {/* Left Column for Text */}
          <div className="md:w-1/2 mb-4 md:mb-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-offWhite">
              HM Canvases & Alliem Art
            </h1>
            <p className="text-xl sm:text-2xl text-lightGreen font-semibold">
              Operations Dashboard
            </p>
          </div>

          {/* Right Column for Logo */}
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <img 
              src="Original_on_Transparent.png" 
              alt="HM Canvases & Alliem Art Logo" 
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/200x80/1A4D2E/F3F4F6?text=Logo" }} 
              className="max-h-24 md:max-h-32 w-auto rounded-lg shadow-md" 
            />
          </div>
        </header>

        {/* Dashboard Overview Heading (kept for clarity) */}
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

        {/* Footer - adapted for dark theme */}
        <footer className="mt-12 text-center text-offWhite/70 text-sm">
          <p>&copy; {new Date().getFullYear()} HM Canvases Ltd. All rights reserved.</p>
          <p>Powered by Google Workspace & Firebase</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
