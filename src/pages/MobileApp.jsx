
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { AppConfig } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "./Dashboard";

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash', 'auth', 'dashboard'
  const [user, setUser] = useState(null);
  const [splashConfig, setSplashConfig] = useState({
    videoUrl: '',
    duration: 3,
    skipEnabled: true,
    isActive: true
  });
  const [authConfig, setAuthConfig] = useState({
    logoUrl: '',
    backgroundImageUrl: '',
    primaryColor: '#0d9488',
    secondaryColor: '#14b8a6',
    welcomeTitle: 'Welcome to MyShopRun',
    welcomeSubtitle: 'Compare prices and save money on your groceries',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const loadAppConfig = useCallback(async () => {
    try {
      // Load splash video config
      const splashConfigs = await AppConfig.filter({ config_type: 'splash_video' });
      if (splashConfigs.length > 0) {
        const config = JSON.parse(splashConfigs[0].config_value || '{}');
        setSplashConfig(prev => ({ ...prev, ...config, videoUrl: splashConfigs[0].file_url || '' }));
      }

      // Load login customization config
      const authConfigs = await AppConfig.filter({ config_type: 'login_customization' });
      if (authConfigs.length > 0) {
        const config = JSON.parse(authConfigs[0].config_value || '{}');
        setAuthConfig(prev => ({ ...prev, ...config }));
      }
    } catch (error) {
      console.error('Error loading app configurations:', error);
    }
  }, []);

  const checkExistingUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      if (currentUser) {
        setUser(currentUser);
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      // User not logged in - stay on splash/auth flow
    }
  }, []);

  useEffect(() => {
    loadAppConfig();
    checkExistingUser();
  }, [loadAppConfig, checkExistingUser]);

  // Handle splash screen timer
  useEffect(() => {
    if (currentScreen === 'splash' && splashConfig.isActive) {
      const timer = setTimeout(() => {
        setCurrentScreen('auth');
      }, splashConfig.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, splashConfig.isActive, splashConfig.duration]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const skipSplash = () => {
    setCurrentScreen('auth');
  };

  // Splash Screen
  if (currentScreen === 'splash') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        {splashConfig.videoUrl ? (
          <video
            src={splashConfig.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${authConfig.primaryColor}, ${authConfig.secondaryColor})` }}
          >
            <img
              src={authConfig.logoUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/72bdf7b58_MSRLogo.png"}
              alt="MyShopRun Logo"
              className="w-48 h-auto"
            />
          </div>
        )}
        
        {splashConfig.skipEnabled && (
          <button
            onClick={skipSplash}
            className="absolute top-8 right-8 bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-full transition-colors z-10"
          >
            Skip
          </button>
        )}
      </div>
    );
  }

  // Login/Register Screen with Tabs
  if (currentScreen === 'auth') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: authConfig.backgroundImageUrl ? `url(${authConfig.backgroundImageUrl})` : 'none',
          backgroundColor: authConfig.backgroundImageUrl ? 'transparent' : authConfig.primaryColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <img
              src={authConfig.logoUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/72bdf7b58_MSRLogo.png"}
              alt="MyShopRun Logo"
              className="w-24 h-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {authConfig.welcomeTitle}
            </h1>
            <p className="text-gray-600 text-sm">
              {authConfig.welcomeSubtitle}
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome Back!</h2>
                <p className="text-gray-600 mb-6">Sign in to your account to continue saving on groceries</p>
                
                <Button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200"
                  style={{ backgroundColor: authConfig.primaryColor }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Join MyShopRun</h2>
                <p className="text-gray-600 mb-6">Create your account and start saving money today</p>
                
                <Button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200"
                  style={{ backgroundColor: authConfig.secondaryColor }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign Up with Google
                    </>
                  )}
                </Button>

                <div className="mt-6 text-xs text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Dashboard Screen - Use existing Dashboard component with mobile styling
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 mobile-app-view">
        <style jsx>{`
          .mobile-app-view {
            /* Force mobile-responsive layout */
            max-width: 100vw;
            overflow-x: hidden;
          }
          .mobile-app-view .max-w-6xl {
            max-width: 100% !important;
            padding: 0 1rem;
          }
          .mobile-app-view .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mobile-app-view .grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: repeat(1, 1fr) !important;
          }
          .mobile-app-view .flex-col.lg\\:flex-row {
            flex-direction: column !important;
          }
          .mobile-app-view .hidden.md\\:flex {
            display: none !important;
          }
          .mobile-app-view .text-3xl {
            font-size: 1.5rem !important;
          }
          @media (max-width: 380px) {
            .mobile-app-view .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 {
              grid-template-columns: repeat(1, 1fr) !important;
            }
          }
        `}</style>
        <Dashboard />
      </div>
    );
  }

  return null;
}
