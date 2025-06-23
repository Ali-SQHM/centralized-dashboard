// src/components/StockLevelChart.jsx
// Displays a bar chart of material stock levels, filterable by material type.

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
    <div className="bg-mediumGreen p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-offWhite mb-4">Stock Levels Overview (in Purchase Units)</h2>
      <div className="mb-4">
        <label htmlFor="chartMaterialTypeFilter" className="block text-offWhite text-sm font-bold mb-1">Filter by Material Type:</label>
        <select
          id="chartMaterialTypeFilter"
          value={selectedMaterialType}
          onChange={(e) => setSelectedMaterialType(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen bg-white/10"
        >
          <option value="" className="text-deepGray bg-offWhite">All Types</option>
          {materialTypes.slice(1).map(type => ( // Slice to skip the initial empty option
            <option key={type} value={type} className="text-deepGray bg-offWhite">{type}</option>
          ))}
        </select>
      </div>

      {filteredChartMaterials.length === 0 ? (
        <p className="text-offWhite/70">No materials to display for the selected type or no materials added yet.</p>
      ) : (
        <div className="flex items-end justify-start h-64 overflow-x-auto p-2 border border-lightGreen rounded-lg bg-white/5">
          {filteredChartMaterials.map((material, index) => {
            const barHeight = (material.currentStockPUOM / maxStock) * 100; // Percentage of max height
            const minStockHeight = (material.minStockPUOM / maxStock) * 100; // Percentage of max height
            const isBelowMin = material.currentStockPUOM < material.minStockPUOM;

            return (
              <div key={material.id} className="relative mx-1 h-full flex flex-col justify-end items-center" style={{ minWidth: '60px', flexShrink: 0 }}>
                {/* Min Stock Line */}
                {material.minStockPUOM > 0 && (
                  <div
                    className="absolute w-full border-b-2 border-dashed"
                    style={{
                      bottom: `${minStockHeight}%`,
                      borderColor: colors.accentGold,
                      zIndex: 10,
                    }}
                  ></div>
                )}
                
                {/* Current Stock Bar */}
                <div
                  className={`w-4/5 rounded-t-sm transition-all duration-300 relative`}
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: isBelowMin ? '#EF4444' : colors.lightGreen, // Red for below min, lightGreen otherwise
                    zIndex: 5,
                  }}
                  title={`Code: ${material.code}\nStock: ${material.currentStockPUOM} ${material.puom}\nMin: ${material.minStockPUOM} ${material.puom}`}
                >
                  <span className="absolute -top-6 text-xs text-offWhite" style={{ left: '50%', transform: 'translateX(-50%)' }}>
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