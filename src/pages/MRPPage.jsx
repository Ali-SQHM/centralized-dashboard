// src/pages/MRPPage.jsx
// This component displays the MRP & Production Planning interface.
// Updates:
// - **FINAL LAYOUT FIX:** Removed `min-h-screen`, `flex`, `items-center`, `justify-center`
//   from the outermost div to prevent "excessive padding" when nested in the dashboard.
//   The page now correctly expands `w-full` and `h-full` within its parent.
// - Placeholder content for MRP data and cards.

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore'; // Assuming Firestore for MRP data
import { colors } from '../utils/constants';

function MRPPage({ db, firestoreAppId }) {
  const [productionPlans, setProductionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dummy data for now - replace with actual Firestore fetch later
  useEffect(() => {
    setLoading(true);
    // In a real app, you'd fetch from Firestore:
    // const mrpColRef = collection(db, `artifacts/${firestoreAppId}/public/data/mrpPlans`);
    // const q = query(mrpColRef);
    // const unsubscribe = onSnapshot(q, (snapshot) => {
    //   const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setProductionPlans(fetchedPlans);
    //   setLoading(false);
    //   setError(null);
    // }, (err) => {
    //   console.error("MRPPage: Error fetching MRP plans:", err);
    //   setError(`Failed to load MRP plans: ${err.message}`);
    //   setLoading(false);
    // });
    // return () => unsubscribe();

    setTimeout(() => {
      setProductionPlans([
        { id: 'plan1', orderId: 'SO-001', product: '100x80 Canvas', status: 'Pending Materials', dueDate: '2025-07-20', quantity: 5 },
        { id: 'plan2', orderId: 'SO-002', product: '60cm Round Panel', status: 'In Progress', dueDate: '2025-07-25', quantity: 2 },
        { id: 'plan3', orderId: 'SO-003', product: 'Tray Frame 50x50', status: 'Ready for Assembly', dueDate: '2025-07-18', quantity: 3 },
        { id: 'plan4', orderId: 'SO-004', product: '200x150 Canvas', status: 'Awaiting Fabric', dueDate: '2025-08-01', quantity: 1 },
      ]);
      setLoading(false);
      setError(null);
    }, 1000); // Simulate loading
  }, [db, firestoreAppId]);


  return (
    // Removed `min-h-screen`, `flex`, `items-center`, `justify-center`.
    // The dashboard's main content area will now correctly manage this page's layout.
    // `w-full h-full p-4 bg-darkGray rounded-xl shadow-md text-offWhite flex flex-col` remains.
      // Main container for Material Management page content.
        // This div uses w-full and min-w-0 to correctly fill the parent dashboard's content area.
        <div className="w-full h-full flex flex-col min-w-0 text-offWhite">
          <h1 className="text-4xl font-extrabold text-blue-400 mb-8" style={{ color: colors.blue[400] }}>Materials Management</h1>
          <p className="text-gray-300 mb-6">Manage your raw material inventory. Add, edit, and delete materials. These materials will be accessible to the Instant Quote App.</p>
    
          {error && (
            <div className="bg-red-700 text-white p-4 rounded-md mb-4">
              <p>Error: {error}</p>
            </div>
          )}
      <h2 className="text-2xl font-bold mb-6 text-center">MRP & Production Planning</h2>

      {loading && <p className="text-lightGreen text-center">Loading MRP data...</p>}
      {error && <p className="text-red-400 text-center">Error: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow overflow-y-auto">
          {/* Production Overview Card */}
          <div className="bg-mediumGreen p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: colors.accentGold }}>Production Schedule Summary</h3>
              <p className="text-lg">Total Active Plans: <span className="font-bold">{productionPlans.length}</span></p>
              <p className="text-lg mt-1">Orders Due This Week: <span className="font-bold">{productionPlans.filter(p => new Date(p.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 7))).length}</span></p>
              <p className="text-sm text-gray-300 mt-3">Monitor upcoming deadlines and plan resource allocation.</p>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors self-start">
              View Schedule
            </button>
          </div>

          {/* Material Requirements Planning (MRP) Card */}
          <div className="bg-mediumGreen p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: colors.accentGold }}>Material Requirements</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Canvas 12oz: <span className="font-bold text-red-400">Need 100sqm</span></li>
                <li>Pine Stretcher Bar: <span className="font-bold text-orange-400">Low, check stock</span></li>
                <li>(Detailed list of materials needed for current plans)</li>
              </ul>
              <p className="text-sm text-gray-300 mt-3">Identify material shortages and generate purchase orders.</p>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors self-start">
              Generate POs
            </button>
          </div>

          {/* Capacity Planning (Placeholder Card) */}
          <div className="bg-mediumGreen p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: colors.accentGold }}>Capacity Planning</h3>
              <p className="text-lg">Next 7 Days: <span className="font-bold">85% Utilized</span></p>
              <p className="text-lg mt-1">Overdue Tasks: <span className="font-bold text-red-400">2</span></p>
              <p className="text-sm text-gray-300 mt-3">Assess workload and allocate tasks to production stations.</p>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors self-start">
              Adjust Workload
            </button>
          </div>

          {/* Detailed Production Plans Table (Placeholder) */}
          <div className="md:col-span-full bg-mediumGreen p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.accentGold }}>Detailed Production Plans (Table Placeholder)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-darkGray text-offWhite text-sm uppercase tracking-wider">
                    <th className="p-3 rounded-tl-lg">Order ID</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-tr-lg">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {productionPlans.map((plan, index) => (
                    <tr key={plan.id} className={`${index % 2 === 0 ? 'bg-mediumGreen' : 'bg-darkGray'} border-b border-gray-600`}>
                      <td className="p-3">{plan.orderId}</td>
                      <td className="p-3">{plan.product}</td>
                      <td className="p-3">{plan.quantity}</td>
                      <td className="p-3">{plan.status}</td>
                      <td className="p-3">{plan.dueDate}</td>
                    </tr>
                  ))}
                  {productionPlans.length === 0 && (
                     <tr>
                       <td colSpan="5" className="p-3 text-center text-gray-400">No production plans to display.</td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {productionPlans.length === 0 && !loading && !error && (
        <p className="text-gray-400 text-center mt-8">No production plans found. Add plans to get started.</p>
      )}
    </div>
  );
}

export default MRPPage;