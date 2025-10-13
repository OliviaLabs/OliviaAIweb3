// Responsive wrapper that switches between mobile and desktop layouts
import React, { useState, useEffect } from 'react';
import DesktopDashboard from './DesktopDashboard';

export default function ResponsiveHomeWrapper({ children }) {
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // DESKTOP: 4-column dashboard (≥1024px) - shows all pages at once, ignores routing
  if (isDesktop) {
    return <DesktopDashboard />;
  }

  // MOBILE: Original single-column layout (<1024px) - uses routing normally
  return <>{children}</>;
}

