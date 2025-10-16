import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import React from 'react'

import { ChatProvider } from './contexts/ChatContext.jsx'
import { WebSocketProvider } from './contexts/WebSocketContext.jsx'
import AppKitProvider from './components/auth/Web3ModalProvider.jsx'

import { AuthProviderLogin } from './contexts/AuthContext.jsx'
import { InternetIdentityProvider } from './contexts/InternetIdentityContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log('🚀 Main.jsx starting...');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HeroUIProvider>
        <AppKitProvider>
          <BrowserRouter  
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AuthProviderLogin>
              <InternetIdentityProvider>
                <WebSocketProvider>
                  <ChatProvider>
                    <main className="dark text-foreground bg-background">
                      <App />
                    </main>
                  </ChatProvider>
                </WebSocketProvider>
              </InternetIdentityProvider>
            </AuthProviderLogin>
          </BrowserRouter>
        </AppKitProvider>
      </HeroUIProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
