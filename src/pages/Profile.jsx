
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User as UserIcon,
  Crown,
  CheckCircle,
  Link as LinkIcon,
  CreditCard,
  Star,
  Zap,
  UtensilsCrossed,
  Sparkles,
  Info,
  ExternalLink,
  Smartphone,
  BookMarked,
  Eye,
  EyeOff,
  Receipt,
  CheckCircle2,
  RefreshCw,
  Unlink,
  MoreVertical,
  Link2,
  Settings,
  X,
  ShoppingCart,
  Loader2,
  Volume2,
  Lightbulb,
  Play,
  Pause,
  Copy, // Added
  Gift, // Added
  Users // Added
} from "lucide-react";
import UpgradeSubscriptionModal from "@/components/UpgradeSubscriptionModal";
import { Link } from "react-router-dom";
import FoodClient from "@/components/services/FoodClient";
import DataClient from "@/components/services/DataClient";
import { PaymentHistory } from "@/api/entities";
import { generateSpeech } from "@/api/functions";
import { toast } from "sonner"; // Added
import QRCode from "react-qr-code"; // Added

import HeadlessLoginModal from '@/components/HeadlessLoginModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AutoRegistrationSetup from '@/components/AutoRegistrationSetup';
import PushNotificationManager from '@/components/PushNotificationManager';

// Centralize API Configuration for image assets
const API_BASE_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/";

// Helper function to create page URLs
const createPageUrl = (pageName) => {
  // This is a placeholder. In a real app, this would use
  // a routing system's `generatePath` or similar, or be part of a centralized route config.
  // For this example, we'll convert the page name to a lowercase path.
  return `/${pageName.toLowerCase()}`;
};

const supermarketsArray = [
  {
    name: "Tesco",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png"
  },
  {
    name: "ASDA",
    logo: `${API_BASE_IMAGE_URL}b91670333_image.png`
  },
  {
    name: "Sainsbury's",
    logo: `${API_BASE_IMAGE_URL}10fb1e1cb_image.png`
  },
  {
    name: "Morrisons",
    logo: `${API_BASE_IMAGE_URL}85bf5ae51_image.png`
  },
  {
    name: "Aldi",
    logo: `${API_BASE_IMAGE_URL}2007112e1_image.png`
  },
  {
    name: "Lidl",
    logo: `${API_BASE_IMAGE_URL}9a5bac9cb_image.png`
  },
  {
    name: "Co-op",
    logo: `${API_BASE_IMAGE_URL}bb1f8329b_image.png`
  },
  {
    name: "Waitrose",
    logo: `${API_BASE_IMAGE_URL}5b3ae72b5_image.png`
  },
  {
    name: "Iceland",
    logo: `${API_BASE_IMAGE_URL}0c3344c55_image.png`
  },
  {
    name: "Ocado",
    logo: `${API_BASE_IMAGE_URL}ae15bfc78_image.png`
  }
];

// Create a map for easy logo lookup by name, used by HeadlessLoginModal
const supermarketLogos = supermarketsArray.reduce((acc, market) => {
  acc[market.name] = market.logo;
  return acc;
}, {});

const deliveryServices = [
  {
    name: 'Uber Eats',
    logo: `${API_BASE_IMAGE_URL}dd90136a7_image.png`
  },
  {
    name: 'Just Eat',
    logo: `${API_BASE_IMAGE_URL}6d1b0ead6_image.png`
  },
  {
    name: 'Deliveroo',
    logo: `${API_BASE_IMAGE_URL}234d89b82_image.png`
  },
];

// Simplified voice options
const googleVoiceOptions = [
  {
    id: 'en-US-Journey-F',
    name: 'Emma (US)',
    languageCode: 'en-US',
    sampleText: 'Hello, I can help you find the best deals for your shopping list.'
  },
  {
    id: 'en-US-Journey-D',
    name: 'Ryan (US)',
    languageCode: 'en-US',
    sampleText: 'Hi, I\'m here to assist with your grocery comparisons and meal planning.'
  },
  {
    id: 'en-GB-Journey-F',
    name: 'Aria (UK)',
    languageCode: 'en-GB',
    sampleText: 'Hello, I can help you find the best deals for your shopping list.'
  },
  {
    id: 'en-GB-Journey-D',
    name: 'Andrew (UK)',
    languageCode: 'en-GB',
    sampleText: 'Hi, I\'m here to assist with your grocery comparisons and meal planning.'
  },
  {
    id: 'en-US-Studio-O',
    name: 'Olivia (US)',
    languageCode: 'en-US',
    sampleText: 'Hello, I can help you find the best deals for your shopping list.'
  },
  {
    id: 'en-US-Studio-Q',
    name: 'Quinn (US)',
    languageCode: 'en-US',
    sampleText: 'Hi, I\'m here to assist with your grocery comparisons and meal planning.'
  }
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectedDelivery, setConnectedDelivery] = useState({});
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', confirmAction: null });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [foodAccountStatus, setFoodAccountStatus] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [platformFor2FA, setPlatformFor2FA] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationCredentials, setValidationCredentials] = useState({ email: '', password: '' });
  const [foodAccountError, setFoodAccountError] = useState(null);
  const [supermarketConnectionError, setSupermarketConnectionError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // New state for voice preview
  const [playingVoice, setPlayingVoice] = useState(null);
  const audioRef = useRef(null);

  // New states for HHL system
  const [showHeadlessLogin, setShowHeadlessLogin] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New states for Auto-Registration Service
  const [showAutoRegModal, setShowAutoRegModal] = useState(false);
  const [isProcessingAddon, setIsProcessingAddon] = useState(false);

  // New state for auto_registration_password decoding
  const [decodedPassword, setDecodedPassword] = useState("••••••••");

  useEffect(() => {
    loadUserData();
    fetchFoodAccountStatus();
    loadConnectionStatuses();
    loadPaymentHistory();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null; // Clear ref
      }
      // No need to cancel speechSynthesis anymore
    };
  }, []);

  const loadConnectionStatuses = async () => {
    try {
        setSupermarketConnectionError(null);
        setLoadingConnections(true);

        const statuses = await DataClient.getConnectionStatuses();
        setConnectionStatuses(statuses);
    } catch (error) {
        console.error("Failed to load connection statuses:", error);
        setSupermarketConnectionError(error.message);
        setConnectionStatuses({}); // Clear on error
    } finally {
        setLoadingConnections(false);
    }
  };

  const fetchFoodAccountStatus = async () => {
    try {
      setFoodAccountError(null); // Clear previous errors
      const status = await FoodClient.getPlatformStatus();
      setFoodAccountStatus(status.accounts || []); // Ensure it's always an array
    } catch (error) {
      console.error("Error fetching food account status:", error);
      setFoodAccountStatus([]); // Set to empty array on error
      setFoodAccountError(error.message);
    }
  };

  const startPollingStatus = (platform) => {
    if (isPolling) return;
    setIsPolling(true);

    const interval = setInterval(async () => {
      try {
        const statusData = await FoodClient.getPlatformStatus();
        const accounts = statusData.accounts || []; // Ensure accounts is always an array
        setFoodAccountStatus(accounts);
        const activeAccount = accounts.find(a => a.platform === platform);

        if (activeAccount && (activeAccount.status === 'connected' || activeAccount.status === 'error' || activeAccount.status === '2fa_required')) {
          clearInterval(interval);
          setIsPolling(false);
          setShowConnectModal(false); // Close the initial connect modal
          setValidationCredentials({ email: '', password: '' }); // Clear credentials

          if (activeAccount.status === '2fa_required') {
            setShow2FAModal(true);
            setPlatformFor2FA(activeAccount.platform); // Ensure platformFor2FA is set for the 2FA modal
          } else if (activeAccount.status === 'connected') {
            setModalContent({
              title: "Connection Successful",
              description: `${activeAccount.platform} has been successfully linked to your MyShopRun account.`
            });
            setShowInfoModal(true);
            // Re-fetch user data to update any `connected_delivery_services` if backend supports this, or rely on foodAccountStatus
            loadUserData();
          } else if (activeAccount.status === 'error') {
            setModalContent({
              title: "Connection Failed",
              description: `Could not connect to ${activeAccount.platform}: ${activeAccount.last_error || "Unknown error."}. Please try again.`
            });
            setShowInfoModal(true);
          }
        }
      } catch (error) {
        console.error("Error during polling:", error);
        clearInterval(interval);
        setIsPolling(false);
        setModalContent({
          title: "Connection Error",
          description: "An error occurred while checking connection status. Please try again."
        });
        setShowInfoModal(true);
      }
    }, 3000); // Poll every 3 seconds
  };

  const loadUserData = async () => {
    try {
      let currentUser = await User.me(); // Use let to allow re-assignment if referral code is generated

      // Generate referral code if it doesn't exist
      if (currentUser && !currentUser.referral_code) {
          const code = `msr-${currentUser.id.substring(0, 8)}`;
          await User.updateMyUserData({ referral_code: code });
          // Re-fetch user to get the updated data
          currentUser = await User.me(); // Update currentUser after saving
      }
      
      setUser(currentUser); // Set user state with the latest data

      // Ensure connected_delivery_services is always an array
      const initialDeliveryConnections = (currentUser.connected_delivery_services || []).reduce((acc, serviceName) => {
        acc[serviceName] = true;
        return acc;
      }, {});
      setConnectedDelivery(initialDeliveryConnections);

      // Handle auto_registration_password decoding
      if (currentUser.auto_registration_password) {
        try {
          const decoded = atob(currentUser.auto_registration_password);
          setDecodedPassword(decoded);
        } catch(e) {
          console.error("Failed to decode password:", e);
          setDecodedPassword("••••••••");
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoading(false);
  };

  const loadPaymentHistory = async () => {
    try {
      const history = await PaymentHistory.list('-payment_date');
      setPaymentHistory(history || []); // Ensure it's always an array
    } catch (error) {
      console.error("Failed to load payment history:", error);
      setPaymentHistory([]); // Set to empty array on error
    }
  };

  // This handleConnectClick is now exclusively for delivery services, supermarkets use HHL.
  const handleConnectDeliveryClick = (service) => {
    setSelectedService(service);
    setPlatformFor2FA(service.name); // Set the platform for potential 2FA
    // setSelectedMarket(null); // Ensure selectedMarket is null (this state is not used in this function scope)
    setValidationCredentials({ email: '', password: '' }); // Reset credentials for new connection attempt
    setShowConnectModal(true);
  };

  // This is specifically for delivery services, not supermarkets.
  const handleConfirmConnectDelivery = async (serviceName, username, password) => {
    try {
      await FoodClient.connectPlatform(serviceName, { username, password });
      setShowConnectModal(false); // Close the connect modal immediately
      setValidationCredentials({ email: '', password: '' }); // Clear credentials on successful initiation
      setModalContent({
        title: "Connection Initiated",
        description: `Starting connection process for ${serviceName}. Please wait...`
      });
      setShowInfoModal(true);
      startPollingStatus(serviceName); // Start polling for status updates
    } catch (error) {
      console.error("Failed to initiate connection with FoodClient", error);
      setModalContent({
        title: "Connection Failed",
        description: `Could not initiate connection with ${serviceName}: ${error.message}. Please try again.`
      });
      setShowInfoModal(true);
    }
  };

  const handleDisconnectDelivery = async (serviceName) => {
    if (!confirm(`Are you sure you want to disconnect ${serviceName}? This will stop future order imports and comparisons.`)) {
      return;
    }
    try {
      await FoodClient.disconnectPlatform(serviceName);
      await fetchFoodAccountStatus(); // Refresh status after disconnect
      setModalContent({
        title: "Disconnected Successfully",
        description: `${serviceName} has been disconnected from your MyShopRun account.`
      });
      setShowInfoModal(true);
    } catch (error) {
      console.error("Failed to disconnect delivery service", error);
      setModalContent({
        title: "Disconnect Failed",
        description: `Could not disconnect ${serviceName}: ${error.message}. Please try again.`
      });
      setShowInfoModal(true);
    }
  };

  const handle2FASubmit = async () => {
    try {
      await FoodClient.submit2FA(platformFor2FA, twoFaCode);
      setShow2FAModal(false);
      setTwoFaCode('');
      setModalContent({
        title: "2FA Submitted",
        description: `2FA code for ${platformFor2FA} submitted. Checking status...`
      });
      setShowInfoModal(true);
      startPollingStatus(platformFor2FA);
    } catch (error) {
      console.error("Failed to submit 2FA code:", error);
      setModalContent({
        title: "2FA Submission Failed",
        description: `Failed to submit 2FA code: ${error.message}. Please try again.`
      });
      setShowInfoModal(true);
    }
  };

  const handleUpgradeSubscription = () => {
    setShowUpgradeModal(true);
  };

  const handleActivateAddon = async () => {
    // Open the upgrade modal which handles the payment flow
    setShowUpgradeModal(true);
  };

  const handleDeactivateAddon = async () => {
    // Show confirmation modal instead of browser popup
    setModalContent({
      title: "Deactivate Food Delivery Add-on?",
      description: "Are you sure you want to deactivate the Food Delivery Saver add-on? You will lose access to delivery comparisons at the end of your current billing period.",
      confirmAction: () => confirmDeactivateAddon() // Pass the action to the modal
    });
    setShowInfoModal(true);
  };

  const confirmDeactivateAddon = async () => {
    setIsProcessingAddon(true);
    try {
      await User.updateMyUserData({ has_food_delivery_addon: false });
      setUser(prev => ({ ...prev, has_food_delivery_addon: false }));
      setModalContent({
        title: "Add-on Deactivated",
        description: "The Food Delivery Saver add-on has been successfully deactivated. You will retain access until your next billing date.",
        confirmAction: null // Clear confirmAction so it shows "OK" button
      });
      setShowInfoModal(true);
    } catch (error) {
      console.error("Failed to deactivate add-on:", error);
      setModalContent({
        title: "Error",
        description: "Could not deactivate the add-on. Please try again.",
        confirmAction: null // Clear confirmAction so it shows "OK" button
      });
      setShowInfoModal(true);
    } finally {
      setIsProcessingAddon(false);
    }
  };

  // New HHL System functions
  const handleConnectAccount = (storeName) => {
    setSelectedStore(storeName);
    setShowHeadlessLogin(true);
  };

  const handleHeadlessLoginSuccess = async () => {
    console.log('Profile: Successfully connected store:', selectedStore);

    if (user && selectedStore) {
        const currentConnected = user.connected_supermarkets || [];

        // Add the store if not already connected
        if (!currentConnected.includes(selectedStore)) {
            const newConnectedStores = [...currentConnected, selectedStore];

            await User.updateMyUserData({ connected_supermarkets: newConnectedStores });

            // CRITICAL: Update local user state immediately
            setUser(prevUser => ({
                ...prevUser,
                connected_supermarkets: newConnectedStores
            }));
        }
    }

    // Reload connection statuses after successful login
    await loadConnectionStatuses();

    setShowHeadlessLogin(false);
    setSelectedStore(null);
    setModalContent({
      title: "Connection Successful",
      description: `${selectedStore} has been successfully connected to your MyShopRun account!`
    });
    setShowInfoModal(true);
  };

  const handleDisconnectAccount = async (storeName) => {
    if (!confirm(`Are you sure you want to disconnect ${storeName}? You'll need to reconnect to import orders from this store.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await DataClient.deleteCredentials(storeName);

      if (user) {
          const currentConnected = user.connected_supermarkets || [];
          const newConnectedStores = currentConnected.filter(s => s !== storeName);

          await User.updateMyUserData({ connected_supermarkets: newConnectedStores });

          // CRITICAL: Update local user state immediately
          setUser(prevUser => ({
              ...prevUser,
              connected_supermarkets: newConnectedStores
          }));
      }

      // Refresh connection statuses
      await loadConnectionStatuses();

      setModalContent({
        title: "Disconnected Successfully",
        description: `${storeName} account has been disconnected from your MyShopRun account.`
      });
      setShowInfoModal(true);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      setModalContent({
        title: "Error",
        description: "Failed to disconnect account. Please try again."
      });
      setShowInfoModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // New Auto-Registration functions
  const handleAutoRegModalComplete = async () => {
    setShowAutoRegModal(false);
    await loadUserData(); // Reload user data to reflect new auto-registration status
    setModalContent({
      title: "Auto-Registration Setup Complete",
      description: "Your auto-registration service has been successfully set up!"
    });
    setShowInfoModal(true);
  };

  const handleDisableAutoReg = async () => {
    if (!confirm("Are you sure you want to disable the Auto Store Registration Service? You will need to manually register for new stores.")) {
      return;
    }
    try {
      await User.updateMyUserData({ auto_registration_enabled: false });
      await loadUserData(); // Refresh user data
      setModalContent({
        title: "Service Disabled",
        description: "Auto Store Registration Service has been successfully disabled."
      });
      setShowInfoModal(true);
    } catch (error) {
      console.error("Failed to disable auto-registration:", error);
      setModalContent({
        title: "Error",
        description: `Failed to disable auto-registration: ${error.message}. Please try again.`
      });
      setShowInfoModal(true);
    }
  };

  // Function to handle changes in user fields (like preferred_voice)
  const handleFieldChange = async (field, value) => {
    // Optimistic UI update
    setUser(prevUser => ({
      ...prevUser,
      [field]: value
    }));

    try {
      await User.updateMyUserData({ [field]: value });
      // Optionally show a success message
      // setModalContent({
      //   title: "Setting Saved",
      //   description: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} updated successfully.`
      // });
      // setShowInfoModal(true);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      // Revert UI on error
      loadUserData();
      setModalContent({
        title: "Error Saving Setting",
        description: `Failed to update ${field}: ${error.message}. Please try again.`
      });
      setShowInfoModal(true);
    }
  };

  // REPLACED: New function to play voice samples using Google TTS
  const handlePreviewVoice = async (voiceId, voiceConfig) => {
    // If this voice is already playing, stop it.
    if (playingVoice === voiceId && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null; // Clear ref
    }

    setPlayingVoice(voiceId); // Set status to loading

    try {
      const response = await generateSpeech({
        text: voiceConfig.sampleText,
        voiceName: voiceConfig.id,
        languageCode: voiceConfig.languageCode
      });

      if (response.data.audioContent) {
        const audioSrc = `data:audio/mp3;base64,${response.data.audioContent}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.play();

        audio.onended = () => {
          setPlayingVoice(null);
        };
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error("Failed to generate voice preview:", error);
      setModalContent({
        title: "Voice Error",
        description: "Could not generate voice preview. Please try again."
      });
      setShowInfoModal(true);
      setPlayingVoice(null); // Reset on error
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">Could not load user data.</div>;
  }

  const referralLink = user?.referral_code ? `${window.location.origin}?ref=${user.referral_code}` : '';

  const getSubscriptionBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Premium Subscriber</Badge>;
      case 'free_trial': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Free Trial</Badge>;
      default: return <Badge variant="destructive">Expired</Badge>;
    }
  };

  return (
    <div className="bg-white">
      <UpgradeSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          loadUserData();
        }}
      />

      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              {modalContent.title}
            </DialogTitle>
            <DialogDescription className="pt-4">{modalContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {modalContent.confirmAction ? (
              <>
                <Button variant="outline" onClick={() => setShowInfoModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    modalContent.confirmAction();
                    setShowInfoModal(false); // Close modal after action is initiated
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Deactivate
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowInfoModal(false)}>OK</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Connect Modal (Now only for delivery services, previously handled supermarkets too) */}
      {(selectedService) && (
        <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedService?.logo} alt={selectedService?.name} className="h-10 w-auto object-contain" />
                <DialogTitle>Connect to {selectedService?.name}</DialogTitle>
              </div>
              <DialogDescription>
                  Connect your {selectedService.name} account to sync order history.
                  <p className="text-xs text-gray-500 mt-2">
                   <span className="font-bold">Privacy:</span> We only store encrypted session tokens, never your password. You can revoke access at any time.
                  </p>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="email">Email / Username</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your account login email"
                  value={validationCredentials.email}
                  onChange={(e) => setValidationCredentials(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isValidating}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your account password"
                    value={validationCredentials.password}
                    onChange={(e) => setValidationCredentials(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isValidating}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {isValidating && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center text-blue-800">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                    Securely logging in with browser automation... This may take a moment.
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConnectModal(false);
                  setValidationCredentials({ email: '', password: '' });
                }}
                disabled={isValidating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirmConnectDelivery(selectedService.name, validationCredentials.email, validationCredentials.password)}
                disabled={isValidating || !validationCredentials.email || !validationCredentials.password}
                className="bg-green-600 hover:bg-green-700"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 2FA Modal */}
      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication for {platformFor2FA}</DialogTitle>
            <DialogDescription>Please enter the code sent to your device to complete the connection.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., 123456"
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FAModal(false)}>Cancel</Button>
            <Button onClick={handle2FASubmit}>Submit Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Headless Login Modal */}
      <HeadlessLoginModal
        isOpen={showHeadlessLogin}
        onClose={() => {
          setShowHeadlessLogin(false);
          // setSelectedStore is managed by HeadlessLoginModal now, not cleared here.
        }}
        storeName={selectedStore} // Pass selectedStore directly from where handleConnectAccount is called
        storeLogoUrl={selectedStore ? supermarketLogos[selectedStore] : null}
        onSuccess={handleHeadlessLoginSuccess}
      />

      {/* Profile Header */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} alt={user.full_name} />
              <AvatarFallback className="text-3xl">{user.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="mt-2">
                {getSubscriptionBadge(user.subscription_status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Account Info, Auto-Registration, Subscription & Add-ons */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            
            {/* NEW: Referral System Card */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  MyShopRun Referral Program
                </CardTitle>
                <CardDescription>
                  Invite friends to earn rewards! When 10 friends sign up with your link and become paying subscribers, you get a free month.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="p-4 bg-white border rounded-lg">
                    <QRCode value={referralLink} size={128} />
                  </div>
                  <div className="flex-grow space-y-4">
                    <div>
                      <Label htmlFor="referral-link">Your Unique Referral Link</Label>
                      <div className="flex gap-2">
                        <Input id="referral-link" value={referralLink} readOnly />
                        <Button variant="outline" size="icon" onClick={() => handleCopy(referralLink)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600"><Users className="w-4 h-4" />Referral Points</CardTitle>
                            <p className="text-2xl font-bold mt-1">{user.referral_points || 0} / 10</p>
                        </Card>
                        <Card className="p-4">
                            <CardTitle className="text-sm font-medium text-gray-600">Reward</CardTitle>
                            <p className="text-lg font-semibold mt-2">1 Month Free</p>
                        </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Account Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <p className="text-gray-900 font-medium">{user?.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                    <p className="text-gray-900 font-medium">
                      {user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                    <Badge className={
                      user?.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                      user?.subscription_status === 'free_trial' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {user?.subscription_status === 'active' ? 'Premium Member' :
                       user?.subscription_status === 'free_trial' ? 'Free Trial' : 'Free Account'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Assistant Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>AI Voice</Label>
                  <p className="text-sm text-gray-500 mb-4">
                    Choose your preferred AI voice for the shopping assistant. Click the play button to hear a sample.
                  </p>

                  <RadioGroup
                    value={user?.preferred_voice || 'en-US-Studio-Q'} // Changed default to 'en-US-Studio-Q'
                    onValueChange={(value) => handleFieldChange('preferred_voice', value)}
                    className="space-y-2"
                  >
                    {googleVoiceOptions.map((voice) => (
                      <div key={voice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                           <RadioGroupItem value={voice.id} id={voice.id} />
                           <Label htmlFor={voice.id} className="font-normal cursor-pointer">{voice.name}</Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewVoice(voice.id, voice)}
                          className="w-8 h-8"
                          title="Play voice sample"
                          disabled={playingVoice && playingVoice !== voice.id}
                        >
                          {playingVoice === voice.id ? (
                            audioRef.current && !audioRef.current.paused ? <Pause className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Google Journey & Studio Voices:</strong> These voices use Google Cloud's most advanced text-to-speech for natural, human-like speech quality.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive alerts about your favorite products and account activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Push Notifications</h3>
                  <PushNotificationManager />
                </div>
              </CardContent>
            </Card>

            {/* Auto-Registration Service */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Auto Store Registration Service
                  {user?.auto_registration_enabled ? (
                    <Badge className="bg-green-100 text-green-800 ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2">Not Set Up</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Automatically register with stores and fill your basket when you choose the cheapest option.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.auto_registration_enabled ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Service Active</span>
                      </div>
                      <div className="text-sm text-green-800 space-y-1">
                        <p><strong>Address:</strong> {user.auto_registration_address}</p>
                        <p><strong>Postcode:</strong> {user.auto_registration_postcode}</p>
                        <p><strong>Phone:</strong> {user.auto_registration_phone}</p>
                        <p><strong>Registered Stores:</strong> {user.registered_stores?.length || 0} stores</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowAutoRegModal(true)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Update Settings
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDisableAutoReg}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disable Service
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Not Set Up Yet</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        Enable our auto-registration service to automatically sign up with stores and fill your basket when you find the best prices.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowAutoRegModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Set Up Auto-Registration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>Manage your subscription and add-ons.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Current Plan */}
                 <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 flex flex-col">
                   <div className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900">MyShopRun Premium</h3>
                      <p className="text-gray-600 text-sm mb-4">Full access to all grocery features.</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {['Unlimited price comparisons', 'Auto shopping list creation', 'Price drop alerts', 'Connected accounts'].map(feature => (
                          <li key={feature} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-teal-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                   </div>
                   <div className="mt-6">
                      <div className="text-3xl font-bold text-gray-900 mb-2">£1.99<span className="text-lg text-gray-500">/month</span></div>
                      {user.subscription_status !== 'active' ? (
                         <Button onClick={handleUpgradeSubscription} className="w-full bg-teal-600 hover:bg-teal-700">
                           <CreditCard className="w-4 h-4 mr-2" />
                           {user.subscription_status === 'free_trial' ? 'Upgrade to Premium' : 'Reactivate Subscription'}
                         </Button>
                      ) : (
                         <Button variant="outline" className="w-full" onClick={handleUpgradeSubscription}>
                           <ExternalLink className="w-4 h-4 mr-2" />
                           Manage Billing
                         </Button>
                      )}
                   </div>
                 </div>

                 {/* Add-on Plan */}
                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 flex flex-col">
                    <div className="flex-grow">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-2">Optional Add-on</Badge>
                      <h3 className="text-lg font-bold text-gray-900">Food Delivery Saver</h3>
                      <p className="text-gray-600 text-sm mb-4">Compare takeaway prices.</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {['Compare Uber Eats, Just Eat, etc.', 'Save on every takeaway order'].map(feature => (
                          <li key={feature} className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <div className="text-3xl font-bold text-gray-900 mb-2">+£0.99<span className="text-lg text-gray-500">/month</span></div>
                       {user.has_food_delivery_addon ? (
                         <Button
                           onClick={handleDeactivateAddon}
                           disabled={isProcessingAddon}
                           variant="outline"
                           className="w-full transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                         >
                           {isProcessingAddon ? (
                             <>
                               <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deactivating...
                             </>
                           ) : (
                             <>
                               <X className="w-4 h-4 mr-2" /> Deactivate Add-on
                             </>
                           )}
                         </Button>
                       ) : (
                         <Button
                           onClick={handleActivateAddon}
                           disabled={isProcessingAddon}
                           className="w-full bg-amber-600 hover:bg-amber-700"
                         >
                           {isProcessingAddon ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                              </>
                           ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" /> Activate Add-on
                              </>
                           )}
                         </Button>
                       )}
                    </div>
                 </div>
              </CardContent>
            </Card>

            {/* Billing History Card */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-700" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  Your past payments and upcoming charges. Next payment due on {user?.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'N/A'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {paymentHistory.map(payment => (
                       <li key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.plan_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">£{payment.amount_paid?.toFixed(2) || '0.00'}</p>
                          <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'} className={payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : ''}>
                            {payment.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No payment history found.</p>
                )}
              </CardContent>
            </Card>

            {/* Connected Delivery Apps Card */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  Connected Delivery Apps
                  <Badge className="bg-green-100 text-green-800 border-green-200">LIVE API</Badge>
                </CardTitle>
                <CardDescription>
                  Connect your accounts to import real order history for price comparison.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {foodAccountError && (
                  <Alert variant="destructive" className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Connection Issue</AlertTitle>
                    <AlertDescription>
                      {foodAccountError}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  {Array.isArray(deliveryServices) ? deliveryServices.map((service) => {
                    const statusInfo = Array.isArray(foodAccountStatus) ? foodAccountStatus.find(s => s.platform === service.name) : null;
                    const status = statusInfo?.status || statusInfo?.connected ? 'connected' : 'not_connected';

                    return (
                    <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center p-2">
                          <img
                            src={service.logo}
                            alt={service.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = `https://via.placeholder.com/48x48/f3f4f6/6b7280?text=${service.name.charAt(0)}`;
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-medium text-lg">{service.name}</span>
                          <div className="text-xs text-gray-500">Real-time integration</div>
                        </div>
                      </div>

                      {status === 'connected' || statusInfo?.connected ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleDisconnectDelivery(service.name)}
                            className="text-red-600 hover:text-red-700 h-auto p-0 text-xs"
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : status === 'pending' || (isPolling && selectedService?.name === service.name) ? (
                         <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">Connecting...</Badge>
                      ) : status === '2fa_required' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPlatformFor2FA(service.name);
                            setShow2FAModal(true);
                          }}
                          className="hover:bg-yellow-50 border-yellow-300"
                        >
                          Enter 2FA Code
                        </Button>
                      ) : status === 'error' ? (
                        <div className="text-right">
                          <Badge variant="destructive">Connection Error</Badge>
                          <p className="text-xs text-red-600 max-w-32">{statusInfo?.last_error}</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleConnectDeliveryClick(service)}
                            className="h-auto p-0 text-xs text-blue-600"
                          >
                            Retry Connection
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectDeliveryClick(service)}
                          className="hover:bg-orange-50 border-orange-300"
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  )}
                  ) : null}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Production API Active</span> - All connections use encrypted storage and real-time data sync.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Connected Accounts & Tools */}
          <div className="lg:col-span-1 space-y-8">
            {/* Connected Supermarkets Section */}
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <Link2 className="w-6 h-6 text-teal-600" />
                  Connected Supermarkets
                </CardTitle>
                <CardDescription>
                  Connect your supermarket accounts to enable automatic price comparisons and shopping history imports.
                  We use bank-level encryption to keep your credentials secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingConnections ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading connection status...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.isArray(supermarketsArray) ? supermarketsArray.map((market) => {
                      const marketSlug = market.name.toLowerCase();
                      const isConnected = connectionStatuses[marketSlug]?.credentialsValidated;

                      return (
                        <div key={market.name} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <img src={market.logo} alt={market.name} className="h-10 w-auto object-contain" />
                            <div>
                              <p className="font-medium">{market.name}</p>
                              <p className="text-sm text-gray-500">
                                {isConnected ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Connected
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Not connected</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isConnected ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={isProcessing}>
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleConnectAccount(market.name)}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reconnect
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDisconnectAccount(market.name)} className="text-red-600">
                                    <Unlink className="w-4 h-4 mr-2" />
                                    Disconnect
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => handleConnectAccount(market.name)}
                                disabled={isProcessing}
                              >
                                <Link2 className="w-4 h-4 mr-1" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    }) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* New Mobile Tools Card */}
            <Card className="shadow-none border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  Mobile Shopping Tools
                </CardTitle>
                <CardDescription>
                  Set up tools for a seamless shopping experience on your phone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={createPageUrl("BookmarkletSetup")}>
                  <Button variant="outline" className="w-full">
                    <BookMarked className="w-4 h-4 mr-2" />
                    Setup Mobile Bookmarklet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Auto-Registration Setup Modal */}
        {showAutoRegModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Auto Store Registration Setup</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAutoRegModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                <AutoRegistrationSetup
                  onComplete={handleAutoRegModalComplete}
                  onSkip={() => setShowAutoRegModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
