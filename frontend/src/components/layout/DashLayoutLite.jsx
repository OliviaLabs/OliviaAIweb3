import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashSidebarLite from './DashSidebarLite.jsx';

export default function DashLayoutLite() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      <DashSidebarLite
        isCollapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        userEmail={null}
      />

      <div className={`flex flex-col h-screen overflow-hidden ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'}`} style={{ width: `calc(100vw - ${isSidebarCollapsed ? '80px' : '280px'})`, maxWidth: `calc(100vw - ${isSidebarCollapsed ? '80px' : '280px'})`, boxSizing: 'border-box' }}>
        <nav style={{ zIndex: 10, maxWidth: '100%', boxSizing: 'border-box' }} className="bg-black border-b border-gray-800 flex-shrink-0 w-full">
          <div className="px-4 h-12 flex justify-between items-center bg-black w-full" style={{ boxSizing: 'border-box' }}>
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

        <main className="flex-1 overflow-hidden w-full" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

