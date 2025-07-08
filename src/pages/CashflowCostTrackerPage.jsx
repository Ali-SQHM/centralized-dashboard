// src/pages/CashflowCostTrackerPage.jsx
// Placeholder component for the Cashflow & Cost Tracker.
// This page will provide tools for managing cash flow and tracking costs.
//
// Updates:
// 1. Initial component structure created as a placeholder.
// 2. **UPDATED:** Integrated with the new PageLayout component for consistent page structure and mobile responsiveness.

import React from 'react';
import PageLayout from '../components/PageLayout'; // Import the new PageLayout component

function CashflowCostTrackerPage({ db, auth, user, firestoreAppId }) {
  return (
    // Wrap the entire page content with PageLayout
    <PageLayout pageTitle="Cashflow & Cost Tracker">
      {/* The main content for the Cashflow & Cost Tracker page, now inside PageLayout */}
      <div className="flex flex-col items-center justify-center h-full text-offWhite p-4">
        <p className="text-lg">
          Cashflow & Cost Tracker Page (Under Construction)
        </p>
        <p className="text-gray-400 mt-2">
          (This is a placeholder. Financial tracking tools will go here.)
        </p>
      </div>
    </PageLayout>
  );
}

export default CashflowCostTrackerPage;
