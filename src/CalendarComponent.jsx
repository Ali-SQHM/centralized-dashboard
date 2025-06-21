// src/CalendarComponent.jsx
import React, { useState } from 'react';

// Define the colors for the calendar to match your dashboard theme
const colors = {
  mediumGreen: '#4F6C4C',
  lightGreen: '#738C71',
  accentGold: '#FFC200',
  offWhite: '#F3F4F6',
  deepGray: '#111827',
  darkGreen: '#1A4D2E', // Added for button background consistency
};

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
