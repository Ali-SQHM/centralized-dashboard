// src/components/StockLevelChart.jsx
// This component visualizes material stock levels against their reorder points
// using Recharts. It is now fully aligned with the provided Firestore data structure.
//
// Updates:
// 1. **CRITICAL FIX**: Modified `chartData` processing to correctly map your
//    Firestore fields (`description`, `currentStockPUOM`, `minStockPUOM`)
//    to the properties expected by Recharts.
// 2. **CRITICAL FIX**: Updated `XAxis` `dataKey` to use `description`.
// 3. **CRITICAL FIX**: Updated `Bar` `dataKey` and `name` to use `currentStockPUOM`
//    and `minStockPUOM` directly.
// 4. **CRITICAL FIX**: Adjusted `ReferenceLine` to correctly use `minStockPUOM`.
// 5. Added more robust parsing for numerical values (`parseFloat`) to ensure
//    chart rendering is stable even with potentially mixed data types.
// 6. Retained all previous fixes for responsiveness, horizontal scrolling,
//    and error handling.

import React, { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell
} from 'recharts';
import { colors } from '../utils/constants';

function StockLevelChart({ data }) {
  console.log("StockLevelChart: Raw data prop received:", data, "Type:", typeof data, "Is Array:", Array.isArray(data));

  // Process data to match chart's expected format and ensure numerical values
  const chartData = Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null)
    ? data.map(item => ({
        name: item.description || item.code || 'Unknown Material', // Use description, fallback to code
        currentStockPUOM: parseFloat(item.currentStockPUOM) || 0, // Ensure it's a number, default to 0
        minStockPUOM: parseFloat(item.minStockPUOM) || 0, // Ensure it's a number, default to 0
      }))
    : [];

  console.log("StockLevelChart: Processed chartData (after validation and mapping):", chartData, "Length:", chartData.length);

  useEffect(() => {
    // Logs here for debugging if needed
  }, [chartData, data]);

  const allStockValues = [];
  chartData.forEach(entry => {
    // Use the mapped property names
    const current = entry.currentStockPUOM;
    const min = entry.minStockPUOM;
    if (!isNaN(current)) allStockValues.push(current);
    if (!isNaN(min)) allStockValues.push(min);
  });

  let minY = allStockValues.length > 0 ? Math.min(...allStockValues) : 0;
  let maxY = allStockValues.length > 0 ? Math.max(...allStockValues) : 100;

  if (minY === 0 && maxY === 0) {
    maxY = 10;
  } else if (minY === maxY) {
    minY = Math.max(0, minY * 0.9);
    maxY = maxY * 1.1;
  } else {
    minY = Math.floor(minY * 0.9);
    maxY = Math.ceil(maxY * 1.1);
  }

  // Ensure minY is not greater than maxY
  if (minY >= maxY) {
      minY = 0;
      maxY = Math.max(100, maxY + 10); // Ensure maxY is at least 100 or maxY + 10 if maxY was very small
  }

  const yAxisDomain = [minY, maxY];
  console.log("StockLevelChart: Calculated Y-Axis Domain:", yAxisDomain);

  const dynamicChartWidth = Math.max(
    600, // Minimum width for readability, ensures it's wider than default small screens
    chartData.length * 70 // Increased per bar width slightly for better label spacing
  );


  return (
    <div className="h-full w-full min-w-max">
      <h4 className="text-xl font-semibold mb-4 text-accentGold text-center">Material Stock Levels (PUOM)</h4>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No material data available to display chart.</p>
      ) : (
        <BarChart
          data={chartData}
          width={dynamicChartWidth}
          height={250}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[700]} />
          {/* CRITICAL FIX: dataKey now uses 'name' which is mapped from 'description' */}
          <XAxis dataKey="name" stroke={colors.offWhite} tick={{ fill: colors.offWhite, fontSize: 10, angle: -45, textAnchor: 'end' }} height={60} />
          <YAxis stroke={colors.offWhite} tick={{ fill: colors.offWhite, fontSize: 12 }} domain={yAxisDomain} />
          <Tooltip
            contentStyle={{ backgroundColor: colors.darkGray, borderColor: colors.gray[600], borderRadius: '8px' }}
            labelStyle={{ color: colors.accentGold }}
            itemStyle={{ color: colors.gray[300]} }
          />
          <Legend wrapperStyle={{ color: colors.offWhite, paddingTop: '10px' }} />

          {/* CRITICAL FIX: dataKey now uses 'currentStockPUOM' */}
          <Bar dataKey="currentStockPUOM" name="Current Stock (PUOM)" maxBarSize={50} minBarSize={1}>
              {
                  chartData.map((entry, index) => {
                      const numericCurrentStock = entry.currentStockPUOM; // Already parsed as number
                      const numericMinStock = entry.minStockPUOM; // Already parsed as number
                      const barFill = (
                          !isNaN(numericCurrentStock) &&
                          !isNaN(numericMinStock) &&
                          numericCurrentStock <= numericMinStock
                      ) ? colors.red[400] : colors.lightGreen;
                      return <Cell key={`cell-${index}`} fill={barFill} />;
                  })
              }
          </Bar>

          {/* CRITICAL FIX: ReferenceLine now uses 'minStockPUOM' */}
          {chartData.some(d => !isNaN(d.minStockPUOM)) && ( // Check if any minStockPUOM exists and is a number
              <ReferenceLine
                  y={Math.min(...chartData.map(d => d.minStockPUOM).filter(val => !isNaN(val)))}
                  stroke={colors.blue[400]}
                  strokeDasharray="3 3"
                  label={{ position: 'top', value: 'Min Stock', fill: colors.blue[400] }}
              />
          )}

        </BarChart>
      )}
    </div>
  );
}

export default StockLevelChart;
