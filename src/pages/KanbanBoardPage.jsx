// src/pages/KanbanBoardPage.jsx
// This component provides an initial Kanban board layout for production.
// It features columns for different order/production statuses.
// In future iterations, this will be populated with data from sales orders
// and potentially allow drag-and-drop functionality to change order status.

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore'; // Assuming Firestore will be used for orders
import { colors } from '../utils/constants';

function KanbanBoardPage({ db, firestoreAppId, currentUser }) {
  // State to hold production orders (currently just a placeholder)
  const [productionOrders, setProductionOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);

  // Define Kanban columns/statuses
  const kanbanColumns = [
    { id: 'new_order', title: 'New Orders', bgColor: colors.mediumGreen },
    { id: 'in_production', title: 'In Production', bgColor: '#4CAF50' }, // Green
    { id: 'quality_check', title: 'Quality Check', bgColor: '#FFC107' }, // Amber
    { id: 'packaging', title: 'Packaging', bgColor: '#2196F3' }, // Blue
    { id: 'shipped', title: 'Shipped', bgColor: '#9E9E9E' }, // Gray
    { id: 'completed', title: 'Completed', bgColor: colors.darkGreen } // Darker green
  ];

  // Placeholder for fetching production orders
  useEffect(() => {
    // In a real application, you would fetch sales orders from Firestore
    // and filter/map them into production orders for the Kanban board.
    // For now, we'll simulate loading.
    setLoadingOrders(true);
    const fetchDummyOrders = () => {
      // Simulate an API call
      setTimeout(() => {
        setProductionOrders([]); // Start empty for now, will add real data later
        setLoadingOrders(false);
        setErrorOrders(null);
        console.log("KanbanBoardPage: Dummy orders fetched. Ready for real data.");
      }, 1000); // Simulate 1 second loading time
    };

    // If Firestore is available, you could set up a real-time listener here
    // Example (commented out for now, to be activated when real order data is used):
    /*
    if (db && firestoreAppId) {
      const ordersCollectionRef = collection(db, `artifacts/${firestoreAppId}/public/data/salesOrders`);
      const q = query(ordersCollectionRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductionOrders(fetchedOrders);
        setLoadingOrders(false);
        setErrorOrders(null);
        console.log("KanbanBoardPage: Real-time sales orders fetched:", fetchedOrders.length);
      }, (err) => {
        console.error("KanbanBoardPage: Error fetching sales orders:", err);
        setErrorOrders(`Failed to load sales orders: ${err.message}`);
        setLoadingOrders(false);
      });
      return () => unsubscribe();
    }
    */

    fetchDummyOrders(); // Call dummy fetch for now
  }, [db, firestoreAppId]); // Include db and firestoreAppId in dependencies for future real-time fetch

  return (
    <div className="w-full h-full flex flex-col min-w-0 text-offWhite">
      <h2 className="text-3xl font-bold text-offWhite mb-6 text-center">Production Kanban Board</h2>

      {loadingOrders && <p className="text-lightGreen text-center">Loading production data...</p>}
      {errorOrders && <p className="text-red-400 text-center">Error: {errorOrders}</p>}

      {!loadingOrders && !errorOrders && (
        <div className="flex flex-col md:flex-row flex-grow overflow-x-auto gap-4 py-2">
          {kanbanColumns.map(column => (
            <div
              key={column.id}
              className="flex-shrink-0 w-full md:w-1/4 lg:w-1/5 xl:w-1/6 bg-mediumGreen rounded-lg shadow-md p-4 flex flex-col"
              style={{ minWidth: '280px' }} // Minimum width for columns
            >
              <h3 className="text-xl font-semibold mb-4 text-offWhite border-b pb-2" style={{ borderColor: column.bgColor }}>
                {column.title} ({productionOrders.filter(order => order.status === column.id).length})
              </h3>
              <div className="flex-grow space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}> {/* Adjust max-height based on overall layout */}
                {/* Placeholder for Kanban Cards */}
                {productionOrders.filter(order => order.status === column.id).length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No orders in this stage.</p>
                ) : (
                  // In a future step, map actual order data here
                  <div className="bg-darkGray p-3 rounded-md text-offWhite text-sm shadow">
                    Placeholder Card for {column.title}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-gray-400 text-xs mt-4 text-center">This is a basic Kanban board. Order data will be displayed here in a future update.</p>
    </div>
  );
}

export default KanbanBoardPage;