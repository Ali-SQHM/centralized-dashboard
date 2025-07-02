// src/utils/constants.js
// This file defines shared constants used across the application,
// including a comprehensive and correctly structured color palette.
//
// THIS IS THE COMPLETE AND CORRECTED COLOR PALETTE FOR ALL COMPONENTS.
// It addresses the TypeError by defining nested color shades (e.g., colors.gray[700]).
//
// Update: Added 'in' to commonUnits for inches.

export const colors = {
    // Primary/Backgrounds (your custom colors)
    deepGray: '#111827', // A near-black for darkest elements or background accents
    darkGray: '#1F2937', // A dark gray for text or secondary elements on light backgrounds
    offWhite: '#F3F4F6', // Off-white for main content background or contrasting text

    // Accents/Highlights (your custom colors)
    lightGreen: '#4ade80', // Tailwind's emerald-400 or similar, used as a primary accent
    accentGold: '#fbbf24', // Tailwind's amber-400 or similar, used as a secondary accent
    
    // Grays for borders, grids, text variations (comprehensive scale)
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
    // Blues for accents, links, etc. (comprehensive scale)
    blue: {
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
    // Reds for errors, delete buttons (comprehensive scale)
    red: {
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#ef4444',
        500: '#dc2626',
        600: '#b91c1c',
        700: '#991b1b',
        800: '#7f1d1d',
        900: '#621717',
    },
    // Greens for success, positive indicators (comprehensive scale)
    green: {
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efad',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },
    // Yellows/Ambers for warnings, accents (comprehensive scale)
    yellow: {
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
    }
};

export const commonUnits = [
    '', // Empty option for initial selection
    'cm', 'in', 'mm', 'm', // Added 'in' and reordered for common usage
    'cm2', 'cm3', 'm3',
    'ltr',
    'ea', // Each
    'sht', // Sheet
    'roll',
    'box',
];

export const materialTypes = [
    '', // Empty option for initial selection (for filter)
    'Wood',
    'Fabric',
    'Sheet Materials',
    'Packaging',
    'Hardware/Components',
    'Mediums/Coatings',
    'Bought-in Profiles',
    'Profile',
];