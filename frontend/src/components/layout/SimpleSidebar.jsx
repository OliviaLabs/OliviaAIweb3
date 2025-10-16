import React from 'react';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-md text-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`;

export default function SimpleSidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-white/10 h-full p-3">
      <div className="text-white font-semibold mb-3 px-2">Navigation</div>
      <nav className="space-y-1">
        {/* Required dashboard nav items mapped to Web3 pages */}
        <NavLink to="/home" className={linkClass}>Home</NavLink>
        <NavLink to="/explore" className={linkClass}>Explore</NavLink>
        <NavLink to="/plugins" className={linkClass}>Plugins</NavLink>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
        <NavLink to="/desktop" className={linkClass}>Desktop</NavLink>
      </nav>
    </aside>
  );
}


