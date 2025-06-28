// src/components/DashboardContent.jsx
// Displays the main content area of the dashboard, including header, logo,
// user ID, main content cards, and the CalendarComponent.

import React from 'react';
import DashboardCard from './DashboardCard'; // Import DashboardCard
import CalendarComponent from './CalendarComponent'; // Import CalendarComponent
import { colors } from '../utils/constants'; // Import colors from centralized constants

function DashboardContent({ onInternalNav, mainCards, userId, firebaseReady }) { 
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
            className="max-h-24 md:max-h-32 w-auto rounded-xl shadow-md" 
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
          <div className="h-48 bg-white/10 rounded-xl mt-4 flex items-center justify-center text-white/50 text-sm">
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

export default DashboardContent;