// src/utils/constants.js
// Centralized constants for colors, common units, and material types.

export const colors = {
  darkGreen: '#1A4D2E', // A deep, rich green for main background
  mediumGreen: '#4F6C4C', // A slightly lighter green for accents/card backgrounds
  lightGreen: '#738C71', // A lighter green for text or softer accents
  accentGold: '#FFC200', // A contrasting vibrant color
  offWhite: '#F3F4F6', // Off-white for main content background or contrasting text
  darkGray: '#1F2937', // A dark gray for text or secondary elements on light backgrounds
  deepGray: '#111827', // A near-black for darkest elements or background accents

  // Added blue and red color scales to match indexing used in components
  blue: {
    400: '#60A5FA', // A medium blue shade (similar to Tailwind blue-400)
    600: '#2563EB', // A darker blue shade (similar to Tailwind blue-600)
  },
  red: {
    400: '#EF4444', // A medium red shade (similar to Tailwind red-400)
  }
};

export const commonUnits = [
  '', // Empty option for initial selection
  'mm', 'cm', 'm',
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