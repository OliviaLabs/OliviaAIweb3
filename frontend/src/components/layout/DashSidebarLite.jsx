import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Sparkles, Code2, UserCog, User, ChevronLeft, ChevronRight, Bot, Boxes, Mail, Home as HomeIcon, Search, Puzzle, Monitor
} from 'lucide-react';
import logo from '../../assets/logos/Olivia-ai-LOGO.png';

export default function DashSidebarLite({ isCollapsed, onCollapse, userEmail }) {
  const location = useLocation();
  const menuGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Home', icon: HomeIcon, path: '/home' },
        { name: 'Explore', icon: Search, path: '/explore' },
        { name: 'Plugins', icon: Puzzle, path: '/plugins', badge: 12 },
        { name: 'Profile', icon: User, path: '/profile' },
      ],
    },
    {
      title: 'Dashboard',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Conversations', icon: MessageSquare, path: '/conversations' },
        { name: 'Leads', icon: Users, path: '/leads' },
      ],
    },
    {
      title: 'AI Tools',
      items: [
        { name: 'Agents', icon: Bot, path: '/agents' },
        { name: 'AI Playground', icon: Sparkles, path: '/playground' },
        { name: 'Ask', icon: MessageSquare, path: '/ask' },
      ],
    },
    {
      title: 'Campaigns',
      items: [
        { name: 'SMS Campaign', icon: MessageSquare, path: '/campaigns/sms' },
        { name: 'Email Campaign', icon: Mail, path: '/campaigns/email' },
      ],
    },
    {
      title: 'Integration',
      items: [
        { name: 'Integrations', icon: Boxes, path: '/integrations' },
        { name: 'WhatsApp Templates', icon: Boxes, path: '/whatsapp-templates' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'API Keys', icon: Code2, path: '/api-keys' },
        { name: 'Staff', icon: UserCog, path: '/staff' },
        { name: 'Acuraus', icon: Monitor, path: '/desktop', badge: 'β' },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <>
      <div className={`hidden md:block h-screen fixed left-0 top-0 bg-black border-r border-gray-800 z-50 transition-all duration-250 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src={logo} alt="Olivia Logo" className="w-10 h-10" />
                </div>
                <span className="font-bold text-white text-xl">OLIVIA AI</span>
              </div>
            )}
            <div onClick={() => onCollapse(!isCollapsed)} className="p-2 hover:bg-gray-900 rounded-lg cursor-pointer">
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          <nav className="p-4 overflow-y-auto flex-1">
            {menuGroups.map((group, idx) => (
              <div key={group.title} className={idx !== 0 ? 'mt-8' : ''}>
{!isCollapsed && (
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative group flex items-center justify-between p-2 rounded-lg transition-all duration-250`}
                      style={{
                        background: isActive(item.path) 
                          ? 'linear-gradient(to top right, #10b981, #34d399)'
                          : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(item.path)) {
                          e.currentTarget.style.background = '#1F2937';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.path)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {isActive(item.path) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg">
                          <item.icon 
                            className="w-4 h-4" 
                            style={{ 
                              color: isActive(item.path) ? '#FFFFFF' : '#9CA3AF',
                              opacity: 1,
                              visibility: 'visible',
                              display: 'inline-block'
                            }}
                          />
                        </div>
                        {!isCollapsed && (
                          <span 
                            className="font-medium text-sm" 
                            style={{ 
                              color: isActive(item.path) ? '#FFFFFF' : '#9CA3AF',
                              opacity: 1,
                              visibility: 'visible',
                              display: 'inline-block'
                            }}
                          >
                            {item.name}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {!isCollapsed && (
            <div className="mt-auto p-4 border-t border-gray-800">
              <div className="p-3 rounded-lg bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
                    <span className="text-sm font-bold text-black">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {userEmail || 'user@example.com'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">Welcome back</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50 shadow-lg">
        <div className="flex justify-around py-2">
          {[
            { name: 'Home', path: '/home', icon: MessageSquare },
            { name: 'Explore', path: '/explore', icon: Users },
            { name: 'Plugins', path: '/plugins', icon: Bot },
            { name: 'Profile', path: '/profile', icon: User },
          ].map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center p-2">
                <Icon className={`w-5 h-5 ${active ? 'text-brand' : 'text-gray-400'}`} />
                {active && <span className="text-[10px] mt-1 text-white">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

