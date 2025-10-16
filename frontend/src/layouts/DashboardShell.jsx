import React from 'react';
import { Outlet } from 'react-router-dom';
import SimpleSidebar from '../components/layout/SimpleSidebar';

export default function DashboardShell() {
  return (
    <div className="h-screen w-full flex bg-black">
      <SimpleSidebar />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}


