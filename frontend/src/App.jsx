import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/home';
import Login from './pages/Login.jsx';
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

// Import real Dashboard, Conversations, Leads, and Agents pages
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Leads from './pages/Leads';
import Agents from './pages/Agents';
const Playground = () => <div className="p-8 text-white">Playground Page</div>;
const SmsCampaign = () => <div className="p-8 text-white">SMS Campaign Page</div>;
const EmailCampaign = () => <div className="p-8 text-white">Email Campaign Page</div>;
const Extensions = () => <div className="p-8 text-white">Extensions Page</div>;
const WhatsappTemplates = () => <div className="p-8 text-white">WhatsApp Templates Page</div>;
const Staff = () => <div className="p-8 text-white">Staff Page</div>;
const ApiKeys = () => <div className="p-8 text-white">API Keys Page</div>;
const Ask = () => <div className="p-8 text-white">Ask Page</div>;

function App() {
  const [showQrCode, setShowQrCode] = useState(false);

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

  return (
    <TokenInfluencerProvider>
      <Routes>
        {showQrCode ? (
          <Route path="/*" element={<QrCode />} />
        ) : (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
            <Route element={<DashLayoutLite />}>
              {/* WEB2 dash sections - REAL pages */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/playground/:agentId?" element={<Playground />} />
              <Route path="/campaigns/sms" element={<SmsCampaign />} />
              <Route path="/campaigns/email" element={<EmailCampaign />} />
              <Route path="/integrations" element={<Extensions />} />
              <Route path="/whatsapp-templates" element={<WhatsappTemplates />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/ask" element={<Ask />} />

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
