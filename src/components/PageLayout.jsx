// src/components/PageLayout.jsx
// This component provides a consistent layout for all internal application pages.
// It includes a page title and handles mobile-specific top padding to clear
// fixed header elements like the hamburger menu.
//
// UPDATED: Re-added pt-16 to the root div to handle mobile top padding.

import React from 'react';

function PageLayout({ pageTitle, children }) {
  return (
    // This div acts as the immediate container for the page's content.
    // It provides the common flex column layout.
    // Added pt-16 for mobile to ensure content clears the fixed hamburger menu.
    // md:pt-0 ensures this padding is not applied on desktop.
    <div className="flex flex-col w-full h-full pt-16 md:pt-0">
      {/* Page Title - consistently rendered for all pages using this layout */}
      <h3 className="text-3xl font-bold text-lightGreen text-center mb-6">
        {pageTitle}
      </h3>
      {/* Main content area for the specific page. Flex-1 allows it to grow. */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export default PageLayout;
