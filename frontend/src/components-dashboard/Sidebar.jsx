import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScrollShadow } from '@heroui/react';
import { Home, Compass, Plug, User, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ isCollapsed = false, onCollapse = () => {}, user = null }) {
  const location = useLocation();

  const menuGroups = [
    {
      title: 'Navigation',
      items: [
        { name: 'Home', icon: Home, path: '/home' },
        { name: 'Explore', icon: Compass, path: '/explore' },
        { name: 'Plugins', icon: Plug, path: '/plugins' },
        { name: 'Profile', icon: User, path: '/profile' },
        { name: 'Desktop', icon: Monitor, path: '/desktop' },
      ],
    },
  ];

  const isActivePath = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const MenuItem = ({ item }) => {
    const isActive = isActivePath(item.path);
    return (
      <Link
        to={item.path}
        className={`relative group flex items-center justify-between p-2 rounded-lg transition-all duration-250 ${
          isActive ? 'bg-gradient-to-tr from-brand to-brand-secondary text-gray-900' : 'hover:bg-gray-50 text-gray-600'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 rounded-r-full" />
        )}

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'group-hover:bg-gray-100'}`}>
            <item.icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`} />
          </div>
          {!isCollapsed && (
            <span className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
              {item.name}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const MobileMenuItem = ({ item }) => {
    const isActive = isActivePath(item.path);
    return (
      <Link to={item.path} className="relative flex flex-col items-center justify-center p-3 transition-all duration-250 min-w-[80px] h-[80px] hover:bg-gray-50">
        {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-brand rounded-b-full" />}
        <div className="p-2">
          <item.icon className={`w-5 h-5 ${isActive ? 'text-brand' : 'text-gray-600'}`} />
        </div>
        {isActive && <span className="text-xs font-medium mt-1 text-center text-gray-900">{item.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (dashboard styling) */}
      <div className={`hidden md:block h-screen fixed left-0 top-0 bg-white border-r border-gray-100 z-50 transition-all duration-250 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src="/Olivia-ai-LOGO.png" alt="Olivia Logo" />
                </div>
                <span className="font-bold text-gray-900 text-xl">OLIVIA AI</span>
              </div>
            )}
            <div onClick={() => onCollapse(!isCollapsed)} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
            </div>
          </div>

          <ScrollShadow hideScrollBar className="flex-1" size={20}>
            <nav className="p-4">
              {menuGroups.map((group, index) => (
                <div key={group.title} className={index !== 0 ? 'mt-8' : ''}>
                  {!isCollapsed && (
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">{group.title}</h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <MenuItem key={item.path} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollShadow>

          {!isCollapsed && (
            <div className="p-4 border-t border-gray-100">
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email || 'user@olivia.ai'}</p>
                    <p className="text-xs text-gray-500 truncate">Welcome back</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
        <div className="px-4 pt-2">
          <ScrollShadow hideScrollBar className="w-full" orientation="horizontal" size={20}>
            <div className="flex gap-2 pb-0" style={{ width: 'max-content' }}>
              {menuGroups.flatMap((g) => g.items).map((item) => (
                <MobileMenuItem key={item.path} item={item} />
              ))}
            </div>
          </ScrollShadow>
        </div>
      </div>
    </>
  );
}



