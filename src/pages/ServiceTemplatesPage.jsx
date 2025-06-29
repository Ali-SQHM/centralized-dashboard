// src/pages/ServiceTemplatesPage.jsx
// Placeholder for Service Templates.
// Styled to match the consistent dark theme.

import React from 'react';

const ServiceTemplatesPage = ({ db, firestoreAppId }) => {
  return (
    <div className="w-full h-full flex flex-col min-w-0 text-offWhite">
      <h2 className="text-3xl font-bold text-green-400 mb-6">Service Templates</h2>
      <p className="text-gray-300 mb-8">Create and manage reusable templates for your common services and quotes to streamline operations.</p>
      <div className="mt-8 p-6 bg-darkGray rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-300">Predefined service packages and pricing structures to accelerate quoting.</p>
        <button className="mt-4 px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700 text-white font-semibold transition duration-200">Manage Templates</button>
      </div>
    </div>
  );
};

export default ServiceTemplatesPage;
