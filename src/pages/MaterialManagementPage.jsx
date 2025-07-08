// src/pages/MaterialManagementPage.jsx
// This component manages the raw material inventory, now fully aligned with the
// provided Firestore data structure and integrated with constants from src/utils/constants.js.
// It allows users to add, edit, and delete material records, displays data
// in a table with correct headers, and calculates MUOM and total stock value.
//
// Updates:
// 1. **CRITICAL FIX**: Re-mapped all table headers and data cells to match
//    the user's Firestore data fields: 'code', 'description', 'puom', 'muom',
//    'mcp', 'pcp', 'materialType', 'salesDescription', 'supplier', 'lastUpdated'.
// 2. **CRITICAL FIX**: Updated `formInput` state and the Add/Edit modal form
//    to use the correct property names for material data.
// 3. **CRITICAL FIX**: Modified `calculateMUOM` to correctly use `currentStockPUOM`
//    and `unitConversionFactor` for MUOM display.
// 4. **CRITICAL FIX**: Updated `totalStockValue` calculation to use `mcp` (Material Cost Price).
// 5. Adjusted search functionality to search by 'code' or 'description'.
// 6. Adjusted sorting functionality to use new field names.
// 7. Retained all previous fixes for decimal precision, layout, responsiveness,
//    Firestore path (`artifacts/default-app-id/public/data/materials`), and error handling.
// 8. **NEW FIX**: Imported `commonUnits` and `materialTypes` from `src/utils/constants.js`.
// 9. **NEW FIX**: Populated the 'Primary UOM' (`puom`) and 'MUOM' (`muom`) select dropdowns
//    in the Add/Edit modal using `commonUnits`.
// 10. **NEW FIX**: Populated the 'Material Type' filter and the 'Material Type' select
//     in the Add/Edit modal using `materialTypes`.

import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import StockLevelChart from '../components/StockLevelChart'; // Ensure this path is correct
import ErrorBoundary from '../components/ErrorBoundary'; // Ensure this path is correct

// NEW: Import constants
import { commonUnits, materialTypes } from '../utils/constants';

function MaterialManagementPage({ db, userId, firestoreAppId }) {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formInput, setFormInput] = useState({
    code: '', // Corresponds to materialCode
    description: '', // Corresponds to name
    materialType: '', // New field
    puom: 'm', // Primary Unit of Measurement (was unitOfMeasurement)
    muom: 'cm', // Secondary Unit of Measurement (new field)
    mcp: 0, // Material Cost Price (was unitCost)
    pcp: 0, // Production Cost Price (was unitPrice)
    unitConversionFactor: 1,
    currentStockPUOM: 0,
    minStockPUOM: 0,
    salesDescription: '', // New field
    supplier: '', // New field
    // lastUpdated will be set automatically or on save
  });
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUOM, setFilterUOM] = useState('All'); // Filter by PUOM
  const [filterMaterialType, setFilterMaterialType] = useState('All'); // New filter for materialType
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Firestore collection path (confirmed as public data)
  const materialsCollectionRef = collection(db, `artifacts/${firestoreAppId}/public/data/materials`);

  // Fetch materials from Firestore
  useEffect(() => {
    if (!db || !firestoreAppId) {
      console.log("MaterialManagementPage: Firestore not ready or appId missing.");
      return;
    }

    console.log(`MaterialManagementPage: Setting up snapshot listener for materials at: artifacts/${firestoreAppId}/public/data/materials`);

    const q = query(materialsCollectionRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(materialsData);
      console.log("MaterialManagementPage: Materials fetched:", materialsData);
    }, (error) => {
      console.error("MaterialManagementPage: Error fetching materials:", error);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId, materialsCollectionRef]);

  // Apply filters and search
  useEffect(() => {
    let tempMaterials = [...materials];

    if (searchTerm) {
      tempMaterials = tempMaterials.filter(material =>
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.code && material.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.salesDescription && material.salesDescription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterUOM !== 'All') {
      tempMaterials = tempMaterials.filter(material => material.puom === filterUOM);
    }

    if (filterMaterialType !== 'All') {
      tempMaterials = tempMaterials.filter(material => material.materialType === filterMaterialType);
    }

    // Apply sorting
    if (sortConfig.key) {
      tempMaterials.sort((a, b) => {
        // Handle potential undefined/null values for sorting
        const aValue = a[sortConfig.key] !== undefined && a[sortConfig.key] !== null ? a[sortConfig.key] : '';
        const bValue = b[sortConfig.key] !== undefined && b[sortConfig.key] !== null ? b[sortConfig.key] : '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredMaterials(tempMaterials);
    console.log("MaterialManagementPage: Filtered materials updated:", tempMaterials);
  }, [materials, searchTerm, filterUOM, filterMaterialType, sortConfig]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = () => {
    setCurrentMaterial(null);
    setFormInput({
      code: '',
      description: '',
      materialType: '',
      puom: 'm', // Default to 'm' or first commonUnit
      muom: 'cm', // Default to 'cm' or a commonUnit
      mcp: 0,
      pcp: 0,
      unitConversionFactor: 1,
      currentStockPUOM: 0,
      minStockPUOM: 0,
      salesDescription: '',
      supplier: '',
    });
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material) => {
    setCurrentMaterial(material);
    setFormInput({
      code: material.code || '',
      description: material.description || '',
      materialType: material.materialType || '',
      puom: material.puom || 'm',
      muom: material.muom || 'cm',
      mcp: material.mcp || 0,
      pcp: material.pcp || 0,
      unitConversionFactor: material.unitConversionFactor || 1,
      currentStockPUOM: material.currentStockPUOM || 0,
      minStockPUOM: material.minStockPUOM || 0,
      salesDescription: material.salesDescription || '',
      supplier: material.supplier || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    try {
      const materialToSave = {
        ...formInput,
        mcp: parseFloat(formInput.mcp) || 0,
        pcp: parseFloat(formInput.pcp) || 0,
        unitConversionFactor: parseFloat(formInput.unitConversionFactor) || 0,
        currentStockPUOM: parseFloat(formInput.currentStockPUOM) || 0,
        minStockPUOM: parseFloat(formInput.minStockPUOM) || 0,
        lastUpdated: new Date().toISOString(),
      };

      if (currentMaterial) {
        const materialDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/materials`, currentMaterial.id);
        await updateDoc(materialDocRef, materialToSave);
        console.log("Material updated:", currentMaterial.id);
      } else {
        await addDoc(materialsCollectionRef, materialToSave);
        console.log("Material added:", materialToSave.description);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving material:", error);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        const materialDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/materials`, id);
        await deleteDoc(materialDocRef);
        console.log("Material deleted:", id);
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const calculateMUOM = useCallback((puomValue, conversionFactor) => {
    const puom = typeof puomValue === 'number' ? puomValue : 0;
    const factor = typeof conversionFactor === 'number' ? conversionFactor : 0;
    return (puom * factor).toFixed(5);
  }, []);

  const totalStockValue = filteredMaterials.reduce((sum, material) => {
    const cost = parseFloat(material.mcp) || 0;
    const stock = parseFloat(material.currentStockPUOM) || 0;
    const stockValue = stock * cost;
    return sum + stockValue;
  }, 0).toFixed(2);

  return (
    <ErrorBoundary>
      <div className="p-6 bg-darkGray text-offWhite min-h-full flex flex-col flex-1 overflow-y-auto">
        <h1 className="text-3xl font-bold text-lightGreen mb-6">Material Management</h1>

        {/* Controls: Add, Filter, Search */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4 w-full min-w-0">
          <button
            onClick={handleAddMaterial}
            className="bg-lightGreen text-deepGray font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition duration-200 shadow-lg flex items-center justify-center w-full md:w-auto"
          >
            <FaPlus className="mr-2" /> Add New Material
          </button>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto min-w-0">
            {/* Filter by Primary UOM */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterUOM}
                onChange={(e) => setFilterUOM(e.target.value)}
                className="block appearance-none w-full bg-gray-800 border border-gray-700 text-offWhite py-2 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
              >
                <option value="All">All Primary UOMs</option>
                {/* Populate from commonUnits */}
                {commonUnits.filter(unit => unit !== '').map(unit => ( // Filter out empty string for filter dropdown
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <FaFilter />
              </div>
            </div>

            {/* Filter by Material Type */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterMaterialType}
                onChange={(e) => setFilterMaterialType(e.target.value)}
                className="block appearance-none w-full bg-gray-800 border border-gray-700 text-offWhite py-2 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
              >
                <option value="All">All Material Types</option>
                {/* Populate from materialTypes */}
                {materialTypes.filter(type => type !== '').map(type => ( // Filter out empty string for filter dropdown
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <FaFilter />
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:w-auto min-w-0">
              <input
                type="text"
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-offWhite focus:ring-lightGreen focus:border-lightGreen"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-mediumGray p-4 rounded-xl shadow-md mb-6 w-full">
          <p className="text-lg font-semibold">Total Stock Value: <span className="text-lightGreen">£{totalStockValue}</span></p>
        </div>

        {/* Stock Level Chart */}
        <div className="bg-mediumGray p-4 rounded-xl shadow-md mb-6 w-full h-80 min-w-0 overflow-x-auto">
          <h2 className="text-xl font-semibold text-lightGreen mb-4">Stock Levels (Primary UOM)</h2>
          {filteredMaterials.length > 0 ? (
            <div className="w-full h-full min-w-[300px]"> {/* min-w for chart responsiveness */}
              <StockLevelChart data={filteredMaterials} />
            </div>
          ) : (
            <p className="text-gray-400">No materials to display in chart.</p>
          )}
        </div>

        {/* Materials Table */}
        <div className="bg-mediumGray p-4 rounded-xl shadow-md overflow-x-auto w-full min-w-0">
          <h2 className="text-xl font-semibold text-lightGreen mb-4">Material Inventory</h2>
          {filteredMaterials.length === 0 ? (
            <p className="text-gray-400">No materials found. Try adjusting your filters or add new materials.</p>
          ) : (
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-700">
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('code')}>Material Code</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('description')}>Description</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('materialType')}>Material Type</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('puom')}>Primary UOM</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('muom')}>MUOM</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('unitConversionFactor')}>Conversion Factor</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('mcp')}>MCP (£)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('pcp')}>PCP (£)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('currentStockPUOM')}>Current Stock (PUOM)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('minStockPUOM')}>Min Stock (PUOM)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Current Stock (MUOM)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Min Stock (MUOM)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('salesDescription')}>Sales Description</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('supplier')}>Supplier</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 cursor-pointer whitespace-nowrap" onClick={() => requestSort('lastUpdated')}>Last Updated</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Total Value (£)</th>
                  <th className="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-800 transition duration-150 ease-in-out">
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.code || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.description || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.materialType || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.puom || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.muom || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{(material.unitConversionFactor || 0).toFixed(5)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">£{(material.mcp || 0).toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">£{(material.pcp || 0).toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{(material.currentStockPUOM || 0).toFixed(5)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{(material.minStockPUOM || 0).toFixed(5)}</td>
                    {/* Using calculateMUOM for MUOM columns */}
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{calculateMUOM(material.currentStockPUOM, material.unitConversionFactor)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{calculateMUOM(material.minStockPUOM, material.unitConversionFactor)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.salesDescription || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">{material.supplier || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">
                      {material.lastUpdated ? new Date(material.lastUpdated).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">£{((material.currentStockPUOM || 0) * (material.mcp || 0)).toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="text-blue-400 hover:text-blue-600 transition duration-200"
                          title="Edit Material"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-400 hover:text-red-600 transition duration-200"
                          title="Delete Material"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add/Edit Material Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-mediumGray p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-lightGreen">{currentMaterial ? 'Edit Material' : 'Add New Material'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-offWhite">
                  <FaTimes size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveMaterial} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="code" className="block text-gray-300 text-sm font-bold mb-2">Material Code:</label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formInput.code}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">Description:</label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formInput.description}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="materialType" className="block text-gray-300 text-sm font-bold mb-2">Material Type:</label>
                    <select // Changed to select for consistency with constants.js
                      id="materialType"
                      name="materialType"
                      value={formInput.materialType}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    >
                      {materialTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="puom" className="block text-gray-300 text-sm font-bold mb-2">Primary UOM:</label>
                    <select
                      id="puom"
                      name="puom"
                      value={formInput.puom}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    >
                      {commonUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="muom" className="block text-gray-300 text-sm font-bold mb-2">MUOM:</label>
                    <select // Changed to select for consistency with constants.js
                      id="muom"
                      name="muom"
                      value={formInput.muom}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    >
                      {commonUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="unitConversionFactor" className="block text-gray-300 text-sm font-bold mb-2">Unit Conversion Factor:</label>
                    <input
                      type="number"
                      id="unitConversionFactor"
                      name="unitConversionFactor"
                      value={formInput.unitConversionFactor}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      step="0.00001"
                    />
                  </div>
                  <div>
                    <label htmlFor="mcp" className="block text-gray-300 text-sm font-bold mb-2">Material Cost Price (MCP) (£):</label>
                    <input
                      type="number"
                      id="mcp"
                      name="mcp"
                      value={formInput.mcp}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="pcp" className="block text-gray-300 text-sm font-bold mb-2">Production Cost Price (PCP) (£):</label>
                    <input
                      type="number"
                      id="pcp"
                      name="pcp"
                      value={formInput.pcp}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="currentStockPUOM" className="block text-gray-300 text-sm font-bold mb-2">Current Stock (PUOM):</label>
                    <input
                      type="number"
                      id="currentStockPUOM"
                      name="currentStockPUOM"
                      value={formInput.currentStockPUOM}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      step="0.00001"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="minStockPUOM" className="block text-gray-300 text-sm font-bold mb-2">Minimum Stock (PUOM):</label>
                    <input
                      type="number"
                      id="minStockPUOM"
                      name="minStockPUOM"
                      value={formInput.minStockPUOM}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                      step="0.00001"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="salesDescription" className="block text-gray-300 text-sm font-bold mb-2">Sales Description:</label>
                    <input
                      type="text"
                      id="salesDescription"
                      name="salesDescription"
                      value={formInput.salesDescription}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    />
                  </div>
                  <div>
                    <label htmlFor="supplier" className="block text-gray-300 text-sm font-bold mb-2">Supplier:</label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      value={formInput.supplier}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    />
                  </div>
                </div>
                {/* Buttons are outside the overflow-y-auto form content, but still within the modal */}
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-gray-700 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-lightGreen text-deepGray font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition duration-200 shadow-lg"
                  >
                    {currentMaterial ? 'Update Material' : 'Add Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default MaterialManagementPage;
