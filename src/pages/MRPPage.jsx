// src/pages/MRPPage.jsx
// This component will manage the Material Requirements Planning (MRP) system,
// focusing on processing "Paid" orders for standard products using their SKUs as dynamic BOMs.
// It will eventually generate batched production lists and material requisitions.
//
// Updates:
// 1. CRITICAL RESPONSIVENESS FIX: Added `table-fixed` to the `<table>` element and
//    `w-full` to ensure it takes 100% of its scrollable container.
// 2. Added explicit width classes (`w-1/X` or `min-w-[YYpx]`) to `<th>` elements
//    to guide `table-fixed` behavior and guarantee content overflow for scrollbars.
// 3. Ensured `min-w-0` is consistently applied to all necessary flex containers and cards.
// 4. All styling (colors, rounding, inputs, etc.) remains consistent.

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { colors } from '../utils/constants'; // Ensure colors are imported for consistent styling

function MRPPage({ db, firestoreAppId }) {
  const [paidStandardOrders, setPaidStandardOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get the public orders collection reference
  const getPublicOrdersCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for collection reference in MRPPage.");
      return null;
    }
    // As per blueprint, orders are in artifacts/{appId}/public/data/orders
    return collection(db, `artifacts/${firestoreAppId}/public/data/orders`);
  };

  useEffect(() => {
    if (!db || !firestoreAppId) {
      console.log("MRP: Skipping data fetch: DB or firestoreAppId not ready.");
      return;
    }

    const ordersColRef = getPublicOrdersCollectionRef();
    if (!ordersColRef) {
      setError("Firestore orders collection reference could not be established. Check Firebase DB connection or app ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query for 'Paid' orders that are also 'quote-converted' or 'manual' and are standard products (have an SKU).
    const q = query(
      ordersColRef,
      where('status', '==', 'Paid'),
      where('lineItems.0.sku', '!=', '') // Assuming SKU presence means it's a standard product
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(order => order.lineItems && order.lineItems[0] && order.lineItems[0].sku); // Filter client-side just in case
      setPaidStandardOrders(ordersList);
      setLoading(false);
      setError(null);
      console.log("MRP: Paid Standard Orders fetched successfully:", ordersList);
    }, (err) => {
      console.error("Error fetching paid standard orders for MRP:", err);
      setError(`Failed to load paid orders: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/{your_app_id}/public/data/orders.`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId]);

  const handleRunMRP = () => {
    // This is a placeholder for the MRP calculation logic.
    // In Phase 3, this will process paidStandardOrders to generate
    // material requirements and production lists.
    console.log("Running MRP for:", paidStandardOrders);
    alert("MRP calculation triggered! (Functionality to be implemented in Phase 3)"); // Use a custom modal in final app
  };

  return (
    // Main container for MRP Page content.
    <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl w-full flex flex-col min-w-0">
      {/* Page Title - following blueprint: text-blue-400, font-extrabold */}
      <h1 className="text-4xl font-extrabold text-blue-400 mb-8">MRP System</h1>
      <p className="text-gray-300 mb-6">
        This system processes "Paid" orders for standard products to determine raw material requirements and generate production schedules.
        Bespoke services will not be included in these automated calculations.
      </p>

      {/* Card for triggering MRP and displaying status */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">MRP Run & Overview</h2>
        {loading && <p className="text-gray-400">Loading relevant orders...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <p className="text-gray-300 mb-4">
              Found {paidStandardOrders.length} "Paid" standard product orders ready for MRP processing.
            </p>
            <button
              onClick={handleRunMRP}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              Run MRP Calculation
            </button>
            <p className="text-gray-400 mt-4 text-sm">
              *Full MRP calculation and detailed output lists will be implemented in Phase 3.
            </p>
          </>
        )}
      </div>

      {/* Card for listing relevant "Paid" Standard Product Orders */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Relevant Paid Orders (for MRP)</h2>
        {loading && <p className="text-gray-400">Loading orders...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && paidStandardOrders.length === 0 && (
          <p className="text-gray-300">No "Paid" standard product orders found to display for MRP.</p>
        )}
        {!loading && !error && paidStandardOrders.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-700 min-w-0">
            <table className="table-fixed w-full divide-y divide-gray-700"> {/* Added table-fixed and w-full */}
              <thead>
                <tr>
                  {/* Apply widths to columns. Adjust these as needed for your data. */}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 rounded-tl-xl whitespace-nowrap w-[100px]">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap w-[150px]">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap w-[150px]">Product SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap w-[70px]">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 rounded-tr-xl whitespace-nowrap w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody className="bg-mediumGreen divide-y divide-gray-700">
                {paidStandardOrders.map(order => (
                  <tr key={order.id} className="hover:bg-lightGreen transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{order.orderId || order.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{order.customerInfo?.name || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{order.lineItems?.[0]?.sku || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{order.lineItems?.[0]?.quantity || 1}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-300">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placeholder Card for MRP Output (Production Lists, Material Requisitions) */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">MRP Output: Production & Material Lists</h2>
        <p className="text-gray-300">
          This section will display batched production lists (e.g., Profile Cutting Schedule, Fabric Cutting List)
          and aggregated material requisitions based on the MRP calculation.
        </p>
        <div className="mt-4 p-4 bg-darkGray rounded-xl border border-gray-700 text-gray-400 text-sm italic">
          Example:
          <p className="mt-2">- Profile Cutting Schedule: Aggregated dimensions for all "CAN" orders.</p>
          <p>- Fabric Cutting List: Total fabric requirements for "PAN" orders.</p>
          <p>- Material Requisition: Consolidated list of all raw materials needed across all relevant orders.</p>
        </div>
      </div>
    </div>
  );
}

export default MRPPage;
