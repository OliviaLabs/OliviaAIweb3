// Responsive wrapper - NO AUTO-SWITCHING
// Desktop 4-column view is now only on /desktop route
import React from 'react';

export default function ResponsiveHomeWrapper({ children }) {
  // Just render children - no desktop switching
  return <>{children}</>;
}

