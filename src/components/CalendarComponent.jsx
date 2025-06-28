// src/components/CalendarComponent.jsx
// Displays a simple monthly calendar with navigation and a link to Google Calendar.

import React, { useState } from 'react';
import { colors } from '../utils/constants'; // Import colors from centralized constants

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
    
    // Add empty divs for leading blank days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="p-2 text-center text-offWhite/30"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`p-2 text-center rounded-xl transition-colors duration-200 cursor-pointer`}
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
        className="mt-4 p-3 rounded-xl font-semibold transition-colors duration-200"
        style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
      >
        Go to Google Calendar
      </button>
    </div>
  );
}

export default CalendarComponent;