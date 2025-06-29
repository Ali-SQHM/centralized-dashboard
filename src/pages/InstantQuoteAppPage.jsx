// src/pages/InstantQuoteAppPage.jsx
// This component now serves as the SINGLE source of truth for the Instant Quote functionality.
// It handles both the public-facing quote generation and the internal, detailed costing view.
// Content is conditionally rendered based on whether a user is logged in and authorized.
//
// Key Updates:
// - **FINAL LAYOUT FIX:** Removed `min-h-screen`, `flex`, `items-center`, `justify-center`
//   from the outermost div to prevent "excessive padding" when nested in the dashboard.
//   The page now correctly expands `w-full` within its parent.
// - The `max-w-6xl` remains on inner content blocks to maintain readability.
// - Existing calculation and dropdown logic (including user-friendly depth mapping) is preserved.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Chrome } from 'lucide-react'; // For Staff Login icon

// Import color and other constants
import { colors, commonUnits, materialTypes } from '../utils/constants';

// InstantQuoteAppPage now receives Firebase props and navigateTo from App.jsx
function InstantQuoteAppPage({ db, firestoreAppId, auth, currentUser, isAuthorizedStaff, navigateTo }) {
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
  const [quantity, setQuantity] = useState(1); // Quantity state
  const [fabricType, setFabricType] = useState('');
  const [finish, setFinish] = useState('');
  const [trayFrameAddon, setTrayFrameAddon] = useState('');
  const [bracingMode, setBracingMode] = useState('Standard');
  const [customHBraces, setCustomHBraces] = useState(0);
  const [customWBraces, setCustomWBraces] = useState(0);
  const [roundOption, setRoundOption] = useState('Stretched');
  const [panelHasFabric, setPanelHasFabric] = useState(false);

  // --- State Variables for Data and UI Feedback ---
  const [sku, setSku] = useState('');
  const [quotePrice, setQuotePrice] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [errorMaterials, setErrorMaterials] = useState(null);
  const [quoteSubmitMessage, setQuoteSubmitMessage] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Customer Info for public submissions
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // State for active info tab (used in the information sidebar)
  const [activeInfoTab, setActiveInfoTab] = useState('profiles'); // 'profiles', 'fabrics', 'braces'

  const [costBreakdown, setCostBreakdown] = useState({
    deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, trayFrameCost: 0,
    braceCost: 0, wedgeCost: 0, keyCost: 0, packagingCost: 0, panelMaterialCost: 0,
    roundMaterialCost: 0, subtotal: 0, markupAmount: 0, finalPriceBeforeVAT: 0,
    finalPriceWithVAT: 0,
  });

  // --- Firestore Reference for Materials ---
  const getPublicMaterialsCollectionRef = useCallback(() => {
    if (!db || !firestoreAppId) {
      console.error("InstantQuoteAppPage: Firestore DB or App ID not available for public materials reference.");
      return null;
    }
    return collection(db, `artifacts/${firestoreAppId}/public/data/materials`);
  }, [db, firestoreAppId]);

  // --- Fetch Materials Effect ---
  useEffect(() => {
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
      // Log options after data is fetched
      console.log("--- DEBUGGING LOG --- Depth Options:", getMaterialsByType('Profile')); // Still filtering by 'Profile' for now
      console.log("--- DEBUGGING LOG --- Fabric Options:", getMaterialsByType('Fabric'));
      console.log("--- DEBUGGING LOG --- Finish Options:", getMaterialsByType('Mediums/Coatings'));
      console.log("--- DEBUGGING LOG --- Tray Frame Options:", getMaterialsByType('Bought-in Profiles'));
    }, (err) => {
      console.error("InstantQuoteAppPage: Error fetching materials:", err);
      setErrorMaterials(`Failed to load material options: ${err.message}. Ensure Firestore security rules allow read access to /artifacts/${firestoreAppId}/public/data/materials.`);
      setLoadingMaterials(false);
    });

    return () => unsubscribe();
  }, [getPublicMaterialsCollectionRef, firestoreAppId, db]); // Dependencies for useEffect

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
            deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, trayFrameCost: 0,
            braceCost: 0, wedgeCost: 0, keyCost: 0, packagingCost: 0, panelMaterialCost: 0,
            roundMaterialCost: 0, subtotal: 0, markupAmount: 0, finalPriceBeforeVAT: 0,
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
                        } else { // WPR, BPR
                             finishCost = (selectedFinish.mcp || 0) * relevantArea;
                        }
                    } else { // Assuming other fabric types have 1x coating cost
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
                            } else { // WPR, BPR
                                finishCost = (selectedFinish.mcp || 0) * relevantArea;
                            }
                        } else { // Assuming other fabric types have 1x coating cost
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
                selectedDepthProfile = getMaterialByCode('P25MM');
            } else if (depth === '32') {
                selectedDepthProfile = getMaterialByCode('P32MM');
            } else if (depth === '44') {
                selectedDepthProfile = getMaterialByCode('P44MM');
            }
            if (selectedDepthProfile) {
                const largestDimension = Math.max(currentHeight, currentWidth);
                if (largestDimension > BRACE_STANDARD_INTERVAL_CM) {
                    profileMultiplier = 2; // For panels, 1 brace means 2 lengths of profile
                } else {
                    profileMultiplier = 1;
                }
                breakdown.profileCost = (selectedDepthProfile.mcp || 0) * profileMultiplier * currentWidth;
                cumulativeCost += breakdown.profileCost;
            }
        } else if (productType === 'RND' || productType === 'OVL') {
            // These are the RNDP codes based on depth values 24, 30, 36, 42 as per our discussion
            if (depth === '24') {
                selectedDepthProfile = getMaterialByCode('RNDP24');
            } else if (depth === '30') {
                selectedDepthProfile = getMaterialByCode('RNDP30');
            } else if (depth === '36') {
                selectedDepthProfile = getMaterialByCode('RNDP36');
            } else if (depth === '42') {
                selectedDepthProfile = getMaterialByCode('RNDP42');
            }
            if (selectedDepthProfile) {
                // Round/Oval profile cost is based on perimeter
                breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm;
                cumulativeCost += breakdown.profileCost;
            }
        } else if (productType === 'CAN' || productType === 'STB') {
            if (depth === '25') {
                selectedDepthProfile = getMaterialByCode('P25MM');
            } else if (depth === '32') {
                selectedDepthProfile = getMaterialByCode('P32MM');
            } else if (depth === '44') {
                selectedDepthProfile = getMaterialByCode('P44MM');
            }
            if (selectedDepthProfile) {
                breakdown.profileCost = (selectedDepthProfile.mcp || 0) * productPerimeterCm;
                cumulativeCost += breakdown.profileCost;
            }
        }

        // 4. Tray Frame Cost (only for TRA product type, or as an add-on)
        if (productType === 'TRA') {
            const selectedTrayFrameProfile = getMaterialByCode(trayFrameAddon);
            if (selectedTrayFrameProfile && productPerimeterCm > 0) {
                let trayFramePerimeter = productPerimeterCm;
                if (selectedTrayFrameProfile.code === 'TFA25') {
                    trayFramePerimeter += TRAY_FRAME_25MM_ADDITION;
                } else if (selectedTrayFrameProfile.code === 'TFA32' || selectedTrayFrameProfile.code === 'TFA40') {
                    trayFramePerimeter += TRAY_FRAME_OTHER_ADDITION;
                }
                breakdown.trayFrameCost = (selectedTrayFrameProfile.mcp || 0) * trayFramePerimeter;
                cumulativeCost += breakdown.trayFrameCost;
            }
        } else if ((productType === 'CAN' || productType === 'PAN') && trayFrameAddon) {
            const selectedTrayFrameProfile = getMaterialByCode(trayFrameAddon);
            if (selectedTrayFrameProfile && productPerimeterCm > 0) {
                let trayFramePerimeter = productPerimeterCm;
                if (selectedTrayFrameProfile.code === 'TFA25') {
                    trayFramePerimeter += TRAY_FRAME_25MM_ADDITION;
                } else if (selectedTrayFrameProfile.code === 'TFA32' || selectedTrayFrameProfile.code === 'TFA40') {
                    trayFramePerimeter += TRAY_FRAME_OTHER_ADDITION;
                }
                breakdown.trayFrameCost = (selectedTrayFrameProfile.mcp || 0) * trayFramePerimeter;
                cumulativeCost += breakdown.trayFrameCost;
            }
        }

        // 5. Braces Cost (conditional based on product type and bracing mode)
        if (productType === 'CAN' || productType === 'STB') {
            if (bracingMode === 'Standard') {
                const brace25mm = getMaterialByCode('BRACE25');
                if (brace25mm) {
                    let hBraces = 0;
                    let wBraces = 0;
                    if (currentWidth > BRACE_STANDARD_INTERVAL_CM) {
                        hBraces = Math.floor(currentWidth / BRACE_STANDARD_INTERVAL_CM);
                    }
                    if (currentHeight > BRACE_STANDARD_INTERVAL_CM) {
                        wBraces = Math.floor(currentHeight / BRACE_STANDARD_INTERVAL_CM);
                    }
                    breakdown.braceCost = (brace25mm.mcp || 0) * (hBraces * (currentHeight - CAN_STB_BRACE_CLEARANCE_CM) + wBraces * (currentWidth - CAN_STB_BRACE_CLEARANCE_CM));
                    cumulativeCost += breakdown.braceCost;
                }
            } else if (bracingMode === 'Custom') {
                const brace25mm = getMaterialByCode('BRACE25');
                if (brace25mm) {
                    breakdown.braceCost = (brace25mm.mcp || 0) * (customHBraces * (currentHeight - CAN_STB_BRACE_CLEARANCE_CM) + customWBraces * (currentWidth - CAN_STB_BRACE_CLEARANCE_CM));
                    cumulativeCost += breakdown.braceCost;
                }
            }
        } else if (productType === 'PAN') {
            const brace25mm = getMaterialByCode('BRACE25');
            if (brace25mm) {
                const largestDimension = Math.max(currentHeight, currentWidth);
                if (largestDimension > BRACE_STANDARD_INTERVAL_CM) {
                    breakdown.braceCost = (brace25mm.mcp || 0) * largestDimension;
                    cumulativeCost += breakdown.braceCost;
                }
            }
        } else if (productType === 'RND' || productType === 'OVL') {
            const brace25mm = getMaterialByCode('BRACE25'); // Assuming same brace material for RND/OVL
            if (brace25mm) {
                const largestDimension = productType === 'RND' ? currentDiameter : currentMajorAxis;
                if (largestDimension > BRACE_STANDARD_INTERVAL_CM) {
                    breakdown.braceCost = (brace25mm.mcp || 0) * 2 * (largestDimension - RND_OVL_BRACE_CLEARANCE_CM);
                    cumulativeCost += breakdown.braceCost;
                }
            }
        }

        // 6. Wedges Cost (only for CAN and STB)
        if (productType === 'CAN' || productType === 'STB') {
            const wedgeMaterial = getMaterialByCode('WEDGE');
            if (wedgeMaterial) {
                breakdown.wedgeCost = (wedgeMaterial.mcp || 0) * productPerimeterCm;
                cumulativeCost += breakdown.wedgeCost;
            }
        }

        // 7. Key Cost (only for CAN and STB)
        if (productType === 'CAN' || productType === 'STB') {
            const keyMaterial = getMaterialByCode('KEY');
            if (keyMaterial) {
                breakdown.keyCost = (keyMaterial.mcp || 0) * productPerimeterCm;
                cumulativeCost += breakdown.keyCost;
            }
        }

        // 8. Packaging Cost (STANDARD FOR ALL PRODUCTS NOW)
        const packagingMaterial = getMaterialByCode('PCKG');
        if (packagingMaterial) {
            let packagingAreaCm2 = 0;
            if (productType === 'CAN' || productType === 'PAN' || productType === 'TRA') {
                packagingAreaCm2 = (currentHeight + 10.0) * (currentWidth + 10.0); // Assuming 10cm margin for packaging
            } else if (productType === 'STB') {
                packagingAreaCm2 = (Math.max(currentHeight, currentWidth) + 5.0) * 10.0;
            } else if (productType === 'RND') {
                packagingAreaCm2 = (currentDiameter + 10.0) * (currentDiameter + 10.0);
            } else if (productType === 'OVL') {
                packagingAreaCm2 = (currentMajorAxis + 10.0) * (currentMinorAxis + 10.0);
            }
            breakdown.packagingCost = (packagingMaterial.mcp || 0) * packagingAreaCm2;
            cumulativeCost += breakdown.packagingCost;
        }

        breakdown.subtotal = cumulativeCost;

        // Apply Markup (Standard markup from blueprint)
        const markupMaterial = getMaterialByCode('MARKUP');
        const markupPercentage = markupMaterial ? (parseNum(markupMaterial.unitConversionFactor) || 0) : 0.40; // Default to 40%
        breakdown.markupAmount = breakdown.subtotal * markupPercentage;
        cumulativeCost += breakdown.markupAmount;

        breakdown.finalPriceBeforeVAT = cumulativeCost;
        breakdown.finalPriceWithVAT = cumulativeCost * VAT_MULTIPLIER;

        // Apply Quantity to final price
        breakdown.finalPriceWithVAT *= quantity;

        // Ensure minimum quote price
        if (breakdown.finalPriceWithVAT < MINIMUM_QUOTE_PRICE) {
            breakdown.finalPriceWithVAT = MINIMUM_QUOTE_PRICE;
        }

        setCostBreakdown(breakdown);
        setQuotePrice(breakdown.finalPriceWithVAT);
        setSku(generateSKU());
        console.log("--- DEBUGGING LOG --- Price calculation complete:", breakdown);

    } catch (calcError) {
        console.error("--- DEBUGGING LOG --- Error during price calculation:", calcError);
        setQuotePrice(null);
        setSku('');
        setCostBreakdown({
            deliveryCost: 0, fabricCost: 0, finishCost: 0, profileCost: 0, trayFrameCost: 0,
            braceCost: 0, wedgeCost: 0, keyCost: 0, packagingCost: 0, panelMaterialCost: 0,
            roundMaterialCost: 0, subtotal: 0, markupAmount: 0, finalPriceBeforeVAT: 0,
            finalPriceWithVAT: 0,
        });
        console.error("User facing error: There was an error calculating the quote. Please ensure all required fields are filled and material data is loaded correctly.");
    }
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, unit, quantity, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces, roundOption, panelHasFabric, materialsData, getMaterialByCode, parseNum]);

  // --- SKU Generation (Memoized - QUANTITY EXCLUDED) ---
  const generateSKU = useCallback(() => {
    let generated = `${productType}-${height || '0'}x${width || '0'}`;
    if (diameter) generated = `${productType}-${diameter}`;
    if (majorAxis && minorAxis) generated = `${productType}-${majorAxis}x${minorAxis}`;
    generated += `-${depth}`;
    if (fabricType) generated += `-${fabricType}`;
    if (finish) generated += `-${finish}`;
    if (trayFrameAddon) generated += `-${trayFrameAddon}`;
    if (bracingMode === 'Custom') generated += `-H${customHBraces}W${customWBraces}`;
    // NOTE: Quantity is intentionally EXCLUDED from SKU generation per user request.
    return generated.replace(/[^a-zA-Z0-9-]/g, ''); // Clean up for valid SKU
  }, [productType, height, width, diameter, majorAxis, minorAxis, depth, fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces]);


  // --- Effect to Recalculate Price on Input Change ---
  useEffect(() => {
    if (!loadingMaterials && materialsData.length > 0) {
      calculatePreliminaryPrice();
    }
  }, [
    productType, height, width, diameter, majorAxis, minorAxis, depth, unit, quantity,
    fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces,
    roundOption, panelHasFabric, loadingMaterials, materialsData, calculatePreliminaryPrice
  ]);

  // --- Helper Functions for Options ---
  const getDepthOptions = useCallback(() => {
    const profileMaterials = getMaterialsByType('Profile');
    const options = [];

    // Depths for CAN/STB/TRA/PAN (25, 32, 44)
    if (['CAN', 'STB', 'TRA', 'PAN'].includes(productType)) {
      ['P25MM', 'P32MM', 'P44MM'].forEach(code => {
        const material = profileMaterials.find(opt => opt.code === code);
        if (material) {
          options.push({
            code: material.code,
            description: code === 'P25MM' ? '25mm Deep' :
                         code === 'P32MM' ? '32mm Deep' :
                         code === 'P44MM' ? '44mm Deep' :
                         material.description
          });
        }
      });
    }
    // Depths for RND/OVL (24, 30, 36, 42)
    else if (['RND', 'OVL'].includes(productType)) {
      ['RNDP24', 'RNDP30', 'RNDP36', 'RNDP42'].forEach(code => {
        const material = profileMaterials.find(opt => opt.code === code);
        if (material) {
          options.push({
            code: material.code,
            description: code === 'RNDP24' ? '24mm Deep' :
                         code === 'RNDP30' ? '30mm Deep' :
                         code === 'RNDP36' ? '36mm Deep' :
                         code === 'RNDP42' ? '42mm Deep' :
                         material.description
          });
        }
      });
    }
    return options;
  }, [productType, getMaterialsByType]);

  const getFabricOptions = useCallback(() => {
    return getMaterialsByType('Fabric'); // Assuming 'Fabric' materialType
  }, [getMaterialsByType]);

  const getFinishOptions = useCallback(() => {
    return getMaterialsByType('Mediums/Coatings'); // Assuming 'Mediums/Coatings' materialType
  }, [getMaterialsByType]);

  const getTrayFrameAddonOptions = useCallback(() => {
    return getMaterialsByType('Bought-in Profiles'); // Assuming 'Bought-in Profiles' materialType
  }, [getMaterialsByType]);


  // --- Customer Modal Submit Handler (Placeholder for Cloud Function integration) ---
  const submitCustomerInfoAndQuote = () => {
    const quoteData = {
      productType, height, width, diameter, majorAxis, minorAxis, depth, unit, quantity,
      fabricType, finish, trayFrameAddon, bracingMode, customHBraces, customWBraces,
      roundOption, panelHasFabric,
      sku,
      quotePrice,
      costBreakdown,
      customerInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress,
      },
      timestamp: new Date().toISOString(),
      status: 'Pending Quote',
    };
    console.log("--- DEBUGGING LOG --- Quote and Customer Info to be submitted:", quoteData);
    setQuoteSubmitMessage('Quote request submitted successfully! We will contact you shortly. (Currently, this is a placeholder. Data is logged to console.)');
    setShowCustomerModal(false);
    setTimeout(() => setQuoteSubmitMessage(''), 5000);
  };

  // --- Navigation Handlers ---
  const handleStaffLoginClick = () => {
    navigateTo('authPage');
  };

  const handleBackToDashboardClick = () => {
    navigateTo('internalDashboard');
  };


  return (
    // Removed `min-h-screen`, `flex`, `items-center`, `justify-center`.
    // The dashboard's main content area will now correctly manage this page's layout.
    // The `p-4 sm:p-8` is kept for internal padding, `font-['Poppins'] bg-deepGray` for style.
    // `relative` is kept for absolute positioning of buttons. `w-full` for horizontal stretch.
    <div className="w-full h-full relative font-['Poppins'] text-offWhite">
        {/* Conditional Header Buttons */}
        {!currentUser ? (
            <button
                onClick={handleStaffLoginClick}
                className="absolute top-4 right-4 flex items-center px-4 py-2 rounded-xl font-semibold transition-colors duration-200 shadow-md z-10"
                style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
            >
                <Chrome size={20} className="mr-2" /> Staff Login
            </button>
        ) : (
            <button
                onClick={handleBackToDashboardClick}
                className="absolute top-4 right-4 flex items-center px-4 py-2 rounded-xl font-semibold transition-colors duration-200 shadow-md z-10"
                style={{ backgroundColor: colors.blue[600], color: colors.offWhite, hover: { backgroundColor: colors.blue[700] } }}
            >
                Back to Dashboard
            </button>
        )}

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

        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto">
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
                    className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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
                    className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        placeholder="e.g., 80.0"
                        />
                    </div>
                    <div>
                        <label htmlFor="width" className="block text-offWhite text-sm font-semibold mb-2">
                        Width ({unit})
                        </label>
                        <input
                        type="number" step="0.1" id="width" value={width} onChange={(e) => setWidth(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        placeholder="e.g., 60.0"
                        />
                    </div>
                    </>
                )}

                {/* Diameter (Conditional) */}
                {productType === 'RND' && (
                    <div>
                    <label htmlFor="diameter" className="block text-offWhite text-sm font-semibold mb-2">
                        Diameter ({unit})
                        </label>
                        <input
                        type="number" step="0.1" id="diameter" value={diameter} onChange={(e) => setDiameter(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        placeholder="e.g., 120.0"
                        />
                    </div>
                    )}

                    {/* Major/Minor Axis (Conditional) */}
                    {productType === 'OVL' && (
                    <>
                        <div>
                        <label htmlFor="majorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                            Major Axis ({unit})
                        </label>
                        <input
                            type="number" step="0.1" id="majorAxis" value={majorAxis} onChange={(e) => setMajorAxis(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                            placeholder="e.g., 100.0"
                        />
                        </div>
                        <div>
                        <label htmlFor="minorAxis" className="block text-offWhite text-sm font-semibold mb-2">
                            Minor Axis ({unit})
                        </label>
                        <input
                            type="number" step="0.1" id="minorAxis" value={minorAxis} onChange={(e) => setMinorAxis(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                            placeholder="e.g., 70.0"
                        />
                        </div>
                    </>
                    )}

                    {/* 4. Depth Selection (Common for most) */}
                    {(productType === 'CAN' || productType === 'PAN' || productType === 'RND' || productType === 'OVL' || productType === 'STB' || productType === 'TRA') && (
                    <div>
                        <label htmlFor="depth" className="block text-offWhite text-sm font-semibold mb-2">
                        Depth
                        </label>
                        <select
                        id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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
                                className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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

                    {/* 5. Fabric Type Selection (Canvas, Stretched Round/Oval, Panel with Fabric) */}
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
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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

                    {/* 6. Finish Selection (Canvas, Panel, Stretched Round/Oval, Tray Frame) */}
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
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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
                            <p className="text-lightGreen text-xs p-3 rounded-xl border border-lightGreen">
                                No finish options for selected fabric.
                            </p>
                        </div>
                    )}
                </div> {/* This closes the grid grid-cols-1 md:grid-cols-2 gap-4 */}

                {/* --- START OF POST-GRID INPUTS, ALL ALWAYS VISIBLE --- */}

                {/* 7. Quantity Field (Always visible, after grid) */}
                <div className="mt-4 md:col-span-2"> {/* Use md:col-span-2 to ensure it takes full width below a 2-column grid */}
                    <label htmlFor="quantity" className="block text-offWhite text-sm font-semibold mb-2">
                        Quantity
                    </label>
                    <input
                        type="number" step="1" min="1" id="quantity" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        placeholder="e.g., 1"
                    />
                </div>

                {/* 8. Tray Frame Add-on (Canvas, Panel) - Hidden for TRA */}
                {((productType === 'CAN' || productType === 'PAN') && depth !== '44') && (
                <div className="mt-4 md:col-span-2"> {/* Also add md:col-span-2 for consistency */}
                    <label htmlFor="trayFrameAddon" className="block text-offWhite text-sm font-semibold mb-2">
                    Tray Frame Add-on
                    </label>
                    <select
                    id="trayFrameAddon" value={trayFrameAddon} onChange={(e) => setTrayFrameAddon(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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

                {/* 9. Bracing Options (Canvas, Stretcher Bar Frame, Panel with Fabric - controlled for PAN) */}
                {(['CAN', 'STB'].includes(productType) || (productType === 'PAN') || (productType === 'RND' || productType === 'OVL')) && (
                <div className="mt-4 md:col-span-2"> {/* Also add md:col-span-2 for consistency */}
                    <label htmlFor="bracingMode" className="block text-offWhite text-sm font-semibold mb-2">
                        Bracing Options
                    </label>
                    <select
                        id="bracingMode" value={bracingMode} onChange={(e) => setBracingMode(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
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
                )}

                {bracingMode === 'Custom' && !(['PAN', 'RND', 'OVL'].includes(productType)) && (
                    <>
                    <div className="mt-4">
                        <label htmlFor="customHBraces" className="block text-offWhite text-sm font-semibold mb-2">
                            Custom Horizontal Braces (0-3)
                        </label>
                        <input
                            type="number" step="1" min="0" max="3" id="customHBraces" value={customHBraces} onChange={(e) => setCustomHBraces(parseInt(e.target.value) || 0)}
                            className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="customWBraces" className="block text-offWhite text-sm font-semibold mb-2">
                            Custom Vertical Braces (0-3)
                        </label>
                        <input
                            type="number" step="1" min="0" max="3" id="customWBraces" value={customWBraces} onChange={(e) => setCustomWBraces(parseInt(e.target.value) || 0)}
                            className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                        />
                    </div>
                    </>
                )}
                {(bracingMode !== 'None' && (parseNum(customHBraces) + parseNum(customWBraces) > 6)) && (
                    <p className="text-red-300 text-xs mt-1 md:col-span-2">Total braces cannot exceed 6.</p>
                )}
            </div> {/* Product Configuration Form */}

            {/* Information Tabs (Profile/Wood, Fabrics, Cross Braces) */}
            <div className="w-full lg:w-1/3 bg-mediumGreen rounded-xl shadow-lg p-4 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.offWhite }}>
                    Information
                </h2>
                <div className="flex justify-center mb-4 border-b border-gray-700">
                    <button
                        onClick={() => setActiveInfoTab('profiles')}
                        className={`py-2 px-4 text-sm font-semibold ${activeInfoTab === 'profiles' ? 'border-b-2 border-accentGold text-accentGold' : 'text-gray-400 hover:text-offWhite'} transition-colors duration-200`}
                    >
                        Profiles & Wood
                    </button>
                    <button
                        onClick={() => setActiveInfoTab('fabrics')}
                        className={`py-2 px-4 text-sm font-semibold ${activeInfoTab === 'fabrics' ? 'border-b-2 border-accentGold text-accentGold' : 'text-gray-400 hover:text-offWhite'} transition-colors duration-200 ml-4`}
                    >
                        Fabrics
                    </button>
                    <button
                        onClick={() => setActiveInfoTab('braces')}
                        className={`py-2 px-4 text-sm font-semibold ${activeInfoTab === 'braces' ? 'border-b-2 border-accentGold text-accentGold' : 'text-gray-400 hover:text-offWhite'} transition-colors duration-200 ml-4`}
                    >
                        Cross Braces
                    </button>
                </div>

                <div className="info-tab-content text-gray-300 text-sm">
                    {activeInfoTab === 'profiles' && (
                        <div>
                            <h3 className="text-lg font-semibold text-offWhite mb-2">Profiles & Wood Types</h3>
                            <p>Here you'll find details about the various stretcher bar profiles and wood types used in our canvases and panels, including their characteristics and recommended uses.</p>
                            <ul className="list-disc list-inside mt-2">
                                <li><strong>Standard Profiles:</strong> Light yet sturdy, suitable for most sizes.</li>
                                <li><strong>Heavy Duty Profiles:</strong> For larger canvases, preventing warping and providing extra support.</li>
                                <li><strong>Wood Types:</strong> Pine (standard), Birch (premium panels).</li>
                            </ul>
                            <img
                                src={`https://placehold.co/400x200/${colors.darkGray.replace('#', '')}/${colors.offWhite.replace('#', '')}?text=Profile+Info`}
                                alt="Profile Information Placeholder"
                                className="mt-4 rounded-lg shadow-md w-full h-auto object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/555/FFF?text=Image+Unavailable"; }}
                            />
                        </div>
                    )}
                    {activeInfoTab === 'fabrics' && (
                        <div>
                            <h3 className="text-lg font-semibold text-offWhite mb-2">Fabric Options</h3>
                            <p>Explore our range of high-quality fabrics, each offering unique textures and performance characteristics for different artistic needs.</p>
                            <ul className="list-disc list-inside mt-2">
                                <li><strong>10oz Cotton Duck:</strong> Versatile, smooth, excellent for various mediums.</li>
                                <li><strong>12oz Cotton Duck:</strong> Heavier, more robust, ideal for larger works.</li>
                                <li><strong>Irish Linen:</strong> Premium choice, fine weave, exceptional longevity.</li>
                                <li><strong>Raw Canvas/Linen:</strong> For a natural, unprimed surface.</li>
                            </ul>
                            <img
                                src={`https://placehold.co/400x200/${colors.darkGray.replace('#', '')}/${colors.offWhite.replace('#', '')}?text=Fabric+Info`}
                                alt="Fabric Information Placeholder"
                                className="mt-4 rounded-lg shadow-md w-full h-auto object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/555/FFF?text=Image+Unavailable"; }}
                            />
                        </div>
                    )}
                    {activeInfoTab === 'braces' && (
                        <div>
                            <h3 className="text-lg font-semibold text-offWhite mb-2">Cross Bracing Guide</h3>
                            <p>Cross braces provide essential support for larger canvases, preventing warping and ensuring stability over time. Our system automatically recommends standard bracing, or you can customize.</p>
                            <ul className="list-disc list-inside mt-2">
                                <li><strong>Standard:</strong> Automatically added for dimensions over 90cm.</li>
                                <li><strong>Custom:</strong> Up to 3 horizontal and 3 vertical braces can be specified.</li>
                                <li><strong>Importance:</strong> Crucial for maintaining the structural integrity of large format artworks.</li>
                            </ul>
                            <img
                                src={`https://placehold.co/400x200/${colors.darkGray.replace('#', '')}/${colors.offWhite.replace('#', '')}?text=Bracing+Info`}
                                alt="Bracing Information Placeholder"
                                className="mt-4 rounded-lg shadow-md w-full h-auto object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/555/FFF?text=Image+Unavailable"; }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Quote Summary and Action Buttons */}
        <div className="bg-mediumGreen rounded-xl shadow-lg p-6 sm:p-8 mt-6 w-full max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: colors.offWhite }}>
                Your Instant Quote
            </h2>
            {quotePrice !== null ? (
                <>
                    <p className="text-offWhite text-lg text-center mb-2">
                        Estimated SKU: <span className="font-mono text-lightGreen">{sku || 'N/A'}</span>
                    </p>
                    <p className="text-offWhite text-4xl font-extrabold text-center mb-6" style={{ color: colors.accentGold }}>
                        Final Price: £{quotePrice.toFixed(2)}
                    </p>

                    {isAuthorizedStaff && (
                        <div className="bg-darkGray p-4 rounded-lg mt-4 text-sm text-gray-300">
                            <h3 className="font-semibold text-offWhite mb-2">Detailed Cost Breakdown:</h3>
                            <ul className="list-none space-y-1">
                                <li><span className="font-semibold">Delivery:</span> £{costBreakdown.deliveryCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Fabric:</span> £{costBreakdown.fabricCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Finish:</span> £{costBreakdown.finishCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Profile:</span> £{costBreakdown.profileCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Tray Frame:</span> £{costBreakdown.trayFrameCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Brace:</span> £{costBreakdown.braceCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Wedge:</span> £{costBreakdown.wedgeCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Key:</span> £{costBreakdown.keyCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Packaging:</span> £{costBreakdown.packagingCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Panel Material:</span> £{costBreakdown.panelMaterialCost.toFixed(2)}</li>
                                <li><span className="font-semibold">Round Material:</span> £{costBreakdown.roundMaterialCost.toFixed(2)}</li>
                                <li className="font-bold text-lg pt-2 border-t border-lightGreen/50"><span className="font-semibold">Subtotal (before markup):</span> £{costBreakdown.subtotal.toFixed(2)}</li>
                                <li><span className="font-semibold">Markup ({ (costBreakdown.subtotal > 0 ? (((costBreakdown.finalPriceBeforeVAT / costBreakdown.subtotal) - 1) * 100).toFixed(0) : 0)}%):</span> £{costBreakdown.markupAmount.toFixed(2)}</li>
                                <li className="font-bold text-lg"><span className="font-semibold">Price (before VAT):</span> £{costBreakdown.finalPriceBeforeVAT.toFixed(2)}</li>
                                <li className="font-bold text-lg"><span className="font-semibold">Final Price (VAT Inc.):</span> £{costBreakdown.finalPriceWithVAT.toFixed(2)}</li>
                            </ul>
                        </div>
                    )}

                    {!currentUser && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-200 shadow-lg"
                                style={{ backgroundColor: colors.blue[400], color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                            >
                                Get Quote & Send to Email
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-gray-300 text-center">
                    Fill in the product configuration to get an instant quote.
                </p>
            )}
            {quoteSubmitMessage && (
                <p className="mt-4 text-sm font-semibold text-center" style={{ color: quoteSubmitMessage.startsWith('Please') ? colors.red[400] : colors.lightGreen }}>
                    {quoteSubmitMessage}
                </p>
            )}
        </div>


        {/* Customer Info Modal */}
        {showCustomerModal && !currentUser && (
            <div className="fixed inset-0 bg-deepGray bg-opacity-80 flex items-center justify-center p-4 z-50">
                <div className="bg-darkGray p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md text-offWhite relative">
                    <h2 className="text-2xl font-bold text-center mb-6" style={{ color: colors.blue[400] }}>Submit Your Quote Request</h2>
                    <p className="text-gray-300 text-center mb-6">Enter your details to receive your personalized quote and order information.</p>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-semibold mb-2">Your Name</label>
                            <input
                                type="text"
                                id="customerName"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                                placeholder="Full Name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="customerEmail" className="block text-sm font-semibold mb-2">Your Email</label>
                            <input
                                type="email"
                                id="customerEmail"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="customerPhone" className="block text-sm font-semibold mb-2">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                id="customerPhone"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                                placeholder="e.g., +44 7123 456789"
                            />
                        </div>
                        <div>
                            <label htmlFor="customerAddress" className="block text-sm font-semibold mb-2">Delivery Address (Optional)</label>
                            <textarea
                                id="customerAddress"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white text-deepGray border border-lightGreen focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen placeholder-gray-400"
                                placeholder="Street, City, Postcode"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowCustomerModal(false)}
                            className="px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                            style={{ backgroundColor: colors.offWhite, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitCustomerInfoAndQuote}
                            className="px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                            style={{ backgroundColor: colors.accentGold, color: colors.deepGray, hover: { backgroundColor: colors.lightGreen } }}
                            disabled={!customerName || !customerEmail}
                        >
                            Submit Quote
                        </button>
                    </div>
                    {quoteSubmitMessage && (
                        <p className="mt-3 text-sm font-semibold text-center" style={{ color: quoteSubmitMessage.startsWith('Please') ? colors.red[400] : colors.lightGreen }}>
                            {quoteSubmitMessage}
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

export default InstantQuoteAppPage;