# 🚀 Deployment Guide - MealSage

This guide covers how to deploy MealSage to Vercel with the Edamam API proxy functionality.

## 📋 Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Edamam API credentials
- Firebase project setup

## 🔧 Local Development

### Option 1: Run Both Servers (Recommended)

```bash
# Install dependencies
npm install

# Run both frontend and proxy server
npm run dev:proxy
```

This will start:
- Frontend: `http://localhost:5173` (Vite dev server)
- Proxy: `http://localhost:3001` (Edamam proxy)

### Option 2: Run Separately

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Proxy Server
npm run proxy
```

## 🌐 Vercel Deployment

### Step 1: Environment Variables

Add these environment variables in your Vercel project settings:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Edamam API Configuration
VITE_EDAMAM_APP_ID=your_edamam_app_id
VITE_EDAMAM_APP_KEY=your_edamam_app_key
EDAMAM_ACCOUNT_USER=your_edamam_account_user

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Configure Vercel Settings

In your Vercel dashboard:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Install Command**: `npm install`
4. **Framework Preset**: `Vite`

## 🔄 How It Works

### Development Mode
- Frontend runs on `localhost:5173`
- Edamam proxy runs on `localhost:3001`
- API calls go to local proxy

### Production Mode (Vercel)
- Frontend is built and served by Vercel
- Edamam API calls go to `/api/edamam` (Vercel serverless function)
- No separate proxy server needed

## 📁 File Structure

```
nourish-vision-web/
├── api/
│   └── edamam.js          # Vercel serverless function
├── src/
│   └── lib/
│       └── edamam.ts      # API client (auto-switches between dev/prod)
├── edamam-proxy.js        # Local development proxy
├── vercel.json            # Vercel configuration
└── package.json           # Build scripts
```

## 🛠️ Troubleshooting

### Common Issues

1. **API calls failing in production**
   - Check environment variables in Vercel dashboard
   - Verify Edamam credentials are correct
   - Check Vercel function logs

2. **CORS errors**
   - The serverless function includes CORS headers
   - Make sure you're using the correct API URL

3. **Build failures**
   - Ensure all dependencies are in `package.json`
   - Check for TypeScript errors
   - Verify Node.js version compatibility

### Debugging

```bash
# Check Vercel function logs
vercel logs

# Test API endpoint locally
curl "http://localhost:3001/api/edamam?q=chicken"

# Test production API
curl "https://your-domain.vercel.app/api/edamam?q=chicken"
```

## 🔐 Security Notes

- Environment variables are automatically encrypted by Vercel
- API keys are never exposed to the client
- CORS is properly configured for production
- Rate limiting is handled by Vercel

## 📈 Monitoring

- Use Vercel Analytics to monitor performance
- Check Vercel Function logs for API errors
- Monitor Edamam API usage in their dashboard

## 🚀 Alternative Deployment Options

### Netlify
- Similar setup but use Netlify Functions instead of Vercel Functions
- Create `netlify/functions/edamam.js`

### Railway/Render
- Deploy both frontend and proxy server
- Use environment variables for configuration

## 📞 Support

For deployment issues:
1. Check Vercel documentation
2. Review environment variable configuration
3. Test API endpoints locally first
4. Check function logs in Vercel dashboard 