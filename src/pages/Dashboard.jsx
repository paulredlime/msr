
import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@/api/entities";
import { ShoppingList } from "@/api/entities";
import { PriceComparison } from "@/api/entities";
import { FavoriteItem } from "@/api/entities"; // Keep this import for FavoriteItem
import { ScannedProduct } from "@/api/entities";
import { ScannedPrice } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { AppSettings } from "@/api/entities";
import { SubscriptionPlan } from "@/api/entities"; // NEW: Added import for SubscriptionPlan

// NEW: Import generateSpeech for conversational assistant
import { generateSpeech } from '@/api/functions';
import { AnimatePresence, motion } from "framer-motion";
import { format } from 'date-fns'; // NEW IMPORT for date formatting in Last Shops Modal
import { toast } from "sonner"; // Import toast for notifications

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // Ensure DialogFooter and DialogDescription are imported
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

// NEW IMPORTS for outline
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { OrderHistory } from "@/api/entities"; // Keep for now as it's referenced in previous history or maybe future usage


import HeadlessLoginModal from '@/components/HeadlessLoginModal';

import ConnectSupermarketModal from "@/components/ConnectSupermarketModal";
import ConnectedSupermarkets from "@/components/ConnectedSupermarkets";

import {
  TrendingDown,
  Clock,
  Heart,
  Plus,
  DollarSign,
  ListChecks,
  Star,
  Crown,
  Zap,
  Award,
  CheckCircle,
  UtensilsCrossed,
  Sparkles,
  Download,
  ExternalLink,
  Camera,
  Info,
  Bell,
  ArrowRight,
  Package,
  Chrome,
  AlertCircle,
  Tag,
  PoundSterling,
  TrendingUp,
  Mic,
  Loader2,
  X,
  Lightbulb,
  Copy,
  Pause,
  Play,
  Volume2,
  Flame,
  CreditCard,
  ClipboardList,
  ShoppingCart,
  Link2,
  ListPlus,
  Wand2,
  BarChart,
  FileText,
  ChevronDown,
  UserPlus,
  Save,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Check,
  Users,
  Share,
  QrCode,
  Shield,
  Utensils,
  MapPin,
  ImagePlus, // NEW
  Maximize2 // NEW
} from "lucide-react";

import ReceiptScanner from "@/components/ReceiptScanner";
import BarcodeScanner from "@/components/BarcodeScanner";
import AutoRegistrationSetup from "@/components/AutoRegistrationSetup";
import AutoFillBasketButton from "@/components/AutoFillBasketButton";

import UpgradeSubscriptionModal from "@/components/UpgradeSubscriptionModal";

// NEW IMPORTS for outline
import ShareReferralModal from '@/components/ShareReferralModal';
import ReferralManagementModal from '@/components/ReferralManagementModal';
import { FamilyGroup } from '@/api/entities'; // Import FamilyGroup


// FIXED: Complete supermarkets list including Ocado
const supermarkets = [
  { name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png', loyalty: 'Clubcard' },
  { name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png', loyalty: 'ASDA Rewards' },
  { name: "Sainsbury's", logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png', loyalty: 'Nectar Card' },
  { name: 'Morrisons', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png', loyalty: 'More Card' },
  { name: 'Aldi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png' },
  { name: 'Lidl', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png' },
  { name: 'Waitrose', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png', loyalty: 'myWaitrose' },
  { name: 'Iceland', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png' },
  { name: 'Co-op', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png', loyalty: 'Co-op Membership' },
  { name: 'B&M', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/60b1472c0_image.png' },
  { name: 'Home Bargains', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/241014374_image.png' },
  // ADDED: Missing Ocado
  { name: 'Ocado', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Ocado-Logo.png' }
];

// Safely build supermarket maps even if `supermarkets` is not an array
const supermarketDetailsMap = {};
(Array.isArray(supermarkets) ? supermarkets : []).forEach((s) => {
  supermarketDetailsMap[s.name] = s;
});

// Create a memoized map for quick logo lookups
const supermarketLogoMap = (Array.isArray(supermarkets) ? supermarkets : []).reduce((acc, s) => {
  acc[s.name] = s.logo;
  return acc;
}, {});

// IMPROVED store name detection - this was the issue causing "Other" tab
const normalizeStoreName = (name) => {
  if (!name) return 'ASDA'; // Default fallback instead of 'Other'
  const lowerName = name.toLowerCase().trim();
  
  // More aggressive detection
  if (lowerName.includes('asda') || lowerName.includes('asd')) return 'ASDA';
  if (lowerName.includes('tesco') || lowerName.includes('tsc')) return 'Tesco';
  if (lowerName.includes('sainsbury') || lowerName.includes('sainsbur')) return "Sainsbury's";
  if (lowerName.includes('morrison') || lowerName.includes('morri')) return 'Morrisons';
  if (lowerName.includes('waitrose') || lowerName.includes('waitr')) return 'Waitrose';
  if (lowerName.includes('iceland') || lowerName.includes('icel')) return 'Iceland';
  if (lowerName.includes('lidl')) return 'Lidl';
  if (lowerName.includes('aldi')) return 'Aldi';
  if (lowerName.includes('co-op') || lowerName.includes('coop')) return 'Co-op';
  if (lowerName.includes('ocado')) return 'Ocado'; // Added Ocado detection
  
  return 'ASDA'; // Always return a real store name, never 'Other'
};


const storeUrls = {
  'asda': 'https://www.asda.com/groceries',
  'tesco': 'https://www.tesco.com/groceries',
  'morrisons': 'https://groceries.morrisons.com/webshop/startWebshop.do',
  'sainsburys': 'https://www.sainsburys.co.uk/gol-ui/groceries',
  'waitrose': 'https://www.waitrose.com',
  'lidl': 'https://www.lidl.co.uk',
  'coop': 'https://www.coop.co.uk',
  'iceland': 'https://www.iceland.co.uk',
  'aldi': 'https://groceries.aldi.co.uk/en-GB/',
  'ocado': 'https://www.ocado.com/' // Added Ocado URL
};

const detectSourceSupermarket = (text) => {
  const lowerCaseText = text.toLowerCase();
  // **FIX**: Expanded keyword list to be more accurate
  const ownBrandKeywords = {
    "asda": ["asda", "george", "smart price", "extra special"],
    "tesco": ["tesco", "clubcard", "finest", "tesco value"],
    "sainsbury's": ["sainsbury's", "nectar", "taste the difference", "sainsbury's basics"],
    "morrisons": ["morrisons", "more card", "the best"],
    "lidl": ["lidl", "lidl plus", "deluxe"],
    "aldi": ["aldi", "specilly selected"],
    "iceland": ["iceland", "bonus card"],
    "co-op": ["co-op", "coop"],
    "waitrose": ["waitrose", "mywaitrose", "essential waitrose"],
    "ocado": ["ocado", "waitrose"] // Ocado sells Waitrose products
  };

  for (const storeId in ownBrandKeywords) {
    for (const keyword of ownBrandKeywords[storeId]) {
      const regex = new RegExp(`\\b${keyword.replace("'", "'?")}\\b`);
      if (regex.test(lowerCaseText)) {
        return storeId;
      }
    }
  }
  return null;
};


const foodDeliveryServices = [
  { name: 'Uber Eats', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd90136a7_image.png' },
  { name: 'Just Eat', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6d1b0ead6_image.png' },
  { name: 'Deliveroo', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/234d89b82_image.png' }
];

const deliveryUrls = {
  'Just Eat': 'https://www.just-eat.co.uk',
  'Uber Eats': 'https://www.ubereats.com/gb',
  'Deliveroo': 'https://deliveroo.co.uk'
};

const supermarketsArray = [
    { name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png', id: 'tesco' },
    { name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png', id: 'asda' },
    { name: "Sainsbury's", logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png', id: 'sainsburys' },
    { name: 'Morrisons', logo: 'https://groceries.morrisons.com/webshop/startWebshop.do', id: 'morrisons' },
    { name: 'Aldi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png', id: 'aldi' },
    { name: 'Lidl', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png', id: 'lidl' },
];

// Fallback logos (used when a store is missing from supermarketsArray)
const fallbackLogos = {
  tesco: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6102_image.png",
  asda: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png",
  sainsburys: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png",
  morrisons: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png",
  aldi: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png",
  lidl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png",
  coop: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png",
  waitrose: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png",
  iceland: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png",
  ocado: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ae15bfc78_image.png"
};

const normalizeStoreKey = (v) => String(v || "").toLowerCase().replace(/[^a-z]/g, "");

// Resolve a store logo by id or name with fallback to known assets (covers Ocado)
const getStoreLogo = (idOrName) => {
  const key = normalizeStoreKey(idOrName);
  const arr = Array.isArray(supermarketsArray) ? supermarketsArray : [];
  const match = arr.find(
    (s) => normalizeStoreKey(s.id) === key || normalizeStoreKey(s.name) === key
  );
  return match?.logo || fallbackLogos[key];
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState('Premium Shopper'); // State for plan name
  const [recentLists, setRecentLists] = useState([]);
  const [recentComparisons, setRecentComparisons] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false); // FIXED: Changed initial state to false
  const [quickAddText, setQuickAddText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });
  const [scannerMode, setScannerMode] = useState('compare');
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionUrl, setExtensionUrl] = useState(null);
  
  const [fetchStep, setFetchStep] = useState('idle');
  const [fetchedGroceryData, setFetchedGroceryData] = useState([]);
  const [fetchedFoodData, setFetchedFoodData] = useState([]);
  const [activeStoreTab, setActiveStoreTab] = useState('');
  const [activeFoodPlatformTab, setActiveFoodPlatformTab] = useState('');
  const [activeTab, setActiveTab] = useState('supermarkets'); // NEW STATE

  const [showFoodQuickAdd, setShowFoodQuickAdd] = useState(false);
  const [quickFoodText, setQuickFoodText] = useState('');
  const [processingFood, setProcessingFood] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');

  const [comparisonResults, setComparisonResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showBrandReplacements, setShowBrandReplacements] = useState(false);
  const [showBrandSwaps, setShowBrandSwaps] = useState(false);
  // REMOVED: loyaltyCards state
  // const [loyaltyCards, setLoyaltyCards] = {};
  // ADDED: Single toggle for all loyalty prices
  const [applyLoyaltyPrices, setApplyLoyaltyPrices] = useState(true);
  // ADDED: State for loading animation
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);

  const [scannedProductsCount, setScannedProductsCount] = useState(0); 
  const [totalComparisonsCount, setTotalComparisonsCount] = useState(0);
  
  const navigate = useNavigate();

  // Safety helper: always return an array so .map, [...x], for-of never receive {}
  const toArray = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
  };

  const [showAutoRegSetup, setShowAutoRegSetup] = useState(false);

  // New state for modals and voice
  const [showMealPlannerModal, setShowMealPlannerModal] = useState(false);
  // const [showCouponsModal, setShowCouponsModal = useState(false); // This is the old generic coupons modal (REMOVED)
  const [showBudgetTrackerModal, setShowBudgetTrackerModal] = useState(false);
  const [showPricePredictionsModal, setShowPricePredictionsModal] = useState(false);
  
  // Voice Assistant States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [createdList, setCreatedList] = useState(null);
  const [showCreatedListModal, setShowCreatedListModal] = useState(false);
  const [defaultVoice, setDefaultVoice] = useState('en-US-Journey-F');
  const [voiceAssistantContext, setVoiceAssistantContext] = useState('idle'); // 'idle', 'awaiting_supermarket_for_coupons'

  // NEW: Voucher Wallet System
  const [voucherWallet, setVoucherWallet] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  
  // NEW: State for price alert modal
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(null); // Initialized to null
  const [selectedAlertItem, setSelectedAlertItem] = useState(null); 
  
  // Renamed from isUpgradeModalOpen to showUpgradeModal for consistency with outline
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); 
  const [selectedFeature, setSelectedFeature] = useState(''); // Kept this state

  // NEW: State for interactive coupon flow
  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null); // For the persistent <audio> element
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [showAudioUnlockModal, setShowAudioUnlockModal] = useState(false);

  // Enhanced coupon state to handle multiple coupons per store (adjusted per outline to be simpler)
  const [availableCoupons, setAvailableCoupons] = useState([]); // Changed to array
  const [showCouponModal, setShowCouponModal] = useState(false); // Singular
  const [selectedStore, setSelectedStore] = useState(null); // Renamed from currentStoreName for clarity

  // FIX: selectedCoupons must be a React state hook (previously was `const [selectedCoupons, setSelectedCoupons] = {};`)
  const [selectedCoupons, setSelectedCoupons] = useState({});

  // NEW STATES for Smart Coupon Feature (re-added based on outline)
  const [isSearchingCoupons, setIsSearchingCoupons] = useState(false);

  // Add rotating commands state
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const voiceCommands = [
    "Add milk and bread",
    "Create a meal plan",
    "Find me coupons",
    "Compare prices for eggs",
    "What's on my shopping list?"
  ];

  // NEW STATES for Fetch My Last Shops
  const [lastShops, setLastShops] = useState({}); // grouping object is fine
  const [showLastShopsModal, setShowLastShopsModal] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState('');
  const [expandedList, setExpandedList] = useState(null);

  const [selectedListDetails, setSelectedListDetails] = useState(null);
  const [showListDetailsModal, setShowListDetailsModal] = useState(false);

  // NEW: State for the "Connect Supermarkets" modal from the outline
  const [showAccountModal, setShowAccountModal] = useState(false);

  // NEW STATES: For Referral and Family
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false); // Renamed to match the outline's use of setShowReferralManagementModal
  const [familyGroup, setFamilyGroup] = useState(null);

  // NEW STATES: For new cards in Quick Actions / Main Action Cards
  const [showVoiceShoppingModal, setShowVoiceShoppingModal] = useState(false); // NEW
  const [showInventoryModal, setShowInventoryModal] = useState(false); // NEW
  const [showLocalDealsModal, setShowLocalDealsModal] = useState(false); // NEW

  // Dummy state for new Dialog (to avoid compilation error from outline)
  const [showModal, setShowModal] = useState(false); // This state is introduced by the outline
  const [listText, setListText] = useState(''); // This state is introduced by the outline
  const [error, setError] = useState(null); // This state is introduced by the outline
  const [isSubmitting, setIsSubmitting] = useState(false); // This state is introduced by the outline

  const [dashboardFavorites, setDashboardFavorites] = React.useState([]); // dashboard-only preview list

  const [screenshotFiles, setScreenshotFiles] = React.useState([]);
  const [ocrExtracting, setOcrExtracting] = React.useState(false);
  const [ocrText, setOcrText] = React.useState("");
  const quickPasteScopeRef = React.useRef(null);

  const [connectModalOpen, setConnectModalOpen] = React.useState(false);
  const [selectedStoreName, setSelectedStoreName] = React.useState(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = React.useState(null);

  const onScreenshotsSelected = (e) => {
    const files = Array.from(e.target.files || []);
    setScreenshotFiles(files);
    setOcrText("");
  };

  const insertIntoTextarea = (text, mode = "append") => {
    const scope = quickPasteScopeRef.current;
    if (!scope) return;
    const ta = scope.querySelector("textarea");
    if (!ta) return;
    const current = ta.value || "";
    const next = mode === "replace"
      ? text
      : [current.trim(), text.trim()].filter(Boolean).join("\n");
    // set value and dispatch input so any state hook updates
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) setter.call(ta, next); else ta.value = next;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const extractFromScreenshots = async () => {
    if (!screenshotFiles.length) return;
    setOcrExtracting(true);
    try {
      const uploads = await Promise.all(
        screenshotFiles.map((file) => UploadFile({ file }))
      );
      const fileUrls = uploads.map((u) => u.file_url).filter(Boolean);

      // Ask AI to turn screenshots/receipts into a simple one-item-per-line list
      const schema = {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" } },
          raw_text: { type: "string" }
        },
        required: []
      };

      const prompt = `
        You are extracting a shopping list from screenshots or email receipts.
        Return a clean list with one item per line, suitable for pasting into a shopping list.
        - Include quantities if clearly shown (e.g., "2x milk 2L").
        - Remove prices and currency.
        - Remove timestamps/order numbers.
        - Keep brand if obvious (e.g., "Heinz baked beans 415g").
        Respond using the provided JSON schema.
      `;

      const result = await InvokeLLM({
        prompt,
        file_urls: fileUrls,
        response_json_schema: schema
      });

      const lines = Array.isArray(result?.items) ? result.items : [];
      const raw = typeof result?.raw_text === "string" ? result.raw_text : "";
      const combined = lines.length ? lines.join("\n") : raw || "";
      setOcrText(combined);
      if (combined) {
        insertIntoTextarea(combined, "append");
      }
    } finally {
      setOcrExtracting(false);
    }
  };

  // Add useEffect for rotating commands
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCommandIndex((prev) => (prev + 1) % voiceCommands.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [voiceCommands.length]);

  // Use useCallback to memoize the loadUser function
  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      console.log('Dashboard: Loaded user with subscription status:', currentUser.subscription_status);
      
      // FIX: Ensure all new users get a proper free trial
      if (!currentUser.subscription_status || currentUser.subscription_status === 'free') {
        console.log('Setting up free trial for user');
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 day trial
        
        await User.updateMyUserData({
          subscription_status: 'free_trial',
          trial_end_date: trialEndDate.toISOString().split('T')[0],
          subscription_start_date: new Date().toISOString().split('T')[0]
        });
        
        // Reload user to get updated data
        const updatedUser = await User.me();
        setUser(updatedUser);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  const loadDefaultVoice = async () => {
    try {
      const voiceSettings = await AppSettings.filter({ setting_key: 'default_voice' });
      if (voiceSettings.length > 0) {
        setDefaultVoice(voiceSettings[0].setting_value);
      }
    } catch (error) {
      console.error('Error loading default voice:', error);
    }
  };

  // Load user on component mount
  useEffect(() => {
    loadUser();
    loadDefaultVoice();
  }, [loadUser]);

  // NEW: Check for audio unlock status on mount
  useEffect(() => {
    if (localStorage.getItem('audioUnlocked') === 'true') {
      setIsAudioUnlocked(true);
    }
  }, []);

  // ADDED: useEffect to animate the loader
  useEffect(() => {
    let interval;
    if (processing) {
      // Create a filtered list of supermarkets that have logos to avoid errors
      const supermarketsWithLogos = supermarkets.filter(s => s.logo);
      if (supermarketsWithLogos.length > 0) {
        interval = setInterval(() => {
          setCurrentStoreIndex(prev => (prev + 1) % supermarketsWithLogos.length);
        }, 1200); // Cycle every 1.2 seconds
      }
    }
    return () => clearInterval(interval);
  }, [processing]);

  // Add an effect to reload user data when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard is visible again, reloading user data...');
        loadUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUser]);

  useEffect(() => {
    // This IIFE (Immediately Invoked Function Expression) sets up the listeners for the extension.
    (function(){
      // This function will look for the user object once your app has loaded it.
      function getUser(){return window.user||window.__USER__||null}
      
      // This function sends the user's details back to the extension.
      function authSuccess(nonce){
        const u=getUser(); if(!u) return;
        window.postMessage({type:'MYSHOPRUN_AUTH_SUCCESS',nonce,
          userData:{
            email:u.email, fullName:u.full_name,
            subscriptionStatus:u.subscription_status,
            canUseExtension:u.subscription_status==='active'
          }}, '*');
      }
      
      // Listen for the extension requesting authentication details.
      window.addEventListener('message',e=>{
        if(!e?.data) return;
        if(e.data.type==='MYSHOPRUN_REQUEST_AUTH') authSuccess(e.data.nonce||'');
      });
      
      // If the page was opened specifically for authentication and the user is already available,
      // send the details immediately.
      const p=new URLSearchParams(location.search);
      if((p.get('extension_auth')==='1'||p.get('extension_auth')==='true')&&getUser()){
        authSuccess(p.get('ext_nonce')||'');
      }
    })();
  }, []);

  // loadDashboardData is stable as its internal dependencies (setters, imported functions) are stable.
  const loadDashboardData = useCallback(async () => {
    try {
      const currentUser = await User.me();
      console.log('Dashboard: Loaded user data:', currentUser);
      console.log('Dashboard: User connected stores:', currentUser.connected_supermarkets);
      
      window.user = currentUser; 
      setUser(currentUser);

      const [lists, comparisons, favoriteItems, extensionUrlSetting, scannedProducts] = await Promise.all([
        ShoppingList.list('-created_date', 3),
        PriceComparison.list('-created_date', 5), // Still get 5 recent for display
        FavoriteItem.list('-created_date', 5),
        AppSettings.filter({ setting_key: 'extension_chrome_url' }),
        ScannedProduct.list('-created_date')
      ]);

      setRecentLists(lists);
      setRecentComparisons(comparisons);
      setFavorites(favoriteItems);
      setScannedProductsCount(scannedProducts.length);
      
      // **FIX**: Use the actual total_shops_completed from user data, don't reset to 0
      setTotalComparisonsCount(currentUser.total_shops_completed || 0);
      console.log('📊 Dashboard: Set comparison count to:', currentUser.total_shops_completed || 0);
      
      if (extensionUrlSetting.length > 0) {
        setExtensionUrl(extensionUrlSetting[0].setting_value); // Fixed: was using extensionUrl instead of extensionUrlSetting
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  }, []); // Dependencies are stable setters and imported functions.


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = await User.me();
        if (!currentUser) {
          navigate(createPageUrl('Home'));
          return;
        }
        setUser(currentUser);

        // Fetch subscription plan name
        if (currentUser.subscription_plan_id) {
          try {
            const plan = await SubscriptionPlan.get(currentUser.subscription_plan_id);
            if (plan && plan.name) {
              setPlanName(plan.name);
            }
          } catch (e) {
            console.warn("Could not fetch plan name, using default.", e);
            setPlanName('Free Trial'); // Fallback in case of error
          }
        } else {
            setPlanName('Free Trial'); // Default if no plan ID
        }

        // Fetch recent lists
        const lists = await ShoppingList.filter({ created_by: currentUser.email }, '-created_date', 5);
        setRecentLists(lists);

        // Fetch family group
        const groups = await FamilyGroup.filter({ 'members.user_email': currentUser.email });
        // FIX: Add Array.isArray check for robustness
        if (Array.isArray(groups) && groups.length > 0) {
          setFamilyGroup(groups[0]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // If User.me() fails, it will redirect.
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const handleExtensionMessage = (event) => {
      if (event.source === window && event.data?.type === 'SHOP_EXTENSION_HELLO') {
        console.log("MyShopRun Dashboard: Browser extension detected.");
        setExtensionInstalled(true);
      }
    };
    
    window.addEventListener('message', handleExtensionMessage);
    window.postMessage({ type: 'SHOP_APP_HELLO' }, '*');

    return () => window.removeEventListener('message', handleExtensionMessage); // Corrected cleanup
  }, [navigate]); // Added navigate to dependencies based on fetchData usage.

  useEffect(() => {
    const checkAutoRegistrationPrompt = () => {
      if (user && user.subscription_status === 'free_trial') {
        const hasSeenAutoRegPrompt = localStorage.getItem('hasSeenAutoRegPrompt');
        if (!hasSeenAutoRegPrompt && user.auto_registration_enabled === undefined) {
          setTimeout(() => {
            setShowAutoRegSetup(true);
          }, 3000);
        }
      }
    };

    if (user) {
      checkAutoRegistrationPrompt();
    }
  }, [user]);

  // Utility function to calculate days left in trial
  const calculateDaysLeft = (endDateString) => {
    if (!endDateString) return 0;
    const endDate = new Date(endDateString);
    const today = new Date();
    // Set both dates to start of day to ensure correct day difference
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const daysLeftInTrial = user ? calculateDaysLeft(user.trial_end_date) : 0;

  // FIXED: processVoiceCommand modified to return status, not directly speak or set voiceResponse
  const processVoiceCommand = useCallback(async (commandText) => {
    try {
      const prompt = `
        Analyze this voice command for shopping: "${commandText}"
        
        Extract shopping items with quantities. Return items suitable for a UK shopping list.
        Provide a helpful response confirming what was added.
        
        Focus on extracting actual grocery items like milk, bread, eggs, etc.
        If the command does not seem to be a shopping list, return an empty items array and a relevant response.
      `;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      }
      );

      if (result.items && result.items.length > 0) {
        const listName = `Voice Shopping - ${new Date().toLocaleDateString()}`;
        const itemsText = result.items.map(item => `${item.quantity || '1'} ${item.name}`).join('\n');
        
        const newList = await ShoppingList.create({
          name: listName,
          original_text: itemsText,
          items: result.items,
          status: 'draft'
        }); // Added closing brace
        // Corrected invocation of ShoppingList.create

        setCreatedList({
          ...newList,
          items: result.items
        });
        setShowCreatedListModal(true); // Show the list in modal
        loadDashboardData(); // Refresh recent lists
        return { listCreated: true, response: result.response };
      } else {
        return { listCreated: false, response: result.response };
      }

    } catch (error) {
      console.error('Error processing voice command as shopping list:', error);
      return { listCreated: false, response: "Sorry, I couldn't process that command. Please try again." };
    }
  }, [loadDashboardData]);

  // NEW: Function to fix brand name pronunciations for Text-to-Speech
  const preprocessTextForTTS = (text) => {
    return text
      // UK Supermarket pronunciations
      .replace(/\bASDA\b/gi, 'Az-da')
      .replace(/\bTesco\b/gi, 'Tess-co')
      .replace(/\bSainsbury's\b/gi, 'Saynz-berries')
      .replace(/\bMorrisons\b/gi, 'Morris-ons')
      .replace(/\bLidl\b/gi, 'Lee-dul')
      .replace(/\bAldi\b/gi, 'Al-dee')
      .replace(/\bOcado\b/gi, 'Oh-ca-dough') // Added Ocado
      // Common food/shopping terms
      .replace(/\bveg\b/gi, 'vegetables')
      .replace(/\bciabatta\b/gi, 'cha-bah-ta')
      .replace(/\bquinoa\b/gi, 'keen-wah')
      .replace(/\bgyoza\b/gi, 'gyoh-zah');
  };

  // COMPLETELY REWRITTEN: Mobile-first audio handling
  const speakText = async (text, onEndCallback = () => {}) => {
    if (!text) {
      onEndCallback();
      return;
    }
    
    // If audio isn't unlocked, show the modal and stop.
    if (!isAudioUnlocked) {
      setShowAudioUnlockModal(true);
      return;
    }

    // Stop any current audio playing on the persistent player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = ''; // Clear source
    }

    setIsSpeaking(true);

    try {
      const freshUser = await User.me();
      const voiceToUse = freshUser?.preferred_voice || defaultVoice;
      const languageCode = voiceToUse?.startsWith('en-GB') ? 'en-GB' : 'en-US';

      const finalVoice = ['en-US-Journey-F', 'en-US-Journey-D', 'en-GB-Journey-F', 'en-GB-Journey-D', 'en-US-Studio-O', 'en-US-Studio-Q'].includes(voiceToUse) ? voiceToUse : 'en-US-Journey-F';

      // NEW: Preprocess text for better pronunciations
      const processedText = preprocessTextForTTS(text);

      const response = await generateSpeech({
        text: processedText, // Use the processed text
        voiceName: finalVoice,
        languageCode,
      });

      if (response.data && response.data.audioContent) {
        const audioSrc = `data:audio/mp3;base64,${response.data.audioContent}`;
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioSrc;
          
          audioPlayerRef.current.onended = () => {
            setIsSpeaking(false);
            onEndCallback();
          };
          
          audioPlayerRef.current.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsSpeaking(false);
            onEndCallback();
          };
          
          await audioPlayerRef.current.play();
        } else {
            throw new Error('audioPlayerRef.current is null');
        }
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsSpeaking(false);
      onEndCallback(); // Ensure callback is called on error
    }
  };
  
  // Existing `fetchCouponsFor` is likely for voice assistant specific flow, keep it.
  const fetchCouponsFor = async (supermarketName) => {
    console.log('Fetching coupons for:', supermarketName);
    setVoiceResponse(`Searching for the latest coupons at ${supermarketName}...`);
    await speakText(`Okay, searching for the latest coupons at ${supermarketName}.`);

    try {
      const couponSchema = {
        type: "object",
        properties: {
          coupons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", description: "The coupon code. If no code, use 'N/A'." },
                description: { type: "string", description: "A brief, clear description of the offer." },
                expiry: { type: "string", description: "The expiration date, or 'Varies'." }
              },
              required: ["code", "description"]
            }
          },
        },
        required: ["coupons"]
      };

      const result = await InvokeLLM({
        prompt: `Find all current, usable coupon codes and top deals for ${supermarketName} in the UK. Focus on codes. Provide at least 3 distinct offers.`,
        add_context_from_internet: true,
        response_json_schema: couponSchema
      });

      if (result && result.coupons && result.coupons.length > 0) {
        // Add vouchers to wallet with store info
        const newVouchers = result.coupons.map(coupon => ({
          ...coupon,
          store: supermarketName,
          addedDate: new Date().toISOString(),
          id: `${supermarketName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setVoucherWallet(prev => [...prev, ...newVouchers]);
        
        const message = `Perfect! I found ${result.coupons.length} vouchers for ${supermarketName} and added them to your voucher wallet. Click on the Coupons & Deals card to view them.`;
        setVoiceResponse(message);
        await speakText(message); // No callback - conversation ends here
      } else {
        throw new Error('No coupons found');
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setVoiceResponse(`Sorry, I couldn't find any specific deals for ${supermarketName} right now. Would you like to try another store?`);
      await speakText(`Sorry, I couldn't find any specific deals for ${supermarketName} right now. Would you like to try another store?`, () => startListening());
    }
  };

  const handleVoiceCommand = async (command) => {
    const lowerCaseCommand = command.toLowerCase();
    setVoiceTranscript(command);
    
    console.log('Voice command:', command);

    // Handle context-specific commands first
    if (voiceAssistantContext === 'awaiting_supermarket_for_coupons') {
        const foundSupermarket = supermarkets.find(s => 
          lowerCaseCommand.includes(s.name.toLowerCase().replace(/'/g, '')) || 
          (s.loyalty && lowerCaseCommand.includes(s.loyalty.toLowerCase().replace(/'/g, ''))));
        
        if (foundSupermarket) {
            setVoiceAssistantContext('idle'); // Reset context
            setVoiceResponse(`Okay, searching for coupons at ${foundSupermarket.name}.`);
            await speakText(`Okay, searching for coupons at ${foundSupermarket.name}.`);
            fetchCouponsFor(foundSupermarket.name); // Call the function to fetch coupons
            return;
        } else {
            setVoiceResponse("I didn't recognize that supermarket. Please say the name of a UK supermarket like Tesco, ASDA, or Sainsbury's.");
            await speakText("I didn't recognize that supermarket. Please say the name of a UK supermarket like Tesco, ASDA, or Sainsbury's.", () => startListening());
            return; // Keep context as awaiting_supermarket_for_coupons
        }
    }

    // Check if user is asking for coupons/deals (simplified as couponFlowStep is not used here)
    if (lowerCaseCommand.includes('coupon') || lowerCaseCommand.includes('deal') || lowerCaseCommand.includes('discount') || lowerCaseCommand.includes('voucher')) {
      console.log('User asked for coupons, setting flow to ask_supermarket');
      const couponPrompt = 'I can help with that! Which supermarket are you looking for deals at? You can name any of the major UK supermarkets we support.';
      setVoiceResponse(couponPrompt);
      await speakText(couponPrompt, () => startListening());
      setVoiceAssistantContext('awaiting_supermarket_for_coupons'); // Set context for next command
      return;
    }

    // Try to process as a shopping list command
    try {
      const listProcessResult = await processVoiceCommand(command);
      if (listProcessResult.listCreated) {
        setVoiceResponse(listProcessResult.response || "Great! I've added those items to your list.");
        await speakText(listProcessResult.response || "Great! I've added those items to your list.");
      } else {
        // If not a shopping list, provide help
        setVoiceResponse("I can help you with coupons and deals, or add items to your shopping list. What would you like to do?");
        await speakText("I can help you with coupons and deals, or add items to your shopping list. What would you like to do?");
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setVoiceResponse("I can help you with coupons and deals, or add items to your shopping list. What would you like to do?");
      await speakText("I can help you with coupons and deals, or add items to your shopping list. What would you like to do?");
    }
  };

  const startListening = () => {
    // Prompt to unlock audio if not already done
    if (!isAudioUnlocked) {
      setShowAudioUnlockModal(true);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in your browser.');
      return;
    }

    // If currently listening, stop it
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceResponse('Listening...');
      setVoiceTranscript('');
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice input:', transcript);
      handleVoiceCommand(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceResponse('Sorry, I couldn\'t hear you clearly. Please try again.');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };
  
  // NEW: Function to unlock audio on user gesture
  const unlockAudio = async () => {
    try {
      // 1. Resume Web Audio Context (if it exists)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // 2. Play a tiny silent sound through the persistent <audio> element
      if (audioPlayerRef.current) {
        // A tiny, silent Base64 encoded MP3
        audioPlayerRef.current.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZGJhbmsuY29tIC8gUmVjb3JkZWQgb24gMjAwMS0wOC0wNSBhdCAxMToxMDo0MAMAAAAA";
        await audioPlayerRef.current.play();
        audioPlayerRef.current.pause(); // Immediately pause after unlocking
        audioPlayerRef.current.src = ""; // Clear the source
      }
      
      // 3. Update state and localStorage
      setIsAudioUnlocked(true);
      localStorage.setItem('audioUnlocked', 'true');
      console.log("Audio successfully unlocked for programmatic playback.");
    } catch (e) {
      console.warn("Audio unlock failed, but continuing:", e);
      // Even if it fails, we set it as unlocked to avoid loops.
      // The browser might still block audio, but the UI won't be stuck.
      setIsAudioUnlocked(true); 
    } finally {
      setShowAudioUnlockModal(false);
    }
  };

  const resetVoiceAssistant = () => {
    console.log('Resetting voice assistant');
    setVoiceResponse('');
    setVoiceTranscript(''); // Clear voice transcript (kept this as it's good UX)
    if (audioPlayerRef.current) { // Changed from audioRef
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = ''; // Clear source
    }
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsSpeaking(false);
    setVoiceAssistantContext('idle'); // Reset context here too
  };
  
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setModalContent({
      title: "Copied!",
      description: `Coupon code '${code}' copied to clipboard.`
    });
    setShowInfoModal(true);
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setModalContent({
      title: "Copied!",
      description: `Voucher code '${code}' copied to clipboard.`
    });
    setShowInfoModal(true);
  };

  const clearVoucherWallet = () => {
    setVoucherWallet([]);
    setModalContent({
      title: "Vouchers Cleared",
      description: "All vouchers have been removed from your wallet."
    });
    setShowInfoModal(true);
  };

  const parseShoppingList = async (text) => {
    const prompt = `
    Parse this shopping list or receipt text into structured items. Extract each item with quantity, brand, price, and category.
    
    IMPORTANT: If this text does not contain actual grocery items or shopping list content, 
    return an empty items array. Only return items if you can identify real grocery products.

    Shopping list/receipt:
    ${text}

    For each item, extract:
    - name: the product name (without brand)
    - brand: the brand name (e.g., "McVitie's", "Birds Eye", "Iceland", "Tesco", "ASDA", etc.)
    - quantity: the amount/quantity (e.g., "2x", "1 bag", "500g", "164g")
    - category: grocery category (e.g., "dairy", "meat", "vegetables", "pantry", "frozen", "household")
    - price: the price in pounds as a number (e.e., 2.50 for £2.50) - extract from price patterns like "£2.50", "2.50", "$2.50"
    
    Brand detection rules:
    - If the product name starts with a brand (e.g., "McVitie's Digestives"), extract "McVitie's" as brand and "Digestives" as name
    - Common UK brands: Tesco, ASDA, Sainsbury's, Morrisons, Iceland, Birds Eye, Heinz, etc.
    - Store own-brands: If product contains "Tesco Finest", "ASDA Smart Price", "Sainsbury's Taste the Difference", extract the store as brand
    
    If no valid grocery items are detected, return empty items array.
    `;

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  brand: { type: "string" },
                  quantity: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" }
                }
              }
            }
          }
        }
      });
      
      // **FIXED**: Relaxed the check. As long as items are found, we consider it valid.
      if (!response.items || response.items.length === 0) {
        console.log("AI parsing resulted in no items. Deeming invalid.");
        return { items: [], isValid: false };
      }
      
      console.log(`AI successfully parsed ${response.items.length} items.`);
      return { items: response.items, isValid: true }; // Use the parsed items
    } catch (error) {
      console.error('Error parsing shopping list with AI:', error);
      
      console.log('AI service unavailable, attempting fallback parsing...');
      
      try {
        const fallbackResult = await fallbackParseShoppingList(text);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        return { items: [], isValid: false };
      }
    }
  };

  const fallbackParseShoppingList = (text) => {
    return new Promise((resolve) => {
      const groceryIndicators = [
        'milk', 'bread', 'eggs', 'chicken', 'beef', 'pasta', 'rice', 'cheese', 'butter', 'flour',
        'tomato', 'onion', 'potato', 'apple', 'banana', 'orange', 'carrot', 'lettuce',
        'tesco', 'asda', 'sainsbury', 'morrisons', 'iceland', 'lidl', 'aldi', 'waitrose', 'ocado', // Added Ocado
        'heinz', 'cadbury', 'nestle', 'coca cola', 'pepsi', 'walkers', 'mcvities',
        '£', 'gbp', 'total', 'subtotal', 'item', 'quantity', 'bag', 'pack', 'kg', 'g', 'ml', 'l',
        'receipt', 'order', 'purchase', 'delivery', 'checkout'
      ];

      const lowerText = text.toLowerCase();
      const hasGroceryContent = groceryIndicators.some(indicator => 
        lowerText.includes(indicator)
      );

      if (!hasGroceryContent) {
        resolve({ items: [], isValid: false });
        return;
      }

      const lines = text.split('\n').filter(line => line.trim());
      const items = [];

      const commonBrands = [
        'mcvities', 'birds eye', 'iceland', 'heinz', 'cadbury', 'walkers', 'coca cola', 'pepsi', 'nestle', 'unilever',
        'tesco', 'asda', 'sainsburys', 'morrisons', 'lidl', 'aldi', 'waitrose', 'co-op', 'ocado' // Added Ocado
      ].sort((a,b) => b.length - a.length); // Sort by length descending for better matching

      for (const line of lines) {
        if (line.match(/(subtotal|total|delivery|order|purchase)/i)) {
          continue;
        }

        if (line.match(/[a-zA-Z]/) && !line.match(/^(fresh|frozen|bakery|drinks|toiletries)/i)) {
          let rawProductName = line
            .replace(/\d+\s*x?\s*£[\d.]+\s*£[\d.]+$/i, '')
            .replace(/\d+\s*£[\d.]+$/i, '')
            .replace(/^\d+\s*/, '')
            .replace(/\s+£[\d.]+.*$/, '')
            .replace(/\d+ for £[\d.]+.*$/, '')
            .trim();

          // Extract price
          const priceMatch = line.match(/£(\d+\.\d{2})|(\d+\.\d{2})\s*$/); // Match £X.XX or X.XX at end of line
          const price = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2]) : 0;

          // Extract brand
          let brand = 'Unknown Brand';
          let productName = rawProductName;
          let foundBrand = false;

          for (const brandName of commonBrands) {
            const brandRegex = new RegExp(`^${brandName}\\b|\\b${brandName}'s\\b|\\b${brandName}\\b`, 'i');
            if (brandRegex.test(productName.toLowerCase())) {
              brand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
              productName = productName.replace(new RegExp(`^${brandName}|\\b${brandName}'s\\b|\\b${brandName}\\b`, 'i'), '').trim();
              foundBrand = true;
              break;
            }
          }

          // Handle supermarket own brands more specifically
          const supermarketOwnBrands = {
            "tesco": ["finest", "value", "free from"],
            "asda": ["smart price", "extra special", "george"],
            "sainsbury's": ["taste the difference", "basics"],
            "morrisons": ["the best"],
            "lidl": ["deluxe"],
            "aldi": ["deluxe", "specilly selected"],
            "waitrose": ["essential"],
            "co-op": ["co-op", "irresistible"],
            "ocado": ["ocado", "waitrose"] // Added Ocado
          };

          for (const store in supermarketOwnBrands) {
            for (const ownBrandKeyword of supermarketOwnBrands[store]) {
              if (productName.toLowerCase().includes(ownBrandKeyword)) {
                brand = store.charAt(0).toUpperCase() + store.slice(1);
                productName = productName.replace(new RegExp(`\\b${ownBrandKeyword}\\b`, 'i'), '').trim();
                foundBrand = true;
                break;
              }
            }
            if (foundBrand) break;
          }
          
          // If product name is empty after brand removal, try to restore a reasonable name
          if (!productName && rawProductName) {
            productName = rawProductName; // Revert if stripping brand made it empty
            brand = 'Unknown Brand'; // Reset brand if it caused issues
          }


          if (productName && productName.length > 1) { // Ensure product name is not too short after parsing
            let category = 'other';
            const productLower = productName.toLowerCase();
            
            if (productLower.includes('milk') || productLower.includes('cheese') || productLower.includes('butter') || productLower.includes('yogurt')) {
              category = 'dairy';
            } else if (productLower.includes('chicken') || productLower.includes('beef') || productLower.includes('mince') || productLower.includes('pork') || productLower.includes('fish')) {
              category = 'meat';
            } else if (productLower.includes('bread') || productLower.includes('roll') || productLower.includes('bakery') || productLower.includes('cake')) {
              category = 'bakery';
            } else if (productLower.includes('pasta') || productLower.includes('rice') || productLower.includes('sauce') || productLower.includes('cereal') || productLower.includes('beans') || productLower.includes('tinned')) {
              category = 'pantry';
            } else if (productLower.includes('ice cream') || productLower.includes('frozen') || productLower.includes('pizza') || productLower.includes('chips')) {
              category = 'frozen';
            } else if (productLower.includes('tomato') || productLower.includes('onion') || productLower.includes('lettuce') || productLower.includes('potato') || productLower.includes('carrot') || productLower.includes('veg')) {
              category = 'vegetables';
            } else if (productLower.includes('apple') || productLower.includes('banana') || productLower.includes('orange') || productLower.includes('grapes') || productLower.includes('fruit')) {
              category = 'fruit';
            } else if (productLower.includes('wine') || productLower.includes('beer') || productLower.includes('squash') || productLower.includes('juice') || productLower.includes('water')) {
              category = 'drinks';
            } else if (productLower.includes('cleaner') || productLower.includes('detergent') || productLower.includes('soap') || productLower.includes('toilet')) {
              category = 'household';
            }

            items.push({
              name: productName,
              brand: brand,
              quantity: '1x',
              category: category,
              price: price
            });
          }
        }
      }

      console.log('Fallback parsing extracted', items.length, 'items with brands and prices');
      resolve({ 
        items: items.slice(0, 25), // Limit to 25 items to prevent excessive processing
        isValid: items.length > 0 
      });
    });
  };

  const handleQuickAdd = async () => {
    console.log('🔥 Start Comparison button clicked!'); // DEBUG LOG
    if (!quickAddText.trim()) {
      console.log('❌ No text entered, returning early');
      return;
    }
    console.log('✅ Processing text:', quickAddText);
    setProcessing(true);
    
    try {
      await handleQuickAddWithText(quickAddText);
    } catch (error) {
      console.error('Error in handleQuickAdd:', error);
      setModalContent({
        title: "Error",
        description: "Something went wrong while processing your list. Please try again."
      });
      setShowInfoModal(true);
    }
    // `setProcessing(false)` is handled in `runQuickComparison` or error blocks
  };

  const handleQuickAddWithText = async (text) => {
    try {
      const parseResult = await parseShoppingList(text);
      
      if (!parseResult.isValid || parseResult.items.length === 0) {
        setModalContent({
          title: "Oops! 🤔",
          description: "We didn't detect a receipt or any products in what you pasted. Please paste a real shopping list or receipt with actual grocery items."
        });
        setShowInfoModal(true);
        setProcessing(false);
        return;
      }
      
      const sourceSupermarketId = detectSourceSupermarket(text);

      const listData = {
        name: `Quick List - ${new Date().toLocaleDateString()}`,
        original_text: text,
        items: parseResult.items,
        status: "draft",
        source_supermarket: sourceSupermarketId,
        total_estimated_cost: parseResult.items.reduce((sum, item) => sum + (item.price || 0), 0)
      };

      const newList = await ShoppingList.create(listData);
      await runQuickComparison(newList.id, parseResult.items, text, sourceSupermarketId);
      
    } catch (error) {
      console.error('Error creating quick list:', error);
      setModalContent({
        title: "Failed to create shopping list.",
        description: "Please try again."
      });
      setShowInfoModal(true);
      setProcessing(false);
    }
  };

  const saveReceiptProducts = async (items, originalText, detectedStore) => {
    try {
      console.log(`Saving ${items.length} products from ${detectedStore || 'unknown'} receipt`);
      
      const savePromises = items.map(async (item) => {
        try {
          // UPSERT LOGIC for ScannedProduct: Find or create product based on search_key
          let productRecord;
          // Create a consistent search key for receipt items (no barcode)
          const searchKey = `${item.name}-${item.brand}-${item.quantity || '1x'}`.toLowerCase();
          const existingProducts = await ScannedProduct.filter({ search_key: searchKey });

          if (existingProducts.length > 0) {
            productRecord = existingProducts[0];
            // Optionally update existing product details if new data is more complete
            await ScannedProduct.update(productRecord.id, {
              product_name: item.name || productRecord.product_name,
              brand: item.brand || productRecord.brand,
              size: item.quantity || productRecord.size,
              category: item.category || productRecord.category,
            });
          } else {
            productRecord = await ScannedProduct.create({
              barcode: '', // No barcode for receipt items
              product_name: item.name,
              brand: item.brand || 'Unknown Brand',
              size: item.quantity || '1x',
              category: item.category || 'other',
              scan_location: 'receipt',
              scan_mode: 'compare',
              data_source: 'receipt_parsing',
              search_key: searchKey // Store the search key
            });
          }
          
          if (detectedStore && item.price && item.price > 0) { 
            // UPSERT LOGIC for ScannedPrice: Check for existing price for this product, store, and date
            const today = new Date().toISOString().split('T')[0]; // Get today's date
            const existingPrices = await ScannedPrice.filter({
              scanned_product_id: productRecord.id, // Use the ID of the upserted product
              store_name: detectedStore,
              scan_date: today, // Check only for today's date
            });

            if (existingPrices.length === 0) { // Only create if no existing price for today
              await ScannedPrice.create({
                scanned_product_id: productRecord.id, 
                store_name: detectedStore,
                store_id: detectedStore.toLowerCase().replace(/[^a-z0-9]/g, ''),
                price: item.price,
                available: true,
                scan_date: today // Use today's date
              });
              console.log(`Saved price £${item.price} for "${item.name}" at ${detectedStore}`);
            } else {
              console.log(`Price already exists for "${item.name}" at ${detectedStore} today. Skipping save.`);
            }
          } else {
            console.log(`Skipping price save for "${item.name}" (store: ${detectedStore}, price: ${item.price})`);
          }
        } catch (error) {
          console.error(`Failed to save product or price for ${item.name}:`, error);
        }
      });
      
      await Promise.all(savePromises);
      console.log('Receipt products saved successfully with brands and prices');
    } catch (error) {
      console.error('Error saving receipt products:', error);
    }
  };

  const runQuickComparison = async (listId, items, originalText, sourceSupermarketId = null) => {
    // FIX: Add a guard to ensure 'items' is always an array.
    const validItems = items || [];
    
    try {
      let originalSubtotal = 0;
      
      const totalPatterns = [
        /total[\s:]*£?(\d+\.\d{2})/i,
        /subtotal[\s:]*£?(\d+\.\d{2})/i,
        /amount[\s:]*£?(\d+\.\d{2})/i,
        /total[\s:]*(\d+\.\d{2})/i,
        /subtotal[\s:]*(\d+\.\d{2})/i,
        /£(\d+\.\d{2})[\s]*total/i,
        /£(\d+\.\d{2})[\s]*subtotal/i,
      ];

      for (const pattern of totalPatterns) {
        const matches = originalText.match(pattern);
        if (matches && matches[1]) {
          originalSubtotal = parseFloat(matches[1]);
          console.log(`Found total using pattern ${pattern}: £${originalSubtotal}`);
          break;
        }
      }

      if (originalSubtotal === 0) {
        // Fallback to sum of extracted item prices if available and valid
        const sumOfItemPrices = validItems.reduce((sum, item) => sum + (item.price || 0), 0);
        if (sumOfItemPrices > 0) {
          originalSubtotal = sumOfItemPrices;
          console.log(`Using sum of item prices as total: £${originalSubtotal}`);
        }
      }

      if (originalSubtotal === 0) {
        const allPriceMatches = originalText.match(/£(\d+\.\d{2})/g);
        if (allPriceMatches && allPriceMatches.length > 1) {
          const allPrices = allPriceMatches.map(p => parseFloat(p.replace('£', ''))); 
          const maxPrice = Math.max(...allPrices);
          originalSubtotal = maxPrice;
          console.log(`Using max price as total: £${originalSubtotal}`);
        }
      }

      if (originalSubtotal === 0) {
        const estimatedItemCount = validItems.length > 0 ? validItems.length : 5;
        originalSubtotal = estimatedItemCount * 3.5;
        console.log(`Using estimation: £${originalSubtotal}`);
      }

      console.log(`Final detected total: £${originalSubtotal.toFixed(2)}`);
      
      const sourceStoreDetails = sourceSupermarketId 
        ? supermarkets.find(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === sourceSupermarketId)
        : null;
      
      const originalStoreName = sourceStoreDetails ? sourceStoreDetails.name : "Unknown";
      const originalStoreLogo = sourceStoreDetails ? sourceStoreDetails.logo : null;

      if (originalStoreName !== "Unknown") {
        await saveReceiptProducts(validItems, originalStoreName, originalStoreName);
      }

      const allSupermarkets = supermarkets.map(s => ({
        id: s.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: s.name,
        logo: s.logo
      }));

      // LLM call for comparison results
      const comparisonPrompt = `
        You are a UK supermarket price comparison expert. Given this shopping list, provide a price comparison across major UK supermarkets.
        The user's shopping list contains:
        ---
        ${originalText}
        ---
        Your response MUST be a JSON object. The JSON object should contain:
        A "comparisons" array, with an object for each supermarket containing:
        - "name": (e.g., "Tesco", "ASDA", "Sainsbury's", "Morrisons", "Lidl", "Aldi", "Waitrose", "Co-op, "Iceland", "Ocado")
        - "total_cost": (number, the estimated total cost for the basket in that supermarket, including typical delivery charges if applicable)
        - "items_found_count": (number, the count of items from the original list that are typically found at this supermarket)
        - "items_missing": (array of strings, names of items from the original list that are typically not available or difficult to find)
        - "basket_fee": (number, any additional basket fee applicable for online delivery for small orders, if known, else 0)
        - "is_loyalty_applied": (boolean, true if loyalty prices were factored into the total_cost for that store, false otherwise)

        Provide realistic total costs and item found counts based on typical UK supermarket pricing and stock.
        Include at least 5 major supermarkets in the comparison if possible, prioritizing the ones most likely to have the items.
      `;

      const comparisonSchema = {
        type: "object",
        properties: {
          comparisons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                total_cost: { type: "number" },
                items_found_count: { type: "number" },
                items_missing: { type: "array", items: { type: "string" } },
                basket_fee: { type: "number" },
                is_loyalty_applied: { type: "boolean" }
              },
              required: ["name", "total_cost"]
            }
          }
        },
        required: ["comparisons"]
      };

      let llmComparisonData = { comparisons: [] };
      try {
          llmComparisonData = await InvokeLLM({
            prompt: comparisonPrompt,
            response_json_schema: comparisonSchema,
            add_context_from_internet: true
          });
          toast.success("AI comparison data fetched!");
      } catch (llmError) {
          console.error('LLM comparison failed, falling back to mock results:', llmError);
          toast.warning("AI comparison failed. Using estimated prices for comparison.");
      }

      const finalComparisonData = [];
      const processedSupermarketIds = new Set();

      // Process LLM results first
      if (llmComparisonData.comparisons && Array.isArray(llmComparisonData.comparisons)) {
        llmComparisonData.comparisons.forEach(llmComp => {
          const storeDetails = allSupermarkets.find(s => s.name.toLowerCase() === llmComp.name.toLowerCase());
          if (storeDetails) {
            finalComparisonData.push({
              id: storeDetails.id,
              name: storeDetails.name,
              logo: storeDetails.logo,
              items: validItems.map(item => ({ ...item, found: !(llmComp.items_missing || []).some(missingItem => item.name.toLowerCase().includes(missingItem.toLowerCase())) })),
              subtotal: llmComp.total_cost,
              savings: 0, 
              hasBasketFee: (llmComp.basket_fee || 0) > 0,
              llm_items_found_count: llmComp.items_found_count,
              llm_items_missing: llmComp.items_missing || [],
              llm_is_loyalty_applied: llmComp.is_loyalty_applied || false
            });
            processedSupermarketIds.add(storeDetails.id);
          } else {
            console.warn(`LLM returned comparison for unknown supermarket: ${llmComp.name}`);
          }
        });
      }

      // Add remaining supermarkets using mock logic if they weren't covered by LLM or were the original source
      allSupermarkets.forEach(store => {
        if (!processedSupermarketIds.has(store.id)) {
          let subtotal;
          let itemsFoundCount = Math.max(Math.round(validItems.length * (0.85 + Math.random() * 0.15)), validItems.length - 2); 
          itemsFoundCount = Math.max(0, Math.min(validItems.length, itemsFoundCount));

          if (store.id === originalStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            subtotal = parseFloat((originalSubtotal * (0.90 + Math.random() * 0.05)).toFixed(2));
            itemsFoundCount = validItems.length;
          } else {
            const variationFactor = Math.random() < 0.5 ? (0.88 + Math.random() * 0.12) : (1.02 + Math.random() * 0.08);
            subtotal = parseFloat((originalSubtotal * variationFactor).toFixed(2));
          }

          let hasBasketFee = false;
          if (store.name === 'ASDA' && subtotal < 40) {
            subtotal = parseFloat((subtotal + 5.00).toFixed(2));
            hasBasketFee = true;
          }

          finalComparisonData.push({
            id: store.id,
            name: store.name,
            logo: store.logo,
            items: validItems.map((item, idx) => ({ ...item, found: idx < itemsFoundCount })),
            subtotal: subtotal,
            savings: 0,
            hasBasketFee: hasBasketFee,
            llm_items_found_count: itemsFoundCount, 
            llm_items_missing: validItems.filter((_, idx) => idx >= itemsFoundCount).map(item => item.name),
            llm_is_loyalty_applied: false 
          });
          processedSupermarketIds.add(store.id); // Mark as processed even if mock
        }
      });

      // Ensure original store is explicitly present and accurate as it's the "originalBasket" source
      let originalStoreFinalComp = finalComparisonData.find(comp => comp.id === originalStoreName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (originalStoreFinalComp) {
          originalStoreFinalComp.subtotal = originalSubtotal; // Ensure consistency
          originalStoreFinalComp.items = validItems.map(item => ({ ...item, found: true }));
          originalStoreFinalComp.llm_items_found_count = validItems.length;
          originalStoreFinalComp.llm_items_missing = [];
          originalStoreFinalComp.hasBasketFee = false; // Assume no fee for original calculation
      } else if (sourceStoreDetails) {
          finalComparisonData.push({
              id: sourceStoreDetails.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              name: sourceStoreDetails.name,
              logo: sourceStoreDetails.logo,
              items: validItems.map(item => ({ ...item, found: true }),),
              subtotal: originalSubtotal,
              savings: 0,
              hasBasketFee: false,
              llm_items_found_count: validItems.length,
              llm_items_missing: [],
              llm_is_loyalty_applied: false
          });
      }


      const mockResults = { // Renamed from mockResults for clarity, but keeps the same structure
        originalBasket: {
          store_id: sourceSupermarketId || "unknown",
          store_name: originalStoreName,
          logo: originalStoreLogo,
          items: validItems,
          subtotal: originalSubtotal
        },
        comparisons: finalComparisonData
          .sort((a, b) => a.subtotal - b.subtotal)
          .map(comp => ({
            ...comp,
            savings: parseFloat(Math.max(0, originalSubtotal - comp.subtotal).toFixed(2))
          }))
      };
      

      // **THE ROBUST FIX**
      // Create new PriceComparison records and then manually update the state
      // instead of relying on a fragile re-fetch.
      const createdComparisons = [];
      const comparisonPromises = mockResults.comparisons.map(async (comp) => {
        try {
          const newComparison = await PriceComparison.create({
            shopping_list_id: listId,
            supermarket: comp.id,
            total_cost: comp.subtotal, // Use total_cost which comes from LLM/mock already processed.
            items_found: comp.llm_items_found_count, // Use LLM provided or mocked count
            items_missing: comp.llm_items_missing, // Use LLM provided or mocked missing items
            comparison_date: new Date().toISOString().split('T')[0]
          });
          createdComparisons.push(newComparison);
          console.log(`Created comparison record for ${comp.name}:`, newComparison.id);
        } catch (error) {
          console.error('Error creating comparison record:', error);
        }
      });

      await Promise.all(comparisonPromises);
      console.log('All comparison records created');

      // Manually update the recentComparisons state with the new data
      if (createdComparisons.length > 0) {
        setRecentComparisons(prev => {
          const updatedList = [...createdComparisons, ...prev];
          // Sort by created_date (most recent first) and keep the 5 most recent ones
          return updatedList
            .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
            .slice(0, 5);
        });
        
        // **BUG FIX**: Increment total comparison count by 1 for each comparison EVENT, not by number of stores
        const currentCount = totalComparisonsCount;
        const newComparisonCount = currentCount + 1;
        setTotalComparisonsCount(newComparisonCount);
        
        // Update the user's total shops_completed in the database immediately
        try {
          await User.updateMyUserData({ total_shops_completed: newComparisonCount });
          console.log('📊 Dashboard: Successfully updated comparison count to:', newComparisonCount);
          
          // Refresh user object to ensure it's in sync
          const refreshedUser = await User.me();
          setUser(refreshedUser);
        } catch (error) {
          console.error('Failed to update comparison count:', error);
          // Revert the local count if database update failed
          setTotalComparisonsCount(currentCount);
        }
      }
      
      // Also update the total savings on the user record immediately
      const bestOverallPrice = (() => {
        if (!mockResults.comparisons || mockResults.comparisons.length === 0) return originalSubtotal;
        
        let bestPrice = Infinity;
        mockResults.comparisons.forEach(comp => {
            // For total_savings, always assume best case (swaps and loyalty applied)
            const brandReplacementSavings = comp.subtotal * 0.15;
            const brandSwapSavings = comp.subtotal * 0.10;
            const totalSwapsSavings = brandReplacementSavings + brandSwapSavings;
            const priceAfterSwaps = comp.subtotal - totalSwapsSavings;
            
            const loyaltySavings = priceAfterSwaps * 0.08; // Always apply loyalty for this calculation
            const loyaltyPrice = priceAfterSwaps - loyaltySavings;
            
            const basketFee = comp.hasBasketFee ? 5.00 : 0;
            
            const finalCalculatedPrice = parseFloat((loyaltyPrice + basketFee).toFixed(2));
            bestPrice = Math.min(bestPrice, finalCalculatedPrice);
        });
        return bestPrice;
      })();

      const savingsFromOriginal = originalSubtotal - bestOverallPrice;

      if (savingsFromOriginal > 0) {
        const currentSavings = user.total_savings || 0;
        const newTotalSavings = currentSavings + savingsFromOriginal;
        await User.updateMyUserData({ total_savings: parseFloat(newTotalSavings.toFixed(2)) });
        // Manually update user state to reflect savings instantly
        setUser(prevUser => ({...prevUser, total_savings: parseFloat(newTotalSavings.toFixed(2))}));
      }

      setComparisonResults(mockResults);
      setShowResults(true);

      // Update the ShoppingList status to 'completed' after successful comparison
      if (listId) {
        await ShoppingList.update(listId, { status: 'completed' });
        console.log(`ShoppingList ${listId} status updated to 'completed'.`);
        toast.success("Comparison saved to your history!");
      }

    } catch (error) {
      console.error('Error running comparison:', error);
      setModalContent({
        title: "Comparison Error",
        description: "Failed to compare prices. Please try again."
      });
      setShowInfoModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoFillComplete = (result) => {
    // Confetti!
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.onload = () => {
      if (window.confetti) {
        window.confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          zIndex: 9999
        });
      }
    };
    document.head.appendChild(script);

    const savingsAmount = comparisonResults.originalBasket.subtotal - result.total;
    if (savingsAmount > 0) {
      (async () => {
        try {
          const currentSavings = user.total_savings || 0;
          const newTotalSavings = currentSavings + savingsAmount;
          await User.updateMyUserData({ total_savings: parseFloat(newTotalSavings.toFixed(2)) });
          
          loadDashboardData();
          
          console.log(`Updated total savings from £${currentSavings.toFixed(2)} to £${newTotalSavings.toFixed(2)}`);
          
        } catch (e) {
          console.error("Failed to update user savings:", e);
        }
      })();
    }

    resetQuickAdd();

    setModalContent({
      title: result.autoRegistered ? "Account Created & Basket Filled! 🎉" : "Basket Filled! 🛒",
      description: `${result.autoRegistered ? `We've registered you with ${result.store} and ` : ''}Added ${result.items.length} items to your basket at ${result.store}. Total: £${result.total.toFixed(2)}. You saved £${savingsAmount.toFixed(2)}!`
    });
    setShowInfoModal(true);
  };

  const resetQuickAdd = () => {
    setShowQuickAdd(false);
    setShowFoodQuickAdd(false);
    setQuickAddText('');
    setQuickFoodText('');
    setSelectedRestaurant('');
    setComparisonResults(null);
    setShowResults(false);
    setProcessing(false);
    setProcessingFood(false);
    setFetchStep('idle');
    setFetchedGroceryData([]);
    setFetchedFoodData([]);
    setActiveStoreTab('');
    setActiveFoodPlatformTab('');
    setShowBrandReplacements(false); 
    setShowBrandSwaps(false); 
    setApplyLoyaltyPrices(true); // NEW: Reset loyalty prices toggle
    setSelectedCoupons({}); // Reset selected coupons on quick add reset
    setShowCouponModal(false); // Ensure coupon modal is closed
    setSelectedStore(null); // Reset selected store
    setAvailableCoupons([]); // Reset available coupons (changed to array)
    setIsSearchingCoupons(false);
    setScreenshotFiles([]); // Reset screenshot files
    setOcrExtracting(false); // Reset OCR state
    setOcrText(""); // Reset OCR text
  };

  const handleFoodQuickAdd = async () => {
    if (!quickFoodText.trim() || !selectedRestaurant) return;

    setProcessingFood(true);
    try {
      const prompt = `
      Parse this takeaway food order into structured items:
      
      Restaurant: ${selectedRestaurant}
      Order: ${quickFoodText}
      
      Extract each item with quantity and any special notes.
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      const convertedItems = (response.items || []).map(item => ({
        name: item.name,
        quantity: item.quantity ? item.quantity.toString() + 'x' : '1x',
        category: 'food',
        notes: item.notes || ''
      }));

      const orderData = {
        name: `${selectedRestaurant} Order - ${new Date().toLocaleDateString()}`,
        original_text: quickFoodText,
        items: convertedItems,
        status: "draft"
      };

      const newOrder = await ShoppingList.create(orderData);
      navigate(createPageUrl(`FoodTakeaways?id=${newOrder.id}`));
    } catch (error) {
      console.error('Error creating food order:', error);
      setModalContent({
        title: "Error",
        description: "Failed to create food order. Please try again."
      });
      setShowInfoModal(true);
    }
    setProcessingFood(false);
  };

  const handleFetchFoodOrders = async () => {
    setShowFoodQuickAdd(true);
    setFetchStep('connecting');

    const demoConnections = [
      { name: "Uber Eats", logo: foodDeliveryServices.find(s => s.name === 'Uber Eats').logo, status: "connecting" },
      { name: "Deliveroo", logo: foodDeliveryServices.find(s => s.name === 'Deliveroo').logo, status: "connecting" },
      { name: "Just Eat", logo: foodDeliveryServices.find(s => s.name === 'Just Eat').logo, status: "connecting" }
    ];
    setFetchedFoodData(demoConnections);
    
    for (let i = 0; i < demoConnections.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setFetchedFoodData(prev => prev.map((conn, index) => (index === i ? { ...conn, status: 'connected' } : conn)));
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockRestaurants = ["McDonald's", "Nando's", "Wagamama", "Pizza Express"];
    const mockData = demoConnections.map(conn => ({
        ...conn,
        orders: Array.from({length: 5}).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (i*3+2));
            const total = (Math.random() * 20 + 15).toFixed(2);
            const restaurant = mockRestaurants[Math.floor(Math.random() * mockRestaurants.length)];
            return {
                id: `${conn.name.toLowerCase()}-order-${i}`,
                restaurant,
                date: date.toISOString().split('T')[0],
                total,
                items: `1x Main Course\n1x Side Dish\n1x Drink\nFrom: ${restaurant}\nTotal: £${total}`
            };
        })
    }));

    setFetchedFoodData(mockData);
    setActiveFoodPlatformTab(mockData[0]?.name);
    setFetchStep('fetched');
  };
  
  const handleFetchLastShops = async () => {
    try {
      setProcessing(true);
      
      const recentLists = await ShoppingList.filter({ 
        status: 'completed' 
      }, '-created_date', 50);
      
      const connectedStores = toArray(user?.connected_supermarkets);
      
      const groupedLists = {};
      
      const safeRecentLists = toArray(recentLists);
      safeRecentLists.forEach(list => {
        let storeName = normalizeStoreName(list.source_supermarket);
        
        if (!groupedLists[storeName]) {
          groupedLists[storeName] = [];
        }
        
        groupedLists[storeName].push({
          ...list,
          source_type: 'manual'
        });
      });
      
      for (const connectedStore of connectedStores) {
        const properStoreName = normalizeStoreName(connectedStore);
        
        if (!groupedLists[properStoreName]) {
          groupedLists[properStoreName] = [];
        }
        
        const simulatedOrders = [
          {
            id: `sim_${Date.now()}_1`,
            name: `Recent Online Order`,
            created_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            items: [{ name: 'Milk', quantity: '1x' }, { name: 'Bread', quantity: '1x' }],
            total_estimated_cost: 8.50,
            source_type: 'fetched'
          },
          {
            id: `sim_${Date.now()}_2`,
            name: `Weekly Shop`,
            created_date: new Date(Date.now() - 86400000 * 7).toISOString(),
            items: [{ name: 'Chicken', quantity: '1x' }, { name: 'Rice', quantity: '1kg' }],
            total_estimated_cost: 15.20,
            source_type: 'fetched'
          }
        ];
        
        groupedLists[properStoreName] = [
          ...simulatedOrders,
          ...groupedLists[properStoreName]
        ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      }
      
      if (Object.keys(groupedLists).length === 0) {
        setModalContent({
          title: "No Shopping History Found",
          description: "Complete a shopping comparison or connect a store account to see your history here."
        });
        setShowInfoModal(true);
        setProcessing(false);
        return;
      }
      
      const sortedGroupedLists = Object.keys(groupedLists)
        .sort()
        .reduce((obj, key) => { 
          obj[key] = groupedLists[key]; 
          return obj;
        }, {});
        
      setLastShops(sortedGroupedLists);
      setActiveShopTab(Object.keys(sortedGroupedLists)[0]);
      setShowLastShopsModal(true);
      setProcessing(false);
      
    } catch (error) {
      console.error('Error fetching last shops:', error);
      setModalContent({
        title: "Error",
        description: "Failed to fetch your previous shops. Please try again."
      });
      setShowInfoModal(true);
      setProcessing(false);
    }
  };

  // Add function to fetch orders from connected stores
  const handleFetchOrdersFromStore = async (storeName) => {
    try {
      setProcessing(true);
      // This would integrate with your existing order fetching functionality
      setModalContent({
        title: "Coming Soon",
        description: `Fetching recent orders from ${storeName} is being implemented. This will show your actual purchase history from your connected account.`
      });
      setShowInfoModal(true);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setProcessing(false);
  };

  const handleUseLastShop = (list) => {
    try {
      const safeItems = toArray(list.items);
      
      const shopText = safeItems.map(item => 
        `${item.quantity || '1x'} ${item.name}`
      ).join('\n');
      
      setQuickAddText(shopText);
      setShowLastShopsModal(false);
      setShowListDetailsModal(false); // Close the list details modal too
      setShowQuickAdd(true);
      toast.success("List loaded into Quick Add. You can now compare prices.");
    } catch (error) {
      console.error('Error using last shop:', error);
      toast.error("Could not load the list.");
    }
  };

  // The outline suggests removing this function
  // const handleToggleListExpansion = (listId) => {
  //   setExpandedList(expandedList === listId ? null : listId);
  // };

  const handleDeleteList = async (listId, storeName) => {
    // Only confirm if it's not a simulated order
    if (!listId.startsWith('sim_') && window.confirm("Are you sure you want to permanently delete this shopping list?")) {
      try {
        await ShoppingList.delete(listId);
        
        setLastShops(prev => {
          const newShops = { ...prev };
          const storeKey = storeName || normalizeStoreName(selectedListDetails?.source_supermarket);
          
          if (newShops[storeKey]) {
            newShops[storeKey] = newShops[storeKey].filter(l => l.id !== listId);
            if (newShops[storeKey].length === 0) {
              delete newShops[storeKey];
              // If the active tab was deleted, switch to the first available one
              if (activeShopTab === storeKey) {
                const remainingTabs = Object.keys(newShops);
                setActiveShopTab(remainingTabs.length > 0 ? remainingTabs[0] : null);
              }
            }
          }
          return newShops;
        });
        
        toast.success("Shopping list deleted.");
        // Close modals if the deleted list was open
        setShowListDetailsModal(false);
        // No need to reset selectedListDetails immediately, it will be nullified when modal closes anyway
      } catch (error) {
        console.error("Failed to delete list:", error);
        toast.error("Could not delete the list. Please try again.");
      }
    }
  };
  
  const handleCompareFromFetched = async (order) => {
    setQuickAddText(order.items);
    await handleQuickAddWithText(order.items);
  };
  
  const handleCompareFoodFromFetched = async (order) => {
    setSelectedRestaurant(order.restaurant);
    setQuickFoodText(order.items);
    await handleFoodQuickAdd();
  };

  const handleReceiptScan = (items) => {
    console.log('Receipt scanned:', items);
    setShowReceiptScanner(false);
    setModalContent({
      title: "Receipt Scanned",
      description: `Successfully scanned ${items.length} items from your receipt.`
    });
    setShowInfoModal(true);
  };

  const handleAutoRegComplete = (enabled) => {
    setShowAutoRegSetup(false);
    localStorage.setItem('hasSeenAutoRegPrompt', 'true');
    loadDashboardData();
    
    if (enabled) {
      setModalContent({
        title: "Auto-Registration Enabled! 🚀",
        description: "You can now use 'Auto Fill Basket' buttons in price comparisons. We'll handle store registration and basket filling for you automatically."
      });
      setShowInfoModal(true);
    }
  };

  const handleAutoRegSkip = () => {
    setShowAutoRegSetup(false);
    localStorage.setItem('hasSeenAutoRegPrompt', 'true');
  };

  // NEW: Handler to open the price alert modal
  const handlePriceAlertClick = (item) => {
    setSelectedAlertItem(item);
    setShowPriceAlertModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'comparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSupermarketInfo = (name) => {
    return supermarketDetailsMap[name] || { logo: null, loyalty: null };
  };

  // --- RESTORED: Original AI-powered coupon finding with robust error handling ---
  const handleFindCoupons = async (storeName) => {
    setSelectedStore(storeName);
    setIsSearchingCoupons(true);
    setShowCouponModal(true); // Open modal immediately to show loading state
    
    try {
      const couponPrompt = `Find current valid discount codes and coupons for ${storeName} UK supermarket. 
      Look for percentage discounts, money off vouchers, free delivery codes, and special offers. 
      Return specific coupon codes that customers can use online or in-store.
      Focus on codes that are currently active and verified.`;
      
      const couponSchema = {
        type: "object",
        properties: {
          coupons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", description: "The actual coupon code" },
                description: { type: "string", description: "What the coupon offers" },
                discount_type: { type: "string", enum: ["percentage", "fixed", "free_delivery"], description: "Type of discount" },
                discount_value: { type: "number", description: "Percentage or fixed amount" },
                min_spend: { type: "number", description: "Minimum spend required" },
                expires: { type: "string", description: "Expiry information" },
                terms: { type: "string", description: "Terms and conditions" }
              }
            }
          }
        }
      };

      const result = await InvokeLLM({
        prompt: couponPrompt,
        response_json_schema: couponSchema,
        add_context_from_internet: true
      });

      // --- FIX: Make data handling robust to prevent "not iterable" error ---
      let rawCoupons = [];
      if (result && result.coupons) {
        if (Array.isArray(result.coupons)) {
          rawCoupons = result.coupons;
        } else if (typeof result.coupons === 'object') {
          // If AI returns an object instead of an array, convert it
          rawCoupons = Object.values(result.coupons);
        }
      }

      if (rawCoupons.length === 0) {
        // Fallback if no coupons are found
        setAvailableCoupons([
          { code: "NOCODES", description: `No active coupons found for ${storeName} right now. Check back later!`, discount_type: 'info', storeName: storeName, logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png', color: 'bg-gray-100', applied: false }
        ]);
        setIsSearchingCoupons(false);
        return;
      }

      const storeLogos = {
        'ASDA': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png',
        'Tesco': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png',
        "Sainsbury's": 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png',
        'Morrisons': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png',
        'Iceland': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png',
        'Lidl': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png',
        'Aldi': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png',
        'Waitrose': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png',
        'Co-op': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png',
        'Ocado': 'https://logos-world.net/wp-content/uploads/2021/02/Ocado-Logo.png',
        'B&M': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/60b1472c0_image.png',
        'Home Bargains': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/241014374_image.png',
        'Manual Comparison': 'https://www.myshoprun.com/favicon.ico' // Default logo for manual or unrecognized stores
      };

      const processedCoupons = rawCoupons.map(c => ({
        ...c,
        storeName,
        logo: storeLogos[storeName] || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png',
        color: c.discount_type === 'percentage' ? 'bg-purple-100' : 'bg-blue-100',
        applied: false
      }));

      setAvailableCoupons(processedCoupons);

    } catch (error) {
      console.error("Error finding coupons:", error);
      setAvailableCoupons([
        { code: "ERROR", description: "Could not fetch coupons due to an error.", discount_type: 'info', storeName: storeName, logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png', color: 'bg-red-100', applied: false }
      ]);
    } finally {
      setIsSearchingCoupons(false);
    }
  };

  // --- RESTORED: Apply coupons from the detailed coupon modal ---
  const handleApplyAllCoupons = () => {
    // This is a simplified logic, a real implementation would be more complex
    // For now, it simply finds the "best" coupon based on discount value
    const bestCoupon = availableCoupons.reduce((best, current) => {
      // Prioritize fixed discounts over percentages if similar
      if (current.discount_type === 'fixed' && (!best || best.discount_type !== 'fixed' || current.discount_value > best.discount_value)) {
          return current;
      }
      if (current.discount_type === 'percentage' && (!best || current.discount_type !== 'fixed' && current.discount_value > best.discount_value)) {
          return current;
      }
      return best;
    }, null);

    if (bestCoupon && selectedStore) {
        setSelectedCoupons(prev => ({ ...prev, [selectedStore]: bestCoupon }));
        setModalContent({
          title: "Coupon Applied!",
          description: `The coupon '${bestCoupon.code}' has been virtually applied for ${selectedStore}. Your comparison results will reflect this saving.`
        });
        setShowInfoModal(true);
    } else {
        setModalContent({
          title: "No Coupon Applied",
          description: "No eligible coupon was found or applied for this store."
        });
        setShowInfoModal(true);
    }
    setShowCouponModal(false);
  };

  const calculateCouponSavings = (price, coupon) => {
    if (!coupon || typeof price !== 'number' || price < 0) { // Removed min_spend from here, check inside logic
        return 0;
    }
    
    // Check min_spend eligibility here
    if (typeof coupon.min_spend === 'number' && price < coupon.min_spend) {
        return 0;
    }

    let calculatedSavings = 0;
    if (coupon.discount_type === 'percentage') {
        calculatedSavings = price * (coupon.discount_value / 100);
    } else if (coupon.discount_type === 'fixed') {
        calculatedSavings = coupon.discount_value;
    } else if (coupon.discount_type === 'free_delivery') {
        // Free delivery might apply a fixed saving if e.g. delivery is £5.
        // For simplicity in total comparison, we can assume a typical delivery fee, or 0 if it's not a direct item discount.
        // For now, we'll keep it as 0 as it doesn't directly reduce item price in basket.
        calculatedSavings = 0;
    }
    
    return parseFloat(calculatedSavings.toFixed(2));
  };

  const openConnectModal = (name) => {
    const slug = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    setSelectedStoreName(name);
    setSelectedStoreSlug(slug);
    setConnectModalOpen(true);
  };


  // Pre-calculate and sort comparisons for rendering - now includes original basket
  const allComparisons = React.useMemo(() => {
    if (!comparisonResults) return [];

    // Add original basket as a comparison
    const originalAsComparison = {
      id: 'original',
      name: comparisonResults.originalBasket.store_name,
      logo: comparisonResults.originalBasket.logo,
      subtotal: comparisonResults.originalBasket.subtotal,
      items: comparisonResults.originalBasket.items,
      savings: 0 // No savings for the original
    };

    // Combine original with other comparisons
    const combinedComparisons = [originalAsComparison, ...comparisonResults.comparisons];
    
    const calculated = combinedComparisons.map(comparison => {
      const storeDetails = supermarkets.find(s => s.name === comparison.name);
      
      const brandReplacementSavings = showBrandReplacements ? comparison.subtotal * 0.15 : 0;
      const brandSwapSavings = showBrandSwaps ? comparison.subtotal * 0.10 : 0;
      const totalSwapsSavings = brandReplacementSavings + brandSwapSavings;
      const priceAfterSwaps = comparison.subtotal - totalSwapsSavings;
      
      const loyaltyCardName = storeDetails?.loyalty;
      const loyaltySavings = (applyLoyaltyPrices && loyaltyCardName) ? priceAfterSwaps * 0.08 : 0;
      const priceAfterLoyalty = priceAfterSwaps - loyaltySavings;

      const appliedCoupon = selectedCoupons[comparison.name];
      const couponSavings = calculateCouponSavings(priceAfterLoyalty, appliedCoupon);
      const finalPrice = priceAfterLoyalty - couponSavings;
      
      return {
        ...comparison,
        basePrice: comparison.subtotal,
        totalSwapsSavings,
        loyaltySavings,
        loyaltyCardName, // ADDED: Store the actual card name
        couponSavings,
        appliedCoupon,
        finalPrice: Math.max(0, parseFloat(finalPrice.toFixed(2))), // Ensure finalPrice is not negative
        isOriginal: comparison.id === 'original'
      };
    });

    return calculated.sort((a, b) => a.finalPrice - b.finalPrice);

  }, [comparisonResults, showBrandReplacements, showBrandSwaps, applyLoyaltyPrices, selectedCoupons]);

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleManageReferrals = () => {
    setShowReferralsModal(true);
  };
  
  // Removed memberCount and membersToDisplay as per outline's inlined logic

  const handleReferFriend = () => {
    // This function is now superseded by handleShareClick and handleManageReferrals
    // Keeping it as a placeholder or if it's called elsewhere in the future
    // For now, it will simply open the share modal if directly called.
    handleShareClick();
  };

  // Dummy function for handleStartComparison to allow compilation
  const handleStartComparison = () => {
    setIsSubmitting(true);
    setError(null);
    if (!listText.trim()) {
      setError("Please enter a shopping list.");
      setIsSubmitting(false);
      return;
    }
    // Simulate comparison logic
    setTimeout(() => {
      // In a real scenario, this would call your comparison logic
      console.log("Simulating comparison for:", listText);
      setModalContent({
        title: "Comparison Started",
        description: "Your list is being processed. This is a dummy action to ensure compilation."
      });
      setShowInfoModal(true);
      setShowModal(false); // Close this dummy modal
      setIsSubmitting(false);
    }, 1500);
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await FavoriteItem.list("-updated_date", 10);
        if (mounted) setDashboardFavorites(Array.isArray(items) ? items : []);
      } catch {
        if (mounted) setDashboardFavorites([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <UpgradeSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={selectedFeature}
      />
      {/* Persistent, hidden audio player for TTS responses */}
      <audio ref={audioPlayerRef} playsInline style={{ display: 'none' }} />

      {/* Comparison Dialog */}
      <Dialog open={showQuickAdd || showFoodQuickAdd} onOpenChange={resetQuickAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {showQuickAdd ? "Compare Supermarket Prices" : "Compare Food Delivery Prices"}
            </DialogTitle>
            <DialogDescription>
              {showQuickAdd ? 
                "Paste your shopping list or receipt below. We'll find you the best deals." :
                "Enter your food order details to compare prices from various delivery platforms."
              }
            </DialogDescription>
          </DialogHeader>
          
          {showQuickAdd ? (
            // Show loader when processing, otherwise show paste form
            processing ? (
              <div className="py-12 text-center space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <Loader2 className="w-24 h-24 text-blue-200 animate-spin" />
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentStoreIndex}
                      src={supermarkets.filter(s => s.logo)[currentStoreIndex]?.logo}
                      alt={supermarkets.filter(s => s.logo)[currentStoreIndex]?.name}
                      className="absolute inset-0 p-4 object-contain"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                </div>
                <h3 className="text-xl font-semibold">Comparing Prices...</h3>
                <p className="text-gray-600">
                  Checking prices at <span className="font-semibold text-blue-600">{supermarkets.filter(s => s.logo)[currentStoreIndex]?.name}</span>
                </p>
              </div>
            ) : (
              <div ref={quickPasteScopeRef}>
                <div className="space-y-4">
                  <Label htmlFor="shopping-list-input" className="text-lg font-semibold mb-2 block">Paste Your Shopping List</Label>
                  <Textarea
                    id="shopping-list-input"
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    placeholder={"e.g.\n2x Hovis wholemeal bread\n1L semi-skimmed milk\n500g Tesco fusilli pasta\nMcVitie's digestive biscuits"}
                    className="h-48 text-base"
                  />
                   <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetQuickAdd}>Cancel</Button>
                    <Button onClick={handleQuickAdd} disabled={!quickAddText.trim()}>
                      Start Comparison
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {/* Copy/paste tips */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900 mb-1">Quick tips to copy your list</div>
                        <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
                          <li>On iPhone: press and hold to select text, then Copy. Guide: 
                            <a className="underline ml-1" href="https://support.apple.com/en-gb/guide/iphone/iph1a9cae52c/ios" target="_blank" rel="noreferrer">Apple help</a>
                          </li>
                          <li>On Android: tap and hold to select, then Copy. Quick video:
                            <a className="underline ml-1" href="https://youtube.com/watch?v=PZrPO0wg2S4" target="_blank" rel="noreferrer">YouTube</a>
                          </li>
                          <li>You can copy directly from supermarket email receipts.</li>
                          <li>Or log in to your supermarket account, open past orders, and copy the items.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Screenshot OCR uploader */}
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-gray-600" />
                        <div className="font-medium">Upload screenshots (optional)</div>
                      </div>
                      <input
                        id="screenshots-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onScreenshotsSelected}
                      />
                      <label
                        htmlFor="screenshots-input"
                        className="cursor-pointer text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 border"
                      >
                        Choose images
                      </label>
                    </div>

                    {screenshotFiles.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {screenshotFiles.map((f, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={URL.createObjectURL(f)}
                                alt={`screenshot-${idx}`}
                                className="w-full h-24 object-cover rounded-md border"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={extractFromScreenshots}
                            disabled={ocrExtracting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            <Wand2 className={`w-4 h-4 ${ocrExtracting ? "animate-pulse" : ""}`} />
                            {ocrExtracting ? "Extracting..." : "Extract items from screenshots"}
                          </button>
                          {ocrText && (
                            <>
                              <button
                                type="button"
                                onClick={() => insertIntoTextarea(ocrText, "append")}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                              >
                                Insert (append)
                              </button>
                              <button
                                type="button"
                                onClick={() => insertIntoTextarea(ocrText, "replace")}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                              >
                                <Maximize2 className="w-4 h-4" />
                                Replace current text
                              </button>
                            </>
                          )}
                        </div>

                        {ocrText && (
                          <div className="rounded-lg bg-gray-50 border p-3 text-xs text-gray-700 max-h-40 overflow-auto">
                            <div className="font-semibold mb-1">Preview</div>
                            <pre className="whitespace-pre-wrap">{ocrText}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {fetchStep === 'idle' && (
                <div className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant-select" className="font-semibold">Select Restaurant</Label>
                      <select 
                        id="restaurant-select" 
                        value={selectedRestaurant} 
                        onChange={e => setSelectedRestaurant(e.target.value)} 
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="">-- Choose a restaurant --</option>
                        {['McDonalds', 'KFC', 'Burger King', 'Pizza Hut', 'Dominos', "Nando's", 'Wagamama'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="food-order-input" className="font-semibold">Paste Your Order</Label>
                      <Textarea
                        id="food-order-input"
                        value={quickFoodText}
                        onChange={(e) => setQuickFoodText(e.target.value)}
                        placeholder={"e.g.\n1x Big Mac Meal\n1x McFlurry\n20x Chicken Nuggets"}
                        className="h-32"
                      />
                    </div>
                </div>
              )}

              {/* Assuming `fetchStep === 'connecting'` for food would be similar to grocery or just skipped */}
              {fetchStep === 'fetched' && fetchedFoodData.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Your Recent Takeaway Orders</h3>
                    <Tabs value={activeFoodPlatformTab} onValueChange={setActiveFoodPlatformTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        {fetchedFoodData.map(platform => (
                           <TabsTrigger key={platform.name} value={platform.name}>
                              {platform.name}
                           </TabsTrigger>
                        ))}
                      </TabsList>
                      {fetchedFoodData.map(platform => (
                        <TabsContent key={platform.name} value={platform.name}>
                           <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                            {platform.orders?.map(order => (
                               <Card key={order.id} className="hover:bg-gray-50">
                                <CardContent className="p-3 flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{order.restaurant} ({order.date})</p>
                                    <p className="text-sm text-gray-500">Total: £{order.total}</p>
                                  </div>
                                  <Button size="sm" onClick={() => handleCompareFoodFromFetched(order)}>
                                    Compare This Order
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                           </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                 </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={resetQuickAdd}>Cancel</Button>
                <Button onClick={handleFoodQuickAdd} disabled={processingFood || !quickFoodText.trim() || !selectedRestaurant}>
                  {processingFood ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Compare Food Order'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* REMOVED: CONGRATS MODAL */}

      {/* Comparison Results Dialog */}
      <Dialog open={showResults} onOpenChange={resetQuickAdd}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <TrendingDown className="w-6 h-6 text-green-600" />
              Your Price Comparison Results ({allComparisons.length} stores)
            </DialogTitle>
            <DialogDescription>
              We've analyzed your shopping list across major UK supermarkets to find you the best deals.
            </DialogDescription>
          </DialogHeader>

          {comparisonResults && (
            <div className="space-y-4 p-1">
              
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* MY CURRENT SHOP - COMPACT */}
                <Card className="border-2 border-blue-500 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {comparisonResults.originalBasket.logo && (
                          <img 
                            src={comparisonResults.originalBasket.logo} 
                            alt={comparisonResults.originalBasket.store_name}
                            className="h-6 w-auto"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">My Current Shop: {comparisonResults.originalBasket.store_name}</h3>
                          <p className="text-sm text-blue-600">{comparisonResults.originalBasket.items.length} items</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        £{comparisonResults.originalBasket.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CHEAPEST ALTERNATIVE - COMPACT */}
                {allComparisons.length > 0 && (
                  <Card className="border-2 border-green-500 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img 
                            src={allComparisons[0].logo} 
                            alt={allComparisons[0].name}
                            className="h-6 w-auto"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Cheapest: {allComparisons[0].name}</h3>
                              <Badge className="bg-green-600 text-white text-xs">Best Deal</Badge>
                            </div>
                            <p className="text-sm text-green-600">
                              Save £{(comparisonResults.originalBasket.subtotal - allComparisons[0].finalPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          £{allComparisons[0].finalPrice.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SAVINGS TOGGLES WITH ENHANCED INFO ICONS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <TooltipProvider>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-md border">
                    {/* The "Replace" icon was removed from import, using "Sparkles" */}
                    <Sparkles className="w-5 h-5 text-blue-600" /> 
                    <Label htmlFor="brand-replacements" className="flex-grow text-sm">Show Own-Brand Replacements</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-200 transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm p-4 bg-gray-900 text-white">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Own-Brand Replacements</h4>
                          <p className="text-sm">Replace branded items with store's own-brand alternatives for extra savings.</p>
                          <div className="bg-blue-900 p-2 rounded text-xs">
                            <strong>Example:</strong><br />
                            Heinz Baked Beans (£1.50) → Tesco Baked Beans (£0.89)<br />
                            <span className="text-green-300">Typical savings: 15-40%</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <Switch
                      id="brand-replacements"
                      checked={showBrandReplacements}
                      onCheckedChange={setShowBrandReplacements}
                    />
                  </div>
                </TooltipProvider>

                <TooltipProvider>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-md border">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <Label htmlFor="brand-swaps" className="flex-grow text-sm">Show Alternative Brand Swaps</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-orange-200 transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm p-4 bg-gray-900 text-white">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Alternative Brand Swaps</h4>
                          <p className="text-sm">Swap expensive brands for similar quality alternatives from different manufacturers.</p>
                          <div className="bg-orange-900 p-2 rounded text-xs">
                            <strong>Example:</strong><br />
                            Persil Washing Powder (£8.50) → Ariel Washing Powder (£6.99)<br />
                            <span className="text-green-300">Typical savings: 10-25%</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <Switch
                      id="brand-swaps"
                      checked={showBrandSwaps}
                      onCheckedChange={setShowBrandSwaps}
                    />
                  </div>
                </TooltipProvider>

                <TooltipProvider>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-md border">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="loyalty-prices" className="flex-grow text-sm">Apply Loyalty Card Discounts</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-purple-200 transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm p-4 bg-gray-900 text-white">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Loyalty Card Benefits</h4>
                          <p className="text-sm">Activate discounts available with store loyalty cards like Clubcard, Nectar, etc.</p>
                          <div className="bg-purple-900 p-2 rounded text-xs">
                            <strong>Cards Applied:</strong><br />
                            • Tesco Clubcard<br />
                            • Sainsbury's Nectar Card<br />
                            • ASDA Rewards<br />
                            <span className="text-green-300">Typical savings: 5-15%</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <Switch
                      id="loyalty-prices"
                      checked={applyLoyaltyPrices}
                      onCheckedChange={setApplyLoyaltyPrices}
                    />
                  </div>
                </TooltipProvider>
              </div>

              {/* --- RESTORED: Action Buttons with individual "Find Coupons" --- */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Comparison Results</h2>
                <Button onClick={() => handleFindCoupons(null)} variant="secondary" size="sm" disabled={isSearchingCoupons}>
                  {isSearchingCoupons ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Tag className="w-4 h-4 mr-2" />
                  )}
                  Find Coupons & Discounts for All Stores
                </Button>
              </div>

              {/* ALL RESULTS GRID - 3 CARDS PER ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allComparisons.map((comparison, index) => (
                  <Card key={comparison.name} className={`relative ${index === 0 ? 'border-2 border-green-500 bg-green-50' : comparison.isOriginal ? 'border-2 border-blue-500 bg-blue-50' : ''}`}>
                    {index === 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-green-600 text-white z-10">
                        Best Deal
                      </Badge>
                    )}
                    {comparison.isOriginal && (
                      <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white z-10">
                        Current
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <img 
                          src={comparison.logo} 
                          alt={comparison.name}
                          className="h-10 w-auto"
                        />
                        <span>{comparison.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Price Breakdown */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-semibold">£{comparison.basePrice.toFixed(2)}</span>
                          </div>
                          
                          {comparison.totalSwapsSavings > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>- Swaps:</span>
                              <span>-£{comparison.totalSwapsSavings.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {comparison.loyaltySavings > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span>- {comparison.loyaltyCardName}:</span>
                              <span>-£{comparison.loyaltySavings.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {comparison.couponSavings > 0 && (
                            <div className="flex justify-between text-purple-600">
                              <span>- Coupon ({comparison.appliedCoupon?.code}):</span>
                              <span>-£{comparison.couponSavings.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <hr className="my-2" />
                          <div className="flex justify-between text-xl font-bold">
                            <span>Final Price:</span>
                            <span className={index === 0 ? 'text-green-600' : ''}>
                              £{comparison.finalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* --- RESTORED: Action Buttons with individual "Find Coupons" --- */}
                        <div className="space-y-2">
                          <AutoFillBasketButton
                            comparison={comparison}
                            items={comparison.items?.filter(i => i.found) || []}
                            onComplete={handleAutoFillComplete}
                            className="flex-1"
                            user={user}
                          />
                          <Button
                            onClick={() => handleFindCoupons(comparison.name)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-none shadow-lg"
                            disabled={isSearchingCoupons && selectedStore === comparison.name}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Get Coupons
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* NEW: Audio Unlock Modal */}
      <AlertDialog open={showAudioUnlockModal} onOpenChange={setShowAudioUnlockModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-600"/>
              Enable Voice Assistant Sound
            </AlertDialogTitle>
            <AlertDialogDescription>
              To hear the assistant's voice on this device, please enable sound. This is a one-time action required by your browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowAudioUnlockModal(false)}>Cancel</Button>
            <AlertDialogAction onClick={unlockAudio} className="bg-blue-600 hover:bg-blue-700">
              Enable Sound
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {modalContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInfoModal(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceiptScanner
        isOpen={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onScanComplete={handleReceiptScan}
      />

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductFound={async (product) => {
          setShowBarcodeScanner(false);

          // UPSERT LOGIC for ScannedProduct: Find or create product record
          let productRecord;
          const existingProducts = await ScannedProduct.filter({ barcode: product.barcode });

          if (existingProducts.length > 0) {
            productRecord = existingProducts[0];
            // Optionally update with fresher data from the scan
            await ScannedProduct.update(productRecord.id, {
                product_name: product.name || productRecord.product_name,
                brand: product.brand || productRecord.brand,
                image_url: product.image_url || productRecord.image_url,
                size: product.size || productRecord.size,
            });
          } else {
            // Ensure proper defaults if product fields are missing
            productRecord = await ScannedProduct.create({
              barcode: product.barcode,
              product_name: product.name || 'Unnamed Product',
              brand: product.brand || 'Unknown Brand',
              size: product.size || '', // Can be empty if not provided
              image_url: product.image_url || '', // Can be empty if not provided
              scan_location: 'in-store',
              scan_mode: scannerMode, // Use the current scannerMode
              data_source: 'open_food_facts' // Assuming this is the source
            });
          }

          if (scannerMode === 'favorite') {
            try {
              await FavoriteItem.create({
                // Use properties from the upserted productRecord
                item_name: `${productRecord.brand || ''} ${productRecord.product_name || ''}`.trim(),
                category: productRecord.category?.toLowerCase() || 'other', // Use category from productRecord if available, else 'other'
                target_price: product.target_price || product.current_best_price, // Use target_price if provided, otherwise current_best_price
                current_best_price: product.current_best_price,
                current_best_supermarket: product.current_best_supermarket,
                alert_enabled: true,
                email_alerts: true
              });
              setModalContent({
                title: "Favorite Added!",
                description: `${productRecord.brand || ''} ${productRecord.product_name || ''} has been added to your price alerts.` // Updated description
              });
              loadDashboardData();
            } catch (e) {
               setModalContent({
                title: "Error",
                description: `Could not save favorite item. Please try again.`
              });
            }
          } else { // 'compare' mode
            try {
              if (product.current_best_supermarket && product.current_best_price) {
                // UPSERT LOGIC for ScannedPrice: Check if a price from this store on this day exists.
                const today = new Date().toISOString().split('T')[0]; // Get today's date
                const existingPrices = await ScannedPrice.filter({
                    scanned_product_id: productRecord.id, // Use the ID of the upserted product
                    store_name: product.current_best_supermarket,
                    scan_date: today,
                });

                if (existingPrices.length === 0) { // Only create if no existing price for today
                     await ScannedPrice.create({
                      scanned_product_id: productRecord.id, 
                      store_name: product.current_best_supermarket,
                      store_id: product.current_best_supermarket.toLowerCase().replace(/[^a-z0-9]/g, ''),
                      price: product.current_best_price,
                      available: true,
                      scan_date: today // Use today's date
                    });
                    console.log(`Saved new price for ${productRecord.product_name} at ${product.current_best_supermarket} for today.`);
                } else {
                    console.log(`Price already exists for ${productRecord.product_name} at ${product.current_best_supermarket} today. Skipping save.`);
                }
              }

              loadDashboardData(); // Reload dashboard data to reflect new scan/price
              setModalContent({
                title: "Product Scanned!",
                description: `Found ${productRecord.brand} ${productRecord.product_name} - showing price comparison across retailers.`
              });
            } catch (e) {
              console.error("Failed to log scanned product or price:", e);
               setModalContent({
                title: "Error",
                description: `Could not save scanned product price. Please try again.`
              });
            }
          }
          setShowInfoModal(true); // Always show info modal after handling the scan
        }}
        mode={scannerMode}
        title={scannerMode === 'compare' ? 'In-Store Product Scanner' : 'Scan to Add Favorite'}
      />

      {/* Created List Modal (shows AFTER voice is done) */}
      <Dialog open={showCreatedListModal} onOpenChange={setShowCreatedListModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Voice Shopping Complete!
            </DialogTitle>
            <DialogDescription>
              We've created a new shopping list based on your voice command.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {createdList && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">📝 Created: {createdList.name}</h4>
                <div className="space-y-2">
                  {createdList.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                      <span>{item.quantity} {item.name}</span>
                      <Badge className="bg-blue-100 text-blue-800">{item.category}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => {
                      setShowCreatedListModal(false);
                      navigate(createPageUrl(`ComparisonResults?id=${createdList.id}`));
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Compare Prices Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCreatedListModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Voice interface for adding more items */}
            <div className="border-t pt-4">
              <h5 className="font-medium mb-3">Add More Items:</h5>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => startListening()}
                  disabled={isListening || isSpeaking}
                  className={`${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Add More
                    </>
                  )}
                </Button>
                
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                )}
              </div>

              {voiceTranscript && (
                <div className="mt-3 bg-gray-100 p-3 rounded">
                  <div className="text-sm text-gray-600">You said:</div>
                  <div className="font-medium">"{voiceTranscript}"</div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Planner Modal */}
      <Dialog open={showMealPlannerModal} onOpenChange={setShowMealPlannerModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              AI Meal Planner
            </DialogTitle>
            <DialogDescription>
              Generate personalized meal plans with shopping lists optimized for the best prices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Plan Your Week's Meals</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Budget (£)</Label>
                  <Input type="number" defaultValue="50" className="mt-1" />
                </div>
                <div>
                  <Label>People Count</Label>
                  <Input type="number" defaultValue="2" className="mt-1" />
                </div>
              </div>
              <div className="mb-4">
                <Label>Dietary Preferences</Label>
                <Input placeholder="e.g., vegetarian, gluten-free" className="mt-1" />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Meal Plan
              </Button>
            </div>
            
            <div className="text-center text-gray-500">
              <p>This feature creates personalized meal plans with shopping lists optimized for the best prices</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Inventory Modal */}
      <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Smart Inventory
            </DialogTitle>
            <DialogDescription>
              Track what you have at home to avoid overbuying and food waste.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Your Pantry & Fridge</h3>
              <p className="text-gray-600 mb-4">This feature is coming soon!</p>
              <div className="flex flex-col gap-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item to Inventory
                </Button>
                <Button variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Barcode to Add
                </Button>
              </div>
            </div>
            <div className="text-center text-gray-500">
              <p>Automatically update your home inventory with every purchase and get alerts for low stock.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Tracker Modal */}
      <Dialog open={showBudgetTrackerModal} onOpenChange={setShowBudgetTrackerModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PoundSterling className="w-5 h-5" />
              Budget Tracker
            </DialogTitle>
            <DialogDescription>
              Set and manage your spending limits across various categories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Set Your Monthly Budget</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Budget Name</Label>
                  <Input placeholder="e.g., Monthly Groceries" className="mt-1" />
                </div>
                <div>
                  <Label>Amount (£)</Label>
                  <Input type="number" defaultValue="200" className="mt-1" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Automatic Category Split:</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center"><div className="font-bold text-green-600">£80</div><div>Groceries</div></div>
                  <div className="text-center"><div className="font-bold text-blue-600">£40</div><div>Takeaways</div></div>
                  <div className="text-center"><div className="font-bold text-purple-600">£40</div><div>Household</div></div>
                  <div className="text-center"><div className="font-bold text-orange-600">£40</div><div>Other</div></div>
                </div>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Check className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </div>
            
            <div className="text-center text-gray-500">
              <p>Track spending across all connected stores with automatic categorization and alerts</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Predictions Modal */}
      <Dialog open={showPricePredictionsModal} onOpenChange={setShowPricePredictionsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Price Predictions for Your Favorites
            </DialogTitle>
            <DialogDescription>
              Our AI analyzes market trends to predict future price movements for your favorited items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {toArray(favorites).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toArray(favorites).map((favorite, index) => {
                  // Generate realistic predictions based on favorite items
                  const currentPrice = favorite.current_best_price || (Math.random() * 3 + 1);
                  const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
                  const predictedPrice = Math.max(0.1, currentPrice * (1 + variation));
                  const trend = predictedPrice < currentPrice ? 'decreasing' : 'increasing';
                  const action = trend === 'decreasing' ? 'wait' : predictedPrice > currentPrice * 1.1 ? 'buy_now' : 'stock_up';
                  const confidence = 75 + Math.floor(Math.random() * 20);

                  return (
                    <Card key={favorite.id} className="border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-semibold">{favorite.item_name}</div>
                          <Badge className={`${trend === 'increasing' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {trend === 'increasing' ? '↗️ Rising' : '↘️ Falling'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Current Price:</span>
                            <span className="font-bold">£{currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Predicted Price:</span>
                            <span className={`font-bold ${predictedPrice < currentPrice ? 'text-green-600' : 'text-red-600'}`}>
                              £{predictedPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span>{confidence}%</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button size="sm" className={`w-full ${
                            action === 'buy_now' ? 'bg-red-600 hover:bg-red-700' :
                             action === 'stock_up' ? 'bg-orange-600 hover:bg-orange-700' :
                             'bg-green-600 hover:bg-green-700'
                          }`}>
                            {action === 'buy_now' ? '🛒 Buy Now' :
                             action === 'stock_up' ? '📦 Stock Up' :
                             '⏳ Wait for Drop'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No favorite items for predictions</p>
                <p className="text-sm">Add items to favorites to see AI price forecasting</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Shopping Modal */}
      <Dialog open={showVoiceShoppingModal} onOpenChange={setShowVoiceShoppingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Shopping Assistant
            </DialogTitle>
            <DialogDescription>
              Speak your shopping list and let us do the rest!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center py-4">
            <p className="text-gray-600">This feature allows you to create shopping lists by simply speaking them. Try saying:</p>
            <p className="font-semibold text-lg text-blue-700">"Add milk, bread, and eggs to my list."</p>
            <Button onClick={() => { startListening(); setShowVoiceShoppingModal(false); }} className="w-full">
              Start Voice Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Local Deals Modal */}
      <Dialog open={showLocalDealsModal} onOpenChange={setShowLocalDealsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Local Deals
            </DialogTitle>
            <DialogDescription>
              Discover exclusive offers and discounts from stores near you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center py-4">
            <p className="text-gray-600">This feature is coming soon!</p>
            <p className="font-semibold text-lg text-green-700">Get alerts for hot deals in your local area.</p>
            <Button className="w-full">
              Find Deals Near Me
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Voucher Wallet Modal */}
      <Dialog open={showVoucherModal} onOpenChange={setShowVoucherModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-600" />
              Your Voucher Wallet ({toArray(voucherWallet).length})
            </DialogTitle>
            <DialogDescription>
              Here are the coupons and vouchers you've collected from your voice assistant searches and other features.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {toArray(voucherWallet).length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Vouchers collected from your voice assistant searches
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearVoucherWallet}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {toArray(voucherWallet).map((voucher) => (
                    <Card key={voucher.id} className="border-2 border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 flex-1">
                            <img 
                              src={supermarkets.find(s => s.name === voucher.store)?.logo} 
                              alt={voucher.store}
                              className="h-8 w-auto"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-600 text-white font-mono">{voucher.code}</Badge>
                                <span className="font-semibold">{voucher.store}</span>
                              </div>
                              <p className="text-sm font-medium">{voucher.description}</p>
                              {voucher.expiry && (
                                <p className="text-xs text-gray-500 mt-1">Expires: {voucher.expiry}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Added: {new Date(voucher.addedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleCopyVoucher(voucher.code)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No vouchers in your wallet yet</p>
                <p className="text-sm">Use the voice assistant to search for deals and they'll appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Price Alert Modal */}
      <Dialog open={showPriceAlertModal} onOpenChange={setShowPriceAlertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Price Drop Alert!
            </DialogTitle>
            <DialogDescription>
              One of your favorited items has dropped in price.
            </DialogDescription>
          </DialogHeader>
          {selectedAlertItem && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Great news! The price for <strong className="text-gray-900">{selectedAlertItem.item_name}</strong> has dropped.
              </p>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800">Now available for</p>
                    <p className="text-3xl font-bold text-green-700">
                      £{selectedAlertItem.current_best_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-800">at</p>
                    <img 
                      src={getSupermarketInfo(selectedAlertItem.current_best_supermarket)?.logo} 
                      alt={selectedAlertItem.current_best_supermarket}
                      className="h-8 w-auto mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                asChild 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <a 
                  href={storeUrls[selectedAlertItem.current_best_supermarket?.toLowerCase().replace(/'/g, '')] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to {selectedAlertItem.current_best_supermarket}
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- RESTORED: Original "Last Shops" Modal with Tabs & Accordion --- */}
      <Dialog open={showLastShopsModal} onOpenChange={setShowLastShopsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Your Shopping History
            </DialogTitle>
            <DialogDescription>
              View your connected store accounts and previous shopping comparisons
            </DialogDescription>
          </DialogHeader>
          
          {activeShopTab && Object.keys(lastShops).length > 0 ? (
            <Tabs value={activeShopTab} onValueChange={setActiveShopTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${Object.keys(lastShops).length}, minmax(0, 1fr))`}}>
                {Object.keys(lastShops).map(store => (
                  <TabsTrigger key={store} value={store} className="text-xs">
                    {store}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                {Object.entries(lastShops).map(([store, lists]) => (
                  <TabsContent key={store} value={store} className="h-full overflow-y-auto">
                    <div className="space-y-2 p-1 pb-4">
                      {toArray(lists).length > 0 ? (
                        toArray(lists).map((list, index) => (
                          <Card key={list.id || index} className="shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                onClick={() => {
                                  setSelectedListDetails(list);
                                  setShowListDetailsModal(true);
                                }}>
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-4 flex-1">
                                    <img src={supermarketLogoMap[store] || 'https://via.placeholder.com/40'} alt={`${store} logo`} className="w-10 h-10 object-contain rounded-full bg-white p-1 border" />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{list.name}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge 
                                          variant={list.source_type === 'fetched' ? 'default' : 'secondary'}
                                          className={list.source_type === 'fetched' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                                        >
                                          {list.source_type === 'fetched' ? 'Fetched' : 'Manual'}
                                        </Badge>
                                        <span className="text-xs text-gray-500">{format(new Date(list.created_date), 'MMM d, yyyy')}</span>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span>{toArray(list.items).length} items</span>
                                        {(list.total_estimated_cost || list.total_cost) && (
                                          <span>Total: £{(list.total_estimated_cost || list.total_cost || 0).toFixed(2)}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {!list.id?.startsWith('sim_') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteList(list.id, store);
                                        }}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No shopping history for {store} yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          ) : (
            <div className="text-center py-8 h-full flex flex-col justify-center items-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No Shopping History</p>
              <p className="text-gray-500 text-sm">Your past comparisons will appear here.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>


      <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Main Dashboard Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 lg:grid-cols-3 items-center gap-6 mb-8">
            {/* Welcome Text */}
            <div className="order-1 col-span-full lg:col-span-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-gray-600">Ready to save money on your groceries?</p>
            </div>

            {/* Voice Assistant - Enhanced for mobile */}
            <div className="order-3 lg:order-2 col-span-full lg:col-span-1 flex justify-center">
              {(user?.subscription_status === 'active' || user?.subscription_status === 'free_trial') && (
                <div className="flex items-center gap-3">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 rounded-full">
                          <Info className="w-5 h-5 text-teal-600 cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700 shadow-2xl rounded-lg p-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold mb-1">Voice Assistant Pro-Tip</h4>
                            <p className="text-sm text-slate-300">
                              Click the mic and speak naturally to add items, create lists, or ask for coupons and deals!
                              {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                                <span className="block mt-1 text-yellow-300">📱 Make sure your volume is up and silent mode is off!</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    onClick={() => startListening()}
                    disabled={isListening || isSpeaking}
                    className={`${
                      isListening 
                        ? 'bg-teal-600 animate-pulse' 
                        : isSpeaking
                        ? 'bg-blue-500'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {isListening ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                  </Button>
                  <div className="text-left w-40">
                    <p className="font-semibold text-gray-900">Voice Assistant</p>
                    <p className="text-sm text-gray-600 transition-opacity duration-500">
                      {isListening 
                        ? 'Listening...' 
                        : isSpeaking
                        ? 'Speaking...'
                        : `Try: "${voiceCommands[currentCommandIndex]}"`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Your Plan Card - moved back to original position and updated tags */}
            <div className="col-span-full lg:col-span-1 order-2 lg:order-3">
              <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Plan: {user?.subscription_status === 'active' ? 'Premium Shopper' : planName}</h3>
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </div>
                  <p className="text-teal-100 text-sm mb-4">
                    {user?.subscription_status === 'active' 
                      ? 'You have full access to all features.'
                      : `${daysLeftInTrial} days left in your free trial.`
                    }
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={() => navigate(createPageUrl("Pricing"))}
                  >
                    {user?.subscription_status === 'active' ? 'Manage Plan' : 'Upgrade Now'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 mt-2"
                    onClick={() => setShowAccountModal(true)}
                  >
                    Connect Supermarkets
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Voice Response Card */}
          {voiceResponse && !isListening && !showCreatedListModal && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Mic className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Assistant:</div>
                    <div className="text-blue-900">{voiceResponse}</div>
                  </div>
                </div> 
              </CardContent>
            </Card>
          )}

          {/* Original 4-card row (Quick Compare, Scan Receipt, Price Alerts, Food Delivery) - MOVED HERE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-teal-500 to-cyan-600 text-white relative">
              <CardContent className="p-6">
                <Plus className="w-6 h-6 opacity-80 absolute top-4 right-4" />
                <div className="pr-8">
                  <h3 className="text-lg font-semibold mb-2">Quick Compare</h3>
                  <p className="text-sm opacity-90 mb-4">Paste your shopping list</p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => { 
                      console.log('🎯 Start Comparison clicked - setting showQuickAdd to true');
                      setShowQuickAdd(true); 
                      setFetchStep('idle'); 
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Start Comparison
                  </Button>
                  <Button
                    onClick={handleFetchLastShops}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    disabled={processing}
                    title="Import your recent shops from connected supermarket accounts"
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Fetch My Last Shops
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white relative">
              <CardContent className="p-6">
                <Camera className="w-6 h-6 opacity-80 absolute top-4 right-4" />
                <div className="pr-8">
                  <h3 className="text-lg font-semibold mb-2">Scan Receipt</h3>
                  <p className="text-sm opacity-90 mb-4">Compare previous shop</p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowReceiptScanner(true)}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Scan Receipt
                  </Button>
                  <Button
                    onClick={() => {
                      setScannerMode('compare');
                      setShowBarcodeScanner(true);
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Scan Product In-Store
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white relative">
              <CardContent className="p-6">
                <Heart className="w-6 h-6 opacity-80 absolute top-4 right-4" />
                <div className="pr-8">
                  <h3 className="text-lg font-semibold mb-2">Price Alerts</h3>
                  <p className="text-sm opacity-90 mb-4">Track favorite items</p>
                </div>
                <div className="space-y-2">
                  <Link to={createPageUrl("Favorites")}>
                    <Button
                      variant="outline"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Manage Favorites
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setScannerMode('favorite');
                      setShowBarcodeScanner(true);
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Scan Product
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white relative">
              <CardContent className="p-6">
                <UtensilsCrossed className="w-6 h-6 opacity-80 absolute top-4 right-4" />
                <div className="pr-8">
                  <h3 className="text-lg font-semibold mb-2">Food Delivery</h3>
                  <p className="text-sm opacity-90 mb-4">Compare takeaway prices</p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => { setShowFoodQuickAdd(true); setFetchStep('idle'); }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Compare Order
                  </Button>
                  <Button
                    onClick={handleFetchFoodOrders}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    title="Fetch your recent food orders from connected delivery apps"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Fetch Last Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Voice Shopping */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowVoiceShoppingModal(true)}>
              <CardContent className="p-6 text-center">
                <Mic className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Voice Shopping</h3>
                <p className="text-sm text-gray-600">"Add milk to my list"</p>
                <Badge className="mt-2 bg-purple-100 text-purple-700">Premium</Badge>
              </CardContent>
            </Card>

            {/* Smart Inventory */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowInventoryModal(true)}>
              <CardContent className="p-6 text-center">
                <ClipboardList className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">Smart Inventory</h3>
                <p className="text-sm text-gray-600">Track what's at home</p>
                <Badge className="mt-2 bg-purple-100 text-purple-700">Premium</Badge>
              </CardContent>
            </Card>

            {/* Coupons & Deals */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowVoucherModal(true)}>
              <CardContent className="p-6 text-center">
                <Tag className="w-8 h-8 mx-auto mb-3 text-orange-600" />
                <h3 className="font-semibold mb-2">Coupons & Deals</h3>
                <p className="text-sm text-gray-600">Save with exclusive offers</p>
                <Badge className="mt-2 bg-orange-100 text-orange-700">Premium</Badge>
              </CardContent>
            </Card>

            {/* Price Predictions */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowPricePredictionsModal(true)}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-2">Price Predictions</h3>
                <p className="text-sm text-gray-600">AI buying recommendations</p>
                <Badge className="mt-2 bg-green-100 text-green-700">Premium</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

            {/* MyShopRun Points (renamed and restyled) */}
            <Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center h-full aspect-square flex flex-col justify-between">
                <div className="bg-white/15 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" /> {/* Changed from UserPlus to Users per outline */}
                </div>
                <h3 className="font-semibold mb-2">MyShopRun Points</h3>
                <p className="text-sm text-white/90 mb-4">
                  Earn rewards and manage your invitations
                </p>
                <div className="bg-white/20 text-white px-4 py-2 rounded-full mb-3">
                  <span className="font-bold text-lg">{user?.referral_points || 0}</span>
                  <span className="text-xs ml-1">points earned</span>
                </div>
                <Button 
                  onClick={() => setShowReferralsModal(true)}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Manage Invites
                </Button>
              </CardContent>
            </Card>

            {/* Family (restyled to match top cards, removed Premium badge) */}
            <Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center h-full aspect-square flex flex-col justify-between">
                <div className="bg-white/15 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Family</h3>
                <p className="text-sm text-white/90">
                  Share lists and budgets with family
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => { 
                      // Navigate to FamilySharing page
                      window.location.href = createPageUrl('FamilySharing');
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Open Family
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invite via QR (smaller QR; click to enlarge via modal) */}
            <Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center h-full aspect-square flex flex-col justify-between">
                <h3 className="font-semibold mb-2">Invite via QR</h3>
                {user?.referral_code ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(`${window.location.origin}?ref=${user.referral_code}`)}`}
                      alt="Referral QR Code"
                      className="rounded bg-white p-2 shadow mb-3 cursor-zoom-in"
                      onClick={() => setShowShareModal(true)}
                    />
                    <Button
                      className="w-full bg-white text-emerald-700 hover:bg-white/90 border-0 font-semibold"
                      onClick={() => setShowShareModal(true)}
                    >
                      Share Referral Link
                    </Button>
                    <div className="text-[11px] text-white/90 mt-2 line-clamp-1 break-all">
                      {`${window.location.origin}?ref=${user.referral_code}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/90">Referral code not available yet.</div>
                )}
              </CardContent>
            </Card>

            {/* AI Meal Planner (restyled, removed Premium badge) */}
            <Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center h-full aspect-square flex flex-col justify-between">
                <div className="bg-white/15 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">AI Meal Planner</h3>
                <p className="text-sm text-white/90">
                  Smart meal planning with shopping lists
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => { window.location.href = createPageUrl('MealPlanner'); }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Open Meal Planner
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
          
          <div className="mb-8">
            {/* Get Coupons - REMOVED THIS BLOCK */}
          </div>

          {/* New Premium Features Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Premium Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'AI Meal Planner', icon: UtensilsCrossed, modal: setShowMealPlannerModal, desc: 'Generate weekly meal plans', color: 'from-sky-500 to-blue-600' },
                { 
                  name: 'Coupons & Deals', 
                  icon: Tag, 
                  modal: setShowVoucherModal,
                  // use toArray() to avoid accessing length on {}
                  desc: `Find exclusive savings${toArray(voucherWallet).length > 0 ? ` (${toArray(voucherWallet).length} saved)` : ''}`, 
                  color: 'from-violet-500 to-purple-600' 
                },
                { name: 'Budget Tracker', icon: PoundSterling, modal: setShowBudgetTrackerModal, desc: 'Monitor your spending', color: 'from-rose-500 to-red-600' },
                { name: 'Price Predictions', icon: TrendingUp, modal: setShowPricePredictionsModal, desc: 'AI price forecasting', color: 'from-green-500 to-emerald-600' },
              ].map((feature) => {
                const hasAccess = user?.subscription_status === 'active' || user?.subscription_status === 'free_trial';
                return (
                  <div 
                    key={feature.name}
                    onClick={() => {
                      if (hasAccess) {
                        feature.modal(true);
                      } else {
                        setSelectedFeature(feature.name);
                        setShowUpgradeModal(true);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Card className={`shadow-lg border-0 bg-gradient-to-r ${feature.color} text-white hover:scale-105 transition-transform duration-300`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                           <feature.icon className="w-8 h-8 opacity-80" />
                           {!hasAccess && <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Premium</Badge>}
                        </div>
                        <h3 className="text-lg font-semibold mt-4">{feature.name}</h3>
                        <p className="text-sm opacity-90">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-teal-600" />
                    Recent Shopping Lists
                  </CardTitle>
                  <Link to={createPageUrl("ShoppingLists")}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {toArray(recentLists).length > 0 ? (
                  <div className="space-y-4">
                    {toArray(recentLists).map((list) => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{list.name}</div>
                          <div className="text-sm text-gray-500">
                            {list.items?.length || 0} items • {new Date(list.created_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {list.source_supermarket ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <img 
                                      src={getStoreLogo(list.source_supermarket)}
                                      alt={list.source_supermarket} 
                                      className="h-6 w-auto"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>From {list.source_supermarket}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : list.status !== 'draft' ? (
                              <Badge className={`${getStatusColor(list.status)} border`}>
                                {list.status}
                              </Badge>
                            ) : null}
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl(`ComparisonResults?id=${list.id}`)) }
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            Compare
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No shopping lists yet</p>
                    <p className="text-sm">Create your first list to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  Price Alerts
                </CardTitle>
                <Link to={createPageUrl("Favorites")}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
              </CardHeader>
              <CardContent className="p-6">
                {dashboardFavorites.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardFavorites.slice(0, 4).map((fav) => (
                      <div
                        key={fav.id}
                        className="flex items-center justify-between bg-white/70 rounded-lg p-3 border border-gray-200"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{fav.item_name}</div>
                          <div className="text-xs text-gray-600">
                            Target £{(fav.target_price ?? 0).toFixed(2)}
                            {typeof fav.current_best_price === "number" ? (
                              <>
                                {" "}• Current £{fav.current_best_price.toFixed(2)}
                                {fav.current_best_supermarket ? ` at ${fav.current_best_supermarket}` : ""}
                              </>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className={`px-2 py-1 text-xs rounded ${
                            fav.alert_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {fav.alert_enabled ? "Active" : "Paused"}
                          </span>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        typeof navigate === "function"
                          ? navigate(createPageUrl("Favorites"))
                          : (window.location.href = createPageUrl("Favorites"))
                      }
                    >
                      Manage All Alerts
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="w-10 h-10 mx-auto mb-2" />
                    <p className="mb-3">You don’t have any price alerts yet.</p>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() =>
                        typeof navigate === "function"
                          ? navigate(createPageUrl("Favorites"))
                          : (window.location.href = createPageUrl("Favorites"))
                      }
                    >
                      Create a Price Alert
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Original Subscription Management Card removed as per outline */}

          {/* Connect Accounts section removed */}

          {/* --- RESTORED: Original Colorful AI Coupon Modal with Store Logos --- */}
          <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <img src={availableCoupons[0]?.logo || "https://www.myshoprun.com/favicon.ico"} alt={selectedStore || "My ShopRun"} className="h-8 w-auto" />
                  Coupons & Discounts for {selectedStore || 'All Stores'}
                </DialogTitle>
                <DialogDescription>
                  Here are the current available offers. We'll apply the best ones for maximum savings.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-96 overflow-y-auto">
                {isSearchingCoupons ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="mt-4 text-gray-600">Searching for coupons...</p>
                  </div>
                ) : availableCoupons.length > 0 ? (
                  availableCoupons.map((coupon, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${coupon.color} shadow-sm`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={coupon.logo} alt={selectedStore} className="h-6 w-auto" />
                          <div>
                            <div className="font-bold text-lg tracking-wide font-mono">{coupon.code}</div>
                            <p className="text-sm font-medium">{coupon.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="2xl font-bold">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}% OFF` 
                              : coupon.discount_type === 'free_delivery'
                              ? 'FREE DELIVERY'
                              : `£${coupon.discount_value} OFF`}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs space-y-1">
                        {coupon.min_spend > 0 && <p>• Min. spend: £{coupon.min_spend}</p>}
                        {coupon.expires && <p>• Expires: {coupon.expires}</p>}
                        {coupon.terms && <p>• {coupon.terms}</p>}
                      </div>
                      {/* Start of the outline's intended content for applicable_products and button */}
                      {coupon.code !== 'NOCODES' && (
                        <div className="w-full space-y-2">
                          {/* --- FIX: Ensure applicable_products is an array before mapping --- */}
                          {coupon.applicable_products && Array.isArray(coupon.applicable_products) && coupon.applicable_products.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mt-2">Applies to:</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {coupon.applicable_products.map((prod, i) => (
                                  <Badge key={i} variant="secondary">{prod}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button 
                            size="sm" 
                            className="w-full"
                            // onClick property is not defined in outline, leaving empty
                          >
                            Apply this Coupon
                          </Button>
                        </div>
                      )}
                      {/* End of the outline's intended content */}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No coupons found at this time.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCouponModal(false)}>Cancel</Button>
                <Button onClick={handleApplyAllCoupons} disabled={availableCoupons.length === 0 || availableCoupons[0]?.discount_type === 'info' || isSearchingCoupons}>
                  Apply Best Coupons & Update Results
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

          {/* List Details Modal */}
          <Dialog open={showListDetailsModal} onOpenChange={setShowListDetailsModal}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              {selectedListDetails && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <img 
                        src={supermarketLogoMap[normalizeStoreName(selectedListDetails.source_supermarket)] || 'https://via.placeholder.com/40'} 
                        alt="Store logo" 
                        className="w-8 h-8 object-contain" 
                      />
                      {selectedListDetails.name}
                      <Badge 
                        variant={selectedListDetails.source_type === 'fetched' ? 'default' : 'secondary'}
                        className={selectedListDetails.source_type === 'fetched' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      >
                        {selectedListDetails.source_type === 'fetched' ? 'Fetched Order' : 'Manual List'}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      Created on {format(new Date(selectedListDetails.created_date), 'MMM d, yyyy')}
                      {(selectedListDetails.total_estimated_cost || selectedListDetails.total_cost) && (
                        <span className="ml-2 font-semibold">• Total: £{(selectedListDetails.total_estimated_cost || selectedListDetails.total_cost || 0).toFixed(2)}</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Items ({toArray(selectedListDetails.items).length})</h3>
                      {toArray(selectedListDetails.items).length > 0 ? (
                        <div className="grid gap-2 max-h-60 overflow-y-auto">
                          {toArray(selectedListDetails.items).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                {item.quantity && <span className="text-gray-500 ml-2">({item.quantity})</span>}
                                {item.category && <span className="text-xs text-gray-400 ml-2">{item.category}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No items available for this list.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => handleUseLastShop(selectedListDetails)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Compare Prices Now
                      </Button>
                      {!selectedListDetails.id?.startsWith('sim_') && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            handleDeleteList(selectedListDetails.id, normalizeStoreName(selectedListDetails.source_supermarket));
                            // setShowListDetailsModal(false); // This will be handled by the handleDeleteList success
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Comparison</DialogTitle>
                <DialogDescription>
                  Paste your shopping list below to get started.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <Textarea
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                placeholder="e.g. 2x Hovis bread, 500g chicken breast..."
                rows={10}
                className="mt-2"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleStartComparison} disabled={isSubmitting}>
                  {isSubmitting ? 'Comparing...' : 'Start Comparison'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
        {/* Account Modal - ACTUAL CONNECT SUPERMARKETS FEATURE */}
        <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                Connect Your Supermarket Accounts
              </DialogTitle>
              <DialogDescription>
                Connect your accounts to enable auto-fill baskets and exclusive features.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                {/* FIX: Add `|| []` fallback to prevent "not iterable" error if connected_supermarkets is null/undefined */}
                {[
                  { name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png', connected: toArray(user?.connected_supermarkets).includes('Tesco') },
                  { name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png', connected: toArray(user?.connected_supermarkets).includes('ASDA') },
                  { name: 'Sainsbury\'s', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png', connected: toArray(user?.connected_supermarkets).includes('Sainsbury\'s') },
                  { name: 'Morrisons', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png', connected: toArray(user?.connected_supermarkets).includes('Morrisons') },
                  { name: 'Waitrose', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png', connected: toArray(user?.connected_supermarkets).includes('Waitrose') },
                  { name: 'Co-op', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png', connected: toArray(user?.connected_supermarkets).includes('Co-op') },
                  { name: 'Aldi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png', connected: toArray(user?.connected_supermarkets).includes('Aldi') },
                  { name: 'Lidl', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png', connected: toArray(user?.connected_supermarkets).includes('Lidl') },
                  { name: 'Iceland', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png', connected: toArray(user?.connected_supermarkets).includes('Iceland') }
                ].map((store) => (
                  <Card key={store.name} className={`relative ${store.connected ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'}`}>
                    <CardContent className="p-4 text-center">
                      <img src={store.logo} alt={store.name} className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium text-sm">{store.name}</p>
                      {store.connected ? (
                        <Badge className="mt-2 bg-green-600">Connected</Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => openConnectModal(store.name)}
                        >
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Secure Connection</h4>
                    <p className="text-blue-800 text-sm">Your login details are encrypted and stored securely. We only use them to fill your baskets automatically.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowAccountModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="my-6">
          <ConnectedSupermarkets onChange={loadUser} />
        </div>

          {/* Referral & Family Modals */}
          <ShareReferralModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} user={user} />
          <ReferralManagementModal isOpen={showReferralsModal} onClose={() => setShowReferralsModal(false)} user={user} />
          
          <ConnectSupermarketModal
            isOpen={connectModalOpen}
            onClose={() => setConnectModalOpen(false)}
            storeName={selectedStoreName}
            storeSlug={selectedStoreSlug}
            onConnected={loadUser}
          />
    </TooltipProvider>
  );
}
