// src/pages/MaterialManagementPage.jsx
// Manages raw material inventory: adding, editing, deleting materials, and CSV upload.
// Displays current stock levels using the StockLevelChart.
//
// Updates:
// 1. All "card" backgrounds changed to bg-mediumGreen.
// 2. All input/select fields changed to bg-white text-deepGray border-lightGreen focus:ring-lightGreen rounded-xl.
// 3. Headings within cards (h2, h3) set to text-offWhite or text-white for best contrast.
// 4. Labels set to text-offWhite.
// 5. Buttons styled consistently with rounded-xl.
// 6. Table styling adjusted for consistency within the mediumGreen card.

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
    // Using a custom modal/confirmation if alert() is not allowed, but for simplicity
    // and given previous use of alert(), retaining window.confirm for now.
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
            batch.set(doc(materialsColRef), materialToSave);
            recordsAdded++;
          } else {
            console.warn(`Skipping invalid record at row ${index + 1} due to missing data:`, record);
            recordsFailed++;
          }
        });

        if (recordsAdded > 0) {
            await batch.commit();
            setCsvMessage(`Successfully added ${recordsAdded} materials from CSV. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
            setCsvMessageType('success');
        } else {
            setCsvMessage(`No valid materials found in CSV to add. ${recordsFailed > 0 ? `(${recordsFailed} records skipped due to missing data)` : ''}`);
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
    
    const matchesMaterialType = filterMaterialType === '' ||
      material.materialType === filterMaterialType;
    
    return matchesSearchTerm && matchesMaterialType;
  });


  return (
    // Main container uses deepGray background, offWhite text, and rounded-xl corners (from DashboardHome)
    <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-8">Materials Management</h1>
      <p className="text-gray-300 mb-6">Manage your raw material inventory. Add, edit, and delete materials. These materials will be accessible to the Instant Quote App.</p>

      {/* 1. Stock Levels Overview Chart Card */}
      {/* Card styling: bg-mediumGreen, rounded-xl, shadow-lg, border-gray-700 */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Stock Levels Overview</h2> {/* Heading inside card is offWhite */}
        <StockLevelChart materials={materials} />
      </div>

      {/* 2. Filter and Search Bar Card */}
      {/* Card styling: bg-mediumGreen, rounded-xl, shadow-lg, border-gray-700 */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-offWhite text-sm font-bold mb-1">Search by Code or Description</label>
          <input
            type="text"
            id="search"
            placeholder="e.g., WOOD-001, Oak Timber"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // Input styling: bg-white, text-deepGray, border-lightGreen, focus:ring-lightGreen, rounded-xl
            className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="filterMaterialType" className="block text-offWhite text-sm font-bold mb-1">Filter by Material Type</label>
          <select
            id="filterMaterialType"
            value={filterMaterialType}
            onChange={(e) => setFilterMaterialType(e.target.value)}
            // Select styling: bg-white, text-deepGray, border-lightGreen, focus:ring-lightGreen, rounded-xl
            className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200"
          >
            <option value="" className="bg-white text-deepGray">All Types</option> 
            {materialTypes.map(type => ( 
              <option key={type} value={type} className="bg-white text-deepGray">{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Materials List/Table Card */}
      {/* Card styling: bg-mediumGreen, rounded-xl, shadow-lg, border-gray-700 */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Current Materials</h2> {/* Heading inside card is offWhite */}
        {loading && <p className="text-gray-400">Loading materials...</p>}
        {error && <p className="text-red-400">{error}</p>}
        
        {/* Table container styling: rounded-xl, border-gray-700 */}
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                {/* Table header styling: bg-gray-700 (consistent), text-gray-300, rounded-tl-xl/rounded-tr-xl */}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 rounded-tl-xl">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">Material Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">PUOM</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">PCP</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">MUOM</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Unit Conversion Factor</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Overhead Factor</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Current Stock (PUOM)</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Current Stock (MUOM)</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Min Stock (PUOM)</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 whitespace-nowrap">Min Stock (MUOM)</th> 
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">MCP</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300">Supplier</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider bg-gray-700 text-gray-300 rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            {/* Table body styling: bg-mediumGreen (for rows), divide-gray-700 */}
            <tbody className="bg-mediumGreen divide-y divide-gray-700">
              {!loading && filteredMaterialsTable.length === 0 && !error && (
                <tr>
                  <td colSpan="15" className="px-4 py-4 text-center text-offWhite/70"> {/* Use offWhite for placeholder text */}
                    No materials added yet. Use the form below or upload a CSV to add your first material!
                  </td>
                </tr>
              )}
              {filteredMaterialsTable.map(material => ( // Looping through filtered materials to display
                <tr key={material.id} className="hover:bg-lightGreen transition-colors duration-150"> {/* Hover effect with lightGreen */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{material.code}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.description}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.materialType}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.puom}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">£{material.pcp?.toFixed(4)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.muom}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{typeof material.unitConversionFactor === 'number' ? material.unitConversionFactor.toFixed(6) : material.unitConversionFactor}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{typeof material.overheadFactor === 'number' ? material.overheadFactor.toFixed(2) : material.overheadFactor}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.currentStockPUOM}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.currentStockMUOM?.toFixed(2)}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.minStockPUOM}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.minStockMUOM?.toFixed(2)}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">£{typeof material.mcp === 'number' ? material.mcp.toFixed(6) : material.mcp}</td> 
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{material.supplier}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(material)}
                      className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-red-400 hover:text-red-500 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Material Entry/Edit Form Card */}
      {/* Card styling: bg-mediumGreen, rounded-xl, shadow-lg, border-gray-700 */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">{editingMaterialId ? 'Edit Material' : 'Add New Material'}</h2> {/* Heading inside card is offWhite */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className="block text-offWhite text-sm font-bold mb-1">Code</label>
            <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required
                   // Input styling: bg-white, text-deepGray, border-lightGreen, focus:ring-lightGreen, rounded-xl
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="description" className="block text-offWhite text-sm font-bold mb-1">Description</label>
            <input type="text" id="description" name="description" value={formData.description} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="materialType" className="block text-offWhite text-sm font-bold mb-1">Material Type</label>
            <select id="materialType" name="materialType" value={formData.materialType} onChange={handleInputChange} required
                    className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200">
              {materialTypes.map(type => (
                <option key={type} value={type} className="bg-white text-deepGray">{type}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="puom" className="block text-offWhite text-sm font-bold mb-1">Purchase Unit of Measure (PUOM)</label>
            <select id="puom" name="puom" value={formData.puom} onChange={handleInputChange} required
                    className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200">
              {commonUnits.map(unit => (
                <option key={unit} value={unit} className="bg-white text-deepGray">{unit}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pcp" className="block text-offWhite text-sm font-bold mb-1">Purchase Cost Price (PCP)</label>
            <input type="number" step="0.0001" id="pcp" name="pcp" value={formData.pcp} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="muom" className="block text-offWhite text-sm font-bold mb-1">Manufacturing Unit of Measure (MUOM)</label>
            <select id="muom" name="muom" value={formData.muom} onChange={handleInputChange} required
                    className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200">
              {commonUnits.map(unit => (
                <option key={unit} value={unit} className="bg-white text-deepGray">{unit}</option> 
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unitConversionFactor" className="block text-offWhite text-sm font-bold mb-1">Unit Conversion Factor (PUOM to MUOM)</label> 
            <input type="number" step="0.000000001" id="unitConversionFactor" name="unitConversionFactor" value={formData.unitConversionFactor} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="overheadFactor" className="block text-offWhite text-sm font-bold mb-1">Overhead Factor (e.g., 1.25 for 25% overhead)</label> 
            <input type="number" step="0.01" id="overheadFactor" name="overheadFactor" value={formData.overheadFactor} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="currentStockPUOM" className="block text-offWhite text-sm font-bold mb-1">Current Stock (in PUOM)</label>
            <input type="number" step="0.01" id="currentStockPUOM" name="currentStockPUOM" value={formData.currentStockPUOM} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="minStockPUOM" className="block text-offWhite text-sm font-bold mb-1">Minimum Stock (in PUOM)</label>
            <input type="number" step="0.01" id="minStockPUOM" name="minStockPUOM" value={formData.minStockPUOM} onChange={handleInputChange} required
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="supplier" className="block text-offWhite text-sm font-bold mb-1">Supplier</label>
            <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleInputChange}
                   className="shadow appearance-none border border-lightGreen rounded-xl w-full py-2 px-3 bg-white text-deepGray leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition duration-200 placeholder-gray-400" />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
            {editingMaterialId && (
              <button
                type="button"
                onClick={() => {
                  setEditingMaterialId(null);
                  setFormData({ 
                    code: '', description: '', materialType: '', puom: '', pcp: '', muom: '', unitConversionFactor: '', overheadFactor: '',
                    currentStockPUOM: '', minStockPUOM: '', supplier: '', 
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-colors duration-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              {editingMaterialId ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>

      {/* CSV Upload Section Card */}
      {/* Card styling: bg-mediumGreen, rounded-xl, shadow-lg, border-gray-700 */}
      <div className="bg-mediumGreen p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-offWhite mb-4">Upload Materials from CSV</h2> {/* Heading inside card is offWhite */}
        <p className="text-gray-300 text-sm mb-4">
          Upload a CSV file containing your materials. The CSV must have the following header row:<br/>
          <code className="text-white bg-deepGray px-2 py-1 rounded text-xs">code,description,materialType,puom,pcp,muom,unitConversionFactor,overheadFactor,currentStockPUOM,minStockPUOM,supplier</code>
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            // File input styling consistent with other inputs
            className="block w-full text-sm text-offWhite file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors duration-200 cursor-pointer"
          />
        </div>
        {csvMessage && (
          <p className={`mt-4 text-sm font-semibold ${csvMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {csvMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default MaterialManagementPage;