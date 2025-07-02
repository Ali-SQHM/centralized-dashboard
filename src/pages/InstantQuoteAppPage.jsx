// src/pages/InstantQuoteAppPage.jsx
// This page serves as both the public-facing Instant Quote app and the internal version.
// It now includes info tabs for product details and a discrete staff login button.

import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa6'; // Import Google icon

function InstantQuoteAppPage({ db, firestoreAppId, auth, currentUser, isAuthorizedStaff, navigateTo }) {
  const [activeTab, setActiveTab] = useState('stretcherBars'); // Default active tab

  // Content for each info tab
  const tabContent = {
    stretcherBars: (
      <div className="p-4 text-offWhite">
        <h4 className="text-xl font-semibold mb-3 text-lightGreen">Stretcher Bars Information</h4>
        <p className="mb-2">Our stretcher bars are crafted from high-quality, sustainably sourced wood, ensuring durability and warp resistance for your canvases.</p>
        <p className="mb-2">Available in various depths and profiles to suit different artistic needs, from standard gallery wraps to deep-edge presentations.</p>
        <ul className="list-disc list-inside text-gray-300">
          <li>Precision-milled joints for perfect corners.</li>
          <li>Kiln-dried timber to prevent warping.</li>
          <li>Custom sizes available upon request.</li>
        </ul>
        <img
          src="https://placehold.co/400x200/1F2937/F3F4F6?text=Stretcher+Bars"
          alt="Stretcher Bars"
          className="mt-4 rounded-lg shadow-md w-full max-w-md mx-auto"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/1F2937/F3F4F6?text=Image+Not+Available"; }}
        />
      </div>
    ),
    fabric: (
      <div className="p-4 text-offWhite">
        <h4 className="text-xl font-semibold mb-3 text-lightGreen">Fabric Information</h4>
        <p className="mb-2">We offer a diverse range of canvas fabrics, including premium cotton and linen, suitable for various painting mediums.</p>
        <p className="mb-2">All fabrics are pre-primed with acid-free gesso, providing an ideal surface for paint adhesion and longevity.</p>
        <ul className="list-disc list-inside text-gray-300">
          <li>Smooth to medium textures available.</li>
          <li>Suitable for oils, acrylics, and mixed media.</li>
          <li>Consistent weave for even stretching.</li>
        </ul>
        <img
          src="https://placehold.co/400x200/1F2937/F3F4F6?text=Canvas+Fabric"
          alt="Canvas Fabric"
          className="mt-4 rounded-lg shadow-md w-full max-w-md mx-auto"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/1F2937/F3F4F6?text=Image+Not+Available"; }}
        />
      </div>
    ),
    finishes: (
      <div className="p-4 text-offWhite">
        <h4 className="text-xl font-semibold mb-3 text-lightGreen">Finishes Information</h4>
        <p className="mb-2">Our finishing options provide protection and enhance the aesthetic appeal of your artwork.</p>
        <p className="mb-2">Choose from various varnishes and sealants, offering different levels of sheen and UV protection.</p>
        <ul className="list-disc list-inside text-gray-300">
          <li>Matte, satin, and gloss finishes.</li>
          <li>UV protective coatings to prevent fading.</li>
          <li>Archival quality for long-term preservation.</li>
        </ul>
        <img
          src="https://placehold.co/400x200/1F2937/F3F4F6?text=Finishes"
          alt="Finishes"
          className="mt-4 rounded-lg shadow-md w-full max-w-md mx-auto"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/1F2937/F3F4F6?text=Image+Not+Available"; }}
        />
      </div>
    ),
  };

  return (
    <div className="p-4 md:p-6 bg-darkGray rounded-xl shadow-md flex flex-col h-full relative"> {/* Added relative for positioning */}
      <h3 className="text-3xl font-bold mb-6 text-lightGreen text-center">Instant Quote App</h3>

      {/* Discrete Staff Login Button (top-right corner) */}
      {!isAuthorizedStaff && (
        <div className="absolute top-4 right-4 z-10"> {/* Positioned absolutely */}
          <button
            onClick={() => navigateTo('authPage')}
            className="bg-gray-700 text-offWhite text-sm py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200 shadow-md flex items-center"
          >
            <FaGoogle className="mr-2 text-base" /> Staff Login
          </button>
        </div>
      )}

      {/* Info Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          {['stretcherBars', 'fabric', 'finishes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-medium rounded-t-lg transition duration-200 ${
                activeTab === tab
                  ? 'bg-mediumGray text-lightGreen border-b-2 border-lightGreen'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-offWhite'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
        <div className="bg-deepGray rounded-b-lg p-4 border border-gray-700">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* Quote Generation Section (Placeholder for now) */}
      <div className="flex-1 bg-deepGray p-6 rounded-xl shadow-inner border border-gray-700 flex flex-col items-center justify-center text-center">
        <h4 className="text-xl font-bold mb-4 text-accentGold">Generate Your Quote (Coming Soon)</h4>
        <p className="text-gray-400 text-lg">
          This section will allow you to input your canvas specifications and generate an instant quote.
        </p>
        {isAuthorizedStaff && (
          <p className="text-mediumGreen text-lg mt-4">
            As authorized staff, you will see detailed cost breakdowns here.
          </p>
        )}
      </div>
    </div>
  );
}

export default InstantQuoteAppPage;
