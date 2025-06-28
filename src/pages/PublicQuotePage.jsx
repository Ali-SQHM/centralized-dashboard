// src/pages/PublicQuotePage.jsx
// This component provides the public-facing user interface for generating instant quotes for custom canvases.
// It is accessible to unauthenticated users. When a quote request is submitted, it will gather customer details
// and, in a later phase, send this information to a Firebase Cloud Function for secure processing with Wix.
// Currently, the submit action logs data and shows a confirmation message.
//
// Key Updates:
// - Hidden detailed cost breakdown; only final price shown.
// - Added Quantity field to impact total price.
// - Implemented responsive info tabs for Profiles/Wood, Fabrics, and Cross Braces with placeholders.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore'; // Removed addDoc as submission will go via Cloud Function
import { colors, commonUnits, materialTypes } from '../utils/constants'; 

// Import lucide-react for icons
import { Chrome } from 'lucide-react';

function PublicQuotePage({ signInWithGoogle, db, firestoreAppId, userId }) { 
  // Helper function for parsing numbers, memoized for performance
  const parseNum = useCallback((value) => parseFloat(value) || 0, []);

  // --- State Variables for Quote Configuration ---
  const [productType, setProductType] = useState('CAN'); 
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState('');
  const [majorAxis, setMajorAxis] = useState('');
  const [minorAxis, setMinorAxis] = useState('');
  const [depth, setDepth] = useState(''); 
  const [unit, setUnit] = useState('CM');
  const [quantity, setQuantity] = useState(1); // New quantity field
  const [fabricType, setFabricType] = useState('');
  const [finish, setFinish] = useState('');
  const [trayFrameAddon, setTrayFrameAddon] = useState(''); 
  const [bracingMode, setBracingMode] = useState('Standard'); 
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
  const [roundOption, setRoundOption] = useState('Stretched');
  const [panelHasFabric, setPanelHasFabric] = useState(false);

  // --- State Variables for Generated Quote and Customer Info ---
  const [sku, setSku] = useState('');
  const [quotePrice, setQuotePrice] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true); 
  const [errorMaterials, setErrorMaterials] = useState(null);
  const [quoteSubmitMessage, setQuoteSubmitMessage] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // State for active info tab
  const [activeInfoTab, setActiveInfoTab] = useState('profiles'); // 'profiles', 'fabrics', 'braces'


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


  // --- Firestore References (for materials only, quotes will go via CF later) ---
  const getPublicMaterialsCollectionRef = () => {
    if (!db || !firestoreAppId) {
      console.error("Firestore DB or App ID not available for public materials reference in PublicQuotePage.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
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
    const filtered = materialsData.filter(m => m.materialType === type);
    return filtered;
  }, [materialsData]);

  const getMaterialByCode = useCallback((code) => {
    if (!materialsData || materialsData.length === 0 || !code) {
        return null;
    }
    const found = materialsData.find(m => m.code === code);
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

        
        // 2. Fabric Cost & Finish Cost (conditional based on product type and options)
        let selectedFabric = null;
        let fabricCostAreaCm2 = 0;

        if (productType === 'CAN' || productType === 'RND' || productType === 'OVL') {
            if ((productType === 'RND' || productType === 'OVL') && roundOption === 'Stretched') { 
                selectedFabric = getMaterialByCode('12oz');
                if (productType === 'RND') {
                    fabricCostAreaCm2 = (currentDiameter + FABRIC_WASTE_MARGIN) * (currentDiameter + FABRIC_WASTE_MARGIN);
                } else if (productType === 'OVL') {
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

            let selectedFinish = null;
            let finishCost = 0;
            if (finish === 'UNP' || finish === 'NAT' || fabricType === 'SUP' || fabricType === 'OIL') { 
                finishCost = 0;
            } else {
                selectedFinish = getMaterialByCode(finish);
                if (selectedFinish) {
                    let relevantArea = fabricCostAreaCm2;

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
                    } else {
                        finishCost = (selectedFinish.mcp || 0) * relevantArea;
                    }
                }
            }
            breakdown.finishCost = finishCost;
            cumulativeCost += breakdown.finishCost;

        } else if (productType === 'PAN') {
            if (panelHasFabric) {
                selectedFabric = getMaterialByCode(fabricType); 
                fabricCostAreaCm2 = (currentHeight + FABRIC_WASTE_MARGIN) * (currentWidth + FABRIC_WASTE_MARGIN);
                if (selectedFabric && fabricCostAreaCm2 > 0) {
                    breakdown.fabricCost = (selectedFabric.mcp || 0) * fabricCostAreaCm2;
                    cumulativeCost += breakdown.fabricCost;
                }

                let selectedFinish = null;
                let finishCost = 0;
                if (finish === 'UNP' || finish === 'NAT' || fabricType === 'SUP' || fabricType === 'OIL') { 
                    finishCost = 0;
                } else {
                    selectedFinish = getMaterialByCode(finish);
                    if (selectedFinish) {
                        let relevantArea = fabricCostAreaCm2;
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
                        } else {
                            finishCost = (selectedFinish.mcp || 0) * relevantArea;
                        }
                    }
                }
                breakdown.finishCost = finishCost;
                cumulativeCost += breakdown.finishCost;

            } else {
                let selectedFinish = null;
                if (finish === 'UNP' || finish === 'NAT') { 
                    breakdown.finishCost = 0;
                } else {
                    selectedFinish = getMaterialByCode(finish); 
                    if (selectedFinish && productAreaCm2 > 0) {
                        breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                        cumulativeCost += breakdown.finishCost;
                    }
                }
            }
        } else if (productType === 'TRA') {
            let selectedFinish = getMaterialByCode(finish); 
            if (selectedFinish && productAreaCm2 > 0) {
                breakdown.finishCost = (selectedFinish.mcp || 0) * productAreaCm2;
                cumulativeCost += breakdown.finishCost;
            }
        }


        // Panel Material Cost for PAN if no fabric
        if (productType === 'PAN' && !panelHasFabric) {
            const ply6Material = getMaterialByCode('PLY6');
            if (ply6Material && currentHeight > 0 && currentWidth > 0) {
                breakdown.panelMaterialCost = (ply6Material.mcp || 0) * (currentHeight + PLY6_WASTE_MARGIN) * (currentWidth + PLY6_WASTE_MARGIN);
                cumulativeCost += breakdown.panelMaterialCost;
            }
        }

        // Round/Oval Material Cost for RND/OVL
        if (productType === 'RND' || productType === 'OVL') {
            const mdf6Material = getMaterialByCode('MDF6');
            
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

            }
        }


        // 3. Stretcher Bar/Profile Cost
        let selectedDepthProfile = null;
        let profileMultiplier = 1;

        if (productType === 'PAN') {
            if (depth === '25') {
                selectedDepthProfile = getMaterialByCode('P25');
            } else if (depth === '32') {
                selectedDepthProfile = getMaterialByCode('PA'); 
            } else if (depth === '44') {
                selectedDepthProfile = getMaterialByCode('PA'); 
                profileMultiplier = 2;
            }
        } else if (productType === 'TRA') { 
            const profileMaterialCode = depth ? `P${depth}` : ''; 
            selectedDepthProfile = getMaterialByCode(profileMaterialCode);
        } else {
            const profileMaterialCode = depth ? `P${depth}` : ''; 
            selectedDepthProfile = getMaterialByCode(profileMaterialCode); 
        }
        
        if (selectedDepthProfile && productPerimeterCm > 0) { 
            breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm * profileMultiplier;
            cumulativeCost += breakdown.profileCost;
        }


        // 4. Tray Frame Add-on Cost (Only for CAN and PAN, not TRA itself)
        let actualTrayFrameCode = '';
        if (trayFrameAddon === 'White') {
            actualTrayFrameCode = `T${depth}W`;
        } else if (trayFrameAddon === 'Black') {
            actualTrayFrameCode = `T${depth}B`;
        } else if (trayFrameAddon === 'Wood') {
            actualTrayFrameCode = `T${depth}N`; 
        }
        
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
                const effectiveHBraceLength = Math.max(0, currentWidth - CAN_STB_BRACE_CLEARANCE_CM);
                const effectiveWBraceLength = Math.max(0, currentHeight - CAN_STB_BRACE_CLEARANCE_CM);

                const totalBraceLengthCm = 
                    (currentHBraces * effectiveHBraceLength) + 
                    (currentWBraces * effectiveWBraceLength);
                breakdown.braceCost = (braceMaterial.mcp || 0) * totalBraceLengthCm;
                cumulativeCost += breakdown.braceCost;
            }

        } else if (productType === 'PAN') {
            let panBraceLengthCm = 0;
            let panBraceMaterial = null;
            let panBraceCount = 0;

            const maxDim = Math.max(currentHeight, currentWidth);
            const minDim = Math.min(currentHeight, currentWidth);

            if (maxDim > BRACE_STANDARD_INTERVAL_CM) {
                panBraceLengthCm = minDim;
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
        } else if (productType === 'RND' || productType === 'OVL') {
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


        // 7. Keys Cost (KEY) - Applies to Tray Frames (TRA) and Panels (PAN)
        const appliesKeys = ['TRA', 'PAN'].includes(productType); 
        let totalKeys = 0;
        if (appliesKeys) {
            totalKeys += 8;
        }
        const keyMaterial = getMaterialByCode('KEY');
        if (keyMaterial && totalKeys > 0) {
            breakdown.keyCost = (keyMaterial.mcp || 0) * totalKeys;
            cumulativeCost += breakdown.keyCost;
        }

        
        // 8. Packaging Cost
        const bubbleWrapMaterial = getMaterialByCode('BUB'); 
        const cardboardMaterial = getMaterialByCode('CAR');     

        const mcpBubbleWrap = bubbleWrapMaterial?.mcp || 0;
        const mcpCardboard = cardboardMaterial?.mcp || 0;

        if (productAreaCm2 > 0) {
            if (productType === 'STB' || productType === 'CAN' || productType === 'PAN' || productType === 'TRA') {
                breakdown.packagingCost = (currentWidth * currentHeight) * 2.2 * (mcpBubbleWrap + mcpCardboard);
            } else if (productType === 'RND') { 
                breakdown.packagingCost = (currentDiameter * currentDiameter) * 2.2 * (mcpBubbleWrap + mcpCardboard); 
            } else if (productType === 'OVL') { 
                breakdown.packagingCost = (currentMinorAxis * currentMinorAxis) * 2.2 * (mcpBubbleWrap + mcpCardboard); 
            } else {
                breakdown.packagingCost = 0; 
            }
        } else {
            breakdown.packagingCost = 0; 
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
            } else {
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

        let priceBeforeVAT = Math.max(breakdown.subtotal * effectiveSalesPriceMultiplier, MINIMUM_QUOTE_PRICE);

        breakdown.markupAmount = priceBeforeVAT - breakdown.subtotal;

        let finalPriceWithVAT = priceBeforeVAT * VAT_MULTIPLIER;

        breakdown.finalPriceBeforeVAT = priceBeforeVAT; 
        breakdown.finalPriceWithVAT = finalPriceWithVAT; 


        setCostBreakdown(breakdown);

        // Apply quantity to final price for display
        return finalPriceWithVAT * quantity; // Multiply by quantity here
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
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, quantity, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, getMaterialsByType, parseNum, roundOption, panelHasFabric]);

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
            } else {
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
            } else {
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
        setQuoteSubmitMessage(''); 
    }
    catch (error) {
        console.error("--- CRITICAL ERROR IN SKU Generation / Main useEffect ---", error);
        setSku('ERROR generating SKU');
        setQuotePrice('ERROR');
        setQuoteSubmitMessage('An internal error occurred. Check console.');
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, quantity, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, getMaterialByCode, calculatePreliminaryPrice, materialsData, loadingMaterials, errorMaterials, parseNum, roundOption, panelHasFabric]); 


  // --- Reset Fields on Product Type Change ---
  useEffect(() => {
    setHeight('');
    setWidth('');
    setDiameter('');
    setMajorAxis('');
    setMinorAxis('');
    setDepth('');
    setUnit('CM');
    setQuantity(1); // Reset quantity
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
    setQuoteSubmitMessage('');
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
      case 'PAN':
        return ['25', '32', '44'].map(d => ({ 
            code: d, 
            description: `${d}mm Deep` 
        }));
      case 'TRA':
        return ['25', '32', '40'].map(d => ({
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
    const allFinishesFromFirestore = getMaterialsByType('Mediums/Coatings');

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
        if (fabricType === 'SUP' || fabricType === 'OIL') {
            return []; 
        }

        if (fabricType === '12oz') { 
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'BPR'].includes(f.code));
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        } else if (fabricType === 'LIN') {
            allowedFinishes.push({ code: 'UNP', description: getDescriptiveFinishName('UNP') }); 
            const filteredPrimers = allFinishesFromFirestore.filter(f => ['WPR', 'CLR'].includes(f.code)); 
            allowedFinishes = allowedFinishes.concat(filteredPrimers.map(f => ({ code: f.code, description: getDescriptiveFinishName(f.code) })));
        }
    }
    else if (productType === 'PAN' && !panelHasFabric) {
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
    return Array.from(new Map(allowedFinishes.map(item => [item.code, item])).values());
  }, [productType, fabricType, roundOption, panelHasFabric, getMaterialsByType]); 

  const getTrayFrameAddonOptions = useCallback(() => {
      if (depth === '44') {
          return [];
      }
      if (!((productType === 'CAN' || productType === 'PAN'))) { 
          return []; 
      }
      
      const options = [];
      options.push({ code: 'White', description: 'White' });
      options.push({ code: 'Black', description: 'Black' });
      options.push({ code: 'Wood', description: 'Wood' }); 

      return options; 
  }, [productType, depth]);


  // --- Handle Quote Submission ---
  const handleQuoteSubmission = () => {
    // Basic validation before opening customer modal
    if (!sku || !quotePrice || quotePrice === '£0.00' || sku === 'Incomplete configuration' || quantity < 1) {
      setQuoteSubmitMessage('Please complete the product configuration with a valid quantity to generate a valid quote before submitting.');
      return;
    }
    setShowCustomerModal(true);
  };

  const submitCustomerInfoAndQuote = async () => {
    if (!customerName || !customerEmail) {
        setQuoteSubmitMessage('Please provide your Name and Email.');
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
        quantity: parseNum(quantity), // Include quantity in data
        fabricType: fabricType || null, 
        finish: finish || null,
        trayFrameAddon: trayFrameAddon || null, 
        bracingMode, 
        customHBraces: parseInt(customHBraces) || 0,
        customWBraces: parseInt(customWBraces) || 0,
        roundOption: (productType === 'RND' || productType === 'OVL') ? roundOption : null,
        panelHasFabric: productType === 'PAN' ? panelHasFabric : null,
        sku,
        quotePrice: parseFloat(quotePrice.replace('£', '')), // This is the total price including quantity
        unitPrice: costBreakdown.finalPriceWithVAT, // Store the per-unit price as well
        costBreakdown: { // Keep full cost breakdown for internal reference if needed by CF
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
            finalPriceBeforeVAT: costBreakdown.finalPriceBeforeVAT, 
            finalPriceWithVAT: costBreakdown.finalPriceWithVAT,
        },
        customerInfo: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress,
        },
        submittedAt: new Date().toISOString(),
        // In Phase 1, this data will be sent to a Firebase Cloud Function for Wix integration.
    };

    console.log("--- DEBUGGING LOG --- Quote and Customer Info to be submitted:", quoteData);
    // Placeholder for Phase 1: Call Firebase Cloud Function here
    setQuoteSubmitMessage('Quote request submitted successfully! We will contact you shortly. (Currently, this is a placeholder. Data is logged to console.)');
    setShowCustomerModal(false);
    // Optionally reset form after submission
    // setProductType('CAN'); setHeight(''); ...
    setTimeout(() => setQuoteSubmitMessage(''), 5000); 
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-['Poppins'] bg-deepGray relative">
        {/* Login Button for Internal Staff */}
        <button
            onClick={signInWithGoogle}
            className="absolute top-4 right-4 flex items-center px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-md z-10"
            style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
        >
            <Chrome size={20} className="mr-2" /> Staff Login
        </button>


        <header className="text-center mb-10 mt-16 sm:mt-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2" style={{ color: colors.offWhite }}>
                HM Instant Quote
            </h1>
            <p className="text-xl sm:text-2xl font-semibold" style={{ color: colors.lightGreen }}>
                Your bespoke canvas cost estimator
            </p>
        </header>

        {loadingMaterials && <p className="text-lightGreen mb-4">Loading material options...</p>}
        {errorMaterials && <p className="text-red-400 mb-4">{errorMaterials}</p>}

        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl"> {/* Flex container for main form and info tabs */}
            {/* Product Configuration Form */}
            <div className="bg-mediumGreen rounded-xl shadow-lg p-4 sm:p-8 w-full lg:w-2/3"> 
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

                {/* Quantity Field */}
                <div>
                    <label htmlFor="quantity" className="block text-offWhite text-sm font-semibold mb-2">
                        Quantity
                    </label>
                    <input
                        type="number" step="1" min="1" id="quantity" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        placeholder="e.g., 1"
                    />
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
                            disabled={productType === 'PAN' || productType === 'RND' || productType === 'OVL'}
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
                        {bracingMode === 'Custom' && !(['PAN', 'RND', 'OVL'].includes(productType)) && (
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
                    <p className="text-sm font-semibold mt-1" style={{ color: colors.lightGreen }}>
                        Price includes VAT and delivery.
                    </p>
                    
                    {/* Submit Quote Button */}
                    <button
                    onClick={handleQuoteSubmission}
                    className="mt-6 p-3 rounded-lg font-semibold transition-colors duration-200"
                    style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                    disabled={!quotePrice || quotePrice === '£0.00' || sku === 'Incomplete configuration' || quantity < 1}
                    >
                    Get Quote & Send to Email
                    </button>
                    {quoteSubmitMessage && (
                    <p className="mt-3 text-sm font-semibold text-center" style={{ color: quoteSubmitMessage.startsWith('Please') ? '#EF4444' : colors.lightGreen }}>
                        {quoteSubmitMessage}
                    </p>
                    )}
                </div>
            </div>

            {/* Information Tabs Section */}
            <div className="bg-mediumGreen rounded-xl shadow-lg p-4 sm:p-8 w-full lg:w-1/3 flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.offWhite }}>
                    Product Information
                </h2>
                
                {/* Tab Buttons */}
                <div className="flex justify-center mb-4 space-x-2">
                    <button
                        onClick={() => setActiveInfoTab('profiles')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                            activeInfoTab === 'profiles' ? 'bg-lightGreen text-deepGray' : 'text-offWhite hover:bg-lightGreen/50'
                        }`}
                    >
                        Profiles & Wood
                    </button>
                    <button
                        onClick={() => setActiveInfoTab('fabrics')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                            activeInfoTab === 'fabrics' ? 'bg-lightGreen text-deepGray' : 'text-offWhite hover:bg-lightGreen/50'
                        }`}
                    >
                        Fabrics
                    </button>
                    <button
                        onClick={() => setActiveInfoTab('braces')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                            activeInfoTab === 'braces' ? 'bg-lightGreen text-deepGray' : 'text-offWhite hover:bg-lightGreen/50'
                        }`}
                    >
                        Cross Braces
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}> {/* Adjust max height for scrolling */}
                    {activeInfoTab === 'profiles' && (
                        <div className="text-offWhite">
                            <h3 className="text-xl font-bold mb-2">Stretcher Bar Profiles & Wood</h3>
                            <p className="text-sm mb-3">Our stretcher bars are crafted from premium kiln-dried pine, ensuring stability and warp resistance. We offer various depths to suit your artistic needs.</p>
                            <img src="https://placehold.co/400x200/50C878/FFFFFF?text=Profile+Info" alt="Profile Information" className="w-full rounded-md mb-3" />
                            <p className="text-xs mb-1">
                                **25mm (P25):** Ideal for smaller works and those requiring a subtle profile.
                            </p>
                            <p className="text-xs mb-1">
                                **32mm (P32):** Our most popular choice, offering a balanced appearance and robust support for a wide range of sizes.
                            </p>
                            <p className="text-xs mb-1">
                                **40mm (P40):** A deeper profile for a more substantial presentation, often chosen for larger canvases.
                            </p>
                            <p className="text-xs mb-3">
                                **44mm (P44):** The deepest profile, providing maximum rigidity and a strong presence, perfect for very large-scale works.
                            </p>
                            <p className="text-lightGreen text-xs">
                                *You can replace the placeholder image above with an actual image of your profiles.*
                            </p>
                        </div>
                    )}

                    {activeInfoTab === 'fabrics' && (
                        <div className="text-offWhite">
                            <h3 className="text-xl font-bold mb-2">Our Canvas Fabrics</h3>
                            <p className="text-sm mb-3">We stock a selection of high-quality fabrics, each with unique characteristics to inspire your art.</p>
                            <img src="https://placehold.co/400x200/50C878/FFFFFF?text=Fabric+Info" alt="Fabric Information" className="w-full rounded-md mb-3" />
                            <p className="text-xs mb-1">
                                **12oz Cotton Duck:** A versatile, medium-weight cotton canvas with a balanced weave, suitable for most painting applications. Available unprimed, primed white, or primed black.
                            </p>
                            <p className="text-xs mb-1">
                                **Superfine Polyester:** A smooth, finely woven synthetic canvas, excellent for detailed work and digital prints due to its uniform surface. No priming required.
                            </p>
                            <p className="text-xs mb-1">
                                **Linen:** A premium natural fiber known for its strength, durability, and characteristic subtle texture. Available unprimed, primed white, or clear sealed to showcase its natural color.
                            </p>
                            <p className="text-xs mb-3">
                                **Oil Primed Linen:** High-quality linen pre-primed with an oil-based ground, offering a superior surface for oil paints with excellent adhesion and archival qualities. No additional priming needed.
                            </p>
                            <p className="text-lightGreen text-xs">
                                *You can replace the placeholder image above with an actual image of your fabrics.*
                            </p>
                        </div>
                    )}

                    {activeInfoTab === 'braces' && (
                        <div className="text-offWhite">
                            <h3 className="text-xl font-bold mb-2">Cross Bracing Information</h3>
                            <p className="text-sm mb-3">Cross braces add stability and prevent warping, especially important for larger canvases and panels. Our system automatically adds braces where needed.</p>
                            <img src="https://placehold.co/400x200/50C878/FFFFFF?text=Brace+Info" alt="Brace Information" className="w-full rounded-md mb-3" />
                            <p className="text-xs mb-1">
                                **Automatic Bracing:** For rectangular canvases and panels, a cross brace is automatically added along the longest side if its dimension exceeds 90cm. This is crucial for structural integrity.
                            </p>
                             <p className="text-xs mb-1">
                                For round and oval canvases/panels, two cross braces are automatically added if the largest axis exceeds 90cm, forming a robust cross-section.
                            </p>
                             <p className="text-xs mb-3">
                                You have the option for custom bracing on standard canvas/stretcher bar frames if you require specific reinforcement beyond our standard recommendations.
                            </p>
                            <p className="text-lightGreen text-xs">
                                *You can replace the placeholder image above with an actual image of your bracing.*
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Customer Info Modal */}
        {showCustomerModal && (
            <div className="fixed inset-0 bg-deepGray bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-mediumGreen rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4 text-offWhite text-center">Your Details</h3>
                    <p className="text-lightGreen text-sm mb-4 text-center">Please provide your contact information to receive your quote.</p>
                    
                    <div className="mb-4">
                        <label htmlFor="customerName" className="block text-offWhite text-sm font-semibold mb-2">Name <span className="text-red-400">*</span></label>
                        <input
                            type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen"
                            placeholder="Your Full Name" required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="customerEmail" className="block text-offWhite text-sm font-semibold mb-2">Email <span className="text-red-400">*</span></label>
                        <input
                            type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen"
                            placeholder="your.email@example.com" required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="customerPhone" className="block text-offWhite text-sm font-semibold mb-2">Phone (Optional)</label>
                        <input
                            type="tel" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen"
                            placeholder="e.g., +44 7123 456789"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="customerAddress" className="block text-offWhite text-sm font-semibold mb-2">Delivery Address (Optional)</label>
                        <textarea
                            id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen"
                            rows="3" placeholder="Street, City, Postcode"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowCustomerModal(false)}
                            className="px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                            style={{ backgroundColor: colors.offWhite, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitCustomerInfoAndQuote}
                            className="px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                            style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                            disabled={!customerName || !customerEmail}
                        >
                            Submit Quote
                        </button>
                    </div>
                    {quoteSubmitMessage && (
                        <p className="mt-3 text-sm font-semibold text-center" style={{ color: quoteSubmitMessage.startsWith('Please') ? '#EF4444' : colors.lightGreen }}>
                            {quoteSubmitMessage}
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

export default PublicQuotePage;