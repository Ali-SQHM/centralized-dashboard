// src/pages/SalesOrdersPage.jsx
// Placeholder component for the Sales Orders page.
// This page will manage sales orders, including creation, viewing, and editing.
//
// Updates:
// 1. Initial component structure created as a placeholder.
// 2. **UPDATED:** Integrated with the new PageLayout component for consistent page structure and mobile responsiveness.

import React from 'react';
import PageLayout from '../components/PageLayout'; // Import the new PageLayout component

function SalesOrdersPage({ db, auth, user, firestoreAppId }) {
  return (
    // Wrap the entire page content with PageLayout
    <PageLayout pageTitle="Sales Orders">
      {/* The main content for the Sales Orders page, now inside PageLayout */}
      <div className="flex flex-col items-center justify-center h-full text-offWhite p-4">
        <p className="text-lg">
          Sales Orders Page (Under Construction)
        </p>
        <p className="text-gray-400 mt-2">
          (This is a placeholder. Your sales order management tools will appear here.)
        </p>
      </div>
    </PageLayout>
  );
}

export default SalesOrdersPage;
