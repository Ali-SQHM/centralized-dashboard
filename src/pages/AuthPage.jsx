// src/pages/AuthPage.jsx
// This component provides the login interface for staff members.
// It is designed to be a simple, centered page with a Google Sign-In button.
// It receives the onSignIn function from App.jsx to handle authentication.

import React from 'react';
import { FaGoogle } from 'react-icons/fa6'; // Using Fa6 for consistency

function AuthPage({ onSignIn, navigateTo }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-darkGray text-offWhite p-4">
      <div className="bg-mediumGray p-8 rounded-xl shadow-2xl w-full max-w-md text-center border border-gray-700">
        <h2 className="text-3xl font-bold text-lightGreen mb-6">Staff Login</h2>
        <p className="text-gray-300 mb-8">
          Please sign in with your authorized Google account to access the internal HM ERP dashboard.
        </p>
        <button
          onClick={onSignIn}
          className="w-full bg-blue-600 text-offWhite font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center text-lg"
        >
          <FaGoogle className="mr-3 text-2xl" /> Sign In with Google
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
