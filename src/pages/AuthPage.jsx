// src/pages/AuthPage.jsx
// This component provides a simplified interface for staff Google Sign-In.
//
// Updates:
// - Simplified UI to a single login button and "Authorised Users only" text.
// - Removed 'Go to Public Quote App' button, replaced by primary navigation.
// - Ensures `colors.blue[400]` syntax is used, now supported by constants.js.

import React from 'react';
import { colors } from '../utils/constants'; // Assuming you have colors in constants

function AuthPage({ onGoogleSignIn, navigateTo }) {
  const handleGoToPublicQuoteApp = () => {
    navigateTo('quoteApp'); // Use the new 'quoteApp' pageName
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-['Poppins'] bg-deepGray text-offWhite">
      <div className="bg-darkGray p-8 rounded-xl shadow-lg border border-gray-700 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold mb-6" style={{ color: colors.blue[400] }}>Staff Login</h2>
        <p className="text-gray-300 mb-8">Authorised Users only</p>

        <button
          onClick={onGoogleSignIn}
          className="w-full py-3 px-6 rounded-xl font-bold text-lg transition-colors duration-200 shadow-md flex items-center justify-center"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-3" />
          Sign in with Google
        </button>

        {/* Removed "Go to Public Quote App" button from AuthPage as navigation is now handled differently */}
        <p className="mt-6 text-sm text-gray-400">
          Not staff? <span onClick={handleGoToPublicQuoteApp} className="text-lightGreen cursor-pointer hover:underline">Go to Public Quote Page</span>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;