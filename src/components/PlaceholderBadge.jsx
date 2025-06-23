// src/components/PlaceholderBadge.jsx
// A small reusable badge to indicate "Coming Soon" for placeholder cards.

import React from 'react';
import { colors } from '../utils/constants'; // Import colors from centralized constants

const PlaceholderBadge = () => (
  <span
    className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-0.5 rounded-full"
    style={{ backgroundColor: colors.accentGold, color: colors.deepGray }}
  >
    Coming Soon
  </span>
);

export default PlaceholderBadge;