
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ArrowUpSquare, PlusSquare, X } from 'lucide-react';

export default function AddToHomeScreenPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [deviceType, setDeviceType] = useState('');

  // Define the event handler outside useEffect to ensure it's a stable reference
  // This is crucial for correctly adding and removing the event listener
  const handleBeforeInstallPrompt = (event) => {
    console.log('[A2HS] beforeinstallprompt event received');
    event.preventDefault();
    setInstallPromptEvent(event);
    setDeviceType('android');
    setIsVisible(true);
  };

  useEffect(() => {
    const isDismissed = localStorage.getItem('a2hs_dismissed');
    if (isDismissed) {
      console.log('[A2HS] Prompt dismissed by user previously');
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // MOBILE-ONLY CHECK: Only show on actual mobile devices
    const isMobile = isIos || isAndroid || /mobile/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    console.log('[A2HS] Device detection:', { userAgent, isIos, isAndroid, isMobile, isStandalone });

    // Exit early if not mobile or if already installed as PWA
    if (!isMobile || isStandalone) {
      console.log('[A2HS] Not a mobile device or already installed - not showing prompt');
      return;
    }

    // For Android mobile devices, add the 'beforeinstallprompt' listener
    if (isAndroid) {
      console.log('[A2HS] Android mobile detected - adding listener for beforeinstallprompt');
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    } 
    // Show for iOS devices with a delay
    else if (isIos) {
      console.log('[A2HS] iOS mobile detected - showing manual prompt');
      setTimeout(() => {
        setDeviceType('ios');
        setIsVisible(true);
      }, 3000); // Slightly longer delay for mobile
    } 
    // For other mobile devices, show a generic prompt with a delay
    else if (isMobile) {
      console.log('[A2HS] Other mobile device detected - showing generic prompt');
      setTimeout(() => {
        setDeviceType('generic');
        setIsVisible(true);
      }, 4000);
    }

    // Cleanup function: this will run when the component unmounts or before the effect re-runs
    return () => {
      // Only remove the listener if it was added (i.e., on Android)
      // `isAndroid` here captures the value from when the effect initially ran
      if (isAndroid) {
        console.log('[A2HS] Cleanup: removing beforeinstallprompt listener');
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []); // Run this effect only once on component mount

  const handleInstallClick = () => {
    if (installPromptEvent) {
      console.log('[A2HS] Triggering native install prompt');
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        console.log('[A2HS] User choice:', choiceResult.outcome);
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setIsVisible(false);
        setInstallPromptEvent(null); // Clear the event after use
      });
    } else {
      console.log('[A2HS] No install event available, manual instructions shown');
    }
  };

  const handleDismiss = () => {
    console.log('[A2HS] User dismissed the prompt');
    localStorage.setItem('a2hs_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="bg-slate-900 text-white p-4 shadow-2xl rounded-lg max-w-lg mx-auto relative">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68976fa9bc8053db9cafcf4e/341d0b21c_Icon-App-40x403x.png"
                alt="MyShopRun Logo"
                className="w-12 h-12 rounded-lg"
            />
            <div>
              <h4 className="font-bold">Add MyShopRun to your Home Screen</h4>
              <p className="text-sm text-gray-300 mt-1">
                Get quick access to your shopping lists and savings, just like a native app.
              </p>
              {deviceType === 'android' && (
                <Button 
                  onClick={handleInstallClick}
                  className="bg-teal-500 hover:bg-teal-600 text-white mt-4 w-full"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
              {deviceType === 'ios' && (
                <div className="text-sm bg-slate-800 p-3 rounded-md mt-3">
                  <p className="mb-2">To install this app on your iPhone:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Tap the Share button <ArrowUpSquare className="inline-block w-3 h-3" /> in Safari</li>
                    <li>Scroll down and tap "Add to Home Screen" <PlusSquare className="inline-block w-3 h-3" /></li>
                    <li>Tap "Add" in the top-right corner</li>
                  </ol>
                </div>
              )}
              {deviceType === 'generic' && (
                <div className="text-sm bg-slate-800 p-3 rounded-md mt-3">
                  <p>Look for "Add to Home Screen" or "Install App" option in your browser menu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
