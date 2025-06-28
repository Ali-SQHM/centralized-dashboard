import React from 'react';

const DashboardHome = ({ user }) => {
  // Placeholder for Quote of the Day
  const quoteOfTheDay = {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  };

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-gray-200 mb-6">Welcome to Your Dashboard, {user?.displayName || user?.email || 'Staff Member'}!</h2>
      <p className="text-gray-300 mb-8">This is the central hub for all HM Manufacturing operations. Stay updated with key metrics and quick links.</p>

      {/* Quote of the Day Section */}
      <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600 mb-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-3">Quote of the Day</h3>
        <p className="text-gray-300 italic text-lg mb-2">"{quoteOfTheDay.text}"</p>
        <p className="text-gray-400 font-medium">- {quoteOfTheDay.author}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-3">Quick Actions</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Review New Quotes (0 new)</li>
            <li>Update Stock Levels (5 items low)</li>
            <li>Check Production Schedule (Next: Mon, 9 AM)</li>
            <li>Process New Orders (3 pending)</li>
          </ul>
        </div>
        {/* Key Metrics Card */}
        <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-3">Key Metrics (Last 30 Days)</h3>
          <p className="text-gray-300 mb-2">Total Revenue: <span className="font-bold text-green-400">£15,200</span></p>
          <p className="text-gray-300 mb-2">Orders Completed: <span className="font-bold text-blue-400">45</span></p>
          <p className="text-gray-300">Average Quote Conversion: <span className="font-bold text-yellow-400">28%</span></p>
        </div>
        {/* Notifications Card */}
        <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-3">Notifications</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>New quote from Jane Doe (2 mins ago)</li>
            <li>Material X - Stock running low!</li>
            <li>Weekly performance report ready.</li>
            <li>System update scheduled for 2 AM.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;