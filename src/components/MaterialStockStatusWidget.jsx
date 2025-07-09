// src/components/MaterialStockStatusWidget.jsx
// This component displays a list of materials that are currently at or below
// their minimum stock level. It fetches data from the Firestore 'materials'
// collection in real-time and filters it for display on the dashboard.

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { FaBoxesPacking, FaCircleExclamation } from 'react-icons/fa6'; // Icons for low stock and warning

function MaterialStockStatusWidget({ db, firestoreAppId }) {
  const [lowStockMaterials, setLowStockMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the Firestore collection reference to prevent unnecessary re-renders
  const materialsCollectionRef = useMemo(() => {
    if (db && firestoreAppId) {
      return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
    }
    return null;
  }, [db, firestoreAppId]);

  useEffect(() => {
    if (!materialsCollectionRef) {
      setError("Firestore materials collection reference not available.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(materialsCollectionRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMaterials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter for materials where current stock is at or below min stock
      const filtered = allMaterials.filter(material => {
        const current = parseFloat(material.currentStockPUOM) || 0;
        const min = parseFloat(material.minStockPUOM) || 0;
        return current <= min;
      });

      setLowStockMaterials(filtered);
      setLoading(false);
      console.log("MaterialStockStatusWidget: Low stock materials fetched:", filtered);
    }, (err) => {
      console.error("MaterialStockStatusWidget: Error fetching materials:", err);
      setError("Failed to load low stock materials: " + err.message);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [materialsCollectionRef]); // Dependency array includes the memoized ref

  return (
    <div className="bg-mediumGray p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex items-center mb-4">
        <FaBoxesPacking className="text-lightGreen text-2xl mr-3" />
        <h2 className="text-xl font-semibold text-offWhite">Low Stock Materials</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-full">
          <svg className="animate-spin h-8 w-8 text-lightGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-3 text-gray-400">Loading...</p>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-center py-4 flex items-center justify-center">
          <FaCircleExclamation className="mr-2" /> {error}
        </div>
      )}

      {!loading && !error && (
        lowStockMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
            <FaBoxesPacking className="text-5xl mb-3" />
            <p>All materials are currently above minimum stock levels. Great job!</p>
          </div>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-1">
            {lowStockMaterials.map(material => (
              <li key={material.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lightGreen">{material.code}</p>
                  <p className="text-sm text-gray-300">{material.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-400 font-bold">
                    Stock: {parseFloat(material.currentStockPUOM).toFixed(2)} {material.puom}
                  </p>
                  <p className="text-xs text-gray-400">
                    Min: {parseFloat(material.minStockPUOM).toFixed(2)} {material.puom}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export default MaterialStockStatusWidget;
