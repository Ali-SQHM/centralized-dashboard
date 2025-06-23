// src/components/InstantQuoteAppPage.jsx
// Provides the user interface and logic for generating instant quotes for custom canvases.
// Fetches material data from Firestore for calculations and allows saving quotes to Firestore.
// FIX: Corrected scope of 'breakdown' object within calculatePreliminaryPrice function.
// ENHANCEMENTS:
// - Robust error handling with try-catch blocks to prevent UI crashes.
// - Extensive console.log statements for debugging finish options and bracing calculations.
// - Refined Finish options based on Fabric Type, including "Unprimed".
// - Tray Frame options simplified to "None", "White", "Black", "Wood" with dynamic code generation.
// - Advanced Bracing options: "No Braces", "Standard (Automatic)", and "Custom Braces".

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore'; 
import { colors, commonUnits, materialTypes } from '../utils/constants'; 

function InstantQuoteAppPage({ db, onInternalNav, firestoreAppId, userId }) { 
  const [productType, setProductType] = useState('CAN'); 
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState('');
  const [majorAxis, setMajorAxis] = useState('');
  const [minorAxis, setMinorAxis] = useState('');
  const [depth, setDepth] = useState(''); 
  const [unit, setUnit] = useState('CM');
  const [fabricType, setFabricType] = useState('');
  const [finish, setFinish] = useState('');
  const [trayFrameAddon, setTrayFrameAddon] = useState(''); 
  const [bracingMode, setBracingMode] = useState('None'); // 'None', 'Standard', 'Custom'
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
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


  // Firestore collection reference for materials (PUBLICLY ACCESSIBLE)
  const getPublicMaterialsCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for public materials reference in InstantQuoteAppPage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
  };

  // Firestore collection reference for quotes (PUBLICLY ACCESSIBLE for now)
  const getPublicQuotesCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for public quotes reference in InstantQuoteAppPage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/quotes`);
  };

  // Fetch all materials on component mount
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
      console.log("--- DEBUGGING LOG --- Fetched Materials Sample (first 5):", fetchedMaterials.slice(0, 5));
    }, (err) => {
      console.error("Error fetching materials for Quote App:", err);
      setErrorMaterials(`Failed to load material options: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/${firestoreAppId}/public/data/materials.`);
      setLoadingMaterials(false);
    });

    return () => unsubscribe();
  }, [db, firestoreAppId]);


  // Helper to filter materials by type
  const getMaterialsByType = (type) => {
    return materialsData.filter(m => m.materialType === type);
  };

  // Helper to get material code/data from code (for dynamic dropdowns and calculations)
  const getMaterialByCode = (code) => {
    const foundMaterial = materialsData.find(m => m.code === code);
    return foundMaterial;
  };

  // Memoized calculatePreliminaryPrice function
  const calculatePreliminaryPrice = useCallback(() => {
    try {
        // Initialize breakdown for THIS calculation cycle inside the function
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

        const parseNum = (value) => parseFloat(value) || 0;
        const MARKUP_PERCENTAGE = 0.20; 
        const MINIMUM_QUOTE_PRICE = 25.00; 
        const BRACE_STANDARD_INTERVAL_CM = 90; // Standard interval for automatic bracing

        // Convert dimensions to CM for consistent internal calculations
        const convertToCm = (val) => (unit === 'IN' ? parseNum(val) * 2.54 : parseNum(val));
        const currentHeight = convertToCm(height);
        const currentWidth = convertToCm(width);
        const currentDiameter = convertToCm(diameter);
        const currentMajorAxis = convertToCm(majorAxis);
        const currentMinorAxis = convertToCm(minorAxis);

        let productAreaCm2 = 0; 
        let productPerimeterCm = 0;

        // Determine product dimensions based on type
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

        // 1. Dynamic Delivery Cost Calculation
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
        
        // 2. Fabric Cost
        const selectedFabric = getMaterialByCode(fabricType);
        if (selectedFabric && productAreaCm2 > 0) {
            breakdown.fabricCost = (selectedFabric.mcp || 0) * productAreaCm2;
            cumulativeCost += breakdown.fabricCost;
        }

        // 3. Finish Cost (Zero if "Unprimed")
        const selectedFinish = getMaterialByCode(finish);
        if (finish === 'UNP') { // "Unprimed" option has 0 cost
            breakdown.finishCost = 0;
        } else if (selectedFinish && productAreaCm2 > 0) {
            breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
            cumulativeCost += breakdown.finishCost;
        }

        // 4. Stretcher Bar/Profile Cost (applies to CAN, PAN, RND, OVL, STB)
        const profileMaterialCode = depth ? `P${depth}` : ''; 
        const selectedDepthProfile = getMaterialByCode(profileMaterialCode); 
        
        if (selectedDepthProfile && productPerimeterCm > 0) { 
            breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm;
            cumulativeCost += breakdown.profileCost;
        }

        // 5. Tray Frame Add-on Cost (for CAN, PAN if depth is not D44)
        let actualTrayFrameCode = '';
        if (trayFrameAddon === 'White') {
            actualTrayFrameCode = `T${depth}W`;
        } else if (trayFrameAddon === 'Black') {
            actualTrayFrameCode = `T${depth}B`;
        } else if (trayFrameAddon === 'Wood') {
            actualTrayFrameCode = `T${depth}Wd`;
        }
        
        const selectedTrayFrame = getMaterialByCode(actualTrayFrameCode);
        const trayFrameValidForProduct = (productType === 'CAN' || productType === 'PAN') && depth !== '44';
        
        if (selectedTrayFrame && trayFrameValidForProduct && productPerimeterCm > 0) { 
            breakdown.trayFrameCost = (selectedTrayFrame.mcp || 0) * productPerimeterCm; 
            cumulativeCost += breakdown.trayFrameCost;
        }

        // 6. Custom Braces Cost (for CAN, STB)
        const braceMaterial = getMaterialsByType('Wood').find(m => m.code.includes('BRACE')); 
        let currentHBraces = 0;
        let currentWBraces = 0;

        if (bracingMode === 'Standard') {
            if (currentWidth > BRACE_STANDARD_INTERVAL_CM) {
                currentHBraces = Math.floor(currentWidth / BRACE_STANDARD_INTERVAL_CM);
            }
            if (currentHeight > BRACE_STANDARD_INTERVAL_CM) {
                currentWBraces = Math.floor(currentHeight / BRACE_STANDARD_INTERVAL_CM);
            }
            currentHBraces = Math.min(currentHBraces, 3); // Limit to max 3 braces
            currentWBraces = Math.min(currentWBraces, 3); // Limit to max 3 braces
            console.log(`--- DEBUGGING LOG --- Bracing Mode: Standard. Calculated H: ${currentHBraces}, W: ${currentWBraces}`);

        } else if (bracingMode === 'Custom') {
            currentHBraces = parseNum(customHBraces);
            currentWBraces = parseNum(customWBraces);
            console.log(`--- DEBUGGING LOG --- Bracing Mode: Custom. Input H: ${currentHBraces}, W: ${currentWBraces}`);
        }
        console.log(`--- DEBUGGING LOG --- Final Brace Counts for Cost: H=${currentHBraces}, W=${currentWBraces}`);

        const totalCalculatedBracesCount = currentHBraces + currentWBraces;

        if (braceMaterial && totalCalculatedBracesCount > 0 && totalCalculatedBracesCount <= 6) { 
            const totalBraceLengthCm = 
                (currentHBraces * currentWidth) + 
                (currentWBraces * currentHeight);
            breakdown.braceCost = (braceMaterial.mcp || 0) * totalBraceLengthCm;
            cumulativeCost += breakdown.braceCost;
        }
        
        // 7. Packaging Cost (dynamic based on product type and specific codes BUB, CAR)
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
        setQuotePrice('ERROR'); // Display an error state in UI
        setCostBreakdown({ // Reset breakdown to avoid displaying incorrect numbers
            deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, 
            trayFrameCost: 0, braceCost: 0, packagingCost: 0, subtotal: 0,
            markupAmount: 0, finalPriceNet: 0, 
        });
        return null;
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, getMaterialsByType]);

  // SKU Generation Logic and Preliminary Price Calculation
  useEffect(() => {
    try {
        let generatedSku = '';
        let currentPrice = 0; 

        const parseNum = (value) => parseFloat(value) || 0;
        const BRACE_STANDARD_INTERVAL_CM = 90;
        const convertToCm = (val) => (unit === 'IN' ? parseNum(val) * 2.54 : parseNum(val)); // Needed for SKU brace calculation

        // --- SKU Generation Logic ---
        switch (productType) {
          case 'CAN': 
            const canvasDepthsSku = { '25': 'P25', '32': 'P32', '40': 'P40', '44': 'P44' }; 
            const selectedDepthAbbr = canvasDepthsSku[depth] || ''; 
            const fabricObj = getMaterialByCode(fabricType);
            const finishObj = getMaterialByCode(finish);
            let fabricAbbr = fabricObj?.code || ''; 
            let finishAbbr = finish === 'UNP' ? 'UNP' : (finishObj?.code || ''); 
            
            if (finishAbbr === 'WPR') finishAbbr = 'PRW'; 
            if (finishAbbr === 'BPR') finishAbbr = 'PRB';
            if (finishAbbr === 'CLR') finishAbbr = 'CSL'; 

            if ((fabricAbbr === 'OIL' || fabricAbbr === 'SUP') && finishAbbr !== 'NAT' && finishAbbr !== 'UNP') { 
                finishAbbr = 'NAT'; 
            } else if (fabricAbbr === '12OZ' && !['UP', 'PRW', 'PRB', 'UNP'].includes(finishAbbr)) { 
                finishAbbr = 'UP'; 
            } else if (fabricAbbr === 'LIN' && !['UP', 'PRW', 'CSL', 'UNP'].includes(finishAbbr)) { 
                finishAbbr = 'UP'; 
            }

            let trayFramePart = '';
            const trayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44'; 
            
            let trayFrameSKUCode = '';
            if (trayFrameAddon === 'White') {
                trayFrameSKUCode = `T${depth}W`;
            } else if (trayFrameAddon === 'Black') {
                trayFrameSKUCode = `T${depth}B`;
            } else if (trayFrameAddon === 'Wood') {
                trayFrameSKUCode = `T${depth}Wd`;
            }

            if (trayFrameSKUCode && trayFrameValid) { 
              trayFramePart = `-${trayFrameSKUCode}`; 
            }

            let customBracingPart = '';
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
            if (totalCustomBraces > 0 && totalCustomBraces <= 6) { 
              customBracingPart = `-H${currentHBracesForSku}W${currentWBracesForSku}`;
            }

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

          case 'PAN': 
              const panelDepthsSku = { '25': 'P25', '32': 'P32', '44': 'P44' }; 
              const panelDepthAbbr = panelDepthsSku[depth] || 'DXX';
              const panelFabricObj = getMaterialByCode(fabricType);
              const panelFabricAbbr = panelFabricObj?.code || 'BARE'; 
              const panelFinishObj = getMaterialByCode(finish);
              let panelFinishAbbr = finish === 'UNP' ? 'UNP' : (panelFinishObj?.code || 'NAT'); 
                if (panelFinishAbbr === 'WPR') panelFinishAbbr = 'PRW'; 
                if (panelFinishAbbr === 'BPR') panelFinishAbbr = 'PRB';
                if (panelFinishAbbr === 'CLR') panelFinishAbbr = 'CSL'; 

              const panelTrayFrameValid = (productType === 'CAN' || productType === 'PAN') && depth !== '44';
              let panelTrayFrameSKUCode = '';
                if (trayFrameAddon === 'White') {
                    panelTrayFrameSKUCode = `T${depth}W`;
                } else if (trayFrameAddon === 'Black') {
                    panelTrayFrameSKUCode = `T${depth}B`;
                } else if (trayFrameAddon === 'Wood') {
                    panelTrayFrameSKUCode = `T${depth}Wd`;
                }
              const panelTrayFramePart = (panelTrayFrameSKUCode && panelTrayFrameValid) ? `-${panelTrayFrameSKUCode}` : '';

              if (parseNum(height) > 0 && parseNum(width) > 0 && panelDepthAbbr !== 'DXX') {
                generatedSku = `PAN-${parseNum(height).toFixed(1)}-${parseNum(width).toFixed(1)}-${panelDepthAbbr}-${unit}-${panelFabricAbbr}-${panelFinishAbbr}${panelTrayFramePart}`;
                currentPrice = calculatePreliminaryPrice();
              } else {
                generatedSku = 'Incomplete configuration';
                currentPrice = null;
              }
              break;

          case 'RND': 
              const rndDepthsSku = { '24': 'P24', '30': 'P30', '36': 'P36', '42': 'P42' }; 
              const rndDepthAbbr = rndDepthsSku[depth] || 'DXX';
              const rndFabricObj = getMaterialByCode(fabricType);
              const rndFabricAbbr = rndFabricObj?.code || '12OZ';
              const rndFinishObj = getMaterialByCode(finish);
              let rndFinishAbbr = finish === 'UNP' ? 'UNP' : (rndFinishObj?.code || ''); 
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

          case 'OVL': 
              const ovlDepthsSku = { '24': 'P24', '30': 'P30', '36': 'P36', '42': 'P42' }; 
              const ovlDepthAbbr = ovlDepthsSku[depth] || 'DXX';
              const ovlFabricObj = getMaterialByCode(fabricType);
              const ovlFabricAbbr = ovlFabricObj?.code || '12OZ';
              const ovlFinishObj = getMaterialByCode(finish);
              let ovlFinishAbbr = finish === 'UNP' ? 'UNP' : (ovlFinishObj?.code || ''); 
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

          case 'TRA': 
              const trayFinishObj = getMaterialByCode(finish);
              let trayFinishAbbr = finish === 'UNP' ? 'UNP' : (trayFinishObj?.code || 'NAT'); 
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

          case 'STB': 
              const stbDepthsSku = { '25': 'P25', '32': 'P32', '40': 'P40', '44': 'P44' }; 
              const stbDepthAbbr = stbDepthsSku[depth] || 'DXX';
              
              let stbHBracesForSku = 0;
              let stbWBracesForSku = 0;

              if (bracingMode === 'Standard') {
                  const currentHeightCm = convertToCm(height);
                  const currentWidthCm = convertToCm(width);
                  stbHBracesForSku = Math.min(Math.floor(currentWidthCm / BRACE_STANDARD_INTERVAL_CM), 3);
                  stbWBracesForSku = Math.min(Math.floor(currentHeightCm / BRACE_STANDARD_INTERVAL_CM), 3);
              } else if (bracingMode === 'Custom') {
                  stbHBracesForSku = parseNum(customHBraces);
                  stbWBracesForSku = parseNum(customWBraces);
              }

              const stbTotalCustomBraces = stbHBracesForSku + stbWBracesForSku;
              const stbCustomBracingPart = (stbTotalCustomBraces > 0 && stbTotalCustomBraces <= 6) ? `-H${stbHBracesForSku}W${stbWBracesForSku}` : '';

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
        setQuoteSaveMessage(''); 
    } catch (error) {
        console.error("--- CRITICAL ERROR IN SKU Generation / Main useEffect ---", error);
        setSku('ERROR generating SKU');
        setQuotePrice('ERROR');
        setQuoteSaveMessage('An internal error occurred. Check console.');
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, calculatePreliminaryPrice]); 


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
    setBracingMode('None');
    setCustomHBraces(0);
    setCustomWBraces(0);
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


  // Define specific dropdown options based on fetched materials and blueprint rules
  const getDepthOptions = () => {
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
  };

  const getFabricOptions = () => {
    const fabrics = getMaterialsByType('Fabric');
    return fabrics.map(f => ({ code: f.code, description: f.description })); 
  };

  const getFinishOptions = () => {
    console.log("--- DEBUGGING LOG --- getFinishOptions called. Current fabricType:", fabricType);
    const allFinishes = getMaterialsByType('Mediums/Coatings');
    console.log("--- DEBUGGING LOG --- All 'Mediums/Coatings' from Firestore:", allFinishes);

    let allowedFinishes = [];

    // Always add "Unprimed" option for relevant product types if not already present
    if (['CAN', 'PAN', 'RND', 'OVL'].includes(productType)) {
        if (!allowedFinishes.some(opt => opt.code === 'UNP')) {
            allowedFinishes.push({ code: 'UNP', description: 'Unprimed' });
        }
    }

    // Refined Finish logic based on your new rules:
    if (fabricType === '12OZ') {
        allowedFinishes = allowedFinishes.concat(allFinishes.filter(f => ['WPR', 'BPR'].includes(f.code)).map(f => ({ code: f.code, description: f.description })));
    } else if (fabricType === 'LIN') {
        allowedFinishes = allowedFinishes.concat(allFinishes.filter(f => ['WPR', 'CSL'].includes(f.code)).map(f => ({ code: f.code, description: f.description })));
    } 
    // For 'SUP' (Superfine) and 'OIL', only 'NAT' is allowed besides 'UNP'
    else if (fabricType === 'SUP' || fabricType === 'OIL') {
        allowedFinishes = allowedFinishes.concat(allFinishes.filter(f => f.code === 'NAT').map(f => ({ code: f.code, description: f.description })));
    }

    console.log("--- DEBUGGING LOG --- Filtered allowedFinishes:", allowedFinishes);
    return allowedFinishes; 
  };

  const getTrayFrameAddonOptions = () => {
      // The user wants 'None', 'White', 'Black', 'Wood' as options
      // We will map these simple strings to full material codes like T25W, T32B in calculation/SKU.
      
      // First, check if tray frames are compatible with current product type and depth
      if (!((productType === 'CAN' || productType === 'PAN') && depth !== '44')) {
          return []; // Not compatible, return no options
      }
      
      const options = [];
      // These options are always displayed if compatible.
      // The calculation will check for actual material code presence in materialsData.
      options.push({ code: 'White', description: 'White' });
      options.push({ code: 'Black', description: 'Black' });
      options.push({ code: 'Wood', description: 'Wood' });

      return options; 
  };


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

      <div className="bg-mediumGreen rounded-xl shadow-lg p-4 sm:p-8 w-full max-w-2xl"> {/* Increased max-w and adjusted padding */}
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
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option>
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
                    <option key={opt.code} value={opt.code} className="bg-deepGray text-offWhite">{opt.description}</option>
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
                    <option value="None" className="bg-deepGray text-offWhite">No Braces</option>
                    <option value="Standard" className="bg-deepGray text-offWhite">Standard (Automatic)</option>
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