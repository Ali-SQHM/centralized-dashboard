// src/pages/SettingsPage.jsx
// Placeholder component for the Settings page.
// This page will allow authorized users to configure application settings.
//
// Updates:
// 1. Initial component structure created as a placeholder.
// 2. **UPDATED:** Integrated with the new PageLayout component for consistent page structure and mobile responsiveness.

import React from 'react';
import PageLayout from '../components/PageLayout'; // Import the new PageLayout component

function SettingsPage({ db, auth, user, firestoreAppId }) {
  return (
    // Wrap the entire page content with PageLayout
    <PageLayout pageTitle="Settings">
      {/* The main content for the Settings page, now inside PageLayout */}
      <div className="flex flex-col items-center justify-center h-full text-offWhite p-4">
        <p className="text-lg">
          Settings Page (Under Construction)
        </p>
        <p className="text-gray-400 mt-2">
          (This is a placeholder. Application settings and configurations will appear here.)
        </p>
      </div>
    </PageLayout>
  );
}

export default SettingsPage;
