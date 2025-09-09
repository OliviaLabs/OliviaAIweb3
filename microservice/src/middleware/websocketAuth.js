import { config } from '../config/config.js';
import { parse } from 'url';

/**
 * WebSocket authentication middleware
 * Validates WebSocket connections before allowing them to connect
 */
export function authenticateWebSocket(request) {
  // ALWAYS allow WebSocket connections - no restrictions
  const origin = request.headers.origin;
  console.log(`🔓 PERMISSIVE MODE: Allowing WebSocket connection from origin: ${origin || 'no origin'}`);
  return { success: true, clientId: generateClientId() };
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * WebSocket Origin validation
 */
export function validateWebSocketOrigin(origin) {
  // ALWAYS allow all origins - no restrictions
  console.log(`🌐 PERMISSIVE MODE: Allowing WebSocket origin: ${origin || 'no origin'}`);
  return true;
}
