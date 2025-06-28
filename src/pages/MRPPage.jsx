// src/components/MRPPage.jsx
// Main landing page for the MRP System, providing navigation to sub-sections.

import React from 'react';
import DashboardCard from '../components/DashboardCard'; // Import DashboardCard
import { colors } from '../utils/constants'; // Import colors from centralized constants

function MRPPage({ onInternalNav }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <h1 className="text-4xl font-extrabold text-offWhite mb-8">MRP System</h1>
      <p className="text-lightGreen mb-6">Manage your materials, sales orders, and production processes here.</p>

      {/* Navigation within MRP System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <DashboardCard
            title="Materials Management"
            description="Add, edit, and view raw materials."
            icon="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-16.5-7.5h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Zm4.5 0h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Zm4.5 0h1.5a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75Z" 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="material_management" 
        />
        <DashboardCard
            title="Sales Orders"
            description="View and process customer orders."
            icon="M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="sales_orders" 
            isPlaceholder={true} 
        />
        <DashboardCard
            title="Production Planning"
            description="Plan and track manufacturing batches."
            icon="M12 21a9 9 0 0 0 9-9c0-.73-.09-1.44-.26-2.12M15 15a3 3 0 0 1-3 3c-1.44 0-2.73-.56-3.75-1.47M3 11.25a9 9 0 0 1 18 0c0 .73-.09 1.44-.26 2.12M9 9a3 3 0 0 0 3-3c1.44 0 2.73.56 3.75 1.47M4.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75H4.5ZM19.5 7.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-.75ZM9 15.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6Z"
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
            link="production_planning" 
            isPlaceholder={true} 
        />
        {/* NEW: Instant Quote App card added to MRP Page */}
        <DashboardCard
            id="mrp-instant-quote"
            title="Instant Quote App"
            description="Generate real-time bespoke canvas quotes."
            icon="M12 6v12m-3-2.25 3 3 3-3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" // Dollar sign icon
            link="instant_quote_app" // Internal link within the dashboard
            isPlaceholder={false} 
            cardBgColor={colors.darkGreen}
            iconBgColor={colors.mediumGreen}
            textColor={colors.offWhite}
            descColor={colors.lightGreen}
            onInternalNav={onInternalNav}
        />
      </div>

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

export default MRPPage;