// src/components/InstantQuoteAppPage.jsx
// Provides the user interface and logic for generating instant quotes for custom canvases.
// Fix: UNP (Unprimed) and NAT (Natural) are no longer Firestore materials; handled as direct zero cost options.
// Fix: Tray Frame Wood codes are T25N and T32N.
// Fix: Adjusted '12oz' fabricType comparison to lowercase 'oz' to match expected Firestore code.
// Fix: Finish dropdown displays user-friendly descriptions.
// Fix: When "Add Fabric to Panel" is checked, default fabricType to '12oz' to prevent finish dropdown "jumping".
// Fix: Adjusted panelHasFabric useEffect dependencies to resolve panel jumping/SKU not configuring issues.
// Fix: Ensured 'CAN' product defaults to '12oz' fabric on product type change to enable cost calculation from start.
// Fix: Corrected syntax error in useState declaration for loadingMaterials.
// FIX: Panels now use KEY cost, not WDG.
// FIX: Panels now have specific bracing logic: one brace along smallest side if largest side > 90cm, no custom bracing.
// FIX: Panels use CB brace for 25mm depth, PA brace for 32mm/44mm depth.
// FIX: Panels use P25 profile for 25mm depth, PA profile for 32mm/44mm depth.
// FIX: RND/OVL MDF6 sheet material cost now correctly calculates based on layers and 6cm ring area.
// FIX: RND/OVL CB cross braces now correctly calculate based on size (>=90cm) for both FrameOnly and Stretched.
// FIX: Input field styling updated to white background.
// FIX: TRA SKU now uses D{depth} for consistency.
// FIX: CAN product now has CLR (Clear Sealed) finish option for Linen (LIN) fabric.
// FIX: TRA product now displays depth options.
// FIX: Tray Frame Add-on dropdown is hidden for TRA product.
// FIX: Fabric (and dependent finish) costs now correctly incorporate a +24cm waste margin to height/width/diameter/axes, using specific square cut for RND/OVL.
// FIX: CAN and STB cross braces now subtract 5cm from their respective lengths.
// FIX: Delivery Area calculation for STB now uses (MAX(H,W)+5)*10.
// FIX: Delivery Area calculation for RND/OVL now uses (Diameter+10)*(Diameter+10) or (Major+10)*(Minor+10).
// FIX: Packaging Cost for RND/OVL now uses Diameter*Diameter*2.2 or Minor*Minor*2.2.
// FIX: PLY6 Panel Material Cost now uses (H+2)*(W+2) waste margin.
// FIX: Finish Cost for 12oz WPR/BPR and LIN CLR/WPR now correctly applies 2x MCP or combined MCPs. (CSL corrected to CLR)
// FIX: Tray Frame Add-on Cost now uses specific perimeters (H+4.2/3.4)*2 + (W+4.2/3.4)*2 based on depth.
// FIX: PAN product depth options restricted to 25, 32, 44mm.
// FIX: PAN product profile cost for 44mm depth is now MCP * 2 * perimeter.
// FIX: Corrected typo 'நிகழ்ச்சி' to '[]' in useCallback dependency array for parseNum.
// FIX: Corrected SKU generation for CAN products to use Height and Width correctly.
// FIX: Restricted depth options for TRA (Tray Frame) product to exclude 44mm.
// NEW: Fabric dropdown order customized to 12oz, Superfine, Linen, Oil primed.
// NEW: Dropdown styling updated (white background, dark text, light green highlight).
// NEW: Markup logic completely revised based on Sales Price % rules for each product type and CAN area bands.
// NEW: VAT (20%) applied as the final step.
// NEW: Added Panel Material (PLY6) cost for bare PAN products.
// NEW: Enhanced console logs for material lookups in calculatePreliminaryPrice.
// REFINEMENTS:
// - Precise Finish options logic based on Fabric Type and Product Type.
// - Enhanced robustness for material data access and calculations.
// - Automatic resetting of dependent dropdown states (Finish, Tray Frame) upon upstream changes.
// - Form layout adjusted for better readability of longer descriptions.
// - DEFAULT BRACING MODE IS NOW "Standard (Automatic)". Custom inputs appear only when "Custom" is selected.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore'; 
import { colors, commonUnits, materialTypes } from '../utils/constants'; 

function InstantQuoteAppPage({ db, onInternalNav, firestoreAppId, userId }) { 
  // Helper function for parsing numbers, memoized for performance
  const parseNum = useCallback((value) => parseFloat(value) || 0, []);

  // --- State Variables ---
  const [productType, setProductType] = useState('CAN'); 
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState('');
  const [majorAxis, setMajorAxis] = useState('');
  const [minorAxis, setMinorAxis] = useState('');
  const [depth, setDepth] = useState(''); 
  const [unit, setUnit] = useState('CM');
  const [fabricType, setFabricType] = useState(''); // This now applies to CAN, and stretched PAN/RND/OVL
  const [finish, setFinish] = useState(''); // Finish for fabric on CAN/RND/OVL, or panel surface for PAN
  const [trayFrameAddon, setTrayFrameAddon] = useState(''); 
  const [bracingMode, setBracingMode] = useState('Standard'); 
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
  
  // New product-specific states
  const [roundOption, setRoundOption] = useState('Stretched'); // 'FrameOnly', 'Stretched' for RND/OVL
  const [panelHasFabric, setPanelHasFabric] = useState(false); // true if adding fabric to a NAT panel

  const [sku, setSku] = useState('');
  const [quotePrice, setQuotePrice] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true); 
  const [errorMaterials, setErrorMaterials] = useState(null);
  const [quoteSaveMessage, setQuoteSaveMessage] = useState('');

  const [costBreakdown, setCostBreakdown] = useState({
    deliveryCost: 0, 
    fabricCost: 0,
    finishCost: 0,
    profileCost: 0, 
    trayFrameCost: 0,
    braceCost: 0,
    wedgeCost: 0, 
    keyCost: 0,   
    packagingCost: 0, 
    panelMaterialCost: 0, 
    roundMaterialCost: 0, 
    subtotal: 0,
    markupAmount: 0,
    finalPriceBeforeVAT: 0, 
    finalPriceWithVAT: 0,   
  });


  // --- Firestore References ---
  const getPublicMaterialsCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for public materials reference in InstantQuoteAppPage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
  };

  const getPublicQuotesCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for public quotes reference in InstantQuoteAppPage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/quotes`);
  };

  // --- Fetch Materials Effect ---
  useEffect(() => {
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
      console.log("--- DEBUGGING LOG --- Materials fetched successfully. Total:", fetchedMaterials.length);
      const materialTypesFound = new Set(fetchedMaterials.map(m => m.materialType));
      console.log("--- DEBUGGING LOG --- Unique Material Types Found in Firestore:", Array.from(materialTypesFound));
      // console.log("--- DEBUGGING LOG --- Fetched Materials Data (full list):", fetchedMaterials); // Uncomment for full data dump
    }, (err) => {
      console.error("Error fetching materials for Quote App:", err);
      setErrorMaterials(`Failed to load material options: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/${firestoreAppId}/public/data/materials.`);
      setLoadingMaterials(false);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId]);


  // --- Memoized Material Getters ---
  const getMaterialsByType = useCallback((type) => {
    if (!materialsData || materialsData.length === 0) {
        console.log(`--- DEBUGGING LOG (getMaterialsByType) --- No materialsData or empty for type: ${type}`);
        return [];
    }
    const filtered = materialsData.filter(m => m.materialType === type);
    console.log(`--- DEBUGGING LOG (getMaterialsByType) --- Found ${filtered.length} materials for type: ${type}`);
    return filtered;
  }, [materialsData]);

  const getMaterialByCode = useCallback((code) => {
    if (!materialsData || materialsData.length === 0 || !code) {
        console.log(`--- DEBUGGING LOG (getMaterialByCode) --- No materialsData or empty, or no code provided for code: ${code}`);
        return null;
    }
    const found = materialsData.find(m => m.code === code);
    console.log(`--- DEBUGGING LOG (getMaterialByCode) --- Material for code ${code} found:`, found ? 'Yes' : 'No', found);
    return found;
  }, [materialsData]);


  // --- Preliminary Price Calculation ---
  const calculatePreliminaryPrice = useCallback(() => {
    try {
        let breakdown = {
            deliveryCost: 0, 
            fabricCost: 0,
            finishCost: 0,
            profileCost: 0, 
            trayFrameCost: 0,
            braceCost: 0,
            wedgeCost: 0, 
            keyCost: 0,   
            packagingCost: 0, 
            panelMaterialCost: 0, 
            roundMaterialCost: 0, 
            subtotal: 0,
            markupAmount: 0,
            finalPriceBeforeVAT: 0, 
            finalPriceWithVAT: 0,   
        };

        let cumulativeCost = 0;

        const MINIMUM_QUOTE_PRICE = 25.00; 
        const BRACE_STANDARD_INTERVAL_CM = 90; 
        const VAT_MULTIPLIER = 1.20; // 120% including VAT
        const FABRIC_WASTE_MARGIN = 24.0; // +24cm for fabric calculation
        const PLY6_WASTE_MARGIN = 2.0; // +2cm for PLY6 material calculation
        const MDF_LAYER_THICKNESS = 6.0; // in mm
        const MDF_RING_WIDTH = 12.0; // in cm
        const RND_OVL_BRACE_CLEARANCE_CM = 6.0; // Clearance for Round/Oval braces
        const CAN_STB_BRACE_CLEARANCE_CM = 5.0; // Clearance for CAN/STB braces
        const TRAY_FRAME_25MM_ADDITION = 4.2; // Addition for 25mm tray frame perimeter
        const TRAY_FRAME_OTHER_ADDITION = 3.4; // Addition for 32mm/40mm tray frame perimeter


        const convertToCm = (val) => (unit === 'IN' ? parseNum(val) * 2.54 : parseNum(val));
        const currentHeight = convertToCm(height);
        const currentWidth = convertToCm(width);
        const currentDiameter = convertToCm(diameter);
        const currentMajorAxis = convertToCm(majorAxis);
        const currentMinorAxis = convertToCm(minorAxis);

        // productAreaCm2 represents the *actual* area of the product, not including waste for fabric/plywood
        let productAreaCm2 = 0; 
        let productPerimeterCm = 0;

        if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA' || productType === 'STB') {
            productAreaCm2 = currentHeight * currentWidth;
            productPerimeterCm = 2 * (currentHeight + currentWidth);
        } else if (productType === 'RND') {
            productAreaCm2 = Math.PI * Math.pow(currentDiameter / 2, 2); 
            productPerimeterCm = Math.PI * currentDiameter;
        } else if (productType === 'OVL') {
            productAreaCm2 = Math.PI * (currentMajorAxis / 2) * (currentMinorAxis / 2); 
            const a = currentMajorAxis / 2;
            const b = currentMinorAxis / 2;
            productPerimeterCm = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        }
        console.log(`--- DEBUGGING LOG (Dimensions) --- Product Type: ${productType}, Area: ${productAreaCm2.toFixed(2)} cm², Perimeter: ${productPerimeterCm.toFixed(2)} cm`);


        // 1. Delivery Cost (STANDARD FOR ALL PRODUCTS NOW)
        let deliveryAreaForBanding = 0;
        if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA') {
             deliveryAreaForBanding = (currentHeight + 10.0) * (currentWidth + 10.0);
        } else if (productType === 'STB') {
            deliveryAreaForBanding = (Math.max(currentHeight, currentWidth) + 5.0) * 10.0;
        } else if (productType === 'RND') {
            deliveryAreaForBanding = (currentDiameter + 10.0) * (currentDiameter + 10.0);
        } else if (productType === 'OVL') {
            deliveryAreaForBanding = (currentMajorAxis + 10.0) * (currentMinorAxis + 10.0);
        }

        if (deliveryAreaForBanding < 2025) {
            breakdown.deliveryCost = 5.00;
        } else if (deliveryAreaForBanding < 8100) {
            breakdown.deliveryCost = 13.50;
        } else if (deliveryAreaForBanding < 16200) {
            breakdown.deliveryCost = 27.00;
        } else if (deliveryAreaForBanding < 32000) {
            breakdown.deliveryCost = 65.00;
        } else if (deliveryAreaForBanding < 48600) {
            breakdown.deliveryCost = 90.00;
        } else { 
            breakdown.deliveryCost = 140.00;
        }
        cumulativeCost += breakdown.deliveryCost;
        console.log(`--- DEBUGGING LOG (Delivery Cost) --- Delivery Area For Banding: ${deliveryAreaForBanding.toFixed(2)}, Cost: ${breakdown.deliveryCost.toFixed(2)}`);

        
        // 2. Fabric Cost & Finish Cost (conditional based on product type and options)
        let selectedFabric = null;
        let fabricCostAreaCm2 = 0; // Area specifically for fabric/finish including waste

        if (productType === 'CAN' || productType === 'RND' || productType === 'OVL') {
            if ((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') { 
                selectedFabric = getMaterialByCode('12oz');
                if (productType === 'RND') {
                    // (Diameter_cm + FABRIC_WASTE_MARGIN) * (Diameter_cm + FABRIC_WASTE_MARGIN)
                    fabricCostAreaCm2 = (currentDiameter + FABRIC_WASTE_MARGIN) * (currentDiameter + FABRIC_WASTE_MARGIN);
                } else if (productType === 'OVL') {
                    // (Minor_Axis_cm + FABRIC_WASTE_MARGIN) * (Minor_Axis_cm + FABRIC_WASTE_MARGIN)
                    fabricCostAreaCm2 = (currentMinorAxis + FABRIC_WASTE_MARGIN) * (currentMinorAxis + FABRIC_WASTE_MARGIN);
                }
            } else if (productType === 'CAN') { 
                selectedFabric = getMaterialByCode(fabricType);
                fabricCostAreaCm2 = (currentHeight + FABRIC_WASTE_MARGIN) * (currentWidth + FABRIC_WASTE_MARGIN);
            }

            if (selectedFabric && fabricCostAreaCm2 > 0) {
                breakdown.fabricCost = (selectedFabric.mcp || 0) * fabricCostAreaCm2;
                cumulativeCost += breakdown.fabricCost;
            }
            console.log(`--- DEBUGGING LOG (Fabric Cost) --- ProductType: ${productType}, FabricType: ${fabricType}, Selected Fabric:`, selectedFabric?.code || 'N/A', `Fabric Area (with waste): ${fabricCostAreaCm2.toFixed(2)} cm², Cost: ${breakdown.fabricCost.toFixed(2)}`);

            let selectedFinish = null;
            let finishCost = 0;
            if (finish === 'UNP' || finish === 'NAT' || fabricType === 'SUP' || fabricType === 'OIL') { 
                finishCost = 0;
            } else {
                selectedFinish = getMaterialByCode(finish);
                if (selectedFinish) {
                    let relevantArea = fabricCostAreaCm2; // Default for fabric related finishes

                    if (fabricType === '12oz') {
                        if (finish === 'WPR' || finish === 'BPR') {
                            finishCost = (selectedFinish.mcp || 0) * 2 * relevantArea;
                        } else {
                            finishCost = (selectedFinish.mcp || 0) * relevantArea;
                        }
                    } else if (fabricType === 'LIN') {
                        if (finish === 'CLR') { 
                            finishCost = (selectedFinish.mcp || 0) * 2 * relevantArea;
                        } else if (finish === 'WPR') {
                            const clrMaterial = getMaterialByCode('CLR'); 
                            finishCost = ((clrMaterial?.mcp || 0) * 2 + (selectedFinish.mcp || 0) * 2) * relevantArea;
                        } else {
                             finishCost = (selectedFinish.mcp || 0) * relevantArea;
                        }
                    } else { // Fallback for other fabric types with finishes
                        finishCost = (selectedFinish.mcp || 0) * relevantArea;
                    }
                }
            }
            breakdown.finishCost = finishCost;
            cumulativeCost += breakdown.finishCost;
            console.log(`--- DEBUGGING LOG (Finish Cost) --- ProductType: ${productType}, Finish: ${finish}, Selected Finish:`, selectedFinish?.code || 'N/A', `Cost: ${breakdown.finishCost.toFixed(2)}`);

        } else if (productType === 'PAN') {
            if (panelHasFabric) {
                selectedFabric = getMaterialByCode(fabricType); 
                fabricCostAreaCm2 = (currentHeight + FABRIC_WASTE_MARGIN) * (currentWidth + FABRIC_WASTE_MARGIN); // Panel fabric waste
                if (selectedFabric && fabricCostAreaCm2 > 0) {
                    breakdown.fabricCost = (selectedFabric.mcp || 0) * fabricCostAreaCm2;
                    cumulativeCost += breakdown.fabricCost;
                }
                console.log(`--- DEBUGGING LOG (Fabric Cost) --- ProductType: ${productType}, PanelHasFabric: true, FabricType: ${fabricType}, Selected Fabric:`, selectedFabric?.code || 'N/A', `Fabric Area (with waste): ${fabricCostAreaCm2.toFixed(2)} cm², Cost: ${breakdown.fabricCost.toFixed(2)}`);

                let selectedFinish = null;
                let finishCost = 0;
                if (finish === 'UNP' || finish === 'NAT' || fabricType === 'SUP' || fabricType === 'OIL') { 
                    finishCost = 0;
                } else {
                    selectedFinish = getMaterialByCode(finish);
                    if (selectedFinish) {
                        let relevantArea = fabricCostAreaCm2; // For fabric related finishes on panels
                        if (fabricType === '12oz') {
                            if (finish === 'WPR' || finish === 'BPR') {
                                finishCost = (selectedFinish.mcp || 0) * 2 * relevantArea;
                            } else {
                                finishCost = (selectedFinish.mcp || 0) * relevantArea;
                            }
                        } else if (fabricType === 'LIN') {
                            if (finish === 'CLR') { 
                                finishCost = (selectedFinish.mcp || 0) * 2 * relevantArea;
                            } else if (finish === 'WPR') {
                                const clrMaterial = getMaterialByCode('CLR'); 
                                finishCost = ((clrMaterial?.mcp || 0) * 2 + (selectedFinish.mcp || 0) * 2) * relevantArea;
                            } else {
                                finishCost = (selectedFinish.mcp || 0) * relevantArea;
                            }
                        } else { // Fallback for other fabric types with finishes
                            finishCost = (selectedFinish.mcp || 0) * relevantArea;
                        }
                    }
                }
                breakdown.finishCost = finishCost;
                cumulativeCost += breakdown.finishCost;
                console.log(`--- DEBUGGING LOG (Finish Cost) --- ProductType: ${productType}, PanelHasFabric: true, Finish: ${finish}, Selected Finish:`, selectedFinish?.code || 'N/A', `Cost: ${breakdown.finishCost.toFixed(2)}`);

            } else { // Bare Panel Finish
                let selectedFinish = null;
                if (finish === 'UNP' || finish === 'NAT') { 
                    breakdown.finishCost = 0;
                } else {
                    selectedFinish = getMaterialByCode(finish); 
                    if (selectedFinish && productAreaCm2 > 0) { // Bare panel finish uses actual product area
                        breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                        cumulativeCost += breakdown.finishCost;
                    }
                }
                console.log(`--- DEBUGGING LOG (Finish Cost) --- ProductType: ${productType}, PanelHasFabric: false, Finish: ${finish}, Selected Finish:`, selectedFinish?.code || 'N/A', `Cost: ${breakdown.finishCost.toFixed(2)}`);
            }
        } else if (productType === 'TRA') {
            let selectedFinish = getMaterialByCode(finish); 
            if (selectedFinish && productAreaCm2 > 0) {
                breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                cumulativeCost += breakdown.finishCost;
            }
            console.log(`--- DEBUGGING LOG (Finish Cost) --- ProductType: ${productType}, Finish: ${finish}, Selected Finish:`, selectedFinish?.code || 'N/A', `Cost: ${breakdown.finishCost.toFixed(2)}`);
        }


        // Panel Material Cost for PAN if no fabric
        if (productType === 'PAN' && !panelHasFabric) {
            const ply6Material = getMaterialByCode('PLY6');
            console.log(`--- DEBUGGING LOG (PLY6 Material Lookup) --- Looking for PLY6. Found: ${ply6Material ? 'Yes' : 'No'}. MCP: ${ply6Material?.mcp}`);
            if (ply6Material && currentHeight > 0 && currentWidth > 0) { // Check dimensions for calculation
                // Apply 2cm waste margin for PLY6
                breakdown.panelMaterialCost = (ply6Material.mcp || 0) * (currentHeight + PLY6_WASTE_MARGIN) * (currentWidth + PLY6_WASTE_MARGIN);
                cumulativeCost += breakdown.panelMaterialCost;
            }
            console.log(`--- DEBUGGING LOG (Panel Material Cost) --- ProductType: PAN, PanelHasFabric: false, PLY6 Material:`, ply6Material?.code || 'N/A', `Cost: ${breakdown.panelMaterialCost.toFixed(2)}`);
        }

        // Round/Oval Material Cost for RND/OVL (always for RND/OVL based on new definition)
        if (productType === 'RND' || productType === 'OVL') {
            const mdf6Material = getMaterialByCode('MDF6');
            console.log(`--- DEBUGGING LOG (MDF6 Material Lookup) --- Looking for MDF6 for ${productType}. Found: ${mdf6Material ? 'Yes' : 'No'}. MCP: ${mdf6Material?.mcp}`);
            
            if (mdf6Material && (parseNum(depth) > 0)) {
                const numberOfLayers = parseNum(depth) / MDF_LAYER_THICKNESS;
                let areaPerLayerCm2 = 0;

                if (productType === 'RND' && currentDiameter > MDF_RING_WIDTH) { 
                    areaPerLayerCm2 = Math.PI * (Math.pow(currentDiameter / 2.0, 2) - Math.pow((currentDiameter - MDF_RING_WIDTH) / 2.0, 2));
                } else if (productType === 'OVL' && currentMajorAxis > MDF_RING_WIDTH && currentMinorAxis > MDF_RING_WIDTH) {
                    areaPerLayerCm2 = Math.PI * ((currentMajorAxis / 2.0) * (currentMinorAxis / 2.0) - ((currentMajorAxis - MDF_RING_WIDTH) / 2.0) * ((currentMinorAxis - MDF_RING_WIDTH) / 2.0));
                }
                
                const totalMDFQuantity = numberOfLayers * areaPerLayerCm2;
                breakdown.roundMaterialCost = (mdf6Material.mcp || 0) * totalMDFQuantity;
                cumulativeCost += breakdown.roundMaterialCost;

                console.log(`--- DEBUGGING LOG (Round Material Cost Calculation) --- Layers: ${numberOfLayers.toFixed(2)}, Area Per Layer: ${areaPerLayerCm2.toFixed(2)} cm², Total Quantity: ${totalMDFQuantity.toFixed(2)} cm²`);
            }
            console.log(`--- DEBUGGING LOG (Round Material Cost) --- ProductType: ${productType}, MDF6 Material:`, mdf6Material?.code || 'N/A', `Cost: ${breakdown.roundMaterialCost.toFixed(2)}`);
        }


        // 3. Stretcher Bar/Profile Cost
        let selectedDepthProfile = null;
        let profileMultiplier = 1; // Default multiplier

        if (productType === 'PAN') {
            if (depth === '25') {
                selectedDepthProfile = getMaterialByCode('P25');
            } else if (depth === '32') {
                selectedDepthProfile = getMaterialByCode('PA'); 
            } else if (depth === '44') { // Special case for PAN 44mm depth
                selectedDepthProfile = getMaterialByCode('PA'); 
                profileMultiplier = 2; // Doubled cost for 44mm PAN profile
            }
        } else if (productType === 'TRA') { 
            const profileMaterialCode = depth ? `P${depth}` : ''; 
            selectedDepthProfile = getMaterialByCode(profileMaterialCode);
        } else { // For CAN, RND, OVL, STB
            const profileMaterialCode = depth ? `P${depth}` : ''; 
            selectedDepthProfile = getMaterialByCode(profileMaterialCode); 
        }
        
        if (selectedDepthProfile && productPerimeterCm > 0) { 
            breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm * profileMultiplier;
            cumulativeCost += breakdown.profileCost;
        }
        console.log(`--- DEBUGGING LOG (Profile Cost) --- ProductType: ${productType}, Depth: ${depth}, Selected Profile:`, selectedDepthProfile?.code || 'N/A', `Multiplier: ${profileMultiplier}, Cost: ${breakdown.profileCost.toFixed(2)}`);


        // 4. Tray Frame Add-on Cost (Only for CAN and PAN, not TRA itself)
        let actualTrayFrameCode = '';
        if (trayFrameAddon === 'White') {
            actualTrayFrameCode = `T${depth}W`;
        } else if (trayFrameAddon === 'Black') {
            actualTrayFrameCode = `T${depth}B`;
        } else if (trayFrameAddon === 'Wood') {
            actualTrayFrameCode = `T${depth}N`; 
        }
        
        console.log(`--- DEBUGGING LOG (Tray Frame Material Lookup) --- Attempting to find material for code: ${actualTrayFrameCode}`);
        const selectedTrayFrame = getMaterialByCode(actualTrayFrameCode);
        const trayFrameAddonValidForProduct = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; 
        
        if (selectedTrayFrame && trayFrameAddonValidForProduct && currentHeight > 0 && currentWidth > 0) { 
            let trayFramePerimeter = 0;
            if (depth === '25') {
                trayFramePerimeter = ((currentHeight + TRAY_FRAME_25MM_ADDITION) * 2) + ((currentWidth + TRAY_FRAME_25MM_ADDITION) * 2);
            } else if (depth === '32' || depth === '40') {
                trayFramePerimeter = ((currentHeight + TRAY_FRAME_OTHER_ADDITION) * 2) + ((currentWidth + TRAY_FRAME_OTHER_ADDITION) * 2);
            }
            breakdown.trayFrameCost = (selectedTrayFrame.mcp || 0) * trayFramePerimeter; 
            cumulativeCost += breakdown.trayFrameCost;
        }
        console.log(`--- DEBUGGING LOG (Tray Frame Addon Cost) --- TrayFrameAddon: ${trayFrameAddon}, Selected Tray Frame:`, selectedTrayFrame?.code || 'N/A', `Cost: ${breakdown.trayFrameCost.toFixed(2)}`);


        // 5. Braces Cost 
        let totalCalculatedBracesCount = 0; 
        
        // Bracing for CAN / STB
        if (productType === 'CAN' || productType === 'STB') {
            let currentHBraces = 0;
            let currentWBraces = 0;

            if (bracingMode === 'Standard') {
                if (currentWidth > BRACE_STANDARD_INTERVAL_CM) {
                    currentHBraces = Math.floor(currentWidth / BRACE_STANDARD_INTERVAL_CM);
                }
                if (currentHeight > BRACE_STANDARD_INTERVAL_CM) {
                    currentWBraces = Math.floor(currentHeight / BRACE_STANDARD_INTERVAL_CM);
                }
                currentHBraces = Math.min(currentHBraces, 3); 
                currentWBraces = Math.min(currentWBraces, 3); 
            } else if (bracingMode === 'Custom') {
                currentHBraces = parseNum(customHBraces);
                currentWBraces = parseNum(customWBraces);
            }
            totalCalculatedBracesCount = currentHBraces + currentWBraces; 

            const braceMaterial = getMaterialByCode('CB'); 
            if (braceMaterial && totalCalculatedBracesCount > 0 && totalCalculatedBracesCount <= 6) { 
                // Apply 5cm clearance for CAN/STB braces
                const effectiveHBraceLength = Math.max(0, currentWidth - CAN_STB_BRACE_CLEARANCE_CM);
                const effectiveWBraceLength = Math.max(0, currentHeight - CAN_STB_BRACE_CLEARANCE_CM);

                const totalBraceLengthCm = 
                    (currentHBraces * effectiveHBraceLength) + 
                    (currentWBraces * effectiveWBraceLength);
                breakdown.braceCost = (braceMaterial.mcp || 0) * totalBraceLengthCm;
                cumulativeCost += breakdown.braceCost;
            }
            console.log(`--- DEBUGGING LOG (Brace Cost CAN/STB) --- ProductType: ${productType}, Braces (H/W): ${currentHBraces}/${currentWBraces}, Material: CB, Cost: ${breakdown.braceCost.toFixed(2)}`);

        } else if (productType === 'PAN') { // Specific bracing logic for PAN
            let panBraceLengthCm = 0;
            let panBraceMaterial = null;
            let panBraceCount = 0;

            const maxDim = Math.max(currentHeight, currentWidth);
            const minDim = Math.min(currentHeight, currentWidth);

            if (maxDim > BRACE_STANDARD_INTERVAL_CM) { // Brace only if largest dim is over 90cm
                panBraceLengthCm = minDim; // No clearance for PAN braces
                panBraceCount = 1;

                if (depth === '25') {
                    panBraceMaterial = getMaterialByCode('CB');
                } else if (depth === '32' || depth === '44') {
                    panBraceMaterial = getMaterialByCode('PA'); 
                }
            }
            totalCalculatedBracesCount = panBraceCount; 

            if (panBraceMaterial && panBraceCount > 0 && panBraceLengthCm > 0) {
                breakdown.braceCost = (panBraceMaterial.mcp || 0) * panBraceLengthCm;
                cumulativeCost += breakdown.braceCost;
            }
            console.log(`--- DEBUGGING LOG (Brace Cost PAN) --- Dimensions (H/W): ${currentHeight.toFixed(2)}/${currentWidth.toFixed(2)}, Brace Count: ${panBraceCount}, Length: ${panBraceLengthCm.toFixed(2)}, Material:`, panBraceMaterial?.code || 'N/A', `Cost: ${breakdown.braceCost.toFixed(2)}`);
        } else if (productType === 'RND' || productType === 'OVL') { // Specific bracing logic for RND/OVL
            let roundBraceCount = 0;
            let roundBraceMaterial = getMaterialByCode('CB'); 
            let totalRoundBraceLengthCm = 0;

            if (productType === 'RND' && currentDiameter >= BRACE_STANDARD_INTERVAL_CM) { 
                roundBraceCount = 2; 
                totalRoundBraceLengthCm = (currentDiameter - RND_OVL_BRACE_CLEARANCE_CM) * roundBraceCount; 
            } else if (productType === 'OVL' && Math.max(currentMajorAxis, currentMinorAxis) >= BRACE_STANDARD_INTERVAL_CM) { 
                roundBraceCount = 2; 
                totalRoundBraceLengthCm = (currentMajorAxis - RND_OVL_BRACE_CLEARANCE_CM) + (currentMinorAxis - RND_OVL_BRACE_CLEARANCE_CM);
            }
            totalCalculatedBracesCount = roundBraceCount;

            if (roundBraceMaterial && roundBraceCount > 0 && totalRoundBraceLengthCm > 0) {
                breakdown.braceCost = (roundBraceMaterial.mcp || 0) * totalRoundBraceLengthCm;
                cumulativeCost += breakdown.braceCost;
            }
            console.log(`--- DEBUGGING LOG (Brace Cost RND/OVL) --- ProductType: ${productType}, Brace Count: ${roundBraceCount}, Total Length: ${totalRoundBraceLengthCm.toFixed(2)}, Material: CB, Cost: ${breakdown.braceCost.toFixed(2)}`);
        }
        else {
             console.log(`--- DEBUGGING LOG (Brace Cost) --- ProductType: ${productType}. No brace calculation applied.`);
        }


        // 6. Wedges Cost (WDG) - Applies to CAN, STB ONLY
        const appliesWedges = ['CAN', 'STB'].includes(productType); 
        let totalWedges = 0;
        if (appliesWedges) {
            totalWedges += 8; 
            if ((productType === 'CAN' || productType === 'STB') && totalCalculatedBracesCount > 0) { 
                totalWedges += (totalCalculatedBracesCount * 2); 
            }
        }
        const wedgeMaterial = getMaterialByCode('WDG');
        if (wedgeMaterial && totalWedges > 0) {
            breakdown.wedgeCost = (wedgeMaterial.mcp || 0) * totalWedges;
            cumulativeCost += breakdown.wedgeCost;
        }
        console.log(`--- DEBUGGING LOG (Wedge Cost) --- ProductType: ${productType}, Total Wedges: ${totalWedges}, Material: ${wedgeMaterial?.code || 'N/A'}, Cost: ${breakdown.wedgeCost.toFixed(2)}`);


        // 7. Keys Cost (KEY) - Applies to Tray Frames (TRA) and Panels (PAN)
        const appliesKeys = ['TRA', 'PAN'].includes(productType); 
        let totalKeys = 0;
        if (appliesKeys) {
            totalKeys += 8; // 8 keys for the frame itself (TRA or PAN)
        }
        const keyMaterial = getMaterialByCode('KEY');
        if (keyMaterial && totalKeys > 0) {
            breakdown.keyCost = (keyMaterial.mcp || 0) * totalKeys;
            cumulativeCost += breakdown.keyCost;
        }
        console.log(`--- DEBUGGING LOG (Key Cost) --- ProductType: ${productType}, Total Keys: ${totalKeys}, Material: ${keyMaterial?.code || 'N/A'}, Cost: ${breakdown.keyCost.toFixed(2)}`);

        
        // 8. Packaging Cost (dynamic based on product type and using productAreaCm2 where appropriate)
        const bubbleWrapMaterial = getMaterialByCode('BUB'); 
        const cardboardMaterial = getMaterialByCode('CAR');     

        const mcpBubbleWrap = bubbleWrapMaterial?.mcp || 0;
        const mcpCardboard = cardboardMaterial?.mcp || 0;

        if (productAreaCm2 > 0) {
            if (productType === 'STB' || productType === 'CAN' || productType === 'PAN' || productType === 'TRA') {
                breakdown.packagingCost = (currentWidth * currentHeight) * 2.2 * (mcpBubbleWrap + mcpCardboard);
                console.log(`--- DEBUGGING LOG (Packaging Cost Rectangular) --- ProductType: ${productType}, Area: ${currentWidth * currentHeight}, BUB MCP: ${mcpBubbleWrap.toFixed(5)}, CAR MCP: ${mcpCardboard.toFixed(5)}, Cost: ${breakdown.packagingCost.toFixed(2)}`);
            } else if (productType === 'RND') { 
                // Diameter_cm * Diameter_cm * 2.2 * (BUB_Material_mcp + CAR_Material_mcp)
                breakdown.packagingCost = (currentDiameter * currentDiameter) * 2.2 * (mcpBubbleWrap + mcpCardboard); 
                console.log(`--- DEBUGGING LOG (Packaging Cost RND) --- ProductType: ${productType}, Bounding Box Area: ${currentDiameter * currentDiameter}, BUB MCP: ${mcpBubbleWrap.toFixed(5)}, CAR MCP: ${mcpCardboard.toFixed(5)}, Cost: ${breakdown.packagingCost.toFixed(2)}`);
            } else if (productType === 'OVL') { 
                // Minor_Axis_cm * Minor_Axis_cm * 2.2 * (BUB_Material_mcp + CAR_Material_mcp)
                breakdown.packagingCost = (currentMinorAxis * currentMinorAxis) * 2.2 * (mcpBubbleWrap + mcpCardboard); 
                console.log(`--- DEBUGGING LOG (Packaging Cost OVL) --- ProductType: ${productType}, Bounding Box Area: ${currentMinorAxis * currentMinorAxis}, BUB MCP: ${mcpBubbleWrap.toFixed(5)}, CAR MCP: ${mcpCardboard.toFixed(5)}, Cost: ${breakdown.packagingCost.toFixed(2)}`);
            } else {
                breakdown.packagingCost = 0; 
                console.log(`--- DEBUGGING LOG (Packaging Cost) --- ProductType: ${productType}, Cost: 0.00 (special case/zero area)`);
            }
        } else {
            breakdown.packagingCost = 0; 
            console.log(`--- DEBUGGING LOG (Packaging Cost) --- ProductType: ${productType}, Cost: 0.00 (dimensions or MCPs zero)`);
        }
        cumulativeCost += breakdown.packagingCost;


        // Calculate Markup based on new rules
        breakdown.subtotal = cumulativeCost; 

        let effectiveSalesPriceMultiplier = 0; 

        if (productType === 'CAN') {
            if (productAreaCm2 < 2025) {
                effectiveSalesPriceMultiplier = 1.10; 
            } else if (productAreaCm2 < 8100) {
                effectiveSalesPriceMultiplier = 1.50; 
            } else if (productAreaCm2 < 32000) {
                effectiveSalesPriceMultiplier = 1.60; 
            } else { // >= 32000 cm2
                effectiveSalesPriceMultiplier = 1.70; 
            }
        } else if (productType === 'PAN') {
            effectiveSalesPriceMultiplier = 1.33; 
        } else if (productType === 'RND' || productType === 'OVL') {
            effectiveSalesPriceMultiplier = 1.50; 
        } else if (productType === 'STB') {
            effectiveSalesPriceMultiplier = 1.43; 
        } else if (productType === 'TRA') {
            effectiveSalesPriceMultiplier = 1.10; 
        }
        console.log(`--- DEBUGGING LOG (Markup) --- Subtotal: ${breakdown.subtotal.toFixed(2)}, Product Type: ${productType}, Area: ${productAreaCm2.toFixed(2)}, Multiplier: ${effectiveSalesPriceMultiplier}`);


        let priceBeforeVAT = Math.max(breakdown.subtotal * effectiveSalesPriceMultiplier, MINIMUM_QUOTE_PRICE);

        breakdown.markupAmount = priceBeforeVAT - breakdown.subtotal;

        let finalPriceWithVAT = priceBeforeVAT * VAT_MULTIPLIER;

        breakdown.finalPriceBeforeVAT = priceBeforeVAT; 
        breakdown.finalPriceWithVAT = finalPriceWithVAT; 

        console.log(`--- DEBUGGING LOG (Final Price) --- Price before VAT: ${priceBeforeVAT.toFixed(2)}, Final Price with VAT: ${finalPriceWithVAT.toFixed(2)}`);


        setCostBreakdown(breakdown);

        return finalPriceWithVAT;
    } catch (error) {
        console.error("--- CRITICAL ERROR IN calculatePreliminaryPrice ---", error);
        setQuotePrice('ERROR'); 
        setCostBreakdown({ 
            deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, 
            trayFrameCost: 0, braceCost: 0, wedgeCost: 0, keyCost: 0, packagingCost: 0, 
            panelMaterialCost: 0, roundMaterialCost: 0, 
            subtotal: 0,
            markupAmount: 0, finalPriceBeforeVAT: 0, finalPriceWithVAT: 0,
        });
        return null;
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, getMaterialsByType, parseNum, roundOption, panelHasFabric]);

  // --- Main Effect for SKU Generation and Price Update ---
  useEffect(() => {
    if (loadingMaterials || errorMaterials || materialsData.length === 0) {
        setSku('Loading...');
        setQuotePrice('£0.00');
        return;
    }

    try {
        let generatedSku = '';
        let currentPrice = null; 

        const BRACE_STANDARD_INTERVAL_CM = 90;
        const convertToCm = (val) => (unit === 'IN' ? parseNum(val) * 2.54 : parseNum(val)); 

        let fabricAbbr = '';
        let finishAbbr = '';
        let trayFramePart = '';
        let customBracingPart = '';
        let validDimensions = false;
        let validDepth = false;
        let validFabric = false;
        let validFinish = false;
        
        // Common logic for fabricAbbr
        if (fabricType) { 
            const fabricObj = getMaterialByCode(fabricType);
            fabricAbbr = fabricObj?.code || '';
        }
        
        // Common logic for finishAbbr (transforms to SKU codes)
        finishAbbr = finish; 
        if (finishAbbr === 'WPR') finishAbbr = 'PRW'; 
        if (finishAbbr === 'BPR') finishAbbr = 'PRB';
        if (finishAbbr === 'CLR') finishAbbr = 'CSL'; 
        
        // Common depth abbreviation logic for SKUs
        const commonDepthsSku = { 
            '25': 'P25', '32': 'P32', '40': 'P40', '44': 'P44', 
            '24': 'P24', '30': 'P30', '36': 'P36', '42': 'P42'  
        }; 
        const selectedDepthAbbr = commonDepthsSku[depth] || ''; 
        validDepth = selectedDepthAbbr !== '';

        // Common tray frame logic for SKU
        const trayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; 
        let trayFrameSKUCode = '';
        if (trayFrameAddon === 'White') {
            trayFrameSKUCode = `T${depth}W`;
        } else if (trayFrameAddon === 'Black') {
            trayFrameSKUCode = `T${depth}B`;
        } else if (trayFrameAddon === 'Wood') {
            trayFrameSKUCode = `T${depth}N`; 
        }
        if (trayFrameSKUCode && trayFrameValid) { 
            trayFramePart = `-${trayFrameSKUCode}`; 
        }

        // Common bracing logic for SKU (only custom for CAN/STB affects SKU part)
        // For PAN/RND/OVL, bracing is always automatic and fixed, so no custom part in SKU from inputs.
        if (['CAN', 'STB'].includes(productType) && bracingMode === 'Custom') {
            let currentHBracesForSku = parseNum(customHBraces);
            let currentWBracesForSku = parseNum(customWBraces);
            const totalCustomBraces = currentHBracesForSku + currentWBracesForSku;
            if (totalCustomBraces > 0 && totalCustomBraces <= 6) { 
                customBracingPart = `-H${currentHBracesForSku}W${currentWBracesForSku}`;
            }
        }


        switch (productType) {
          case 'CAN': 
            validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
            validFabric = fabricAbbr !== '';
            validFinish = (fabricType === 'SUP' || fabricType === 'OIL') ? true : (finishAbbr !== ''); 
            
            if (validDimensions && validDepth && validFabric && validFinish) {
                generatedSku = `CAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}-${fabricAbbr}-${finishAbbr}${trayFramePart}${customBracingPart}`;
                currentPrice = calculatePreliminaryPrice();
            } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
            }
            break;

          case 'PAN': 
            validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
            validFinish = (panelHasFabric && (fabricType === 'SUP' || fabricType === 'OIL')) ? true : (finishAbbr !== ''); 
            
            if (panelHasFabric) {
                validFabric = fabricAbbr !== '';
            } else {
                validFabric = true; 
            }

            if (validDimensions && validDepth && validFinish && validFabric) {
                const fabricPart = panelHasFabric ? `-${fabricAbbr}` : ''; 
                // Add bracing info to PAN SKU if applicable (one fixed brace)
                let panBraceSkuPart = '';
                const currentHeightCm = convertToCm(height);
                const currentWidthCm = convertToCm(width);
                const maxDimPan = Math.max(currentHeightCm, currentWidthCm);
                if (maxDimPan > BRACE_STANDARD_INTERVAL_CM) {
                     panBraceSkuPart = `-B1`; // Indicates 1 brace
                }

                generatedSku = `PAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricPart}-${finishAbbr}${trayFramePart}${panBraceSkuPart}`;
                currentPrice = calculatePreliminaryPrice();
            } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
            }
            break;

          case 'RND': 
            validDimensions = parseNum(diameter) > 0;
            if (roundOption === 'Stretched') {
                fabricAbbr = '12oz'; 
                validFabric = true;
                validFinish = finishAbbr !== '';
            } else { // FrameOnly
                fabricAbbr = 'NOFAB'; 
                finishAbbr = 'NOFIN'; 
                validFabric = true;
                validFinish = true;
            }
            
            if (validDimensions && validDepth && validFabric && validFinish) {
                const fabricFinishPart = (roundOption === 'Stretched' && finishAbbr) ? `-${fabricAbbr}-${finishAbbr}` : (roundOption === 'FrameOnly' ? '' : `-NOFAB-${finishAbbr}`);
                
                let roundBraceSkuPart = '';
                const currentDiameterCm = convertToCm(diameter);
                if (currentDiameterCm >= BRACE_STANDARD_INTERVAL_CM) { 
                    roundBraceSkuPart = `-B2`; 
                }

                generatedSku = `RND-${parseNum(diameter).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricFinishPart}${roundBraceSkuPart}`;
                currentPrice = calculatePreliminaryPrice();
            } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
            }
            break;

          case 'OVL': 
            validDimensions = (parseNum(majorAxis) > 0 && parseNum(minorAxis) > 0);
            if (roundOption === 'Stretched') {
                fabricAbbr = '12oz'; 
                validFabric = true;
                validFinish = finishAbbr !== '';
            } else { // FrameOnly
                fabricAbbr = 'NOFAB'; 
                finishAbbr = 'NOFIN'; 
                validFabric = true;
                validFinish = true;
            }

            if (validDimensions && validDepth && validFabric && validFinish) { 
                const fabricFinishPart = (roundOption === 'Stretched' && finishAbbr) ? `-${fabricAbbr}-${finishAbbr}` : (roundOption === 'FrameOnly' ? '' : `-NOFAB-${finishAbbr}`);
                
                let ovalBraceSkuPart = '';
                const currentMajorAxisCm = convertToCm(majorAxis);
                const currentMinorAxisCm = convertToCm(minorAxis);
                if (Math.max(currentMajorAxisCm, currentMinorAxisCm) >= BRACE_STANDARD_INTERVAL_CM) { 
                    ovalBraceSkuPart = `-B2`; 
                }

                generatedSku = `OVL-${parseNum(majorAxis).toFixed(1)}-${parseNum(minorAxis).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricFinishPart}${ovalBraceSkuPart}`;
                currentPrice = calculatePreliminaryPrice();
            } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
            }
            break;

          case 'TRA': 
            validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
            validFinish = finishAbbr !== ''; 
            validFabric = true; 
            
            if (validDimensions && validFinish && validDepth) { 
                generatedSku = `TRA-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-D${depth}-${unit}-${finishAbbr}`; 
                currentPrice = calculatePreliminaryPrice();
            } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
            }
            break;

          case 'STB': 
            validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
            validFabric = true; 
            validFinish = true; 

            if (validDimensions && validDepth) {
                generatedSku = `STB-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}${customBracingPart}`;
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
        setQuoteSaveMessage(''); 
    }
    catch (error) {
        console.error("--- CRITICAL ERROR IN SKU Generation / Main useEffect ---", error);
        setSku('ERROR generating SKU');
        setQuotePrice('ERROR');
        setQuoteSaveMessage('An internal error occurred. Check console.');
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, calculatePreliminaryPrice, materialsData, loadingMaterials, errorMaterials, parseNum, roundOption, panelHasFabric]); 


  // --- Reset Fields on Product Type Change ---
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
    setBracingMode('Standard'); 
    setCustomHBraces(0);
    setCustomWBraces(0);
    setRoundOption('Stretched'); 
    setPanelHasFabric(false); 
    setSku('');
    setQuotePrice(null);
    setQuoteSaveMessage('');
    setCostBreakdown({
        deliveryCost: 0,
        fabricCost: 0,
        finishCost: 0,
        profileCost: 0,
        trayFrameCost: 0,
        braceCost: 0,
        wedgeCost: 0, 
        keyCost: 0,   
        packagingCost: 0,
        panelMaterialCost: 0, 
        roundMaterialCost: 0,
        subtotal: 0,
        markupAmount: 0,
        finalPriceBeforeVAT: 0, 
        finalPriceWithVAT: 0,
    });

    // Default fabric for CAN on product type change
    if (productType === 'CAN') {
      setFabricType('12oz'); 
    }

  }, [productType]);

  // Reset finish when fabric type changes
  useEffect(() => {
      setFinish('');
  }, [fabricType]);

  // Reset tray frame when depth changes (since tray frames are depth-dependent)
  useEffect(() => {
      setTrayFrameAddon('');
  }, [depth]);

  // Reset fabric/finish for RND/OVL if roundOption changes
  useEffect(() => {
    if (productType === 'RND' || productType === 'OVL') {
        if (roundOption === 'FrameOnly') {
            setFabricType(''); 
            setFinish(''); 
        } else if (roundOption === 'Stretched') {
            setFabricType('12oz'); 
            setFinish(''); 
        }
    }
  }, [roundOption, productType]);

  // Handle panelHasFabric change for PAN: auto-select 12oz fabric if checked
  useEffect(() => {
    if (productType === 'PAN') {
        if (panelHasFabric) {
            setFabricType('12oz'); 
            setFinish(''); 
        } else {
            setFabricType(''); 
            if (finish === 'NAT') { 
                setFinish('NAT');
            } else {
                setFinish(''); 
            }
        }
    }
  }, [panelHasFabric, productType]); 

  // --- Dynamic Dropdown Options Getters ---

  const getDepthOptions = useCallback(() => {
    switch (productType) {
      case 'CAN': 
      case 'STB':
        return ['25', '32', '40', '44'].map(d => ({ 
            code: d, 
            description: `${d}mm Deep` 
        }));
      case 'PAN': // Restricted depth options for PAN
        return ['25', '32', '44'].map(d => ({ 
            code: d, 
            description: `${d}mm Deep` 
        }));
      case 'TRA': // Restricted depth options for TRA
        return ['25', '32', '40'].map(d => ({ // 44mm excluded for TRA
            code: d, 
            description: `${d}mm Deep` 
        }));
      case 'RND':
      case 'OVL': 
        return ['24', '30', '36', '42'].map(d => ({ 
            code: d, 
            description: `${d}mm Deep` 
        }));
      default: return [];
    }
  }, [productType]);

  const getFabricOptions = useCallback(() => {
    const allFabrics = getMaterialsByType('Fabric');
    
    // Define a custom sort order for specific fabric codes
    const customOrder = ['12oz', 'SUP', 'LIN', 'OIL']; 
    
    // Sort the fabrics
    let sortedFabrics = [...allFabrics].sort((a, b) => { 
        const indexA = customOrder.indexOf(a.code);
        const indexB = customOrder.indexOf(b.code);

        if (indexA === -1 && indexB === -1) {
            return a.description.localeCompare(b.description); 
        }
        if (indexA === -1) {
            return 1; 
        }
        if (indexB === -1) {
            return -1; 
        }
        return indexA - indexB; 
    });

    if (productType === 'RND' || productType === 'OVL') {
        if (roundOption === 'Stretched') {
            const fabric12oz = sortedFabrics.find(f => f.code === '12oz');
            if (fabric12oz) {
                return [{ code: '12oz', description: fabric12oz.description }];
            } else {
                console.warn("--- WARNING --- '12oz' fabric material not found in Firestore for Round/Oval stretched option.");
                return [];
            }
        } else { 
            return [];
        }
    } else if (productType === 'PAN' && panelHasFabric) {
        return sortedFabrics.map(f => ({ code: f.code, description: f.description })); 
    } else if (productType === 'CAN') {
        return sortedFabrics.map(f => ({ code: f.code, description: f.description })); 
    }
    return []; 
  }, [productType, roundOption, panelHasFabric, getMaterialsByType, getMaterialByCode]);


  const getFinishOptions = useCallback(() => {
    console.log("--- DEBUGGING LOG (getFinishOptions) --- Called. Current fabricType:", fabricType, "Current productType:", productType, "Current roundOption:", roundOption, "Current panelHasFabric:", panelHasFabric);
    const allFinishesFromFirestore = getMaterialsByType('Mediums/Coatings');
    console.log("--- DEBUGGING LOG (getFinishOptions) --- All 'Mediums/Coatings' found in Firestore (raw objects):", allFinishesFromFirestore); 
    console.log("--- DEBUGGING LOG (getFinishOptions) --- Codes from Firestore:", allFinishesFromFirestore.map(f => f.code));

    let allowedFinishes = [];

    // Helper to get descriptive name for finishes
    const getDescriptiveFinishName = (code) => {
        switch (code) {
            case 'UNP': return 'Unprimed';
            case 'NAT': return 'Natural (Bare)';
            case 'WPR': return 'Primed White';
            case 'BPR': return 'Primed Black';
            case 'CLR': return 'Clear Sealed'; 
            default: return allFinishesFromFirestore.find(f => f.code === code)?.description || code; 
        }
    };

    if (productType === 'CAN' || (productType === 'PAN' && panelHasFabric)) {
        // If Superfine or Oil primed is selected, no finish options
        if (fabricType === 'SUP' || fabricType === 'OIL') {
            console.log("--- DEBUGGING LOG (getFinishOptions) --- Superfine or Oil primed selected, no finish options.");
            return []; 
        }

        if (fabricType === '12oz') { 
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
            console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered for 12oz (WPR, BPR):", filteredPrimers);
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        } else if (fabricType === 'LIN') {
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'CLR'].includes(f.code)); 
            console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered for LIN (WPR, CLR):", filteredPrimers);
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        }
    }
    else if (productType === 'PAN' && !panelHasFabric) { // Bare panel finishes
        allowedFinishes.push({ code: 'NAT', description: getDescriptiveFinishName('NAT') });
        const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
        allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
    }
    else if (productType === 'RND' || productType === 'OVL') {
        if (roundOption === 'Stretched') {
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        } else { 
            return [];
        }
    }
    else if (productType === 'TRA') {
        allowedFinishes.push({ code: 'NAT', description: getDescriptiveFinishName('NAT') }); 
        const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR', 'CLR'].includes(f.code)); 
        allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
    }
    // STB does not have a finish option

    const uniqueFinishes = Array.from(new Map(allowedFinishes.map(item => [item.code, item])).values());

    console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered and unique allowedFinishes (final):", uniqueFinishes);
    return uniqueFinishes; 
  }, [productType, fabricType, roundOption, panelHasFabric, getMaterialsByType]); 

  const getTrayFrameAddonOptions = useCallback(() => {
      // Tray frame not compatible with D44, so don't show options if depth is 44
      if (depth === '44') {
          return [];
      }

      // Tray frame available only for CAN and PAN (not TRA, as TRA is the tray frame itself)
      if (!((productType === 'CAN' || productType === 'PAN'))) { 
          return []; 
      }
      
      const options = [];
      options.push({ code: 'White', description: 'White' });
      options.push({ code: 'Black', description: 'Black' });
      options.push({ code: 'Wood', description: 'Wood' }); 

      return options; 
  }, [productType, depth]);


  // --- Save Quote Logic ---
  const handleSaveQuote = async () => {
    if (!db || !firestoreAppId || !userId) {
      setQuoteSaveMessage('Error: Firebase not initialized or user not authenticated.');
      return;
    }
    if (!sku || !quotePrice || quotePrice === '£0.00' || sku === 'Incomplete configuration') {
      setQuoteSaveMessage('Please complete the product configuration to generate a valid quote before saving.');
      return;
    }

    try {
      const quotesColRef = getPublicQuotesCollectionRef();
      if (!quotesColRef) {
        setQuoteSaveMessage('Error: Could not get quotes collection reference.');
        return;
      }

      const quoteData = {
        productType,
        height: parseFloat(height) || null,
        width: parseFloat(width) || null,
        diameter: parseFloat(diameter) || null,
        majorAxis: parseFloat(majorAxis) || null,
        minorAxis: parseFloat(minorAxis) || null,
        depth: depth || null,
        unit,
        fabricType: fabricType || null, 
        finish: finish || null,
        trayFrameAddon: trayFrameAddon || null, 
        bracingMode, 
        customHBraces: parseInt(customHBraces) || 0,
        customWBraces: parseInt(customWBraces) || 0,
        roundOption: (productType === 'RND' || productType === 'OVL') ? roundOption : null,
        panelHasFabric: productType === 'PAN' ? panelHasFabric : null,
        sku,
        quotePrice: parseFloat(quotePrice.replace('£', '')), 
        costBreakdown: { 
            deliveryCost: costBreakdown.deliveryCost, 
            fabricCost: costBreakdown.fabricCost,
            finishCost: costBreakdown.finishCost,
            profileCost: costBreakdown.profileCost,
            trayFrameCost: costBreakdown.trayFrameCost,
            braceCost: costBreakdown.braceCost,
            wedgeCost: costBreakdown.wedgeCost, 
            keyCost: costBreakdown.keyCost,   
            packagingCost: costBreakdown.packagingCost, 
            panelMaterialCost: costBreakdown.panelMaterialCost, 
            roundMaterialCost: costBreakdown.roundMaterialCost,
            subtotal: costBreakdown.subtotal,
            markupAmount: costBreakdown.markupAmount,
            finalPriceBeforeVAT: 0, 
            finalPriceWithVAT: 0,
        },
        generatedByUserId: userId, 
        timestamp: new Date().toISOString(), 
      };

      await addDoc(quotesColRef, quoteData);
      setQuoteSaveMessage('Quote saved successfully!');
      setTimeout(() => setQuoteSaveMessage(''), 3000); 
    } catch (e) {
      console.error("Error saving quote: ", e);
      setQuoteSaveMessage(`Failed to save quote: ${e.message}. Please check console for details.`);
    }
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

      <div className="bg-mediumGreen rounded-xl shadow-lg p-4 sm:p-8 w-full max-w-2xl"> 
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
              className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
            >
              <option value="CAN" className="bg-white text-deepGray">Canvas (CAN)</option>
              <option value="PAN" className="bg-white text-deepGray">Painting Panel (PAN)</option>
              <option value="RND" className="bg-white text-deepGray">Round (RND)</option>
              <option value="OVL" className="bg-white text-deepGray">Oval (OVL)</option>
              <option value="TRA" className="bg-white text-deepGray">Tray Frame (TRA)</option>
              <option value="STB" className="bg-white text-deepGray">Stretcher Bar Frame (STB)</option>
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
              className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
            >
              <option value="CM" className="bg-white text-deepGray">CM</option>
              <option value="IN" className="bg-white text-deepGray">IN</option>
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
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                  placeholder="e.g., 80.0"
                />
              </div>
              <div>
                <label htmlFor="width" className="block text-offWhite text-sm font-semibold mb-2">
                  Width ({unit})
                </label>
                <input
                  type="number" step="0.1" id="width" value={width} onChange={(e) => setWidth(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
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
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
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
                    className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                    placeholder="e.g., 100.0"
                  />
                </div>
                <div>
                  <label htmlFor="minorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                    Minor Axis ({unit})
                  </label>
                  <input
                    type="number" step="0.1" id="minorAxis" value={minorAxis} onChange={(e) => setMinorAxis(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                    placeholder="e.g., 70.0"
                  />
                </div>
              </>
            )}

            {/* Depth Selection (Common for most) */}
            {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL' || productType === 'STB' || productType === 'TRA') && (
              <div>
                <label htmlFor="depth" className="block text-offWhite text-sm font-semibold mb-2">
                  Depth
                </label>
                <select
                  id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                >
                  <option value="">Select Depth</option>
                  {getDepthOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-white text-deepGray">{opt.description}</option> 
                  ))}
                </select>
              </div>
            )}

            {/* Round/Oval specific option: Frame Only or Stretched */}
            {(productType === 'RND' || productType === 'OVL') && (
                <div>
                    <label htmlFor="roundOption" className="block text-offWhite text-sm font-semibold mb-2">
                        Build Option
                    </label>
                    <select
                        id="roundOption"
                        value={roundOption}
                        onChange={(e) => setRoundOption(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                    >
                        <option value="Stretched" className="bg-white text-deepGray">Stretched</option>
                        <option value="FrameOnly" className="bg-white text-deepGray">Frame Only</option>
                    </select>
                </div>
            )}

            {/* Panel specific option: Add Fabric */}
            {productType === 'PAN' && finish === 'NAT' && ( 
                <div className="md:col-span-2"> 
                    <input
                        type="checkbox"
                        id="panelHasFabric"
                        checked={panelHasFabric}
                        onChange={(e) => setPanelHasFabric(e.target.checked)}
                        className="mr-2 h-4 w-4 text-accentGold focus:ring-accentGold border-lightGreen rounded"
                    />
                    <label htmlFor="panelHasFabric" className="text-offWhite text-sm font-semibold">
                        Add Fabric to Panel
                    </label>
                    {panelHasFabric && (
                         <p className="text-lightGreen text-xs mt-1">Selecting fabric will add fabric cost and finish options for the fabric.</p>
                    )}
                </div>
            )}

            {/* Fabric Type Selection (Canvas, Stretched Round/Oval, Panel with Fabric) */}
            {((productType === 'CAN') || 
              ((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') ||
              (productType === 'PAN' && panelHasFabric)
            ) && (
              <div>
                <label htmlFor="fabricType" className="block text-offWhite text-sm font-semibold mb-2">
                  Fabric Type
                </label>
                <select
                  id="fabricType" value={fabricType} onChange={(e) => setFabricType(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                  disabled={((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched')} 
                >
                  <option value="">Select Fabric</option>
                  {getFabricOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-white text-deepGray">{opt.description}</option>
                  ))}
                </select>
                {((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') && (
                    <p className="text-lightGreen text-xs mt-1">Fabric fixed to 12oz for stretched {productType === 'RND' ? 'Round' : 'Oval'}.</p>
                )}
              </div>
            )}

            {/* Finish Selection (Canvas, Panel, Stretched Round/Oval, Tray Frame) */}
            {((productType === 'CAN' && (fabricType !== 'SUP' && fabricType !== 'OIL')) || 
              (productType === 'PAN' && !panelHasFabric) || 
              (productType === 'PAN' && panelHasFabric && (fabricType !== 'SUP' && fabricType !== 'OIL')) || 
              ((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') || 
              (productType === 'TRA') 
            ) && (
              <div>
                <label htmlFor="finish" className="block text-offWhite text-sm font-semibold mb-2">
                  Finish
                </label>
                <select
                  id="finish" value={finish} onChange={(e) => setFinish(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                  disabled={(productType === 'PAN' && panelHasFabric && !fabricType) || 
                            ((productType === 'RND' || productType === 'OVL') && roundOption === 'FrameOnly')} 
                >
                  <option value="">Select Finish</option>
                  {getFinishOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-white text-deepGray">{opt.description}</option>
                  ))}
                </select>
                {productType === 'PAN' && panelHasFabric && !fabricType && (
                    <p className="text-red-300 text-xs mt-1">Select a fabric type first.</p>
                )}
              </div>
            )}
            
            {/* Display message when finish dropdown is hidden for SUP/OIL */}
            {((productType === 'CAN' && (fabricType === 'SUP' || fabricType === 'OIL')) ||
              (productType === 'PAN' && panelHasFabric && (fabricType === 'SUP' || fabricType === 'OIL'))) && (
                <div className="md:col-span-1">
                    <label className="block text-offWhite text-sm font-semibold mb-2">
                        Finish
                    </label>
                    <p className="text-lightGreen text-xs p-3 rounded-lg border border-lightGreen">
                        No finish options for selected fabric.
                    </p>
                </div>
            )}


            {/* Tray Frame Add-on (Canvas, Panel) - Hidden for TRA */}
            {((productType === 'CAN' || productType === 'PAN') && depth !== '44') && ( 
              <div>
                <label htmlFor="trayFrameAddon" className="block text-offWhite text-sm font-semibold mb-2">
                  Tray Frame Add-on
                </label>
                <select
                  id="trayFrameAddon" value={trayFrameAddon} onChange={(e) => setTrayFrameAddon(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                  disabled={depth === '44'} 
                >
                  <option value="">No Tray Frame</option> 
                  {getTrayFrameAddonOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-white text-deepGray">{opt.description}</option>
                  ))}
                </select>
                {depth === '44' && (
                    <p className="text-red-300 text-xs mt-1">Tray Frame not compatible with D44 depth.</p>
                )}
              </div>
            )}

            {/* Bracing Options (Canvas, Stretcher Bar Frame, Panel with Fabric - controlled for PAN) */}
            {(['CAN', 'STB'].includes(productType) || (productType === 'PAN') || (productType === 'RND' || productType === 'OVL')) && ( 
              <>
                <div>
                  <label htmlFor="bracingMode" className="block text-offWhite text-sm font-semibold mb-2">
                    Bracing Options
                  </label>
                  <select
                    id="bracingMode" value={bracingMode} onChange={(e) => setBracingMode(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                    disabled={productType === 'PAN' || productType === 'RND' || productType === 'OVL'} // Disable for PAN, RND, OVL as it's automatic
                  >
                    <option value="Standard" className="bg-white text-deepGray">Standard (Automatic)</option>
                    <option value="None" className="bg-white text-deepGray">No Braces</option>
                    <option value="Custom" className="bg-white text-deepGray">Custom Braces</option>
                  </select>
                  {productType === 'PAN' && (
                    <p className="text-lightGreen text-xs mt-1">Panels automatically include one brace if largest dimension exceeds 90cm.</p>
                  )}
                   {(productType === 'RND' || productType === 'OVL') && (
                    <p className="text-lightGreen text-xs mt-1">Round/Oval include 2 cross braces if largest dimension exceeds 90cm.</p>
                  )}
                </div>
                {bracingMode === 'Custom' && !(['PAN', 'RND', 'OVL'].includes(productType)) && ( // Only show custom inputs if not PAN, RND, OVL
                  <>
                    <div>
                      <label htmlFor="customHBraces" className="block text-offWhite text-sm font-semibold mb-2">
                        Custom Horizontal Braces (0-3)
                      </label>
                      <input
                        type="number" step="1" min="0" max="3" id="customHBraces" value={customHBraces} onChange={(e) => setCustomHBraces(parseInt(e.target.value) || 0)}
                        className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="customWBraces" className="block text-offWhite text-sm font-semibold mb-2">
                        Custom Vertical Braces (0-3)
                      </label>
                      <input
                        type="number" step="1" min="0" max="3" id="customWBraces" value={customWBraces} onChange={(e) => setCustomWBraces(parseInt(e.target.value) || 0)}
                        className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                      />
                    </div>
                  </>
                )}
                 {(bracingMode !== 'None' && (parseNum(customHBraces) + parseNum(customWBraces) > 6)) && (
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
            
            {/* Save Quote Button and Message */}
            <button
              onClick={handleSaveQuote}
              className="mt-6 p-3 rounded-lg font-semibold transition-colors duration-200"
              style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
            >
              Save Quote
            </button>
            {quoteSaveMessage && (
              <p className="mt-3 text-sm font-semibold" style={{ color: quoteSaveMessage.startsWith('Error') ? '#EF4444' : colors.lightGreen }}>
                {quoteSaveMessage}
              </p>
            )}
          </div>

          {/* Cost Breakdown Section */}
          {(quotePrice && quotePrice !== '£0.00' && sku !== 'Incomplete configuration') && (
              <div className="mt-8 pt-8 border-t border-lightGreen/50 text-offWhite text-left">
                  <h3 className="text-xl font-bold mb-4">Cost Breakdown:</h3>
                  <ul className="space-y-1 text-sm">
                      <li><span className="font-semibold">Delivery Cost:</span> £{costBreakdown.deliveryCost.toFixed(2)}</li> 
                      <li><span className="font-semibold">Fabric Cost:</span> £{costBreakdown.fabricCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Finish Cost:</span> £{costBreakdown.finishCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Profile Cost:</span> £{costBreakdown.profileCost.toFixed(2)}</li>
                      {costBreakdown.panelMaterialCost > 0 && <li><span className="font-semibold">Panel Material Cost:</span> £{costBreakdown.panelMaterialCost.toFixed(2)}</li>}
                      {costBreakdown.roundMaterialCost > 0 && <li><span className="font-semibold">Round/Oval Material Cost:</span> £{costBreakdown.roundMaterialCost.toFixed(2)}</li>}
                      <li><span className="font-semibold">Tray Frame Cost:</span> £{costBreakdown.trayFrameCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Brace Cost:</span> £{costBreakdown.braceCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Wedge Cost:</span> £{costBreakdown.wedgeCost.toFixed(2)}</li> 
                      <li><span className="font-semibold">Key Cost:</span> £{costBreakdown.keyCost.toFixed(2)}</li>   
                      <li><span className="font-semibold">Packaging Cost:</span> £{costBreakdown.packagingCost.toFixed(2)}</li> 
                      <li className="font-bold text-lg pt-2 border-t border-lightGreen/50"><span className="font-semibold">Subtotal (before markup):</span> £{costBreakdown.subtotal.toFixed(2)}</li>
                      {/* Markup percentage display: (multiplier - 1) * 100 */}
                      <li><span className="font-semibold">Markup ({ (costBreakdown.subtotal > 0 ? (((costBreakdown.finalPriceBeforeVAT / costBreakdown.subtotal) - 1) * 100).toFixed(0) : 0)}%):</span> £{costBreakdown.markupAmount.toFixed(2)}</li> 
                      <li className="font-bold text-lg"><span className="font-semibold">Price (before VAT):</span> £{costBreakdown.finalPriceBeforeVAT.toFixed(2)}</li>
                      <li className="font-bold text-lg"><span className="font-semibold">Final Price (VAT Inc.):</span> £{costBreakdown.finalPriceWithVAT.toFixed(2)}</li>
                  </ul>
              </div>
          )}
        </div>

        {/* Link back to MRP System (using onInternalNav) */}
        <div className="mt-8">
          <button
            onClick={() => onInternalNav('mrp')}
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