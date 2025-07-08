// src/pages/MRPPage.jsx
// Placeholder component for the MRP & Production Planning page.
// This page will manage material requirements planning and production scheduling.
//
// Updates:
// 1. Initial component structure created as a placeholder.
// 2. **UPDATED:** Integrated with the new PageLayout component for consistent page structure and mobile responsiveness.

import React from 'react';
import PageLayout from '../components/PageLayout'; // Import the new PageLayout component

function MRPPage({ db, auth, user, firestoreAppId }) {
  return (
    // Wrap the entire page content with PageLayout
    <PageLayout pageTitle="MRP & Production Planning">
      {/* The main content for the MRP & Production Planning page, now inside PageLayout */}
      <div className="flex flex-col items-center justify-center h-full text-offWhite p-4">
        <p className="text-lg">
          MRP & Production Planning Page (Under Construction)
        </p>
        <p className="text-gray-400 mt-2">
          (This is a placeholder. Material requirements and production schedules will appear here.)
        </p>
      </div>
    </PageLayout>
  );
}

export default MRPPage;
