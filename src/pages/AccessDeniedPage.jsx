// src/pages/AccessDeniedPage.jsx
// This component is displayed when a user successfully authenticates via Google
// but their UID is not found in the Firestore allowlist (`app_config/users_allowed`).

import React from 'react';
import { colors } from '../utils/constants';

function AccessDeniedPage({ signOutUser }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center font-['Poppins']" style={{ backgroundColor: colors.deepGray, color: colors.offWhite }}>
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
        Access Denied
      </h1>
      <p className="text-xl sm:text-2xl font-semibold mb-8" style={{ color: colors.lightGreen }}>
        You are authenticated but not authorized to view this page.
      </p>
      <p className="text-md mb-8" style={{ color: colors.offWhite }}>
        Please contact your administrator for access.
      </p>
      <button
        onClick={signOutUser}
        className="px-6 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-md"
        style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default AccessDeniedPage;