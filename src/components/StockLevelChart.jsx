// src/components/StockLevelChart.jsx
// Displays a bar chart of material stock levels, filterable by material type.
//
// Updates:
// 1. CRITICAL RESPONSIVENESS FIX: Simplified the inner chart bars container.
//    Removed 'w-fit' and 'min-w-full' from the inner div to allow 'overflow-x-auto'
//    to function more naturally. The individual bars' `min-width` and `flex-shrink-0`
//    should force the container to overflow if content exceeds parent width.
// 2. All styling (colors, rounding, inputs, etc.) and other fixes remain.

import React, { useState } from 'react';
import { colors, materialTypes } from '../utils/constants'; // Import constants

function StockLevelChart({ materials }) { // 'materials' prop received from MaterialManagementPage
  const [selectedMaterialType, setSelectedMaterialType] = useState('');

  const filteredChartMaterials = materials.filter(material => {
    return selectedMaterialType === '' || material.materialType === selectedMaterialType;
  });

  // Calculate max stock for scaling the chart, considering both current and min stock (in PUOM) for better scaling
  const maxStock = Math.max(
    ...filteredChartMaterials.map(m => Math.max(m.currentStockPUOM || 0, m.minStockPUOM || 0)),
    1 // Ensure at least 1 to avoid division by zero if all stocks are zero
  );

  return (
    // Main container for the chart component itself (this is the "card" for the chart)
    // Should be bg-mediumGreen, consistent with other content cards.
    <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-offWhite mb-4">Stock Levels Overview (in Purchase Units)</h2>
      <div className="mb-4">
        <label htmlFor="chartMaterialTypeFilter" className="block text-offWhite text-sm font-bold mb-1">Filter by Material Type:</label>
        <select
          id="chartMaterialTypeFilter"
          value={selectedMaterialType}
          onChange={(e) => setSelectedMaterialType(e.target.value)}
          // Input styling: bg-white, text-deepGray, border-lightGreen, focus:ring-lightGreen, rounded-xl
          className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200"
        >
          <option value="" className="bg-white text-deepGray">All Types</option>
          {/* Meticulously re-typed to eliminate hidden characters and ensure proper JSX structure */}
          {materialTypes.map(type => (
            <option key={type} value={type} className="bg-white text-deepGray">{type}</option>
          ))}
        </select>
      </div>

      {filteredChartMaterials.length === 0 ? (
        <p className="text-offWhite/70">No materials to display for the selected type or no materials added yet.</p>
      ) : (
        // Inner container for the chart bars. This div needs to correctly trigger horizontal scroll.
        // `flex-nowrap` ensures items don't wrap, forcing overflow.
        // `overflow-x-auto` is the key for the scrollbar.
        // `min-w-0` is added to ensure flex context allows shrinking if needed.
        <div
          className="flex flex-nowrap items-end h-64 overflow-x-auto p-2 border border-lightGreen rounded-xl bg-deepGray min-w-0" // ADDED min-w-0, REMOVED w-fit and min-w-full
        >
          {filteredChartMaterials.map((material, index) => {
            const barHeight = (material.currentStockPUOM / maxStock) * 100; // Percentage of max height
            const minStockHeight = (material.minStockPUOM / maxStock) * 100; // Percentage of max height
            const isBelowMin = material.currentStockPUOM < material.minStockPUOM;

            return (
              // Individual bar container - minWidth ensures bars don't shrink too much.
              // `flex-shrink-0` ensures it doesn't shrink below its min-width.
              <div
                key={material.id}
                className="relative mx-1 h-full flex flex-col justify-end items-center flex-shrink-0"
                style={{ minWidth: '60px' }} // Explicit min-width for each bar is important for bar readability
              >
                {/* Min Stock Line */}
                {material.minStockPUOM > 0 && (
                  <div
                    className="absolute w-full border-b-2 border-dashed"
                    style={{
                      bottom: `${minStockHeight}%`,
                      borderColor: colors.accentGold, // Accent gold for min stock line
                      zIndex: 10,
                    }}
                  ></div>
                )}

                {/* Current Stock Bar */}
                <div
                  className={`w-4/5 rounded-t-xl transition-all duration-300 relative`}
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: isBelowMin ? '#EF4444' : colors.lightGreen, // Used direct hex for red-500, lightGreen for good stock
                    zIndex: 5,
                  }}
                  title={`Code: ${material.code}\nStock: ${material.currentStockPUOM} ${material.puom}\nMin: ${material.minStockPUOM} ${material.puom}`}
                >
                  <span className="absolute -top-6 text-xs text-white" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                    {material.currentStockPUOM}
                  </span>
                </div>
                <span className="text-xs mt-1 text-offWhite text-center w-full truncate">{material.code}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StockLevelChart;