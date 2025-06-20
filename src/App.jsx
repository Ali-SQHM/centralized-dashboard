import React from 'react';

// Main App component for the Centralized Operations Dashboard
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex flex-col items-center justify-center p-4 sm:p-8 font-['Poppins']">
      {/* Dashboard Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-900 mb-2">
          HM Canvases & Alliem Art
        </h1>
        <p className="text-xl sm:text-2xl text-emerald-700 font-semibold">
          Operations Dashboard
        </p>
        <p className="text-gray-700 mt-2 text-base sm:text-lg">
          Your centralized hub for all business tools.
        </p>
      </header>

      {/* Dashboard Grid for Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">

        {/* Google Workspace Section */}
        <div className="col-span-full text-center text-xl sm:text-2xl font-bold text-emerald-800 mb-4 mt-6">
          Google Workspace
        </div>

        {/* Gmail Card */}
        <DashboardCard
          title="Gmail"
          description="Manage all your business emails."
          icon="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75M21.75 6.75a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6.75m18.75 0v2.625a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75m18.75 0a3.75 3.75 0 0 0-3.75-3.75H9.75a3.75 3.75 0 0 0-3.75 3.75m6.75 0a5.25 5.25 0 0 0-5.25 5.25v2.25m-3.75 7.5v-2.25m11.25 7.5v-2.25m-6.75 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" // Icon path for envelope
          link="https://mail.google.com/"
        />

        {/* Google Chat Card */}
        <DashboardCard
          title="Google Chat"
          description="Collaborate on tasks and projects."
          icon="M20.25 8.515 17.5 10.758V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h11.75a1.5 1.5 0 0 0 1.5-1.5V13.5l3.75 2.25V8.515ZM12 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12.75a.75.75 0 0 1-.75-.75V7.5ZM6.75 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V7.5Zm3 7.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H10.5a.75.75 0 0 1-.75-.75V15Z" // Icon path for chat bubble
          link="https://chat.google.com/"
        />

        {/* Google Drive Card */}
        <DashboardCard
          title="Google Drive"
          description="Access all your shared business files."
          icon="M13.5 6.75L12 9.75m-3.75-5.25L3 7.5m1.5 4.5l4.5 4.5m4.5-12.75l4.5 4.5M12 18.75l3-3.75m-3-6l2.25 2.25M6.75 15l-3 3.75m15-3.75l-3 3.75m-9.75-9.75l3 3.75M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" // Icon path for cloud/drive
          link="https://drive.google.com/"
        />

        {/* Financial Tracker Google Sheet Card */}
        <DashboardCard
          title="Financial Operations Tracker"
          description="Your centralized sheet for cash flow, costs & transfers."
          icon="M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" // Icon path for spreadsheet
          link="#" // Placeholder, will be updated with actual Google Sheet URL later
          isPlaceholder={true}
        />

        {/* Business Platforms Section */}
        <div className="col-span-full text-center text-xl sm:text-2xl font-bold text-emerald-800 mb-4 mt-6">
          Business Platforms
        </div>

        {/* Wix Dashboard Card */}
        <DashboardCard
          title="Wix Dashboard"
          description="Manage your website, orders, and CRM."
          icon="M19.5 12h-2.625a2.25 2.25 0 0 1-2.25-2.25V7.5m-18.75 4.5H5.25a2.25 2.25 0 0 0 2.25-2.25V7.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM1.5 12H5.25m-.75 7.5V12m14.25 4.5v-4.5m10.5 0H21a.75.75 0 0 0-.75-.75m-18 0v-2.25A2.25 2.25 0 0 1 3.75 6a2.25 2.25 0 0 1 2.25 2.25v.75m.75-3.75v.75m0 3.75h-.75M12 10.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" // Icon path for website/dashboard
          link="https://manage.wix.com/"
        />

        {/* Custom Application Section */}
        <div className="col-span-full text-center text-xl sm:text-2xl font-bold text-emerald-800 mb-4 mt-6">
          Custom Applications
        </div>

        {/* ERP/MRP System Card (Placeholder) */}
        <DashboardCard
          title="ERP/MRP System"
          description="Automate manufacturing costs & inventory."
          icon="M19.5 14.25v-2.625A3.375 3.375 0 0 0 16.125 8.25H15V6h3.75a3.375 3.375 0 0 1 3.375 3.375v2.625a3.375 3.375 0 0 1-3.375 3.375H15a2.25 2.25 0 0 1-2.25-2.25V10.5a2.25 2.25 0 0 1 2.25-2.25h1.125A2.25 2.25 0 0 1 18 10.5v1.125m-6.75-9.375a9 9 0 1 1-9 9m9-9a9 9 0 0 0-9 9m.375 1.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" // Generic cog/system icon
          link="#" // Placeholder, will be updated with actual ERP app URL later
          isPlaceholder={true}
        />

        {/* AI-Powered Social Media Content Hub Card (Placeholder) */}
        <DashboardCard
          title="AI Social Media Hub"
          description="Generate content & manage social media."
          icon="M18 1.5c2.982 0 5.467 2.225 5.953 5.176c-.453-.162-.93-.264-1.428-.314l-.078.002a2.895 2.895 0 0 0-2.316 2.684v1.5a.75.75 0 0 0 1.5 0v-1.5a1.395 1.395 0 0 1 1.117-1.295c.787-.139 1.487.054 1.838.411A.75.75 0 0 0 21 8.25c0 .385-.205.702-.505.882c-2.485 1.405-5.337 1.947-8.25 1.947c-3.153 0-6.195-.716-8.25-1.947C3.205 8.952 3 8.635 3 8.25a.75.75 0 0 0 .505-.882c.351-.357 1.051-.55 1.838-.411a1.395 1.395 0 0 1 1.117 1.295v1.5a.75.75 0 0 0 1.5 0v-1.5A2.895 2.895 0 0 0 4.047 6.676C4.533 3.725 7.018 1.5 10 1.5h8Zm-9 6a3 3 0 0 0-3 3v2.25a.75.75 0 0 0 1.5 0v-2.25a1.5 1.5 0 0 1 1.5-1.5H12a1.5 1.5 0 0 1 1.5 1.5v2.25a.75.75 0 0 0 1.5 0v-2.25a3 3 0 0 0-3-3h-2Z" // Icon path for a lightbulb/idea
          link="#" // Placeholder, will be updated with actual AI Hub app URL later
          isPlaceholder={true}
        />

      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-700 text-sm">
        <p>&copy; {new Date().getFullYear()} HM Canvases Ltd. All rights reserved.</p>
        <p>Powered by Google Workspace & Firebase</p>
      </footer>
    </div>
  );
}

// DashboardCard Component for reusable UI
function DashboardCard({ title, description, icon, link, isPlaceholder = false }) {
  const PlaceholderBadge = () => (
    <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
      Coming Soon
    </span>
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
        ${isPlaceholder ? 'opacity-80 cursor-not-allowed' : ''}
      `}
      onClick={(e) => isPlaceholder && e.preventDefault()} // Prevent click for placeholders
    >
      {isPlaceholder && <PlaceholderBadge />}
      {/* Icon (using inline SVG for simplicity and consistency with Tailwind) */}
      <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 text-emerald-600">
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
      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">{title}</h3>
      <p className="text-gray-600 text-center text-sm">{description}</p>
    </a>
  );
}

export default App; // Export the main App component as default