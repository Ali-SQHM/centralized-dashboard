// src/components/InstantQuoteAppPage.jsx
// Provides the user interface and logic for generating instant quotes for custom canvases.
// Fetches material data from Firestore for calculations.

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore'; 
import { colors, commonUnits, materialTypes } from '../utils/constants'; // Import constants

function InstantQuoteAppPage({ db, onInternalNav, firestoreAppId }) { // Receive db and firestoreAppId
  const [productType, setProductType] = useState('CAN'); // Default to Canvas
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState(''); // For Round
  const [majorAxis, setMajorAxis] = useState(''); // For Oval
  const [minorAxis, setMinorAxis] = useState(''); // For Oval
  const [depth, setDepth] = useState('');
  const [unit, setUnit] = useState('CM');
  const [fabricType, setFabricType] = useState('');
  const [finish, setFinish] = useState('');
  const [trayFrameAddon, setTrayFrameAddon] = useState('');
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
  const [sku, setSku] = useState('');
  const [quotePrice, setQuotePrice] = useState(null);
  const [materialsData, setMaterialsData] = useState([]); // All materials from Firestore
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [errorMaterials, setErrorMaterials] = useState(null);

  // Firestore collection reference for materials (PUBLICLY ACCESSIBLE)
  // This function now uses the firestoreAppId prop directly.
  const getPublicMaterialsCollectionRef = () => {
    if (!db || !firestoreAppId) { // Ensure both are available
      console.error("Firestore DB or App ID not available for public materials reference in InstantQuoteAppPage.");
      return null;
    }
    // THIS IS THE PUBLIC PATH for materials, consistent with MaterialManagementPage
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
  };

  // Fetch all materials on component mount
  useEffect(() => {
    // Only proceed if db and firestoreAppId are available
    if (!db || !firestoreAppId) {
      console.log("Skipping material fetch for Quote App: DB or firestoreAppId not ready.");
      return;
    }

    const materialsColRef = getPublicMaterialsCollectionRef();
    if (!materialsColRef) {
      setErrorMaterials("Firestore materials collection reference could not be established. Check Firebase DB connection or app ID.");
      setLoadingMaterials(false);
      return;
    }

    setLoadingMaterials(true);
    const q = query(materialsColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMaterials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterialsData(fetchedMaterials);
      setLoadingMaterials(false);
      setErrorMaterials(null);
      console.log("Materials fetched successfully for Quote App:", fetchedMaterials);
    }, (err) => {
      console.error("Error fetching materials for Quote App:", err);
      setErrorMaterials(`Failed to load material options: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/{your_app_id}/public/data/materials.`);
      setLoadingMaterials(false);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId]); // Depend on db and firestoreAppId


  // Helper to filter materials by type
  const getMaterialsByType = (type) => {
    return materialsData.filter(m => m.materialType === type);
  };

  // Helper to get material code/data from code (for dynamic dropdowns and calculations)
  const getMaterialByCode = (code) => materialsData.find(m => m.code === code);

  // SKU Generation Logic (Complex based on blueprint)
  useEffect(() => {
    let generatedSku = '';
    let currentPrice = 0; // For preliminary quote

    // Function to safely parse float, return 0 if invalid
    const parseNum = (value) => parseFloat(value) || 0;

    // Preliminary price calculation for Canvas (mock)
    const calculatePreliminaryPrice = () => {
        let totalCost = 0;

        // Base cost (e.g., handling, labor)
        totalCost += 10.00; // Small fixed base cost

        // Dimensions based cost (area)
        let areaCm2 = 0;
        if (unit === 'IN') { // Convert dimensions to CM if unit is inches for consistent calculation
            const heightCm = parseNum(height) * 2.54;
            const widthCm = parseNum(width) * 2.54;
            const diameterCm = parseNum(diameter) * 2.54;
            const majorAxisCm = parseNum(majorAxis) * 2.54;
            const minorAxisCm = parseNum(minorAxis) * 2.54;

            if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') {
                areaCm2 = heightCm * widthCm;
            } else if (productType === 'RND') {
                areaCm2 = Math.PI * Math.pow(diameterCm / 2, 2);
            } else if (productType === 'OVL') {
                areaCm2 = Math.PI * (majorAxisCm / 2) * (minorAxisCm / 2);
            }
        } else { // Unit is CM
            if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') {
                areaCm2 = parseNum(height) * parseNum(width);
            } else if (productType === 'RND') {
                areaCm2 = Math.PI * Math.pow(parseNum(diameter) / 2, 2);
            } else if (productType === 'OVL') {
                areaCm2 = Math.PI * (parseNum(majorAxis) / 2) * (parseNum(minorAxis) / 2);
            }
        }
        
        // Use MUOM values (which are in cm, cm2, etc.) for calculations
        // Assuming mcp for fabric/finish is per cm2 (or suitable MUOM)
        const selectedFabric = getMaterialByCode(fabricType);
        if (selectedFabric && areaCm2 > 0) {
            totalCost += (selectedFabric.mcp || 0) * (areaCm2); // MCP is already per MUOM (cm2)
        }

        const selectedFinish = getMaterialByCode(finish);
        if (selectedFinish && areaCm2 > 0) {
            totalCost += (selectedFinish.mcp || 0) * (areaCm2); // MCP is already per MUOM (cm2)
        }

        const selectedDepthProfile = getMaterialByCode(`D${depth}`); 
        if (selectedDepthProfile) {
            let perimeterCm = 0;
            const currentHeight = (unit === 'IN') ? parseNum(height) * 2.54 : parseNum(height);
            const currentWidth = (unit === 'IN') ? parseNum(width) * 2.54 : parseNum(width);
            const currentDiameter = (unit === 'IN') ? parseNum(diameter) * 2.54 : parseNum(diameter);
            const currentMajorAxis = (unit === 'IN') ? parseNum(majorAxis) * 2.54 : parseNum(majorAxis);
            const currentMinorAxis = (unit === 'IN') ? parseNum(minorAxis) * 2.54 : parseNum(minorAxis);


            if (productType === 'CAN' || productType === 'PAN' || productType === 'STB') {
                perimeterCm = 2 * (currentHeight + currentWidth);
            } else if (productType === 'RND') {
                perimeterCm = Math.PI * currentDiameter;
            } else if (productType === 'OVL') {
                const a = currentMajorAxis / 2;
                const b = currentMinorAxis / 2;
                perimeterCm = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
            }
            totalCost += (selectedDepthProfile.mcp || 0) * perimeterCm; // Assuming MCP for profile is per cm
        }

        const selectedTrayFrame = getMaterialByCode(trayFrameAddon);
        if (selectedTrayFrame) {
            // Need to determine how many tray frame units are needed based on product dimensions
            // For now, a placeholder calculation. This needs a more precise rule from the blueprint.
            totalCost += (selectedTrayFrame.mcp || 0) * 1; // Assuming 1 unit of tray frame material per product
        }

        // Custom braces
        const braceMaterial = getMaterialsByType('Wood').find(m => m.code.includes('BRACE')); // Assuming a generic brace material
        if (braceMaterial && (parseNum(customHBraces) > 0 || parseNum(customWBraces) > 0)) {
            const totalBraceLengthCm = 
                (parseNum(customHBraces) * ((unit === 'IN' ? parseNum(width) * 2.54 : parseNum(width)))) + 
                (parseNum(customWBraces) * ((unit === 'IN' ? parseNum(height) * 2.54 : parseNum(height))));
            totalCost += (braceMaterial.mcp || 0) * totalBraceLengthCm; // Assuming MCP for braces is per cm
        }

        // Add a general markup/profit margin (e.g., 20%)
        totalCost *= 1.20;

        // Apply a floor price or minimum
        totalCost = Math.max(totalCost, 25.00); // Minimum £25.00 for any quote

        return totalCost;
    };


    switch (productType) {
      case 'CAN': // Canvas
        const canvasDepths = {
          '25': 'D25', '32': 'D32', '40': 'D40', '44': 'D44'
        };
        const selectedDepthAbbr = canvasDepths[depth] || '';

        const fabricObj = getMaterialByCode(fabricType); // Get full material object
        const finishObj = getMaterialByCode(finish);   // Get full material object

        let fabricAbbr = fabricObj?.code || ''; 
        let finishAbbr = finishObj?.code || ''; 
        
        // Handle specific finishes in SKU as per blueprint (UP, WPR, BPR, CLR, NAT)
        if (finishAbbr === 'WPR') finishAbbr = 'PRW'; 
        if (finishAbbr === 'BPR') finishAbbr = 'PRB';
        if (finishAbbr === 'CLR') finishAbbr = 'CSL'; 

        // Apply compatibility rules for finishes
        if ((fabricAbbr === 'OIL' || fabricAbbr === 'SUP') && finishAbbr !== 'NAT') {
            finishAbbr = 'NAT'; 
        } else if (fabricAbbr === '12OZ' && !['UP', 'PRW', 'PRB'].includes(finishAbbr)) {
            finishAbbr = 'UP'; 
        } else if (fabricAbbr === 'LIN' && !['UP', 'PRW', 'CSL'].includes(finishAbbr)) {
            finishAbbr = 'UP'; 
        }

        let trayFramePart = '';
        const trayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; // Use '44' from state
        if (trayFrameAddon && trayFrameValid) { 
          trayFramePart = `-${trayFrameAddon}`; 
        }

        let customBracingPart = '';
        const totalCustomBraces = parseNum(customHBraces) + parseNum(customWBraces);
        if (totalCustomBraces > 0 && totalCustomBraces <= 6) { // Max 6 braces
          customBracingPart = `-H${parseNum(customHBraces)}W${parseNum(customWBraces)}`;
        }

        // Basic validation for dimensions
        const validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
        const validDepth = selectedDepthAbbr !== '';
        const validFabric = fabricAbbr !== '';
        const validFinish = finishAbbr !== '';

        if (validDimensions && validDepth && validFabric && validFinish) {
            generatedSku = `CAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}-${fabricAbbr}-${finishAbbr}${trayFramePart}${customBracingPart}`;
            currentPrice = calculatePreliminaryPrice();
        } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
        }

        break;
      // Add other product types here later: PAN, RND, OVL, TRA, STB
      case 'PAN': // Painting Panel - Simplified for now
          const panelDepths = {
            '25': 'D25', '32': 'D32', '44': 'D44'
          };
          const panelDepthAbbr = panelDepths[depth] || 'DXX';
          const panelFabricObj = getMaterialByCode(fabricType);
          const panelFabricAbbr = panelFabricObj?.code || 'BARE'; // Assuming 'BARE' if no fabric
          const panelFinishObj = getMaterialByCode(finish);
          let panelFinishAbbr = panelFinishObj?.code || 'NAT'; // Assuming 'NAT' if no finish
            if (panelFinishAbbr === 'WPR') panelFinishAbbr = 'PRW'; 
            if (panelFinishAbbr === 'BPR') panelFinishAbbr = 'PRB';
            if (panelFinishAbbr === 'CLR') panelFinishAbbr = 'CSL'; 

          const panelTrayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; // Use '44' from state
          const panelTrayFramePart = (trayFrameAddon && panelTrayFrameValid) ? `-${trayFrameAddon}` : '';

          if (parseNum(height) > 0 && parseNum(width) > 0 && panelDepthAbbr !== 'DXX') {
            generatedSku = `PAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${panelDepthAbbr}-${unit}-${panelFabricAbbr}-${panelFinishAbbr}${panelTrayFramePart}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'RND': // Round - Simplified for now
          const rndDepths = {
            '24': 'D24', '30': 'D30', '36': 'D36', '42': 'D42'
          };
          const rndDepthAbbr = rndDepths[depth] || 'DXX'; // Prefix D for SKU
          const rndFabricObj = getMaterialByCode(fabricType);
          const rndFabricAbbr = rndFabricObj?.code || '12OZ'; // Default for round/oval if no specific material
          const rndFinishObj = getMaterialByCode(finish);
          let rndFinishAbbr = rndFinishObj?.code || '';
            if (rndFinishAbbr === 'WPR') rndFinishAbbr = 'PRW'; 
            if (rndFinishAbbr === 'BPR') rndFinishAbbr = 'PRB';
            if (rndFinishAbbr === 'CLR') rndFinishAbbr = 'CSL'; 
          
          if (parseNum(diameter) > 0 && rndDepthAbbr !== 'DXX') {
            generatedSku = `RND-${parseNum(diameter).toFixed(1)}-${rndDepthAbbr}-${unit}-${rndFabricAbbr}${rndFinishAbbr ? '-' + rndFinishAbbr : ''}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'OVL': // Oval - Simplified for now
          const ovlDepths = {
            '24': 'D24', '30': 'D30', '36': 'D36', '42': 'D42'
          };
          const ovlDepthAbbr = ovlDepths[depth] || 'DXX'; // Prefix D for SKU
          const ovlFabricObj = getMaterialByCode(fabricType);
          const ovlFabricAbbr = ovlFabricObj?.code || '12OZ'; // Default for round/oval if no specific material
          const ovlFinishObj = getMaterialByCode(finish);
          let ovlFinishAbbr = ovlFinishObj?.code || '';
            if (ovlFinishAbbr === 'WPR') ovlFinishAbbr = 'PRW'; 
            if (ovlFinishAbbr === 'BPR') ovlFinishAbbr = 'PRB';
            if (ovlFinishAbbr === 'CLR') ovlFinishAbbr = 'CSL'; 

          if (parseNum(majorAxis) > 0 && parseNum(minorAxis) > 0 && ovlDepthAbbr !== 'DXX') {
            generatedSku = `OVL-${parseNum(majorAxis).toFixed(1)}-${parseNum(minorAxis).toFixed(1)}-${ovlDepthAbbr}-${unit}-${ovlFabricAbbr}${ovlFinishAbbr ? '-' + ovlFinishAbbr : ''}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'TRA': // Tray Frame - Simplified for now
          const trayFinishObj = getMaterialByCode(finish);
          let trayFinishAbbr = trayFinishObj?.code || 'NAT';
            if (trayFinishAbbr === 'WPR') trayFinishAbbr = 'PRW'; 
            if (trayFinishAbbr === 'BPR') trayFinishAbbr = 'PRB';
            if (trayFinishAbbr === 'CLR') trayFinishAbbr = 'CSL'; 

          if (parseNum(height) > 0 && parseNum(width) > 0) {
            generatedSku = `TRA-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-PXX-${unit}-${trayFinishAbbr}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      case 'STB': // Stretcher Bar Frame - Simplified for now
          const stbDepths = {
            '25': 'D25', '32': 'D32', '40': 'D40', '44': 'D44'
          };
          const stbDepthAbbr = stbDepths[depth] || 'DXX'; // Prefix D for SKU
          const stbTotalCustomBraces = parseNum(customHBraces) + parseNum(customWBraces);
          const stbCustomBracingPart = (stbTotalCustomBraces > 0 && stbTotalCustomBraces <= 6) ? `-H${parseNum(customHBraces)}W${parseNum(customWBraces)}` : '';

          if (parseNum(height) > 0 && parseNum(width) > 0 && stbDepthAbbr !== 'DXX') {
            generatedSku = `STB-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${stbDepthAbbr}-${unit}${stbCustomBracingPart}`;
            currentPrice = calculatePreliminaryPrice();
          } else {
            generatedSku = 'Incomplete configuration';
            currentPrice = null;
          }
          break;
      default:
        generatedSku = 'Select a product type';
        currentPrice = null;
    }

    setSku(generatedSku);
    setQuotePrice(currentPrice !== null ? `£${currentPrice.toFixed(2)}` : null);

  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, customHBraces, customWBraces, materialsData]); 


  // Reset fields when product type changes
  useEffect(() => {
    setHeight('');
    setWidth('');
    setDiameter('');
    setMajorAxis('');
    setMinorAxis('');
    setDepth('');
    setUnit('CM');
    setFabricType('');
    setFinish('');
    setTrayFrameAddon('');
    setCustomHBraces(0);
    setCustomWBraces(0);
    setSku('');
    setQuotePrice(null);
  }, [productType]);


  // Define specific dropdown options based on fetched materials and blueprint rules
  const getDepthOptions = () => {
    switch (productType) {
      case 'CAN': return ['25', '32', '40', '44']; // Use numeric values for depth in state
      case 'PAN': return ['25', '32', '44'];
      case 'RND':
      case 'OVL': return ['24', '30', '36', '42'];
      case 'STB': return ['25', '32', '40', '44'];
      default: return [];
    }
  };

  const getFabricOptions = () => {
    const fabrics = getMaterialsByType('Fabric');
    switch (productType) {
      case 'CAN':
      case 'PAN': return fabrics.map(f => f.code); // All fabric codes
      case 'RND':
      case 'OVL': return fabrics.filter(f => f.code === '12OZ').map(f => f.code); // Only 12OZ for Rounds/Ovals (as per doc)
      default: return [];
    }
  };

  const getFinishOptions = () => {
    const finishes = getMaterialsByType('Mediums/Coatings'); // Finishes are mediums/coatings
    const allowedFinishes = finishes.map(f => f.code); 

    // Filter based on selected fabric type (Canvas and Panel rules)
    if (productType === 'CAN' || productType === 'PAN') {
        if (fabricType === 'SUP' || fabricType === 'OIL') {
            return allowedFinishes.filter(f => f === 'NAT');
        } else if (fabricType === '12OZ') {
            return allowedFinishes.filter(f => ['UP', 'WPR', 'BPR'].includes(f));
        } else if (fabricType === 'LIN') {
            return allowedFinishes.filter(f => ['UP', 'WPR', 'CSL'].includes(f));
        }
    } else if (productType === 'RND' || productType === 'OVL') {
        // For Round/Oval, if fabric covered, only PRW/PRB
        if (fabricType === '12OZ') {
            return allowedFinishes.filter(f => ['WPR', 'BPR'].includes(f));
        } else { // Bare panels, based on similar options as Panel
            return allowedFinishes.filter(f => ['NAT', 'CLR', 'WPR', 'BPR'].includes(f)); 
        }
    }
    return allowedFinishes; 
  };

  const getTrayFrameAddonOptions = () => {
      // Filter for actual tray frame materials like T25N, T32W etc.
      const trayFrames = materialsData.filter(m => m.code.startsWith('T25') || m.code.startsWith('T32'));
      
      // Tray frame is invalid if Canvas/Panel depth is D44
      if ((productType === 'CAN' || productType === 'PAN') && depth === '44') return []; // Use '44' from state
      
      // Only show T25x for D25, T32x for D32/D40
      if (productType === 'CAN' || productType === 'PAN') {
          if (depth === '25') return trayFrames.filter(tf => tf.code.startsWith('T25')).map(tf => tf.code);
          if (depth === '32' || depth === '40') return trayFrames.filter(tf => tf.code.startsWith('T32')).map(tf => tf.code);
      }
      return []; 
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-['Poppins']" style={{ backgroundColor: colors.deepGray }}>
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2" style={{ color: colors.offWhite }}>
          HM Instant Quote
        </h1>
        <p className="text-xl sm:text-2xl font-semibold" style={{ color: colors.lightGreen }}>
          Your bespoke canvas cost estimator
        </p>
      </header>

      {loadingMaterials && <p className="text-lightGreen mb-4">Loading material options...</p>}
      {errorMaterials && <p className="text-red-400 mb-4">{errorMaterials}</p>}

      <div className="bg-mediumGreen rounded-xl shadow-lg p-8 w-full max-w-lg"> {/* Increased max-width */}
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.offWhite }}>
          Product Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type Selection */}
          <div>
            <label htmlFor="productType" className="block text-offWhite text-sm font-semibold mb-2">
              Product Type
            </label>
            <select
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
            >
              <option value="CAN" className="bg-deepGray text-offWhite">Canvas (CAN)</option>
              <option value="PAN" className="bg-deepGray text-offWhite">Painting Panel (PAN)</option>
              <option value="RND" className="bg-deepGray text-offWhite">Round (RND)</option>
              <option value="OVL" className="bg-deepGray text-offWhite">Oval (OVL)</option>
              <option value="TRA" className="bg-deepGray text-offWhite">Tray Frame (TRA)</option>
              <option value="STB" className="bg-deepGray text-offWhite">Stretcher Bar Frame (STB)</option>
            </select>
          </div>

          {/* Unit Selection */}
          <div>
            <label htmlFor="unit" className="block text-offWhite text-sm font-semibold mb-2">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
            >
              <option value="CM" className="bg-deepGray text-offWhite">CM</option>
              <option value="IN" className="bg-deepGray text-offWhite">IN</option>
            </select>
          </div>

          {/* Conditional Dimension Inputs based on Product Type */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') && (
            <>
              <div>
                <label htmlFor="height" className="block text-offWhite text-sm font-semibold mb-2">
                  Height ({unit})
                </label>
                <input
                  type="number" step="0.1" id="height" value={height} onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen placeholder-offWhite/70"
                  placeholder="e.g., 80.0"
                />
              </div>
              <div>
                <label htmlFor="width" className="block text-offWhite text-sm font-semibold mb-2">
                  Width ({unit})
                </label>
                <input
                  type="number" step="0.1" id="width" value={width} onChange={(e) => setWidth(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen placeholder-offWhite/70"
                  placeholder="e.g., 60.0"
                />
              </div>
            </>
          )}

          {productType === 'RND' && (
            <div>
              <label htmlFor="diameter" className="block text-offWhite text-sm font-semibold mb-2">
                Diameter ({unit})
              </label>
              <input
                type="number" step="0.1" id="diameter" value={diameter} onChange={(e) => setDiameter(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen placeholder-offWhite/70"
                placeholder="e.g., 120.0"
              />
            </div>
          )}

          {productType === 'OVL' && (
            <>
              <div>
                <label htmlFor="majorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                  Major Axis ({unit})
                </label>
                <input
                  type="number" step="0.1" id="majorAxis" value={majorAxis} onChange={(e) => setMajorAxis(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen placeholder-offWhite/70"
                  placeholder="e.g., 100.0"
                />
              </div>
              <div>
                <label htmlFor="minorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                  Minor Axis ({unit})
                </label>
                <input
                  type="number" step="0.1" id="minorAxis" value={minorAxis} onChange={(e) => setMinorAxis(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen placeholder-offWhite/70"
                  placeholder="e.g., 70.0"
                />
              </div>
            </>
          )}

          {/* Depth Selection (Common for most) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL' || productType === 'STB') && (
            <div>
              <label htmlFor="depth" className="block text-offWhite text-sm font-semibold mb-2">
                Depth
              </label>
              <select
                id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
              >
                <option value="">Select Depth</option>
                {getDepthOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{`D${opt}`}</option> 
                ))}
              </select>
            </div>
          )}

          {/* Fabric Type Selection (Canvas, Panel, Round, Oval) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL') && (
            <div>
              <label htmlFor="fabricType" className="block text-offWhite text-sm font-semibold mb-2">
                Fabric Type
              </label>
              <select
                id="fabricType" value={fabricType} onChange={(e) => setFabricType(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
              >
                <option value="">Select Fabric</option>
                {getFabricOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Finish Selection (Canvas, Panel, Round, Oval) */}
          {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL') && (
            <div>
              <label htmlFor="finish" className="block text-offWhite text-sm font-semibold mb-2">
                Finish
              </label>
              <select
                id="finish" value={finish} onChange={(e) => setFinish(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
              >
                <option value="">Select Finish</option>
                {getFinishOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tray Frame Add-on (Canvas, Panel) */}
          {(productType === 'CAN' || productType === 'PAN') && (
            <div>
              <label htmlFor="trayFrameAddon" className="block text-offWhite text-sm font-semibold mb-2">
                Tray Frame Add-on
              </label>
              <select
                id="trayFrameAddon" value={trayFrameAddon} onChange={(e) => setTrayFrameAddon(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                disabled={depth === '44'} // Disable if depth is D44
              >
                <option value="">No Tray Frame</option>
                {getTrayFrameAddonOptions().map(opt => (
                  <option key={opt} value={opt} className="bg-deepGray text-offWhite">{opt}</option>
                ))}
              </select>
              {depth === '44' && (
                  <p className="text-red-300 text-xs mt-1">Tray Frame not compatible with D44 depth.</p>
              )}
            </div>
          )}

          {/* Custom Cross Braces (Canvas, Stretcher Bar Frame) */}
          {(productType === 'CAN' || productType === 'STB') && (
            <>
              <div>
                <label htmlFor="customHBraces" className="block text-offWhite text-sm font-semibold mb-2">
                  Custom Horizontal Braces (0-3)
                </label>
                <input
                  type="number" step="1" min="0" max="3" id="customHBraces" value={customHBraces} onChange={(e) => setCustomHBraces(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                />
              </div>
              <div>
                <label htmlFor="customWBraces" className="block text-offWhite text-sm font-semibold mb-2">
                  Custom Vertical Braces (0-3)
                </label>
                <input
                  type="number" step="1" min="0" max="3" id="customWBraces" value={customWBraces} onChange={(e) => setCustomWBraces(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                />
              </div>
              {(parseInt(customHBraces) + parseInt(customWBraces) > 6) && (
                  <p className="text-red-300 text-xs mt-1 md:col-span-2">Total braces cannot exceed 6.</p>
              )}
            </>
          )}

        </div>

        {/* Generated SKU and Quote Price */}
        <div className="mt-8 text-center">
          <h3 className="text-2xl font-bold" style={{ color: colors.offWhite }}>
            Generated SKU:
          </h3>
          <p className="text-xl font-extrabold mt-2 text-lightGreen break-all">
            {sku || 'Configure product...'}
          </p>

          <h3 className="text-2xl font-bold mt-4" style={{ color: colors.offWhite }}>
            Estimated Price:
          </h3>
          <p className="text-4xl font-extrabold mt-2" style={{ color: colors.accentGold }}>
            {quotePrice || '£0.00'}
          </p>
        </div>
      </div>

      {/* Link back to MRP System (using onInternalNav) */}
      <div className="mt-8">
        <button
          onClick={() => onInternalNav('mrp')} // Use onInternalNav to go back to MRP
          className="p-3 rounded-lg font-semibold transition-colors duration-200 inline-block"
          style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
          Back to MRP System
        </button>
      </div>
    </div>
  );
}

export default InstantQuoteAppPage;