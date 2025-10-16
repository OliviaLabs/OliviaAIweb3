import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/home';
import Login from './pages/login';
import Plugins from './pages/plugins';
import Explore from './pages/explore';
import Profile from './pages/profile';
import Desktop from './pages/Desktop';

import Layout from './components/layout/Layout';
import DashLayoutLite from './components/layout/DashLayoutLite.jsx';
import { PrivateRoute } from './components/auth/RouteGuards';
import { TokenInfluencerProvider } from './contexts/TokenInfluencerContext';
import { HomeInputProvider } from './contexts/HomeInputContext';
import React, { useState, useEffect } from 'react';
import QrCode from './pages/qrcode';

function App() {
  const [showQrCode, setShowQrCode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData && tg.initDataUnsafe) {
      if (tg.platform && tg.platform !== "web") {
        tg.expand();
        tg.disableVerticalSwipes();
        tg.onEvent("viewportChanged", () => {
          if (!tg.isExpanded) {
            tg.expand();
          }
        });
        return;
      }
    }
    setShowQrCode(false);
  }, []);

  if (location.pathname === '/' || location.pathname === '') {
    return <Navigate to="/login" replace />;
  }

  return (
    <TokenInfluencerProvider>
      <Routes>
        {showQrCode ? (
          <Route path="/*" element={<QrCode />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route element={<DashLayoutLite />}>
                {/* WEB2 dash sections (placeholders) */}
                <Route path="/dashboard" element={<div className="p-6 text-white">Dashboard page</div>} />
                <Route path="/conversations" element={<div className="p-6 text-white">Conversations</div>} />
                <Route path="/leads" element={<div className="p-6 text-white">Leads</div>} />
                <Route path="/agents" element={<div className="p-6 text-white">Agents</div>} />
                <Route path="/playground" element={<div className="p-6 text-white">AI Playground</div>} />
                <Route path="/campaigns/sms" element={<div className="p-6 text-white">SMS Campaign</div>} />
                <Route path="/campaigns/email" element={<div className="p-6 text-white">Email Campaign</div>} />
                <Route path="/integrations" element={<div className="p-6 text-white">Integrations</div>} />
                <Route path="/whatsapp-templates" element={<div className="p-6 text-white">WhatsApp Templates</div>} />
                <Route path="/staff" element={<div className="p-6 text-white">Staff</div>} />
                <Route path="/api-keys" element={<div className="p-6 text-white">API Keys</div>} />
                <Route path="/ask" element={<div className="p-6 text-white">Ask</div>} />

                {/* Your existing app pages inside the new shell */}
                <Route element={
                  <HomeInputProvider>
                    <Layout />
                  </HomeInputProvider>
                }>
                  <Route path="/home" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/plugins" element={<Plugins />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/desktop" element={<Desktop />} />
                </Route>
              </Route>
            </Route>

            <Route path="/icp-setup" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      <Toaster richColors position="bottom-right" closeButton />
    </TokenInfluencerProvider>
  );
}

export default App;
