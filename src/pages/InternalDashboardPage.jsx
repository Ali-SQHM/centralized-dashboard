// src/pages/InternalDashboardPage.jsx
// This is the internal dashboard page for authorized staff.
// It now uses the PageLayout component for consistent title and mobile padding.

import React from 'react';
import PageLayout from '../components/PageLayout'; // Import PageLayout

function InternalDashboardPage({ db, userId, firestoreAppId }) {
  return (
    <PageLayout pageTitle="Internal Dashboard">
      {/* The actual content of your Internal Dashboard goes here */}
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-offWhite text-lg">
          Welcome to your Internal Dashboard, staff member!
        </p>
        <p className="text-gray-400 mt-2">
          (This is a placeholder. Your dashboard widgets and data will appear here.)
        </p>
        <p className="text-sm text-gray-500 mt-4">
          User ID: {userId || 'N/A'} | App ID: {firestoreAppId || 'N/A'}
        </p>
      </div>
    </PageLayout>
  );
}

export default InternalDashboardPage;
