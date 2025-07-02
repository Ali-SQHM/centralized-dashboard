// src/components/StockLevelChart.jsx
// This component visualizes material stock levels against their reorder points
// using Recharts. It now includes refinements for rendering and visibility.

import React, { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { colors } from '../utils/constants'; // Import color constants

function StockLevelChart({ data }) {
  const chartData = Array.isArray(data) ? data : [];

  // --- DEBUGGING LOGS (keep for now) ---
  useEffect(() => {
    console.log("StockLevelChart: Received data prop:", data);
    console.log("StockLevelChart: Prepared chartData:", chartData);

    if (chartData.length > 0) {
      chartData.forEach((entry, index) => {
        const currentStock = entry['Current Stock'];
        const minStock = entry['Min Stock'];
        console.log(`StockLevelChart: Entry ${index} (${entry.name}): Current Stock = ${currentStock}, Min Stock = ${minStock}`);
        if (isNaN(Number(currentStock)) || isNaN(Number(minStock))) {
          console.warn(`StockLevelChart: Entry ${index} has non-numeric stock values! Current: ${currentStock}, Min: ${minStock}`);
        }
      });
    } else {
      console.log("StockLevelChart: chartData is empty, no bars will be rendered.");
    }
  }, [chartData, data]);
  // --- END DEBUGGING LOGS ---

  // Determine Y-axis domain dynamically to ensure all bars are visible
  const allStockValues = chartData.flatMap(entry => [Number(entry['Current Stock']), Number(entry['Min Stock'])])
                                  .filter(val => !isNaN(val));

  let minY = allStockValues.length > 0 ? Math.min(...allStockValues) : 0;
  let maxY = allStockValues.length > 0 ? Math.max(...allStockValues) : 100; // Default max to 100 if no data

  // Adjust domain to ensure visibility, especially for small or zero values
  if (minY === 0 && maxY === 0) {
      maxY = 10; // If all values are zero, show a small range
  } else if (minY === maxY) { // If all values are the same non-zero value
      minY = Math.max(0, minY * 0.9);
      maxY = maxY * 1.1;
  } else {
      // Add some padding to the Y-axis domain for general cases
      minY = Math.floor(minY * 0.9);
      maxY = Math.ceil(maxY * 1.1);
  }

  // Ensure min is always less than max
  if (minY >= maxY) {
      minY = 0; // Fallback
      maxY = Math.max(100, maxY + 10); // Ensure max is at least 100 or 10 more than current max
  }

  const yAxisDomain = [minY, maxY];
  console.log("StockLevelChart: Calculated Y-Axis Domain:", yAxisDomain);


  return (
    <div className="w-full h-80 bg-deepGray p-4 rounded-xl shadow-inner">
      <h4 className="text-xl font-semibold mb-4 text-accentGold text-center">Material Stock Levels (PUOM)</h4>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No material data available to display chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[700]} />
            <XAxis dataKey="name" stroke={colors.offWhite} tick={{ fill: colors.offWhite, fontSize: 12 }} />
            {/* Dynamically set YAxis domain */}
            <YAxis stroke={colors.offWhite} tick={{ fill: colors.offWhite, fontSize: 12 }} domain={yAxisDomain} />
            <Tooltip
              contentStyle={{ backgroundColor: colors.darkGray, borderColor: colors.gray[600], borderRadius: '8px' }}
              labelStyle={{ color: colors.accentGold }}
              itemStyle={{ color: colors.gray[300] }}
            />
            <Legend wrapperStyle={{ color: colors.offWhite, paddingTop: '10px' }} />

            {/* Bar for Current Stock (PUOM) with conditional coloring */}
            {/* dataKey must exactly match the key in the chartData objects */}
            <Bar dataKey="Current Stock" name="Current Stock (PUOM)" maxBarSize={50} minBarSize={1}> {/* Added minBarSize */}
                {
                    chartData.map((entry, index) => {
                        // Accessing values using bracket notation for keys with spaces
                        const numericCurrentStock = Number(entry['Current Stock']);
                        const numericMinStock = Number(entry['Min Stock']);
                        const barFill = (
                            !isNaN(numericCurrentStock) &&
                            !isNaN(numericMinStock) &&
                            numericCurrentStock <= numericMinStock
                        ) ? colors.red[400] : colors.lightGreen;
                        return <Cell key={`cell-${index}`} fill={barFill} />;
                    })
                }
            </Bar>

            {/* Dashed Reference Line for Min Stock (PUOM) */}
            {/* Ensure the y value is correctly calculated and the key matches */}
            {chartData.some(d => d['Min Stock'] !== undefined && d['Min Stock'] !== null && !isNaN(Number(d['Min Stock']))) && (
                <ReferenceLine
                    y={Math.min(...chartData.map(d => Number(d['Min Stock'])).filter(val => val !== undefined && val !== null && !isNaN(val)))}
                    stroke={colors.blue[400]}
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Min Stock', fill: colors.blue[400] }}
                />
            )}

          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default StockLevelChart;