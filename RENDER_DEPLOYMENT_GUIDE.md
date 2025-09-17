# Render Deployment Guide

## Environment Variables to Set on Render

Set these environment variables in your Render dashboard:

### Required Variables
```
NODE_ENV=production
PORT=10000
ADMIN_ACCESS_SECRET=your_admin_secret_here
OPENAI_API_KEY=your_openai_api_key_here
ALLOWED_ORIGIN=https://olivia-ai-web3.onrender.com
```

### Optional Variables
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WEBSOCKET_PATH=/ws/secure-proxy
EXTERNAL_WEBSOCKET_URLS=wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream,wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws,wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app
```

### API Keys (Only if using these services)
```
CHANGENOW_API_KEY=your_changenow_key
LURKY_API_KEY=your_lurky_key
ZERO_EX_API_KEY=your_zerox_key
OKX_API_KEY=your_okx_key
OKX_SECRET_KEY=your_okx_secret
OKX_PASSPHRASE=your_okx_passphrase
```

## Build Configuration

The deployment uses the following build command:
```bash
npm install && NODE_OPTIONS="--max-old-space-size=4096" npm run build:production && cd microservice && npm install
```

## Start Command

The start command is configured in render.yaml:
```bash
cd microservice && npm start
```

This command:
1. Changes to the microservice directory
2. Starts the Node.js server which:
   - Serves the API endpoints at `/api/*`
   - Serves the built frontend files from the `dist` directory
   - Handles WebSocket connections at `/ws/secure-proxy`

## Testing the Deployment

After deployment, test these endpoints:

1. **Health Check** (no auth required):
   ```
   GET https://olivia-ai-web3.onrender.com/api/health
   ```

2. **Frontend Application**:
   ```
   https://olivia-ai-web3.onrender.com
   ```

3. **Token Info** (auth required):
   ```
   GET https://olivia-ai-web3.onrender.com/api/openai/token-info
   Authorization: Bearer dev-token
   ```

4. **Chat Completions** (auth required):
   ```
   POST https://olivia-ai-web3.onrender.com/api/openai/chat/completions
   Authorization: Bearer dev-token
   Content-Type: application/json
   
   {
     "messages": [{"role": "user", "content": "Hello!"}]
   }
   ```

## Troubleshooting

### 401 Unauthorized Error
- Check if `ADMIN_ACCESS_SECRET` is set correctly
- The frontend uses `dev-token` for authentication in production

### 404 Not Found Error
- Verify the microservice is running
- Check the build logs for any errors

### CORS Errors
- Ensure `ALLOWED_ORIGIN` is set to `https://oliviaaiweb3-1.onrender.com`
- The microservice allows multiple origins including the production URL

### Memory Issues
- The build process uses `NODE_OPTIONS="--max-old-space-size=4096"` to increase memory
- Large assets are temporarily moved during build to reduce memory usage
