// Desktop 4-Column Dashboard Layout - Home | Explore | Blank | Plugins
// Only visible on screens ≥1024px (lg breakpoint)
import React, { Suspense } from 'react';
import { Search, Puzzle } from 'lucide-react';

// Lazy load pages to avoid duplicate initialization
const Home = React.lazy(() => import('../../pages/Home'));
const Explore = React.lazy(() => import('../../pages/Explore'));
const Plugins = React.lazy(() => import('../../pages/Plugins'));

export default function DesktopDashboard() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* 4 VERTICAL COLUMNS ROW */}
      <div className="flex-1 flex gap-0 overflow-hidden relative">
        
        {/* COLUMN 1 - HOME (COMPLETE, SELF-CONTAINED) */}
        <div className="flex-1 border-r border-gray-800 flex flex-col min-w-0 relative">
          <Suspense fallback={<div className="text-white p-4">Loading...</div>}>
            <Home />
          </Suspense>
        </div>

        {/* COLUMN 2 - EXPLORE */}
        <div className="flex-1 border-r border-gray-800 flex flex-col overflow-hidden min-w-0">
          <div className="p-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm shrink-0 z-10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Explore</span>
            </h3>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 overflow-auto">
              <Suspense fallback={<div className="text-white p-4">Loading...</div>}>
                <Explore />
              </Suspense>
            </div>
          </div>
        </div>

        {/* COLUMN 3 - BLANK */}
        <div className="flex-1 border-r border-gray-800 flex flex-col overflow-hidden min-w-0 bg-black">
          {/* Empty column */}
        </div>

        {/* COLUMN 4 - PLUGINS */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="p-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm shrink-0 z-10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-purple-400" />
              <span className="text-sm">Plugins</span>
            </h3>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 overflow-auto">
              <Suspense fallback={<div className="text-white p-4">Loading...</div>}>
                <Plugins />
              </Suspense>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
