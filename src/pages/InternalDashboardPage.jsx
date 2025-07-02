     // src/pages/InternalDashboardPage.jsx
     import React from 'react';

     function InternalDashboardPage({ db, auth, user, firestoreAppId, navigateTo }) {
       return (
         <div className="flex flex-col items-center justify-center h-full bg-darkGray rounded-xl shadow-md p-6">
           <h2 className="text-3xl font-bold mb-4 text-lightGreen">Internal Dashboard (Under Construction)</h2>
           <p className="text-offWhite mb-4">Welcome, {user ? user.email || user.uid : 'Staff User'}!</p>
           <p className="text-gray-400 text-center">This is your secure internal dashboard. Use the sidebar to navigate to other staff-only sections.</p>
           <button
             onClick={() => navigateTo('instantQuote')}
             className="mt-6 bg-accentGold text-deepGray font-bold py-3 px-6 rounded-xl hover:bg-lightGreen transition duration-200 shadow-lg"
           >
             Go to Instant Quote
           </button>
         </div>
       );
     }

     export default InternalDashboardPage;