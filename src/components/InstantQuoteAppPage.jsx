// src/components/InstantQuoteAppPage.jsx
// Provides the user interface and logic for generating instant quotes for custom canvases.
// Fix: UNP (Unprimed) and NAT (Natural) are no longer Firestore materials; handled as direct zero cost options.
// Fix: Tray Frame Wood codes are T25N and T32N.
// Fix: Adjusted '12oz' fabricType comparison to lowercase 'oz' to match expected Firestore code.
// Fix: Finish dropdown displays user-friendly descriptions.
// Fix: Corrected brace material lookup to 'CB' code.
// Fix: When "Add Fabric to Panel" is checked, default fabricType to '12oz' to prevent finish dropdown "jumping".
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
    packagingCost: 0, 
    subtotal: 0,
    markupAmount: 0,
    finalPriceNet: 0, 
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
        return [];
    }
    return materialsData.filter(m => m.materialType === type);
  }, [materialsData]);

  const getMaterialByCode = useCallback((code) => {
    if (!materialsData || materialsData.length === 0 || !code) {
        return null;
    }
    return materialsData.find(m => m.code === code);
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
            packagingCost: 0, 
            subtotal: 0,
            markupAmount: 0,
            finalPriceNet: 0, 
        };

        let cumulativeCost = 0;

        const MARKUP_PERCENTAGE = 0.20; 
        const MINIMUM_QUOTE_PRICE = 25.00; 
        const BRACE_STANDARD_INTERVAL_CM = 90; 

        const convertToCm = (val) => (unit === 'IN' ? parseNum(val) * 2.54 : parseNum(val));
        const currentHeight = convertToCm(height);
        const currentWidth = convertToCm(width);
        const currentDiameter = convertToCm(diameter);
        const currentMajorAxis = convertToCm(majorAxis);
        const currentMinorAxis = convertToCm(minorAxis);

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

        // 1. Delivery Cost (remains largely the same)
        let deliveryAreaForBanding = 0;
        if (productType === 'STB') {
            const maxDim = Math.max(currentHeight, currentWidth);
            deliveryAreaForBanding = (10.0 * (maxDim + 5.0)) * 2.2;
        } else if (productType === 'RND') {
            deliveryAreaForBanding = Math.PI * Math.pow((currentDiameter + 10.0) / 2, 2);
        } else if (productType === 'OVL') {
            deliveryAreaForBanding = Math.PI * ((currentMajorAxis + 10.0) / 2) * ((currentMinorAxis + 10.0) / 2);
        }
        else {
            deliveryAreaForBanding = (currentHeight + 10.0) * (currentWidth + 10.0);
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
        
        // 2. Fabric Cost & Finish Cost (conditional based on product type and options)
        if (productType === 'CAN' || productType === 'RND' || productType === 'OVL') {
            if (productType === 'RND' || productType === 'OVL') {
                if (roundOption === 'Stretched') { // Only 12oz for stretched rounds/ovals
                    const selectedFabric = getMaterialByCode('12oz'); // Fabric is fixed to 12oz
                    if (selectedFabric && productAreaCm2 > 0) {
                        breakdown.fabricCost = (selectedFabric.mcp || 0) * productAreaCm2;
                        cumulativeCost += breakdown.fabricCost;
                    }
                } else { // FrameOnly option, no fabric cost
                    breakdown.fabricCost = 0;
                }
            } else { // Standard Canvas (CAN)
                const selectedFabric = getMaterialByCode(fabricType);
                if (selectedFabric && productAreaCm2 > 0) {
                    breakdown.fabricCost = (selectedFabric.mcp || 0) * productAreaCm2;
                    cumulativeCost += breakdown.fabricCost;
                }
            }

            // Finish cost for CAN, RND (Stretched), OVL (Stretched)
            if (finish === 'UNP' || finish === 'NAT') { 
                breakdown.finishCost = 0;
            } else {
                const selectedFinish = getMaterialByCode(finish);
                if (selectedFinish && productAreaCm2 > 0) {
                    breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                    cumulativeCost += breakdown.finishCost;
                }
            }
        } else if (productType === 'PAN') {
            // Panel has its own surface finish OR a stretched fabric
            if (panelHasFabric) {
                const selectedFabric = getMaterialByCode(fabricType); // Fabric for the panel
                if (selectedFabric && productAreaCm2 > 0) {
                    breakdown.fabricCost = (selectedFabric.mcp || 0) * productAreaCm2;
                    cumulativeCost += breakdown.fabricCost;
                }
                // Finish cost for fabric on panel
                if (finish === 'UNP' || finish === 'NAT') { // NAT here for fabric on panel
                    breakdown.finishCost = 0;
                } else {
                    const selectedFinish = getMaterialByCode(finish);
                    if (selectedFinish && productAreaCm2 > 0) {
                        breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                        cumulativeCost += breakdown.finishCost;
                    }
                }
            } else { // Bare Panel, finish applies to the panel itself
                if (finish === 'UNP' || finish === 'NAT') { // Panel is Natural/Unfinished
                    breakdown.finishCost = 0;
                } else {
                    const selectedFinish = getMaterialByCode(finish); // Primed White/Black for panel
                    if (selectedFinish && productAreaCm2 > 0) {
                        breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                        cumulativeCost += breakdown.finishCost;
                    }
                }
            }
        }

        // 3. Stretcher Bar/Profile Cost (applies to CAN, PAN, RND, OVL, STB)
        const profileMaterialCode = depth ? `P${depth}` : ''; 
        const selectedDepthProfile = getMaterialByCode(profileMaterialCode); 
        
        if (selectedDepthProfile && productPerimeterCm > 0) { 
            breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm;
            cumulativeCost += breakdown.profileCost;
        }

        // 4. Tray Frame Add-on Cost (for CAN, PAN if depth is not D44)
        let actualTrayFrameCode = '';
        if (trayFrameAddon === 'White') {
            actualTrayFrameCode = `T${depth}W`;
        } else if (trayFrameAddon === 'Black') {
            actualTrayFrameCode = `T${depth}B`;
        } else if (trayFrameAddon === 'Wood') {
            actualTrayFrameCode = `T${depth}N`; 
        }
        
        const selectedTrayFrame = getMaterialByCode(actualTrayFrameCode);
        const trayFrameValidForProduct = (productType === 'CAN' || productType === 'PAN' || productType === 'TRA') && depth !== '44'; 
        
        if (selectedTrayFrame && trayFrameValidForProduct && productPerimeterCm > 0) { 
            breakdown.trayFrameCost = (selectedTrayFrame.mcp || 0) * productPerimeterCm; 
            cumulativeCost += breakdown.trayFrameCost;
        }

        // 5. Braces Cost (for CAN, STB) - Corrected lookup for 'CB'
        const braceMaterial = getMaterialByCode('CB'); // Direct lookup by code 'CB'
        console.log("--- DEBUGGING LOG (Calculate Braces) --- braceMaterial found:", braceMaterial);
        console.log("--- DEBUGGING LOG (Calculate Braces) --- braceMaterial.mcp:", braceMaterial?.mcp);
        
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
            console.log(`--- DEBUGGING LOG (Calculate) --- Bracing Mode: Standard. Calculated H: ${currentHBraces}, W: ${currentWBraces}`);

        } else if (bracingMode === 'Custom') {
            currentHBraces = parseNum(customHBraces);
            currentWBraces = parseNum(customWBraces);
            console.log(`--- DEBUGGING LOG (Calculate) --- Bracing Mode: Custom. Input H: ${currentHBraces}, W: ${currentWBraces}`);
        }
        console.log(`--- DEBUGGING LOG (Calculate) --- Final Brace Counts for Cost: H=${currentHBraces}, W=${currentWBraces}`);

        const totalCalculatedBracesCount = currentHBraces + currentWBraces;
        console.log("--- DEBUGGING LOG (Calculate Braces) --- totalCalculatedBracesCount:", totalCalculatedBracesCount);

        if (braceMaterial && totalCalculatedBracesCount > 0 && totalCalculatedBracesCount <= 6) { 
            const totalBraceLengthCm = 
                (currentHBraces * currentWidth) + 
                (currentWBraces * currentHeight);
            console.log("--- DEBUGGING LOG (Calculate Braces) --- totalBraceLengthCm:", totalBraceLengthCm);

            breakdown.braceCost = (braceMaterial.mcp || 0) * totalBraceLengthCm;
            console.log("--- DEBUGGING LOG (Calculate Braces) --- Calculated breakdown.braceCost:", breakdown.braceCost);
            cumulativeCost += breakdown.braceCost;
        } else {
            console.log("--- DEBUGGING LOG (Calculate Braces) --- Brace cost not calculated: Conditions not met. braceMaterial:", braceMaterial, "totalCalculatedBracesCount:", totalCalculatedBracesCount);
        }
        
        // 6. Packaging Cost (dynamic based on product type and specific codes BUB, CAR)
        const bubbleWrapMaterial = getMaterialByCode('BUB'); 
        const cardboardMaterial = getMaterialByCode('CAR');     

        const mcpBubbleWrap = bubbleWrapMaterial?.mcp || 0;
        const mcpCardboard = cardboardMaterial?.mcp || 0;

        if (productType === 'STB') {
            const maxDim = Math.max(currentHeight, currentWidth);
            breakdown.packagingCost = (10.0 * (maxDim + 5.0)) * 2.2 * mcpCardboard;
        } else if (productAreaCm2 > 0) {
            breakdown.packagingCost = (currentWidth * currentHeight) * 2.2 * (mcpBubbleWrap + mcpCardboard);
        } else {
            breakdown.packagingCost = 0; 
        }
        cumulativeCost += breakdown.packagingCost;


        breakdown.subtotal = cumulativeCost;

        breakdown.markupAmount = cumulativeCost * MARKUP_PERCENTAGE;
        breakdown.finalPriceNet = cumulativeCost * (1 + MARKUP_PERCENTAGE);

        let finalPriceWithFloor = Math.max(breakdown.finalPriceNet, MINIMUM_QUOTE_PRICE);

        setCostBreakdown(breakdown);

        return finalPriceWithFloor;
    } catch (error) {
        console.error("--- CRITICAL ERROR IN calculatePreliminaryPrice ---", error);
        setQuotePrice('ERROR'); 
        setCostBreakdown({ 
            deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, 
            trayFrameCost: 0, braceCost: 0, packagingCost: 0, subtotal: 0,
            markupAmount: 0, finalPriceNet: 0, 
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
        if (fabricType) { // only if a fabric is selected/determined
            const fabricObj = getMaterialByCode(fabricType);
            fabricAbbr = fabricObj?.code || '';
        }
        
        // Common logic for finishAbbr (transforms to SKU codes)
        finishAbbr = finish; 
        if (finishAbbr === 'WPR') finishAbbr = 'PRW'; 
        if (finishAbbr === 'BPR') finishAbbr = 'PRB';
        if (finishAbbr === 'CLR') finishAbbr = 'CSL'; 

        // Common depth abbreviation logic
        const commonDepthsSku = { 
            '25': 'P25', '32': 'P32', '40': 'P40', '44': 'P44', 
            '24': 'P24', '30': 'P30', '36': 'P36', '42': 'P42'  
        }; 
        const selectedDepthAbbr = commonDepthsSku[depth] || ''; 
        validDepth = selectedDepthAbbr !== '';

        // Common tray frame logic
        const trayFrameValid = (productType === 'CAN' || productType === 'PAN' || productType === 'TRA') && depth !== '44'; 
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

        // Common bracing logic
        let currentHBracesForSku = 0;
        let currentWBracesForSku = 0;
        if (bracingMode === 'Standard') {
            const currentHeightCm = convertToCm(height);
            const currentWidthCm = convertToCm(width);
            currentHBracesForSku = Math.min(Math.floor(currentWidthCm / BRACE_STANDARD_INTERVAL_CM), 3);
            currentWBracesForSku = Math.min(Math.floor(currentHeightCm / BRACE_STANDARD_INTERVAL_CM), 3);
        } else if (bracingMode === 'Custom') {
            currentHBracesForSku = parseNum(customHBraces);
            currentWBracesForSku = parseNum(customWBraces);
        }
        const totalCustomBraces = currentHBracesForSku + currentWBracesForSku;
        if (totalCustomBraces > 0 && totalCustomBraces <= 6 && (productType === 'CAN' || productType === 'STB')) { 
            customBracingPart = `-H${currentHBracesForSku}W${currentWBracesForSku}`;
        }


        switch (productType) {
          case 'CAN': 
            validDimensions = (parseNum(height) > 0 && parseNum(width) > 0);
            validFabric = fabricAbbr !== '';
            validFinish = finishAbbr !== '';

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
            validFinish = finishAbbr !== '';

            if (panelHasFabric) {
                validFabric = fabricAbbr !== '';
            } else {
                validFabric = true; 
            }

            if (validDimensions && validDepth && validFinish && validFabric) {
                const fabricPart = panelHasFabric ? `-${fabricAbbr}` : ''; 
                generatedSku = `PAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricPart}-${finishAbbr}${trayFramePart}`;
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
                generatedSku = `RND-${parseNum(diameter).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricFinishPart}`;
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
                generatedSku = `OVL-${parseNum(majorAxis).toFixed(1)}-${parseNum(minorAxis).toFixed(1)}-${selectedDepthAbbr}-${unit}${fabricFinishPart}`;
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
            
            if (validDimensions && validFinish) { 
                generatedSku = `TRA-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-PXX-${unit}-${finishAbbr}`; 
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
        packagingCost: 0,
        subtotal: 0,
        markupAmount: 0,
        finalPriceNet: 0,
    });
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
            setFabricType('12oz'); // Automatically set to 12oz when 'Add Fabric' is checked
            setFinish(''); // Reset finish, will be determined by 12oz fabric
        } else {
            // If panelHasFabric is unchecked, clear fabric type, and reset finish to default bare panel finishes
            setFabricType(''); 
            if (finish === 'NAT') { // If it was already NAT, it stays NAT.
                setFinish('NAT');
            } else { // Otherwise, reset to no finish for bare panel
                setFinish('');
            }
        }
    }
  }, [panelHasFabric, productType]); // Added productType as dependency


  // --- Dynamic Dropdown Options Getters ---

  const getDepthOptions = useCallback(() => {
    switch (productType) {
      case 'CAN': 
      case 'PAN': 
      case 'STB':
        return ['25', '32', '40', '44'].map(d => ({ 
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
    if (productType === 'RND' || productType === 'OVL') {
        if (roundOption === 'Stretched') {
            const fabric12oz = getMaterialByCode('12oz');
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
        const fabrics = getMaterialsByType('Fabric');
        return fabrics.map(f => ({ code: f.code, description: f.description })); 
    } else if (productType === 'CAN') {
        const fabrics = getMaterialsByType('Fabric');
        return fabrics.map(f => ({ code: f.code, description: f.description })); 
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
            case 'CSL': return 'Clear Sealed';
            default: return allFinishesFromFirestore.find(f => f.code === code)?.description || code; 
        }
    };

    if (productType === 'CAN') {
        if (fabricType === '12oz') { 
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
            console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered for 12oz (WPR, BPR):", filteredPrimers);
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        } else if (fabricType === 'LIN') {
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'CSL'].includes(f.code));
            console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered for LIN (WPR, CSL):", filteredPrimers);
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        } else if (fabricType === 'SUP' || fabricType === 'OIL') {
            allowedFinishes.push({ code: 'NAT', description: getDescriptiveFinishName('NAT') }); 
        }
    }
    else if (productType === 'PAN') {
        if (panelHasFabric) { // If fabric is added to panel, finishes are for fabric
            if (fabricType === '12oz') {
                allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') });
                const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
                allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
            } else if (fabricType === 'LIN') {
                allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') });
                const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'CSL'].includes(f.code));
                allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
            } else if (fabricType === 'SUP' || fabricType === 'OIL') {
                 allowedFinishes.push({ code: 'NAT', description: getDescriptiveFinishName('NAT') }); 
            }
        } else { // Bare panel, finishes are for the panel surface
            allowedFinishes.push({ code: 'NAT', description: getDescriptiveFinishName('NAT') });
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        }
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
        const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR', 'CSL'].includes(f.code));
        allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
    }
    // STB does not have a finish option

    const uniqueFinishes = Array.from(new Map(allowedFinishes.map(item => [item.code, item])).values());

    console.log("--- DEBUGGING LOG (getFinishOptions) --- Filtered and unique allowedFinishes (final):", uniqueFinishes);
    return uniqueFinishes; 
  }, [productType, fabricType, roundOption, panelHasFabric, getMaterialsByType]); 

  const getTrayFrameAddonOptions = useCallback(() => {
      if (!((productType === 'CAN' || productType === 'PAN') && depth !== '44')) {
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
            packagingCost: costBreakdown.packagingCost, 
            subtotal: costBreakdown.subtotal,
            markupAmount: costBreakdown.markupAmount,
            finalPriceNet: costBreakdown.finalPriceNet,
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
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option> 
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
                        className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                    >
                        <option value="Stretched" className="bg-deepGray text-offWhite">Stretched</option>
                        <option value="FrameOnly" className="bg-deepGray text-offWhite">Frame Only</option>
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
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                  disabled={((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched')} 
                >
                  <option value="">Select Fabric</option>
                  {getFabricOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option>
                  ))}
                </select>
                {((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') && (
                    <p className="text-lightGreen text-xs mt-1">Fabric fixed to 12oz for stretched {productType === 'RND' ? 'Round' : 'Oval'}.</p>
                )}
              </div>
            )}

            {/* Finish Selection (Canvas, Panel, Stretched Round/Oval, Tray Frame) */}
            {((productType === 'CAN') || 
              (productType === 'PAN') || 
              ((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') ||
              (productType === 'TRA') 
            ) && (
              <div>
                <label htmlFor="finish" className="block text-offWhite text-sm font-semibold mb-2">
                  Finish
                </label>
                <select
                  id="finish" value={finish} onChange={(e) => setFinish(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                  disabled={(productType === 'PAN' && panelHasFabric && !fabricType) || 
                            ((productType === 'RND' || productType === 'OVL') && roundOption === 'FrameOnly')} 
                >
                  <option value="">Select Finish</option>
                  {getFinishOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option>
                  ))}
                </select>
                {productType === 'PAN' && panelHasFabric && !fabricType && (
                    <p className="text-red-300 text-xs mt-1">Select a fabric type first.</p>
                )}
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
                  disabled={depth === '44'} 
                >
                  <option value="">No Tray Frame</option>
                  {getTrayFrameAddonOptions().map(opt => (
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option>
                  ))}
                </select>
                {depth === '44' && (
                    <p className="text-red-300 text-xs mt-1">Tray Frame not compatible with D44 depth.</p>
                )}
              </div>
            )}

            {/* Bracing Options (Canvas, Stretcher Bar Frame) */}
            {(productType === 'CAN' || productType === 'STB') && (
              <>
                <div>
                  <label htmlFor="bracingMode" className="block text-offWhite text-sm font-semibold mb-2">
                    Bracing Options
                  </label>
                  <select
                    id="bracingMode" value={bracingMode} onChange={(e) => setBracingMode(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 text-offWhite border border-lightGreen focus:outline-none focus:ring-2 focus:ring-accentGold focus:border-lightGreen"
                  >
                    <option value="Standard" className="bg-deepGray text-offWhite">Standard (Automatic)</option>
                    <option value="None" className="bg-deepGray text-offWhite">No Braces</option>
                    <option value="Custom" className="bg-deepGray text-offWhite">Custom Braces</option>
                  </select>
                </div>
                {bracingMode === 'Custom' && ( 
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
                      <li><span className="font-semibold">Tray Frame Cost:</span> £{costBreakdown.trayFrameCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Brace Cost:</span> £{costBreakdown.braceCost.toFixed(2)}</li>
                      <li><span className="font-semibold">Packaging Cost:</span> £{costBreakdown.packagingCost.toFixed(2)}</li> 
                      <li className="font-bold text-lg pt-2 border-t border-lightGreen/50"><span className="font-semibold">Subtotal (before markup):</span> £{costBreakdown.subtotal.toFixed(2)}</li>
                      <li><span className="font-semibold">Markup ({ (costBreakdown.subtotal > 0 ? (100 * (costBreakdown.markupAmount / costBreakdown.subtotal)).toFixed(0) : 0)}%):</span> £{costBreakdown.markupAmount.toFixed(2)}</li> 
                      <li className="font-bold text-lg"><span className="font-semibold">Final Price (before min. floor):</span> £{costBreakdown.finalPriceNet.toFixed(2)}</li>
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