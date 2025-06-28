import React from 'react';

const ServiceTemplatesPage = ({ db, firestoreAppId }) => {
  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-green-300 mb-6">Service Templates</h2>
      <p className="text-gray-300">Create and manage reusable templates for your common services and quotes.</p>
      <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-300">Streamline your quoting process with predefined service packages.</p>
      </div>
    </div>
  );
};

export default ServiceTemplatesPage;