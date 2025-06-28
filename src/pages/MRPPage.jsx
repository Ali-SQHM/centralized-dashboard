// src/pages/MRPPage.jsx
// Simplified placeholder for the MRP (Material Requirements Planning) System.
// Styled to match the consistent dark theme.

import React from 'react';

const MRPPage = ({ db, firestoreAppId }) => {
  return (
    <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl">
      <h2 className="text-3xl font-bold text-purple-400 mb-6">MRP System</h2>
      <p className="text-gray-300 mb-8">This page is dedicated to Material Requirements Planning. It will help you manage:</p>
      <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
        <li>Production Schedules and Orders</li>
        <li>Bill of Materials (BOM) Management</li>
        <li>Inventory Control for Manufacturing</li>
        <li>Capacity Planning and Resource Allocation</li>
      </ul>
      <div className="mt-8 p-6 bg-darkGray rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">MRP Dashboards & Reports (Coming Soon)</h3>
        <p className="text-gray-300">Detailed insights into your manufacturing process efficiency will be available here.</p>
        <button className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 text-white font-semibold transition duration-200">View Production Overview</button>
      </div>
    </div>
  );
};

export default MRPPage;