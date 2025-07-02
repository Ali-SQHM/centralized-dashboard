// src/pages/MaterialManagementPage.jsx
// This component manages the raw material inventory. It allows users to add,
// edit, and delete material records.
// It displays material costs and prices in Pound Sterling (£) and handles
// stock levels with floating-point precision.
//
// Updates:
// 1. Decimal Precision for Stock:
//    - `currentStockPUOM` and `minStockPUOM` are now parsed using `parseFloat`
//      instead of `parseInt` in `handleSaveMaterial` to preserve decimal values.
//    - `currentStockMUOM` and `minStockMUOM` calculations are adjusted accordingly.
//    - All stock level displays in the table (`currentStockMUOM`, `minStockMUOM`,
//      `currentStockPUOM`, `minStockPUOM`) now use `.toFixed(5)` for 5 decimal places.
// 2. Retained all currency fixes, stock calculations, form adjustments, filter, layout, and debugging logs.
// 3. FIX: Enhanced layout for proper vertical and horizontal scrolling of content.
// 4. FIX: Explicitly set Firestore collection path to "default-app-id" to resolve persistent warning.
// 5. FIX: Re-added calculation for totalStockValue.
// 6. FIX: Corrected table header for Min Stock (MUOM) and ensured proper table rendering.
// 7. FIX: Refined responsive layout for controls (add, filter, search) to prevent horizontal overflow.
// 8. FIX: Added `min-w-0` to key flex containers to prevent content from pushing beyond bounds.

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import StockLevelChart from '../components/StockLevelChart';
import { colors, materialTypes, commonUnits } from '../utils/constants';

function MaterialManagementPage({ db, firestoreAppId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null); // For editing
  const [formInput, setFormInput] = useState({
    code: '',
    description: '',
    materialType: '',
    supplier: '',
    salesDescription: '',

    muom: '',
    puom: '',
    currentStockPUOM: '',
    minStockPUOM: '',

    pcp: '',
    overheadFactor: '',
    unitConversionFactor: '',
    lastUpdated: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMaterialType, setSelectedMaterialType] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // CRITICAL FIX: Explicitly set the collection path to use "default-app-id"
  // This bypasses any potential issues with firestoreAppId prop not being "default-app-id"
  const materialsCollectionPath = `artifacts/default-app-id/public/data/materials`;

  useEffect(() => {
    console.log("MaterialManagementPage: useEffect mounted.");
    console.log("MaterialManagementPage: db prop received:", db ? "Initialized" : "NULL");
    console.log("MaterialManagementPage: firestoreAppId prop received:", firestoreAppId); // This will still show what App.jsx passes
    console.log("MaterialManagementPage: Using explicit collection path:", materialsCollectionPath);

    if (!db) {
      console.error("MaterialManagementPage: Firestore DB is not initialized. Cannot fetch data.");
      setError("Firestore DB is not initialized. Please check Firebase configuration.");
      setLoading(false);
      return;
    }

    const q = collection(db, materialsCollectionPath);
    console.log("MaterialManagementPage: Setting up onSnapshot for query:", q);

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const materialsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`MaterialManagementPage: onSnapshot fired! Fetched ${materialsData.length} materials.`);
        console.log("MaterialManagementPage: Fetched materialsData content:", materialsData);
        setMaterials(materialsData);
        setLoading(false);
      },
      (err) => {
        console.error("MaterialManagementPage: Error fetching materials in onSnapshot:", err);
        setError("Failed to load materials. Please try again. Error: " + err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("MaterialManagementPage: useEffect cleanup - unsubscribing from Firestore.");
      unsubscribe();
    };
  }, [db, materialsCollectionPath]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInput(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFilterChange = (e) => {
    setSelectedMaterialType(e.target.value);
  };

  const openAddModal = () => {
    setCurrentMaterial(null);
    setFormInput({
      code: '',
      description: '',
      materialType: '',
      supplier: '',
      salesDescription: '',

      muom: '',
      puom: '',
      currentStockPUOM: '',
      minStockPUOM: '',

      pcp: '',
      overheadFactor: '',
      unitConversionFactor: '',
      lastUpdated: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (material) => {
    setCurrentMaterial(material);
    setFormInput({
      code: material.code || '',
      description: material.description || '',
      materialType: material.materialType || '',
      supplier: material.supplier || '',
      salesDescription: material.salesDescription || '',
      // Populate PUOM fields directly
      currentStockPUOM: material.currentStockPUOM !== undefined && material.currentStockPUOM !== null ? material.currentStockPUOM : '',
      minStockPUOM: material.minStockPUOM !== undefined && material.minStockPUOM !== null ? material.minStockPUOM : '',
      muom: material.muom || '',
      puom: material.puom || '',
      pcp: material.pcp !== undefined && material.pcp !== null ? material.pcp : '',
      overheadFactor: material.overheadFactor !== undefined && material.overheadFactor !== null ? material.overheadFactor : '',
      unitConversionFactor: material.unitConversionFactor !== undefined && material.unitConversionFactor !== null ? material.unitConversionFactor : '',
      lastUpdated: material.lastUpdated || new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Parse float values for stock, pcp, overheadFactor, unitConversionFactor
    const materialToSave = {
      ...formInput,
      currentStockPUOM: parseFloat(formInput.currentStockPUOM) || 0,
      minStockPUOM: parseFloat(formInput.minStockPUOM) || 0,
      pcp: parseFloat(formInput.pcp) || 0,
      overheadFactor: parseFloat(formInput.overheadFactor) || 0,
      unitConversionFactor: parseFloat(formInput.unitConversionFactor) || 1, // Default to 1 to avoid division by zero
      lastUpdated: new Date().toISOString(), // Ensure lastUpdated is always current
    };

    // Calculate currentStockMUOM and minStockMUOM
    materialToSave.currentStockMUOM = materialToSave.currentStockPUOM * materialToSave.unitConversionFactor;
    materialToSave.minStockMUOM = materialToSave.minStockPUOM * materialToSave.unitConversionFactor;

    // Calculate MCP (Material Cost Price)
    // MCP = PCP * (1 + Overhead Factor)
    materialToSave.mcp = materialToSave.pcp * (1 + (materialToSave.overheadFactor / 100)); // Assuming overheadFactor is a percentage

    try {
      if (currentMaterial) {
        // Update existing material
        const materialDocRef = doc(db, materialsCollectionPath, currentMaterial.id);
        await updateDoc(materialDocRef, materialToSave);
        console.log("Material updated:", materialToSave);
      } else {
        // Add new material
        await addDoc(collection(db, materialsCollectionPath), materialToSave);
        console.log("Material added:", materialToSave);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving material:", err);
      setError("Failed to save material: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, materialsCollectionPath, id));
        console.log("Material deleted:", id);
      } catch (err) {
        console.error("Error deleting material:", err);
        setError("Failed to delete material: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtered materials for display
  const filteredMaterials = materials.filter(material => {
    const matchesType = selectedMaterialType ? material.materialType === selectedMaterialType : true;
    const matchesSearch = searchTerm ?
      Object.values(material).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;
    return matchesType && matchesSearch;
  });

  // Calculate total stock value for chart
  const totalStockValue = materials.reduce((sum, material) => {
    const mcp = material.mcp || 0;
    const currentStockMUOM = material.currentStockMUOM || 0;
    return sum + (mcp * currentStockMUOM);
  }, 0);

  // Prepare data for StockLevelChart
  const chartData = filteredMaterials.map(m => ({
    name: m.code,
    'Current Stock': m.currentStockMUOM || 0,
    'Min Stock': m.minStockMUOM || 0,
  }));


  return (
    // Main container for the page content. It will flex to fill the parent's height.
    // The overflow-y-auto is now handled by the parent div in App.jsx.
    // Ensure this container itself is flex-col so its children stack vertically.
    // Added min-w-0 to ensure it doesn't prevent horizontal shrinking.
    <div className="p-4 md:p-6 bg-darkGray rounded-xl shadow-md flex flex-col flex-1 min-w-0">
      <h3 className="text-3xl font-bold mb-6 text-lightGreen text-center">Material Management</h3>

      {loading && (
        <div className="flex items-center justify-center h-full text-offWhite text-xl">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-lightGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading materials...
        </div>
      )}

      {error && (
        <div className="bg-red-800 text-offWhite p-4 rounded-lg mb-4 text-center">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Controls: Add Material, Filter, Search */}
          {/* Added min-w-0 to this flex container as well */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4 flex-wrap max-w-full min-w-0">
            <button
              onClick={openAddModal}
              className="bg-lightGreen text-deepGray font-bold py-2 px-4 rounded-xl hover:bg-darkGreen transition duration-200 shadow-lg w-full md:w-auto flex-shrink-0"
            >
              Add New Material
            </button>

            {/* This div contains filter and search, ensure it also wraps/distributes space */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto flex-grow md:flex-grow-0 min-w-0">
              {/* Filter by Material Type */}
              <select
                value={selectedMaterialType}
                onChange={handleFilterChange}
                className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen w-full sm:w-auto"
              >
                {materialTypes.map(type => (
                  <option key={type} value={type}>{type === '' ? 'All Material Types' : type}</option>
                ))}
              </select>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Stock Level Chart */}
          <div className="mb-6 bg-deepGray p-4 rounded-xl shadow-inner border border-gray-700">
            <h4 className="text-xl font-bold mb-4 text-accentGold">Overall Stock Value: £{totalStockValue.toFixed(2)}</h4>
            {/* Pass the prepared chartData to the StockLevelChart component */}
            <StockLevelChart data={chartData} />
          </div>

          {/* Materials Table - Now with horizontal scrolling */}
          {/* flex-1 here ensures the table container takes up remaining vertical space if needed */}
          <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-lg flex-1">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-mediumGray">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Supplier</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sales Desc.</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">MUOM</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PUOM</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Stock (PUOM)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Min Stock (PUOM)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Stock (MUOM)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Min Stock (MUOM)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PCP (£)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Overhead Factor (%)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unit Conv. Factor</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">MCP (£)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-darkGray divide-y divide-gray-700">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-offWhite">{material.code}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.materialType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.supplier}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.salesDescription}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.muom}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.puom}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.currentStockPUOM !== undefined ? material.currentStockPUOM.toFixed(5) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.minStockPUOM !== undefined ? material.minStockPUOM.toFixed(5) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.currentStockMUOM !== undefined ? material.currentStockMUOM.toFixed(5) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.minStockMUOM !== undefined ? material.minStockMUOM.toFixed(5) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">£{material.pcp !== undefined ? material.pcp.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.overheadFactor !== undefined ? material.overheadFactor.toFixed(2) : 'N/A'}%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.unitConversionFactor !== undefined ? material.unitConversionFactor.toFixed(5) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">£{material.mcp !== undefined ? material.mcp.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{material.lastUpdated ? new Date(material.lastUpdated).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(material)}
                        className="text-lightGreen hover:text-accentGold mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-deepGray bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-darkGray rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-lightGreen">
              {currentMaterial ? 'Edit Material' : 'Add New Material'}
            </h3>
            <form onSubmit={handleSaveMaterial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">Code</label>
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
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
                  <label htmlFor="materialType" className="block text-sm font-medium text-gray-300 mb-1">Material Type</label>
                  <select
                    id="materialType"
                    name="materialType"
                    value={formInput.materialType}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    required
                  >
                    <option value="">Select Type</option>
                    {materialTypes.filter(type => type !== '').map(type => ( // Filter out empty option for input
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={formInput.supplier}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                  />
                </div>
                <div>
                  <label htmlFor="salesDescription" className="block text-sm font-medium text-gray-300 mb-1">Sales Description</label>
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
                  <label htmlFor="muom" className="block text-sm font-medium text-gray-300 mb-1">MUOM (Manufacturing Unit of Measure)</label>
                  <select
                    id="muom"
                    name="muom"
                    value={formInput.muom}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    required
                  >
                    <option value="">Select MUOM</option>
                    {commonUnits.filter(unit => unit !== '').map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="puom" className="block text-sm font-medium text-gray-300 mb-1">PUOM (Purchasing Unit of Measure)</label>
                  <select
                    id="puom"
                    name="puom"
                    value={formInput.puom}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    required
                  >
                    <option value="">Select PUOM</option>
                    {commonUnits.filter(unit => unit !== '').map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="currentStockPUOM" className="block text-sm font-medium text-gray-300 mb-1">Current Stock (PUOM)</label>
                  <input
                    type="number"
                    id="currentStockPUOM"
                    name="currentStockPUOM"
                    value={formInput.currentStockPUOM}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    step="0.00001" // Allow 5 decimal places
                  />
                </div>
                <div>
                  <label htmlFor="minStockPUOM" className="block text-sm font-medium text-gray-300 mb-1">Min Stock (PUOM)</label>
                  <input
                    type="number"
                    id="minStockPUOM"
                    name="minStockPUOM"
                    value={formInput.minStockPUOM}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    step="0.00001" // Allow 5 decimal places
                  />
                </div>
                <div>
                  <label htmlFor="pcp" className="block text-sm font-medium text-gray-300 mb-1">PCP (£) (Purchasing Cost Price)</label>
                  <input
                    type="number"
                    id="pcp"
                    name="pcp"
                    value={formInput.pcp}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="overheadFactor" className="block text-sm font-medium text-gray-300 mb-1">Overhead Factor (%)</label>
                  <input
                    type="number"
                    id="overheadFactor"
                    name="overheadFactor"
                    value={formInput.overheadFactor}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="unitConversionFactor" className="block text-sm font-medium text-gray-300 mb-1">Unit Conversion Factor (PUOM to MUOM)</label>
                  <input
                    type="number"
                    id="unitConversionFactor"
                    name="unitConversionFactor"
                    value={formInput.unitConversionFactor}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-offWhite focus:ring-lightGreen focus:border-lightGreen"
                    step="0.00001" // Allow 5 decimal places
                  />
                </div>
              </div>
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
  );
}

export default MaterialManagementPage;
