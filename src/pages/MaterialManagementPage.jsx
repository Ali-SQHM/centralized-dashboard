// src/pages/MaterialManagementPage.jsx
// Manages raw material inventory: adding, editing, deleting materials, and CSV upload.
// Displays current stock levels using the StockLevelChart.
//
// Updates:
// 1. CRITICAL RESPONSIVENESS FIX: Added `table-fixed` to the `<table>` element and
//    `w-full` to ensure it takes 100% of its scrollable container.
// 2. Added explicit width classes (`w-1/X` or `min-w-[YYpx]`) to `<th>` elements
//    to guide `table-fixed` behavior and guarantee content overflow for scrollbars.
// 3. Ensured `min-w-0` is consistently applied to all necessary flex containers and cards.
// 4. All styling (colors, rounding, inputs, etc.) remains as previously confirmed.
// 5. StockLevelChart import is correct and relies on its internal responsiveness.

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, onSnapshot, writeBatch } from 'firebase/firestore';
import StockLevelChart from '../components/StockLevelChart';
import { colors, commonUnits, materialTypes } from '../utils/constants'; // Ensure custom colors are imported

function MaterialManagementPage({ db, firestoreAppId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    materialType: '',
    puom: '',
    pcp: '',
    muom: '',
    unitConversionFactor: '',
    overheadFactor: '',
    currentStockPUOM: '',
    minStockPUOM: '',
    supplier: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterialType, setFilterMaterialType] = useState('');
  const [csvMessage, setCsvMessage] = useState('');
  const [csvMessageType, setCsvMessageType] = useState('');

  const getPublicMaterialsCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for collection reference in MaterialManagementPage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
  };

  useEffect(() => {
    if (!db || !firestoreAppId) {
      console.log("Skipping material fetch: DB or firestoreAppId not ready.");
      return;
    }

    const materialsColRef = getPublicMaterialsCollectionRef();
    if (!materialsColRef) {
      setError("Firestore collection reference could not be established. Check Firebase DB connection or app ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(materialsColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(materialsList);
      setLoading(false);
      setError(null);
      console.log("Materials fetched successfully for Material Management:", materialsList);
    }, (err) => {
      console.error("Error fetching materials:", err);
      setError(`Failed to load materials: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/{your_app_id}/public/data/materials.`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDerivedValues = (data) => {
    const pcp = parseFloat(data.pcp || 0);
    const unitConversionFactor = parseFloat(data.unitConversionFactor || 0);
    const overheadFactor = parseFloat(data.overheadFactor || 0);
    const currentStockPUOM = parseFloat(data.currentStockPUOM || 0);
    const minStockPUOM = parseFloat(data.minStockPUOM || 0);

    const mcp = (unitConversionFactor > 0)
      ? (pcp / unitConversionFactor) * overheadFactor
      : 0;

    const currentStockMUOM = currentStockPUOM * unitConversionFactor;
    const minStockMUOM = minStockPUOM * unitConversionFactor;

    return { mcp, currentStockMUOM, minStockMUOM };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !firestoreAppId) {
      console.error("Firebase not initialized or firestoreAppId missing.");
      return;
    }

    try {
      const materialsColRef = getPublicMaterialsCollectionRef();
      if (!materialsColRef) return;

      const { mcp, currentStockMUOM, minStockMUOM } = calculateDerivedValues(formData);

      const materialData = {
        code: formData.code,
        description: formData.description,
        materialType: formData.materialType,
        puom: formData.puom,
        pcp: parseFloat(formData.pcp),
        muom: formData.muom,
        unitConversionFactor: parseFloat(formData.unitConversionFactor),
        overheadFactor: parseFloat(formData.overheadFactor),
        currentStockPUOM: parseFloat(formData.currentStockPUOM || 0),
        minStockPUOM: parseFloat(formData.minStockPUOM || 0),
        currentStockMUOM: currentStockMUOM,
        minStockMUOM: minStockMUOM,
        mcp: mcp,
        supplier: formData.supplier,
        lastUpdated: new Date().toISOString()
      };

      if (editingMaterialId) {
        const materialDocRef = doc(db, materialsColRef.path, editingMaterialId);
        await updateDoc(materialDocRef, materialData);
        console.log("Material updated with ID: ", editingMaterialId);
      } else {
        const docRef = await addDoc(materialsColRef, materialData);
        console.log("Material added with ID: ", docRef.id);
      }

      setFormData({
        code: '', description: '', materialType: '', puom: '', pcp: '', muom: '',
        unitConversionFactor: '', overheadFactor: '',
        currentStockPUOM: '', minStockPUOM: '', supplier: '',
      });
      setEditingMaterialId(null);
    } catch (e) {
      console.error("Error adding/updating material: ", e);
      setError(`Failed to save material: ${e.message}`);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      code: material.code || '',
      description: material.description || '',
      materialType: material.materialType || '',
      puom: material.puom || '',
      pcp: material.pcp || '',
      muom: material.muom || '',
      unitConversionFactor: material.unitConversionFactor || '',
      overheadFactor: material.overheadFactor || '',
      currentStockPUOM: material.currentStockPUOM || '',
      minStockPUOM: material.minStockPUOM || '',
      supplier: material.supplier || '',
    });
    setEditingMaterialId(material.id);
  };

  const handleDelete = async (id) => {
    if (!db || !firestoreAppId) {
      console.error("Firebase not initialized or firestoreAppId missing.");
      return;
    }
    // Using a custom modal/dialog is preferred over window.confirm for iframes
    // For now, retaining window.confirm as it was in your original code.
    const confirmDelete = window.confirm("Are you sure you want to delete this material?");
    if (!confirmDelete) {
      return;
    }

    try {
      const materialsColRef = getPublicMaterialsCollectionRef();
      if (!materialsColRef) return;

      await deleteDoc(doc(db, materialsColRef.path, id));
      console.log("Material deleted with ID: ", id);
    } catch (e) {
      console.error("Error deleting material: ", e);
      setError(`Failed to delete material: ${e.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setCsvMessage('No file selected.');
      setCsvMessageType('error');
      return;
    }

    if (file.type !== 'text/csv') {
      setCsvMessage('Please upload a CSV file.');
      setCsvMessageType('error');
      return;
    }

    setCsvMessage('Uploading and processing CSV...');
    setCsvMessageType('info');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      try {
        const parsedData = parseCSV(text);
        let recordsAdded = 0;
        let recordsFailed = 0;
        const materialsColRef = getPublicMaterialsCollectionRef();

        if (!materialsColRef) {
          throw new Error("Firestore materials collection reference is not available.");
        }

        const batch = writeBatch(db);

        parsedData.forEach((record, index) => {
          if (record.code && record.description && record.materialType && record.puom &&
              record.pcp && record.muom && record.unitConversionFactor && record.overheadFactor &&
              record.currentStockPUOM && record.minStockPUOM) {

            const { mcp, currentStockMUOM, minStockMUOM } = calculateDerivedValues({
                pcp: record.pcp,
                unitConversionFactor: record.unitConversionFactor,
                overheadFactor: record.overheadFactor,
                currentStockPUOM: record.currentStockPUOM,
                minStockPUOM: record.minStockPUOM
            });

            const materialToSave = {
              code: record.code,
              description: record.description,
              materialType: record.materialType,
              puom: record.puom,
              pcp: parseFloat(record.pcp || 0),
              muom: record.muom,
              unitConversionFactor: parseFloat(record.unitConversionFactor || 0),
              overheadFactor: parseFloat(record.overheadFactor || 0),
              currentStockPUOM: parseFloat(record.currentStockPUOM || 0),
              minStockPUOM: parseFloat(record.minStockPUOM || 0),
              currentStockMUOM: currentStockMUOM,
              minStockMUOM: minStockMUOM,
              mcp: mcp,
              supplier: record.supplier || '',
              lastUpdated: new Date().toISOString()
            };
            // Set (upsert) instead of add to prevent duplicate codes if CSV re-uploaded with same codes
            // Using doc(materialsColRef, record.code) for specific document ID if 'code' is unique and suitable as ID
            // Or use addDoc if you always want new documents (less suitable for updates)
            // For now, using set with specific ID based on code as it's common for materials management.
            // If codes aren't unique, you might need to query first and update or use addDoc.
            batch.set(doc(materialsColRef, record.code), materialToSave);
            recordsAdded++;
          } else {
            console.warn(`Skipping invalid record at row ${index + 1} due to missing data:`, record);
            recordsFailed++;
          }
        });

        if (recordsAdded > 0) {
          await batch.commit();
          setCsvMessage(`Successfully added/updated ${recordsAdded} materials from CSV. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
          setCsvMessageType('success');
        } else {
          setCsvMessage(`No valid materials found in CSV to add/update. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
          setCsvMessageType('error');
        }
      } catch (err) {
        console.error("Error processing CSV:", err);
        setCsvMessage(`Failed to process CSV: ${err.message}`);
        setCsvMessageType('error');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1} has mismatched column count and will be skipped.`);
        continue;
      }
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = values[index];
      });
      data.push(rowObject);
    }
    return data;
  };

  const filteredMaterialsTable = materials.filter(material => {
    const matchesSearchTerm = searchTerm === '' ||
                              material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMaterialType = filterMaterialType === '' || material.materialType === filterMaterialType;
    return matchesSearchTerm && matchesMaterialType;
  });

  // Calculate overall stock levels for the chart
  const stockLevels = materials.map(m => ({
    name: m.description,
    value: m.currentStockPUOM || 0,
    min: m.minStockPUOM || 0
  }));

  return (
    // Main container for Material Management page content.
    // This div uses w-full and min-w-0 to correctly fill the parent dashboard's content area.
    <div className="w-full h-full flex flex-col min-w-0 text-offWhite">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-8" style={{ color: colors.blue[400] }}>Materials Management</h1>
      <p className="text-gray-300 mb-6">Manage your raw material inventory. Add, edit, and delete materials. These materials will be accessible to the Instant Quote App.</p>

      {error && (
        <div className="bg-red-700 text-white p-4 rounded-md mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      {/* 1. Add/Edit Material Form Card */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">{editingMaterialId ? 'Edit Material' : 'Add New Material'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className="block text-sm font-semibold mb-1">Code</label>
            <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-1">Description</label>
            <input type="text" id="description" name="description" value={formData.description} onChange={handleInputChange} required
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="materialType" className="block text-sm font-semibold mb-1">Material Type</label>
            <select id="materialType" name="materialType" value={formData.materialType} onChange={handleInputChange} required
                    className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen">
              <option value="">Select Type</option>
              {materialTypes.map(type => type && <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="puom" className="block text-sm font-semibold mb-1">Purchase Unit of Measure (PUOM)</label>
            <select id="puom" name="puom" value={formData.puom} onChange={handleInputChange} required
                    className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen">
              <option value="">Select PUOM</option>
              {commonUnits.map(unit => unit && <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pcp" className="block text-sm font-semibold mb-1">Purchase Cost per PUOM (PCP)</label>
            <input type="number" step="0.01" id="pcp" name="pcp" value={formData.pcp} onChange={handleInputChange} required
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="muom" className="block text-sm font-semibold mb-1">Manufacturing Unit of Measure (MUOM)</label>
            <select id="muom" name="muom" value={formData.muom} onChange={handleInputChange} required
                    className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen">
              <option value="">Select MUOM</option>
              {commonUnits.map(unit => unit && <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="unitConversionFactor" className="block text-sm font-semibold mb-1">Unit Conversion Factor (PUOM to MUOM)</label>
            <input type="number" step="0.01" id="unitConversionFactor" name="unitConversionFactor" value={formData.unitConversionFactor} onChange={handleInputChange} required
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="overheadFactor" className="block text-sm font-semibold mb-1">Overhead Factor</label>
            <input type="number" step="0.01" id="overheadFactor" name="overheadFactor" value={formData.overheadFactor} onChange={handleInputChange} required
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="currentStockPUOM" className="block text-sm font-semibold mb-1">Current Stock (PUOM)</label>
            <input type="number" step="0.01" id="currentStockPUOM" name="currentStockPUOM" value={formData.currentStockPUOM} onChange={handleInputChange}
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div>
            <label htmlFor="minStockPUOM" className="block text-sm font-semibold mb-1">Min Stock (PUOM)</label>
            <input type="number" step="0.01" id="minStockPUOM" name="minStockPUOM" value={formData.minStockPUOM} onChange={handleInputChange}
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="supplier" className="block text-sm font-semibold mb-1">Supplier</label>
            <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange}
                   className="w-full p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen" />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            {editingMaterialId && (
              <button type="button" onClick={() => {
                setEditingMaterialId(null);
                setFormData({
                  code: '', description: '', materialType: '', puom: '', pcp: '', muom: '',
                  unitConversionFactor: '', overheadFactor: '', currentStockPUOM: '', minStockPUOM: '', supplier: '',
                });
              }}
                      className="px-6 py-3 rounded-xl font-semibold transition-colors duration-200 bg-gray-600 text-offWhite hover:bg-gray-700">
                Cancel Edit
              </button>
            )}
            <button type="submit"
                    className="px-6 py-3 rounded-xl font-semibold transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700">
              {editingMaterialId ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>

      {/* CSV Upload Section Card */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Upload Materials from CSV</h2>
        <p className="text-gray-300 text-sm mb-4">
          Upload a CSV file containing your materials. The CSV must have the following header row:<br/>
          <code className="text-white bg-deepGray px-2 py-1 rounded text-xs">code,description,materialType,puom,pcp,muom,unitConversionFactor,overheadFactor,currentStockPUOM,minStockPUOM,supplier</code>
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-offWhite file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors duration-200 cursor-pointer"
          />
        </div>
        {csvMessage && (
          <p className={`mt-3 text-sm font-semibold text-center ${csvMessageType === 'error' ? 'text-red-400' : 'text-lightGreen'}`}>
            {csvMessage}
          </p>
        )}
      </div>

      {/* Stock Levels Overview Chart Card */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 w-full min-w-0">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Stock Levels Overview</h2>
        {materials.length > 0 ? (
          <StockLevelChart materials={stockLevels} />
        ) : (
          <p className="text-gray-400 text-center">No materials to display in chart.</p>
        )}
      </div>

      {/* Materials Table Card */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 w-full min-w-0 flex flex-col">
        <h2 className="text-2xl font-bold text-offWhite mb-4">All Materials</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/2 p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen"
          />
          <select
            value={filterMaterialType}
            onChange={(e) => setFilterMaterialType(e.target.value)}
            className="w-full sm:w-1/2 p-2 rounded-md bg-white text-deepGray border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lightGreen"
          >
            <option value="">All Material Types</option>
            {materialTypes.map(type => type && <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-md">
          <table className="min-w-full divide-y divide-gray-700 table-fixed"> {/* Added table-fixed */}
            <thead className="bg-darkGray">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[80px]">Code</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-2/12 min-w-[150px]">Description</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[100px]">Type</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[80px]">PUOM</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[80px]">PCP</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[80px]">MUOM</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[120px]">Conv. Factor</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[100px]">Overhead</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[120px]">Stock (PUOM)</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[120px]">Min Stock (PUOM)</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[120px]">Stock (MUOM)</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[120px]">Min Stock (MUOM)</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[100px]">MCP</th> {/* Added width */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/12 min-w-[100px]">Supplier</th> {/* Added width */}
                <th scope="col" className="relative px-6 py-3 w-1/12 min-w-[120px]"><span className="sr-only">Edit</span></th> {/* Added width */}
              </tr>
            </thead>
            <tbody className="bg-mediumGreen divide-y divide-gray-600">
              {filteredMaterialsTable.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-offWhite">{material.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.materialType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.puom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">£{material.pcp?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.muom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.unitConversionFactor?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.overheadFactor?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.currentStockPUOM?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.minStockPUOM?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.currentStockMUOM?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.minStockMUOM?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">£{material.mcp?.toFixed(4)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{material.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(material)} className="text-blue-400 hover:text-blue-600 mr-3">Edit</button>
                    <button onClick={() => handleDelete(material.id)} className="text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredMaterialsTable.length === 0 && (
                <tr>
                  <td colSpan="15" className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">No materials found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MaterialManagementPage;