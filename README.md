# 🍎 MealSage - AI-Powered Food Nutrition Analysis

A modern, mobile-responsive web application that uses AI to analyze food photos and provide detailed nutritional insights. Built with React, TypeScript, and powered by Google Gemini AI.

![MealSage Demo](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-18.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-blue)

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Food Analysis**: Snap a photo and get instant nutritional insights
- **Real-time Results**: Get detailed breakdowns including calories, macros, and health recommendations
- **Accurate Detection**: Advanced image recognition for precise food identification
- **Personalized Insights**: Receive health scores and actionable recommendations

### 📱 Mobile-First Design
- **Fully Responsive**: Optimized for all devices (mobile, tablet, desktop)
- **Touch-Friendly**: Intuitive mobile navigation with hamburger menu
- **Progressive Web App**: Fast loading and smooth interactions
- **Dark/Light Mode**: Automatic theme switching with manual toggle

### 🔧 Technical Features
- **Modern UI/UX**: Beautiful animations and micro-interactions
- **Real-time Authentication**: Firebase integration with Google Sign-in
- **API Integration**: Edamam Recipe Search API for comprehensive nutrition data
- **Performance Optimized**: Lazy loading and efficient state management

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Firebase project setup
- Edamam API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tallamSai/Meal_Sage.git
   cd Meal_Sage
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the project root:
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

   # Google Gemini AI
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Mobile Responsiveness

The application is fully optimized for mobile devices with:

- **Responsive Navigation**: Collapsible hamburger menu for mobile
- **Touch-Optimized UI**: Larger touch targets and intuitive gestures
- **Adaptive Layouts**: Flexible grids that stack on smaller screens
- **Mobile-First Typography**: Scalable text sizes for all devices
- **Optimized Images**: Responsive image handling and lazy loading

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### UI Components
- **Shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing

### Backend & APIs
- **Firebase** - Authentication and database
- **Google Gemini AI** - AI-powered food analysis
- **Edamam API** - Nutrition database
- **React Query** - Data fetching and caching

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── ...             # Custom components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── styles/             # Global styles and CSS
└── types/              # TypeScript type definitions
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Add your Firebase config to `.env`

### Edamam API Setup
1. Sign up at [Edamam Developer Portal](https://developer.edamam.com/)
2. Create a new application
3. Add your API credentials to `.env`

### Google Gemini AI
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to your `.env` file

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy the dist folder
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [Edamam](https://developer.edamam.com/) for nutrition data
- [Firebase](https://firebase.google.com/) for backend services
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components

## 📞 Support

For support, email wht10088@gmail.com or create an issue in this repository.

---

**Made with ❤️ by tallamSai**
