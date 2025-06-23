// src/components/SocialMediaHubPage.jsx
// Placeholder page for the AI Social Media Hub.

import React from 'react';
import { colors } from '../utils/constants'; // Import colors from centralized constants

function SocialMediaHubPage({ onInternalNav }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <h1 className="text-4xl font-extrabold text-offWhite mb-8">AI Social Media Hub</h1>
      <p className="text-lightGreen mb-6">Access AI-powered content generation and social media management tools here.</p>
      {/* Content for Social Media Hub will go here */}

      {/* Button to go back to main dashboard */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('dashboard')}
          className="p-3 rounded-lg font-semibold transition-colors duration-200"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default SocialMediaHubPage;