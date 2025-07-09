// src/components/StockLevelChart.jsx
// This component renders a bar chart using Recharts to visualize stock levels.
// It displays material codes on the X-axis and current stock in Purchase UOM on the Y-axis.
//
// Updates:
// 1. **TWEAK**: Changed X-axis data key from 'description' to 'code' to display material codes.
// 2. Added console logs for debugging data processing.
// 3. **CRITICAL FIX**: Implemented conditional bar coloring by pre-calculating the 'fillColor'
//    for each data entry and assigning it to a new property in the `chartData` array.
//    The <Bar> component now uses a custom `shape` to apply this pre-calculated color.
// 4. Ensured `minStockPUOM` and `puom` are correctly passed to the chart data.
// 5. **FIX**: Ensured Tooltip formatter correctly accesses `puom` from `payload.payload`.
// 6. **FIX**: Removed duplicate `dataKey` attribute from the <Bar> component.
// 7. **FIX**: Set the `fill` prop on the <Bar> component to a static color for the legend icon.

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function StockLevelChart({ data }) {
  console.log("StockLevelChart: Raw data prop received:", data, "Type:", typeof data, "Is Array:", Array.isArray(data));

  // Function to determine bar color based on stock levels
  const getBarColor = (currentStock, minStock) => {
    // Ensure values are numbers for comparison
    const current = parseFloat(currentStock) || 0;
    const min = parseFloat(minStock) || 0;
    return current <= min ? '#ef4444' : '#34d399'; // Tailwind red-500 vs lightGreen
  };

  // Ensure data is an array and each item has 'code', 'currentStockPUOM', 'minStockPUOM', and 'puom'
  // CRITICAL FIX: Pre-calculate fillColor for each data item
  const chartData = Array.isArray(data) ? data.map(item => {
    const currentStock = parseFloat(item.currentStockPUOM) || 0;
    const minStock = parseFloat(item.minStockPUOM) || 0;
    return {
      code: item.code || 'N/A', // Use code for X-axis label
      currentStockPUOM: currentStock, // Ensure it's a number
      minStockPUOM: minStock, // Ensure minStockPUOM is also a number
      puom: item.puom || '', // Include puom for tooltip formatter
      fillColor: getBarColor(currentStock, minStock), // Pre-calculated color
    };
  }).filter(item => item.currentStockPUOM >= 0) : []; // Filter out invalid stock values

  console.log("StockLevelChart: Processed chartData (after validation and mapping):", chartData, "Length:", chartData.length);

  // Determine Y-axis domain dynamically based on data
  const maxStock = Math.max(...chartData.map(item => item.currentStockPUOM));
  const yAxisDomain = [0, maxStock > 0 ? maxStock * 1.1 : 10]; // Add 10% buffer or default to 10 if max is 0

  console.log("StockLevelChart: Calculated Y-Axis Domain:", yAxisDomain);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No stock data available for the chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /> {/* Darker grid lines */}
        <XAxis
          dataKey="code" // Correctly uses 'code' for X-axis labels
          stroke="#cbd5e0" // Light gray for axis text
          angle={-45} // Angle for better readability of long codes
          textAnchor="end" // Anchor text to the end of the tick
          height={80} // Give more height for angled labels
          interval={0} // Show all labels
        />
        <YAxis
          stroke="#cbd5e0" // Light gray for axis text
          domain={yAxisDomain} // Dynamic domain
        />
        <Tooltip
          cursor={{ fill: '#4a5568', opacity: 0.5 }} // Darker tooltip background
          contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '8px' }} // Darker tooltip background
          labelStyle={{ color: '#a0aec0' }} // Light gray label text
          itemStyle={{ color: '#e2e8f0' }} // Off-white item text
          formatter={(value, name, props) => [`${value.toFixed(2)} ${props.payload.puom || ''}`, 'Stock']}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: '#cbd5e0' }} /> {/* Light gray legend text */}
        <Bar
          dataKey="currentStockPUOM" // This is the single, correct dataKey for bar height
          name="Current Stock (Purchase UOM)"
          fill="#34d399" // This fill color is for the LEGEND ICON ONLY
          // The actual bar color is determined by the custom shape
          shape={(props) => {
            const { x, y, width, height, fillColor } = props; // fillColor is passed from chartData
            return <rect x={x} y={y} width={width} height={height} fill={fillColor} rx={5} ry={5} />;
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default StockLevelChart;
