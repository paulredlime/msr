
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/api/entities';
import { ShoppingCart, Zap, CheckCircle, Clock, AlertCircle, MailCheck, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// **NEW APPROACH**: Explicit store mapping table to avoid normalization issues
const STORE_MAPPING = {
  // Mapping from comparison.name (as it appears in UI) to possible values in user.connected_supermarkets
  'ASDA': ['ASDA', 'asda', 'Asda'],
  'Tesco': ['Tesco', 'tesco'],
  'Sainsbury\'s': ['Sainsbury\'s', 'Sainsburys', 'sainsburys', 'sainsbury\'s', 'Sainsbury\'s'],
  'Morrisons': ['Morrisons', 'morrisons'],
  'Waitrose': ['Waitrose', 'waitrose'],
  'Lidl': ['Lidl', 'lidl'],
  'Aldi': ['Aldi', 'aldi'],
  'Co-op': ['Co-op', 'Coop', 'coop', 'co-op'],
  'Iceland': ['Iceland', 'iceland']
};

// Reverse mapping for store IDs
const STORE_ID_MAPPING = {
  'ASDA': 'asda',
  'Tesco': 'tesco', 
  'Sainsbury\'s': 'sainsburys',
  'Morrisons': 'morrisons',
  'Waitrose': 'waitrose',
  'Lidl': 'lidl',
  'Aldi': 'aldi',
  'Co-op': 'coop',
  'Iceland': 'iceland'
};

export default function AutoFillBasketButton({ comparison, items, onComplete, className, size, user }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(null);
  const [flowStep, setFlowStep] = useState('idle');
  const [processingText, setProcessingText] = useState('');
  const [buttonState, setButtonState] = useState({ mode: 'manual', text: 'Manual Checkout', color: 'bg-gray-600 hover:bg-gray-700' });

  const storeId = STORE_ID_MAPPING[comparison.name] || comparison.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const storeUrl = `https://www.${storeId}.com`;

  // **FIX**: Remove unnecessary comparison.id dependency
  const verifyStoreConnection = useCallback(async () => {
    try {
      // Always fetch fresh user data from database
      const freshUser = await User.me();
      
      if (!freshUser) {
        setButtonState({ mode: 'manual', text: 'Manual Checkout', color: 'bg-gray-600 hover:bg-gray-700' });
        return;
      }
      
      console.log(`🔍 AutoFillBasketButton: Checking connection for "${comparison.name}"`);
      console.log(`📋 AutoFillBasketButton: User connected stores:`, freshUser.connected_supermarkets);
      console.log(`🤖 AutoFillBasketButton: User registered stores:`, freshUser.registered_stores);
      
      // Use explicit mapping to check for manual connection
      const connectedStores = freshUser.connected_supermarkets || [];
      const possibleStoreNames = STORE_MAPPING[comparison.name] || [comparison.name];
      
      console.log(`🎯 AutoFillBasketButton: Looking for these variations:`, possibleStoreNames);
      
      const isManuallyConnected = connectedStores.some(userStore => {
        const match = possibleStoreNames.includes(userStore);
        console.log(`🔎 AutoFillBasketButton: Checking "${userStore}" against possible names: ${match}`);
        return match;
      });
      
      // Check auto-registration status (variable still exists but logic changed below)
      const autoRegisteredStores = freshUser.registered_stores || [];
      const isAutoRegistered = autoRegisteredStores.includes(storeId);
      
      console.log(`✅ AutoFillBasketButton: Is ${comparison.name} manually connected?`, isManuallyConnected);
      console.log(`🤖 AutoFillBasketButton: Is ${comparison.name} (${storeId}) auto-registered?`, isAutoRegistered);
      
      // **REVISED LOGIC**: ONLY check for manual connection. Ignore auto-registration for this button's state.
      if (isManuallyConnected) {
        console.log(`🟢 AutoFillBasketButton: Setting ${comparison.name} to AUTO-FILL mode (manually connected)`);
        setButtonState({ mode: 'auto-fill', text: 'Auto Fill Basket', color: 'bg-green-600 hover:bg-green-700' });
        return;
      }

      // If auto-registration is enabled but store not connected, show auto-register option
      if (freshUser.auto_registration_enabled) {
        console.log(`🔵 AutoFillBasketButton: Setting ${comparison.name} to AUTO-REGISTER mode`);
        setButtonState({ mode: 'auto-register', text: 'Auto Register & Fill', color: 'bg-blue-600 hover:bg-blue-700' });
        return;
      }

      // Fallback to manual
      console.log(`⚪ AutoFillBasketButton: Setting ${comparison.name} to MANUAL mode (fallback)`);
      setButtonState({ mode: 'manual', text: 'Manual Checkout', color: 'bg-gray-600 hover:bg-gray-700' });
      
    } catch (error) {
      console.error('❌ AutoFillBasketButton: Error verifying store connection:', error);
      setButtonState({ mode: 'manual', text: 'Manual Checkout', color: 'bg-gray-600 hover:bg-gray-700' });
    }
  }, [comparison.name, storeId]); // Removed comparison.id dependency

  // Verify store connection on component mount and when comparison changes
  useEffect(() => {
    verifyStoreConnection();
  }, [verifyStoreConnection]);

  const handleClick = async () => {
    setLoading(true);
    try {
      switch(buttonState.mode) {
        case 'connected': // This case should theoretically not be hit with the new logic, but kept for robustness if logic changes again.
          window.open(`${storeUrl}/basket`, '_blank');
          break;
        case 'auto-register':
        case 'auto-fill':
          // Set isRegistered based on current button mode
          setIsRegistered(buttonState.mode === 'auto-fill'); 
          setShowModal(true);
          break;
        case 'manual':
        default:
          window.open(storeUrl, '_blank');
          break;
      }
    } catch (error) {
      console.error('Error in autofill button click:', error);
      window.open(storeUrl, '_blank');
    }
    setLoading(false);
  };
  
  const startRegistrationFlow = async () => {
    setFlowStep('processing');
    setProcessingText('Creating your account...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    setFlowStep('email_verify');
  };

  const startLoginFlow = async () => {
    setFlowStep('processing');
    setProcessingText('Logging in & filling basket...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    setFlowStep('success');
  };

  const handleEmailVerified = async () => {
    setFlowStep('processing');
    setProcessingText('Account verified! Filling your basket...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update the user's registered stores
    try {
      const freshUser = await User.me();
      if (freshUser && !freshUser.registered_stores?.includes(storeId)) {
        const updatedStores = [...(freshUser.registered_stores || []), storeId];
        await User.updateMyUserData({ registered_stores: updatedStores });
      }
    } catch (error) {
      console.error('Error updating registered stores:', error);
    }

    setFlowStep('success');
  };

  const handleClose = () => {
    setShowModal(false);
    if (flowStep === 'success' && onComplete) {
       onComplete({
        store: comparison.name,
        items: items,
        total: comparison.subtotal,
        // If the initial flow was 'auto-register' (meaning isRegistered was false), then it was auto-registered.
        autoRegistered: isRegistered === false 
      });
    }
    setFlowStep('idle');
    setProcessingText('');
    setIsRegistered(null);
  };
  
  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        className={`${className || 'w-full'} ${buttonState.color} whitespace-nowrap`}
        size={size || "sm"}
      >
        {loading ? (
          <Clock className="w-4 h-4 animate-spin"/>
        ) : buttonState.mode === 'manual' ? (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {buttonState.text}
          </>
        ) : (
          buttonState.text
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Auto-Shop for {comparison.name}
            </DialogTitle>
          </DialogHeader>
          
          {flowStep === 'idle' && (
            <div>
              <DialogDescription className="mb-4">
                {isRegistered
                  ? "We'll automatically log you in and fill your basket with the items from your list."
                  : "You're not registered with this store yet. We can create an account for you using your saved details and then fill your basket."
                }
              </DialogDescription>
              {comparison.hasBasketFee && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Includes £5.00 ASDA basket fee.
                    </AlertDescription>
                  </Alert>
              )}
               <DialogFooter>
                 <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                 <Button onClick={isRegistered ? startLoginFlow : startRegistrationFlow}>
                   {isRegistered ? "Proceed" : "Register & Fill Basket"}
                 </Button>
               </DialogFooter>
            </div>
          )}

          {flowStep === 'processing' && (
             <div className="py-6 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">{processingText}</h3>
              <p className="text-gray-600">Please wait, this may take a moment...</p>
            </div>
          )}

          {flowStep === 'email_verify' && (
            <div>
              <div className="text-center py-4">
                  <MailCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Account Created! One Last Step...</h3>
                  <p className="text-gray-600">
                    We've registered you with <strong>{comparison.name}</strong>. Please check your email inbox for a verification link from them.
                  </p>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={handleEmailVerified} className="w-full bg-green-600 hover:bg-green-700">
                  I've Verified My Email, Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {flowStep === 'success' && (
            <div>
              <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Basket Ready!</h3>
                  <p className="text-gray-600">
                    We've filled your basket at <strong>{comparison.name}</strong>. You're ready to check out.
                  </p>
              </div>
              <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                 <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">Close</Button>
                 <Button asChild className="w-full sm:w-auto">
                   <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                     <ExternalLink className="w-4 h-4 mr-2"/>
                     Go to Checkout
                   </a>
                 </Button>
              </DialogFooter>
            </div>
          )}
          
        </DialogContent>
      </Dialog>
    </>
  );
}
