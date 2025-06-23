// src/components/DashboardCard.jsx
// Reusable component for displaying interactive cards on the dashboard and internal pages.
// Handles navigation for external links, root path links, and internal app navigation.

import React from 'react';
import PlaceholderBadge from './PlaceholderBadge'; // Import the PlaceholderBadge
import { colors } from '../utils/constants'; // Import colors from centralized constants

function DashboardCard({ title, description, icon, link, isPlaceholder = false, cardBgColor, iconBgColor, textColor, descColor, onInternalNav }) {
  // Determine if it's an external link or a root path link
  const isExternalLink = link.startsWith('http://') || link.startsWith('https://');
  const isRootPathLink = link.startsWith('/'); // e.g., /quote

  const handleClick = (e) => {
    if (isPlaceholder) {
      e.preventDefault(); // Prevent navigation for placeholders
      console.log(`${title} is coming soon!`);
    } else if (isRootPathLink) {
        e.preventDefault(); // Prevent default <a> behavior for root path links
        // For root path links, we directly set window.location.href to trigger a full page reload,
        // which helps in correctly initializing the new "app" (Dashboard or Quote App).
        window.location.href = link;
    } else if (!isExternalLink && onInternalNav) { // Only call onInternalNav for internal links like "mrp", "material_management"
        e.preventDefault();
        onInternalNav(link);
    }
  };

  return (
    <a
      // If it's a placeholder or internal link, use # and let handleClick manage.
      // If it's an external link or root path link, use the actual link.
      href={isPlaceholder || (!isExternalLink && !isRootPathLink) ? "#" : link}
      target={isExternalLink ? "_blank" : "_self"}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      className={`relative flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
        ${isPlaceholder ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ backgroundColor: cardBgColor }}
      onClick={handleClick}
    >
      {isPlaceholder && <PlaceholderBadge />}
      <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 text-accentGold" style={{ backgroundColor: iconBgColor }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-center mb-2" style={{ color: textColor }}>{title}</h3>
      <p className="text-center text-sm" style={{ color: descColor }}>
        {description}
      </p>
    </a>
  );
}

export default DashboardCard;