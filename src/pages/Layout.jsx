

import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@/api/entities";
import { FavoriteItem } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ContactModal from "@/components/ContactModal";
import CookieConsent from "@/components/CookieConsent";
import AddToHomeScreenPrompt from "@/components/AddToHomeScreenPrompt";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { PushNotificationManager } from '@/components/PushNotificationManager';
import UpgradeSubscriptionModal from '@/components/UpgradeSubscriptionModal';
import AccountConnectionModal from '@/components/AccountConnectionModal'; // Added import for AccountConnectionModal
import { sendWelcomeEmail } from '@/api/functions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  ShoppingCart,
  BarChart3,
  User as UserIcon,
  Settings,
  Heart,
  UtensilsCrossed,
  MessageCircle,
  Users,
  Bell,
  BellRing,
  ClipboardList,
  Shield,
  Home,
  PoundSterling,
  Code,
  ChevronDown,
  Smartphone,
  Package,
  Tag,
  TrendingUp,
  Zap,
  Mic,
  Calculator,
  BookOpen,
  Sprout,
  ScanLine,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";

const getBaseUrl = () => {
  if (window.location.hostname === 'myshoprun.app') {
    return 'https://myshoprun.app';
  }
  return window.location.origin;
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [alertItems, setAlertItems] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');
  // Removed socialLinks state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [apiCallsCache, setApiCallsCache] = useState({});
  const [lastApiCall, setLastApiCall] = useState(0);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false); // Added state
  const [showAccountModal, setShowAccountModal] = useState(false); // Added state

  // Define public pages and isPublicPage
  const publicPages = ["Home", "Pricing", "AdminLogin", "SuperAdmin", "PrivacyPolicy", "TermsAndConditions", "BrowserExtensionHandoff", "ExtensionApiSpec", "PaymentSuccess", "PaymentCancelled"];
  const isHomePage = currentPageName === "Home";
  const isPublicPage = publicPages.includes(currentPageName);

  // Use a ref to hold the current apiCallsCache to prevent stale closures without triggering useCallback re-creation
  const apiCallsCacheRef = useRef({});

  // Sync the ref with the state whenever apiCallsCache state changes
  useEffect(() => {
    apiCallsCacheRef.current = apiCallsCache;
  }, [apiCallsCache]);

  // Enhanced error handling with retry logic
  const withRetry = async (apiCall, retries = 2, delay = 2000) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 429 && i < retries) {
          console.log(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    const elementsToRemove = document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon'], link[rel='shortcut icon'], link[rel='manifest']");
    elementsToRemove.forEach(el => {
      try {
        if (el && el.remove) {
          el.remove();
        }
      } catch (error) {
        console.warn('Could not remove element:', error);
      }
    });

    const metaElementsToRemove = document.querySelectorAll("meta[name='apple-mobile-web-app-title']");
    metaElementsToRemove.forEach(el => {
      try {
        if (el && el.remove) {
          el.remove();
        }
      } catch (error) {
        console.warn('Could not remove meta element:', error);
      }
    });

    const head = document.head;
    const cleanupElements = [];
    const newIconUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png";

    const favicons = [
        { rel: 'apple-touch-icon', sizes: '180x180', href: newIconUrl },
        { rel: 'icon', type: 'image/png', href: newIconUrl },
    ];

    favicons.forEach(fav => {
        const link = document.createElement('link');
        link.rel = fav.rel;
        if (fav.type) link.type = fav.type;
        if (fav.sizes) link.sizes = fav.sizes;
        link.href = fav.href;
        head.appendChild(link);
        cleanupElements.push(link);
    });

    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-title';
    meta.content = 'MyShopRun';
    head.appendChild(meta);
    cleanupElements.push(meta);

    const manifest = {
      "name": "MyShopRun",
      "short_name": "MyShopRun",
      "icons": [
        {
          "src": newIconUrl,
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": newIconUrl,
          "sizes": "512x512",
          "type": "image/png"
        }
      ],
      "theme_color": "#0d9488",
      "background_color": "#ffffff",
      "start_url": "/",
      "display": "standalone",
      "scope": "/"
    };

    const manifestString = JSON.stringify(manifest);
    const manifestBlob = new Blob([manifestString], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestUrl;
    head.appendChild(manifestLink);
    cleanupElements.push(manifestLink);

    return () => {
        cleanupElements.forEach(el => {
          try {
            if (el && el.remove) {
              el.remove();
            }
          } catch (error) {
            console.warn('Could not remove cleanup element:', error);
          }
        });
        try {
          URL.revokeObjectURL(manifestUrl);
        } catch (error) {
          console.warn('Could not revoke blob URL:', error);
        }
    };
  }, []);

  const checkUser = useCallback(async () => {
    try {
      // Check cache first using the ref
      const cacheKey = 'currentUser';
      const cachedData = apiCallsCacheRef.current[cacheKey];
      if (cachedData && Date.now() - cachedData.timestamp < 30 * 1000) { // 30 second cache
        setUser(cachedData.data);
        window.user = cachedData.data;
        return;
      }

      let currentUser = await withRetry(async () => {
        return await User.me();
      });

      // Capture referral code from URL on first load for a new user session
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode && !sessionStorage.getItem('referral_code_captured')) {
          sessionStorage.setItem('referral_code', refCode);
          sessionStorage.setItem('referral_code_captured', 'true');
      }

      if (currentUser && (!currentUser.subscription_status || currentUser.subscription_status === 'free')) {
        console.log("Setting up free trial for new user");
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        const startDate = new Date();

        const updatedUserData = {
            subscription_status: 'free_trial',
            trial_end_date: trialEndDate.toISOString().split('T')[0],
            subscription_start_date: startDate.toISOString().split('T')[0]
        };

        // Add referral code if it exists in session storage
        const storedRefCode = sessionStorage.getItem('referral_code');
        if (storedRefCode && !currentUser.referred_by) {
            updatedUserData.referred_by = storedRefCode;
        }

        await User.updateMyUserData(updatedUserData);
        
        try {
          await sendWelcomeEmail({
            userEmail: currentUser.email,
            userName: currentUser.full_name
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        const refreshedUser = await User.me();
        setUser(refreshedUser);
        window.user = refreshedUser;
        currentUser = refreshedUser;
      } else {
        setUser(currentUser);
        window.user = currentUser;
      }

      // Cache the result using functional update
      setApiCallsCache(prev => ({
        ...prev,
        [cacheKey]: { data: currentUser, timestamp: Date.now() }
      }));

    } catch (error) {
      // Only log errors that aren't expected 401s for public pages
      if (!isPublicPage || error.response?.status !== 401) {
        console.error('Error checking user:', error);
      }
      
      if (
        !isPublicPage &&
        !currentPageName.startsWith("PaymentSuccess") &&
        !currentPageName.startsWith("PaymentCancelled")
      ) {
        const redirectUrl = `${getBaseUrl()}${window.location.pathname}${window.location.search}`;
        await User.loginWithRedirect(redirectUrl);
      }
    }
    setLoading(false);
  }, [isPublicPage, currentPageName]);

  const handleMarkAsRead = () => {
    if (!user) return;
    const storageKey = `lastNotificationCheck_${user.email}`;
    localStorage.setItem(storageKey, new Date().toISOString());

    // Update state for immediate feedback
    setHasUnread(false);
    setActiveAlerts(0);
    setAlertItems([]);
    setNotificationsOpen(false);
  };

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    const cacheKey = `alerts_raw_favorites_${user.email}`;
    const cachedData = apiCallsCacheRef.current[cacheKey];
    let favorites;

    if (cachedData && Date.now() - cachedData.timestamp < 2 * 60 * 1000) { // 2 minute cache for raw data
      favorites = cachedData.data;
    } else {
      favorites = await withRetry(async () => {
        return await FavoriteItem.list('-updated_date', 50); // Fetch by most recently updated, get more items
      });
      setApiCallsCache(prev => ({
        ...prev,
        [cacheKey]: { data: favorites, timestamp: Date.now() }
      }));
    }

    // Process the fetched/cached favorites list
    const storageKey = `lastNotificationCheck_${user.email}`;
    const lastCheckTimestamp = localStorage.getItem(storageKey);
    let lastCheckDate = lastCheckTimestamp ? new Date(lastCheckTimestamp) : null;

    let potentialAlerts = favorites.filter(item => 
      item.current_best_price && 
      item.target_price && 
      item.current_best_price <= item.target_price
    );

    // Filter out alerts generated before the last check
    if (lastCheckDate) {
      potentialAlerts = potentialAlerts.filter(item => 
        new Date(item.updated_date) > lastCheckDate
      );
    }
    
    const finalAlerts = potentialAlerts;
    
    setAlertItems(finalAlerts);
    setActiveAlerts(finalAlerts.length);
    setHasUnread(finalAlerts.length > 0);

  }, [user]);

  // Removed loadSocialLinks function

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    console.log('[layout.js] MyShopRun: Pinging for browser extension...');
    
    const timeout = setTimeout(() => {
      window.postMessage({ type: 'SHOP_APP_HELLO' }, '*');
    }, 1000);

    const handleExtensionMessage = (event) => {
      if (event.source === window && event.data?.type === 'SHOP_EXTENSION_HELLO') {
        console.log("MyShopRun: Browser extension detected.");
        setExtensionAvailable(true);
      }
    };
    
    window.addEventListener('message', handleExtensionMessage);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, []);

  // Single useEffect for all API calls with proper sequencing
  // Also force refresh on initial load
  useEffect(() => {
    const initializeApp = async () => {
      await checkUser();
    };
    initializeApp();
  }, [checkUser]);

  // Load alerts separately when user object is available
  useEffect(() => {
    if(user) {
      loadAlerts();
    }
  }, [user, loadAlerts]);

  // Check if we should show the account connection modal for new users
  useEffect(() => {
    if (user && user.subscription_status === 'free_trial') {
      // Check if user has seen the account modal before
      const hasSeenModal = localStorage.getItem(`account_modal_seen_${user.email}`);
      if (!hasSeenModal) {
        setIsAccountModalOpen(true);
      }
    }
  }, [user]);

  const handleAccountModalClose = () => {
    setIsAccountModalOpen(false);
    if (user) {
      localStorage.setItem(`account_modal_seen_${user.email}`, 'true');
    }
  };

  const handleAccountModalSkip = () => {
    setIsAccountModalOpen(false);
    if (user) {
      localStorage.setItem(`account_modal_seen_${user.email}`, 'true');
    }
  };

  // Removed useEffect for page change and loadSocialLinks

  const handleLogin = async () => {
    await User.loginWithRedirect(`${getBaseUrl()}${createPageUrl('Dashboard')}`);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    window.user = null;
    navigate(createPageUrl("Home"));
  };

  const handlePremiumClick = (featureName) => {
    setSelectedFeature(featureName);
    setIsUpgradeModalOpen(true);
  };

  const handleGetStarted = async () => {
    await User.loginWithRedirect(`${getBaseUrl()}${createPageUrl('Dashboard')}`);
  };

  const dashboardLinks = [
    { name: "Dashboard", href: createPageUrl("Dashboard"), icon: Home },
    { name: "Lists", href: createPageUrl("ShoppingLists"), icon: ShoppingCart },
    { name: "Discounts", href: createPageUrl("CouponsDeals"), icon: Tag },
    { name: "Favorites", href: createPageUrl("Favorites"), icon: Heart },
    { name: "Takeaways", href: createPageUrl("FoodTakeaways"), icon: UtensilsCrossed },
    { name: "Family", href: createPageUrl("FamilySharing"), icon: Users }
  ];

  const premiumLinks = [
    { name: "AI Meal Planner", href: createPageUrl("MealPlanner"), icon: UtensilsCrossed, isPremium: true },
    { name: "Recipe Importer", href: createPageUrl("Recipes"), icon: BookOpen, isPremium: true },
    { name: "Budget Tracker", href: createPageUrl("BudgetTracker"), icon: PoundSterling, isPremium: true },
    { name: "Price Predictions", href: createPageUrl("PricePredictions"), icon: TrendingUp, isPremium: true },
    { name: "Voice Shopping", href: createPageUrl("VoiceShopping"), icon: Mic, isPremium: true },
    { name: "Smart Inventory", href: createPageUrl("SmartInventory"), icon: Package, isPremium: true },
    { name: "Seasonal Deals", href: createPageUrl("SeasonalDeals"), icon: Sprout, isPremium: true },
    { name: "Local Deals", href: createPageUrl("LocalDeals"), icon: ScanLine, isPremium: true },
    { name: "Bulk Calculator", href: createPageUrl("BulkCalculator"), icon: Calculator, isPremium: true },
    { name: "Mobile App", href: createPageUrl("MobileApp"), icon: Smartphone, isPremium: true },
    { name: "Browser Extension", href: createPageUrl("BrowserExtensionHandoff"), icon: Package, isPremium: false },
  ];

  const adminLinks = [
    { name: "Admin Dashboard", href: createPageUrl("AdminDashboard"), icon: BarChart3 },
    { name: "User Management", href: createPageUrl("UserManagement"), icon: UserIcon },
    { name: "Plan Management", href: createPageUrl("PlanManagement"), icon: Package },
    { name: "Notifications", href: createPageUrl("AdminNotifications"), icon: Bell },
    { name: "Contact Messages", href: createPageUrl("AdminMessages"), icon: MessageCircle },
    { name: "App Settings", href: createPageUrl("AdminSettings"), icon: Shield },
    { name: "Landing Page", href: createPageUrl("LandingPageEditor"), icon: Code },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Spacer for the fixed nav on homepage to prevent content jump */}
      {isHomePage && <div className="h-16" />}

      {/* Main Navigation */}
      <AnimatePresence>
        <motion.nav 
          className={`bg-white/90 backdrop-blur-sm border-b z-40 w-full
            ${isHomePage ? 'fixed top-0' : 'relative'}
            ${isScrolled && isHomePage ? 'shadow-md border-gray-200' : 'border-transparent'}
          `}
          initial={isHomePage ? { y: -100, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to={createPageUrl("Home")} className="flex items-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png" 
                    alt="MyShopRun Logo" 
                    className="h-12 w-auto" 
                  />
                </Link>
              </div>
              
              {/* Center Menu */}
              <div className="flex-1 flex justify-center">
                <div className="hidden md:flex items-center gap-8">
                  {user ? (
                    <>
                      {dashboardLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          className={`text-sm font-medium flex items-center gap-1 ${
                            location.pathname === link.href 
                              ? 'text-teal-600' 
                              : 'text-gray-600 hover:text-teal-600'
                          }`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.name}
                        </Link>
                      ))}

                      {/* Notifications Dropdown */}
                      <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="relative">
                            <BellRing className="w-4 h-4" />
                            {hasUnread && (
                              <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 text-white min-w-4 h-4 flex items-center justify-center">
                                {activeAlerts}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">Price Alerts</h3>
                              {hasUnread && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={handleMarkAsRead}
                                  className="text-xs text-teal-600 hover:text-teal-700"
                                >
                                  Mark all as read
                                </Button>
                              )}
                            </div>
                            
                            {alertItems.length > 0 ? (
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {alertItems.map((item) => (
                                  <div key={item.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-medium text-green-800 text-sm">
                                          🎉 Target price reached!
                                        </p>
                                        <p className="text-green-700 text-sm mt-1">
                                          {item.item_name} is now £{item.current_best_price?.toFixed(2)} at {item.current_best_supermarket}
                                        </p>
                                        <p className="text-green-600 text-xs mt-1">
                                          Target: £{item.target_price?.toFixed(2)} • You save: £{((item.target_price || 0) - (item.current_best_price || 0)).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No price alerts yet</p>
                                <Link 
                                  to={createPageUrl("Favorites")} 
                                  className="text-teal-600 hover:text-teal-700 text-sm"
                                  onClick={() => setNotificationsOpen(false)}
                                >
                                  Set up price alerts →
                                </Link>
                              </div>
                            )}
                            
                            {alertItems.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <Link 
                                  to={createPageUrl("Favorites")} 
                                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                                  onClick={() => setNotificationsOpen(false)}
                                >
                                  View all favorites →
                                </Link>
                              </div>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {user.role === 'admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Admin
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {adminLinks.map((link) => (
                              <DropdownMenuItem key={link.href} asChild>
                                <Link to={link.href} className="flex items-center">
                                  <link.icon className="w-4 h-4 mr-2" />
                                  {link.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  ) : (
                    <>
                      <Link to={createPageUrl("Home")} className={`text-sm font-medium ${currentPageName === "Home" ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'}`}>Home</Link>
                      <button 
                        type="button"
                        onClick={() => setIsPricingModalOpen(true)}
                        className={`text-sm font-medium ${currentPageName === "Pricing" ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'}`}
                      >
                        Pricing
                      </button>
                      <button type="button" onClick={() => setIsContactModalOpen(true)} className="text-sm font-medium text-gray-600 hover:text-teal-600">Contact</button>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Auth Buttons / Profile */}
              <div className="flex-shrink-0">
                <div className="hidden md:flex items-center gap-3">
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-teal-600">
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{user.full_name}</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Home")} className="flex items-center">
                            <Home className="w-4 h-4 mr-2" />
                            Home Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Dashboard")} className="flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("FamilySharing")} className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Family
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {premiumLinks.map(link => (
                            <DropdownMenuItem key={link.href} asChild>
                              <Link 
                                to={link.href} 
                                className="flex items-center"
                                onClick={(e) => {
                                  if (link.isPremium && (!user.subscription_status || user.subscription_status === 'expired')) {
                                    e.preventDefault();
                                    handlePremiumClick(link.name);
                                  }
                                }}
                              >
                                <link.icon className="w-4 h-4 mr-2" />
                                {link.name}
                              </Link>
                            </DropdownMenuItem>
                        ))}
                        {activeAlerts > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("Favorites")} className="flex items-center text-green-600">
                                <BellRing className="w-4 h-4 mr-2" />
                                Price Alerts ({activeAlerts})
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Profile")} className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-2" />
                            Profile & Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                          Log Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={handleLogin}>Log In</Button>
                      <Button onClick={handleGetStarted} className="bg-teal-600 hover:bg-teal-700">
                        Sign Up
                        <ArrowRight className="w-4 h-4 ml-2"/>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                      {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden"
              >
                {user ? (
                   <div className="px-4 py-4 space-y-2">
                      <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-teal-600">
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                     <nav className="grid gap-2">
                       {dashboardLinks.map(link => (
                         <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                           {link.name}
                         </Link>
                       ))}
                       {/* Add Notifications for mobile */}
                       <button
                         type="button"
                         onClick={() => {
                           setMobileMenuOpen(false);
                           // Handle mobile notifications differently or link to favorites
                           navigate(createPageUrl("Favorites"));
                         }}
                         className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                       >
                         Notifications
                         {hasUnread && (
                            <Badge className="ml-2 px-1 py-0 text-xs bg-red-500 text-white min-w-4 h-4 flex items-center justify-center">
                              {activeAlerts}
                            </Badge>
                         )}
                       </button>

                       {/* Add premium links to mobile menu */}
                       {premiumLinks.map(link => (
                          <button
                            key={link.href}
                            type="button"
                            onClick={(e) => {
                              setMobileMenuOpen(false); // Close mobile menu after click
                              if (link.isPremium && (!user.subscription_status || user.subscription_status === 'expired')) {
                                e.preventDefault();
                                handlePremiumClick(link.name);
                              } else {
                                navigate(link.href);
                              }
                            }}
                            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                          >
                            {link.name}
                          </button>
                       ))}
                       {activeAlerts > 0 && (
                          <Link to={createPageUrl("Favorites")} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-green-600 hover:bg-gray-50 rounded-md">
                            Price Alerts ({activeAlerts})
                          </Link>
                       )}
                       <Link to={createPageUrl("Profile")} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                          Profile & Settings
                       </Link>

                       {user.role === 'admin' && (
                         <>
                          <div className="my-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</div>
                          {adminLinks.map(link => (
                            <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                              {link.name}
                            </Link>
                          ))}
                         </>
                       )}
                     </nav>
                     <Button className="w-full mt-4" variant="outline" onClick={handleLogout}>Log Out</Button>
                   </div>
                ) : (
                  <>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                      <Link to={createPageUrl("Home")} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${currentPageName === "Home" ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}>Home</Link>
                      <button 
                        type="button"
                        onClick={() => { 
                          setIsPricingModalOpen(true); 
                          setMobileMenuOpen(false); 
                        }} 
                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPageName === "Pricing" ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Pricing
                      </button>
                      <button type="button" onClick={() => { setIsContactModalOpen(true); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Contact</button>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <div className="px-5 space-y-2">
                        <Button className="w-full" onClick={handleLogin}>Log In</Button>
                        <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleGetStarted}>Sign Up</Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </AnimatePresence>
      
      {/* Reusing UpgradeSubscriptionModal for Signup prompts and pricing */}
      <UpgradeSubscriptionModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} featureName={selectedFeature} />
      <UpgradeSubscriptionModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} featureName="" />
      
      <main>
        {children}
      </main>

      {user && (user.subscription_status === 'active' || user.subscription_status === 'free_trial') && <FloatingChatWidget />}

      <footer className="bg-gray-900 py-12 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png" 
                  alt="MyShopRun Logo" 
                  className="h-14 w-auto mr-3" 
                />
                <span className="text-xl font-bold text-white">MyShopRun</span>
              </div>
              <p className="text-gray-300 mb-4">
                Save money on groceries with smart price comparison and shopping automation.
              </p>
              {/* Social Links - Hardcoded */}
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/myshoprun" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://x.com/myshoprun" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/myshoprun.app" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/company/myshoprun" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div className="md:col-start-4 flex justify-center md:justify-end">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/929ffb4ef_power-by-stripe_03.png" 
                  alt="Secure payments by Stripe" 
                  className="h-16 w-auto" 
                />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
            <p className="mb-4 sm:mb-0">&copy; 2024 MyShopRun. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 justify-center sm:justify-end">
              <button type="button" onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-white transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => setIsTermsModalOpen(true)} className="hover:text-white transition-colors">Terms of Service</button>
              <button type="button" onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors">Contact Us</button>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      <TermsAndConditionsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <AccountConnectionModal 
        isOpen={isAccountModalOpen}
        onClose={handleAccountModalClose}
        onSkip={handleAccountModalSkip}
      />
      <CookieConsent />
      <AddToHomeScreenPrompt />
      <PushNotificationManager />
    </div>
  );
}

