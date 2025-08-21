# WalletConnect Project Setup

## 🚀 Quick Setup Guide

### 1. Get Your Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up or log in
3. Click "Create Project"
4. Enter your project details:
   - **Project Name**: Olivia AI
   - **Description**: AI-Powered Web3 Assistant Platform
   - **URL**: Your domain (or localhost:3000 for development)
5. Copy your **Project ID**

### 2. Add to Environment Variables
Create or update your `.env` file in the project root:

```bash
# WalletConnect Configuration
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

### 3. Restart Your Development Server
```bash
npm run dev
```

## 🔧 Project Configuration

Your project should be configured with these settings in WalletConnect Cloud:

- **Name**: Olivia AI
- **Description**: AI-Powered Web3 Assistant Platform  
- **URL**: `https://your-domain.com` (or `http://localhost:3000` for development)
- **Icon**: Upload your Olivia AI logo
- **Allowed Origins**: 
  - `http://localhost:3000` (for development)
  - `https://your-production-domain.com` (for production)

## 🌐 Supported Networks

Your app supports these networks:
- Ethereum Mainnet
- Arbitrum
- Polygon
- Base
- Optimism
- BSC (Binance Smart Chain)
- Avalanche

## 🛡️ Security Notes

- Never commit your actual project ID to version control
- Keep your project ID in the `.env` file (which should be in `.gitignore`)
- Use different project IDs for development and production environments

## 📱 Testing

After setup, you should be able to:
1. Click "Connect Wallet" on the login page
2. See the WalletConnect modal with wallet options
3. Connect with MetaMask, WalletConnect, Coinbase Wallet, etc.
4. No more 401/403 errors in the console

## ❓ Troubleshooting

If you see errors:
- **401/403 errors**: Check your project ID is correct
- **CORS errors**: Verify your domain is added to allowed origins
- **Modal not opening**: Make sure VITE_WALLETCONNECT_PROJECT_ID is set
