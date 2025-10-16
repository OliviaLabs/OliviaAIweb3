import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashSidebarLite from './DashSidebarLite.jsx';

export default function DashLayoutLite() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      <DashSidebarLite
        isCollapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        userEmail={null}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <nav style={{ zIndex: 10 }} className="bg-black border-b border-gray-800 flex-shrink-0">
          <div className="px-4 h-12 flex justify-between items-center bg-black">
            <div className="md:hidden flex items-center">
              <img src="/Olivia-ai-LOGO.png" alt="Olivia Logo" className="w-6 h-6" />
              <p className="text-white font-bold ml-1 text-sm">OLIVIA AI</p>
            </div>
            <div className="hidden md:block"></div>
            <div className="flex items-center gap-3">
              {/* Room for user dropdown, notifications, etc. */}
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

