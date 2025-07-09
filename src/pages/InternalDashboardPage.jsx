// src/pages/InternalDashboardPage.jsx
// This component serves as the internal dashboard for authorized staff.
// It will eventually display a mosaic of key information from different
// parts of the ERP system.
//
// Updates:
// 1. Integrated the new `MaterialStockStatusWidget` component.
// 2. Implemented a basic Tailwind CSS `grid` layout to start building
//    the "mosaic dashboard" structure.

import React from 'react';
import MaterialStockStatusWidget from '../components/MaterialStockStatusWidget'; // Import the new widget
import ErrorBoundary from '../components/ErrorBoundary'; // Ensure ErrorBoundary is imported

function InternalDashboardPage({ db, userId, firestoreAppId }) {
  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 bg-darkGray text-offWhite min-h-screen flex flex-col">
        <h1 className="text-3xl font-bold text-lightGreen mb-6 text-center sm:text-left">Internal Dashboard</h1>

        {/* Mosaic Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {/* Material Stock Status Widget */}
          <div className="col-span-1"> {/* This widget will take 1 column */}
            <MaterialStockStatusWidget db={db} firestoreAppId={firestoreAppId} />
          </div>

          {/* Placeholder for other dashboard widgets */}
          <div className="bg-mediumGray p-6 rounded-xl shadow-lg flex items-center justify-center text-gray-400 text-center h-64">
            <p>Another Dashboard Widget Here</p>
          </div>
          <div className="bg-mediumGray p-6 rounded-xl shadow-lg flex items-center justify-center text-gray-400 text-center h-64">
            <p>Sales Overview</p>
          </div>
          <div className="bg-mediumGray p-6 rounded-xl shadow-lg flex items-center justify-center text-gray-400 text-center h-64">
            <p>Production Metrics</p>
          </div>
          {/* Add more widgets as needed */}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default InternalDashboardPage;