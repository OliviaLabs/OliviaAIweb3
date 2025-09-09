# Deployment Instructions

## Deploy Microservice to Render

1. **Create a new Web Service on Render:**
   - Go to https://render.com/dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Set **Root Directory**: `microservice`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`

2. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   OPENAI_API_KEY=your_openai_api_key
   ZERO_EX_API_KEY=your_0x_api_key
   COINSTATS_API_KEY=your_coinstats_api_key
   LURKY_API_KEY=your_lurky_api_key
   CHANGENOW_API_KEY=your_changenow_api_key
   ADMIN_ACCESS_SECRET=dev-token
   ```

3. **Update the microservice URL in endpoints.js:**
   Replace `https://olivia-ai-microservice.onrender.com` with your actual Render URL.

## How It Works

### Local Development:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- Auto-detects localhost and uses local URLs

### Production:
- **Frontend**: https://oliviaaiweb3-1.onrender.com  
- **Backend**: https://olivia-ai-microservice.onrender.com
- Auto-detects production domain and uses production URLs

## Testing

1. **Local**: Visit http://localhost:3000 - should use local microservice
2. **Production**: Visit https://oliviaaiweb3-1.onrender.com - should use production microservice

Both will have the full AI-driven bubble system working!
