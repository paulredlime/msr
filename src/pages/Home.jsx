
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SubscriptionPlan } from "@/api/entities";
import { User } from "@/api/entities";
import { LandingPageContent } from "@/api/entities";
import { GrocerAccount } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { AppConfig } from '@/api/entities';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Shield,
  CheckCircle,
  Star,
  TrendingDown,
  Bell,
  Smartphone,
  Crown,
  Zap,
  ArrowRight,
  Wand2,
  ClipboardPaste,
  Scale,
  Sparkles,
  UtensilsCrossed,
  Download,
  BellRing,
  Heart,
  Loader2,
  Mic,
  Tag,
  TrendingUp,
  PoundSterling,
  Package,
  BarChart,
  ClipboardList,
  Cpu,
  Search,
  Settings,
  Users,
  MessageCircle,
  PiggyBank,
  Sprout,
  BrainCircuit,
  LifeBuoy,
  Camera as CameraIcon, // Renamed to avoid conflict
  Volume2, // Added Volume2 for AI Assistant
  Send, // Added Send for AI Assistant
} from "lucide-react";
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from '@/components/Confetti'; // Added Confetti import

// Helper function to determine the base URL for redirects
const getBaseUrl = () => {
  // You can specify production domain here if needed, otherwise window.location.origin is generally safe
  // if (process.env.NODE_ENV === 'production') {
  //   return 'https://myshoprun.app'; // Example production domain
  // }
  return window.location.origin;
};

// Define all canonical features of the application
const ALL_FEATURES = [
  {
    category: "Core Grocery",
    features: [
      { id: "GROCERY_PASTE_LIST", name: "Paste & Compare Shopping List", description: "Allow users to paste a simple shopping list for comparison." },
      { id: "GROCERY_SAVE_LISTS", name: "Save Shopping Lists", description: "Users can create, save, and manage multiple shopping lists." },
      { id: "GROCERY_PRICE_HISTORY", name: "Price History Tracking", description: "View historical price charts for products." },
    ]
  },
  {
    category: "Premium Grocery",
    features: [
      { id: "GROCERY_CONNECT_ACCOUNTS", name: "Connect Supermarket Accounts", description: "Link Tesco, ASDA, etc., to import history." },
      { id: "GROCERY_AUTO_CHECKOUT", name: "One-Click Basket Fill", description: "Use browser extension/bookmarklet to auto-fill the cart." }
    ]
  },
  {
    category: "Food Delivery",
    features: [
      { id: "FOOD_BROWSE_RESTAURANTS", name: "Browse Restaurants & Menus", description: "Users can search and view menus from delivery platforms." },
      { id: "FOOD_DELIVERY_COMPARISON", name: "Food Delivery Price Check", description: "Compare takeaway prices on the dashboard." }
    ]
  },
  {
    category: "Favorites & Alerts",
    features: [
      { id: "FAVORITES_SAVE_ITEMS", name: "Save Favorite Items", description: "Users can save items to a favorites list." },
      { id: "FAVORITES_PRICE_ALERTS", name: "Price Drop Alerts", description: "Receive notifications when a favorite item's price drops." },
      { id: "FAVORITES_ALERT_FREQUENCY", name: "Set Alert Frequency", description: "Choose between daily or weekly price checks for favorites." }
    ]
  },
  {
    category: "Account & Limits",
    features: [
      { id: "LIMIT_UNLIMITED_LISTS", name: "Unlimited Shopping Lists", description: "Create and save an unlimited number of lists." },
      { id: "LIMIT_UNLIMITED_FAVORITES", name: "Unlimited Favorite Items", description: "Track an unlimited number of favorite products." },
      { id: "SUPPORT_PRIORITY", name: "Priority Support", description: "User's support tickets are prioritized." }
    ]
  }
];

// Helper to quickly map feature IDs to their names for display
const featureIdMap = ALL_FEATURES.flatMap(group => group.features).reduce((acc, feature) => {
  acc[feature.id] = feature.name;
  return acc;
}, {});

const features = [
  {
    icon: ShoppingCart,
    title: "68,000+ Product Database",
    description: "Compare across our massive database of 68,000+ products from all 10 major UK supermarkets for comprehensive savings"
  },
  {
    icon: DollarSign,
    title: "Smart Product Matching",
    description: "Our AI matches Branston-to-Branston for identical brands, or ASDA bread to Tesco bread for equivalent own-brand comparisons"
  },
  {
    icon: Clock,
    title: "Loyalty Card Integration",
    description: "See prices with and without loyalty cards like Clubcard and Nectar to maximize your savings potential"
  },
  {
    icon: Bell,
    title: "Auto Shopping Lists",
    description: "Paste your existing shopping list and we'll automatically find the best matches at the cheapest store"
  },
  {
    icon: TrendingDown,
    title: "Real Savings Tracking",
    description: "Save an average of £200+ per month by always shopping at the cheapest supermarket with equivalent products"
  },
  {
    icon: Smartphone,
    title: "One-Click Shopping",
    description: "Automatically login to the cheapest store with your shopping list ready to checkout via our browser extension"
  }
];

const supermarketLogos = [
  { name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png' },
  { name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png' },
  { name: 'Sainsbury\'s', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png' },
  { name: 'Morrisons', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png' },
  { name: 'Aldi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png' },
  { name: 'Lidl', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png' },
  { name: 'Waitrose', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png' },
  { name: 'Co-op', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png' },
  { name: 'Iceland', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png' },
  { name: 'B&M', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/60b1472c0_image.png' },
  { name: 'Home Bargains', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/241014374_image.png' },
];

const allLogos = [...supermarketLogos, ...supermarketLogos]; // Duplicate for smooth looping

// Note: This 'deliveryServices' array is no longer used in the rendering of the new food delivery card,
// but it's kept as it's an existing constant that might be used elsewhere or might be planned for future use.
const deliveryServices = [
  { name: "Uber Eats", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd90136a7_image.png" },
  { name: "Deliveroo", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/234d89b82_image.png" },
  { name: "Just Eat", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6d1b0ead6_image.png" }
];

export default function Home() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [landingContent, setLandingContent] = useState({});
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [modalPlan, setModalPlan] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false); // State for general loading of buttons/actions
  const [showConfetti, setShowConfetti] = useState(false); // New state for confetti

  // Effect to load plans and user data on component mount
  useEffect(() => {
    loadPlansAndUser();
    loadLandingContent();
  }, []); // Empty dependency array, runs once on mount

  const loadLandingContent = async () => {
    try {
      const content = await LandingPageContent.list();
      const contentBySection = {};
      content.forEach(item => {
        if (item.is_active) {
          contentBySection[item.section] = item;
        }
      });
      setLandingContent(contentBySection);
    } catch (error) {
      console.error('Error loading landing content:', error);
    }
  };

  const loadPlansAndUser = async () => {
    try {
      const [activePlans, currentUser] = await Promise.all([
        SubscriptionPlan.filter({ is_active: true }, 'price'),
        User.me().catch(() => null) // Attempt to get current user, but don't fail if not logged in
      ]);

      setPlans(activePlans.slice(0, 3));
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setPlansLoading(false);
  };

  // Centralized function for "Get Started" or "Start Free Trial" buttons
  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await User.loginWithRedirect(
        `${getBaseUrl()}${createPageUrl('Dashboard')}`
      );
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      toast({
        title: "Login failed",
        description: "There was an issue signing you in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectPlan = async (planId) => {
    if (!user) {
      await User.loginWithRedirect(
        `${getBaseUrl()}${createPageUrl("Dashboard")}` // Uses getBaseUrl
      );
    } else {
      window.location.href = createPageUrl(`Profile?plan=${planId}`);
    }
  };

  const handleAutoRegister = async () => {
    setIsRegistering(true);
    try {
      const currentUser = await User.me();

      // Check if ASDA is already connected
      const existingAccounts = await GrocerAccount.filter({ user_id: currentUser.id, store: 'asda' });

      if (existingAccounts.length > 0) {
        toast({
          title: "Already Connected!",
          description: "You are already connected to ASDA. Navigating to your profile.",
          variant: "default",
        });
      } else {
        // Simulate creating a new connection
        await GrocerAccount.create({
          user_id: currentUser.id,
          store: 'asda',
          username: currentUser.email, // Use email as a placeholder
          password_encrypted: btoa('simulated_password_for_demo'), // Placeholder for demo, Base64 encode for simple encryption
          is_active: true,
          sync_status: 'active',
          last_sync: new Date().toISOString()
        });

        toast({
          title: "✅ Success!",
          description: "ASDA has been added to your connected accounts.",
          className: "bg-green-100 text-green-800 border-green-200",
        });
        setShowConfetti(true); // Trigger confetti on successful auto-registration
        setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds
      }

      // Navigate to profile to see the result
      navigate(createPageUrl('Profile'));

    } catch (error) {
      console.error('Auto-registration failed:', error);
      // User is not logged in or other error
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to use this feature.",
        variant: "destructive",
      });
      // Optionally, redirect to login
      await User.loginWithRedirect(`${getBaseUrl()}${window.location.pathname}`); // Uses getBaseUrl for current page
    } finally {
      setIsRegistering(false);
    }
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return <ShoppingCart className="w-6 h-6" />;
    if (name.includes('pro')) return <Zap className="w-6 h-6" />;
    if (name.includes('expert')) return <Crown className="w-6 h-6" />;
    return <Zap className="w-6 h-6" />;
  };

  const getPlanColor = (planName, index) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return 'from-blue-500 to-indigo-600';
    if (name.includes('pro')) return 'from-teal-500 to-cyan-600';
    if (name.includes('expert')) return 'from-amber-500 to-orange-600';

    const colors = [
      'from-blue-500 to-indigo-600',
      'from-teal-500 to-cyan-600',
      'from-amber-500 to-orange-600'
    ];
    return colors[index % colors.length];
  };

  const isPopularPlan = (planName) => {
    return planName.toLowerCase().includes('pro');
  };

  const heroContent = landingContent.hero || {};
  const heroTitleParts = (heroContent.title || "Never Overpay on Shopping Again").split(' ');
  const normalTitle = heroTitleParts.slice(0, -2).join(' ');
  const highlightedTitle = heroTitleParts.slice(-2).join(' ');

  const heroBackgroundStyle = () => {
    if (heroContent.background_type === 'video' && heroContent.background_value) {
      return {};
    } else if (heroContent.background_type === 'image' && heroContent.background_value) {
      return {
        backgroundImage: `url(${heroContent.background_value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (heroContent.background_type === 'color' && heroContent.background_value) {
      return { backgroundColor: heroContent.background_value };
    } else {
      return {};
    }
  };

  return (
    <div className="min-h-screen">
      {showConfetti && <Confetti />} {/* Render Confetti if showConfetti is true */}
      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scroll-container { 
          display: flex;
          animation: scroll-left 40s linear infinite; 
        }
        .scroll-container:hover { animation-play-state: paused; }
      `}</style>

      {/* Hero Section */}
      <section
        className={`relative pt-20 pb-32 overflow-hidden ${
          heroContent.background_type === 'gradient' && heroContent.background_value
            ? heroContent.background_value
            : 'bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50'
        }`}
        style={heroBackgroundStyle()}
      >
        {heroContent.background_type === 'video' && heroContent.background_value && (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={heroContent.background_value} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </>
        )}

        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="max-w-4xl mx-auto">
            {heroContent.subtitle && (
              <Badge className="mb-6 bg-teal-100 text-teal-800 border-teal-200 px-4 py-2 text-sm">
                {heroContent.subtitle}
              </Badge>
            )}

            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black mb-8 leading-tight ${
              heroContent.background_type === 'video' ? 'text-white' : 'text-gray-900'
            }`}>
              {normalTitle}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent block">
                {highlightedTitle}
              </span>
            </h1>

            <p className={`text-xl sm:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${
              heroContent.background_type === 'video' ? 'text-white' : 'text-gray-600'
            }`}>
              MyShopRun compares prices across all major UK supermarkets and takeaway apps, saving you time and money. Once you find a cheaper full shop on another supermarket, in one click our system will auto-add to your basket on that store, allowing you to checkout in a matter of moments with the MyShopRun Instant Shop feature!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-4 h-auto"
                onClick={handleGetStarted} // Uses handleGetStarted
                disabled={loading} // Uses loading state
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="w-5 h-5 ml-2" />}
                {heroContent.button_text || 'Start Free Trial'}
              </Button>

              <Link to={createPageUrl("Pricing")}>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-teal-200 hover:bg-teal-50">
                  See Pricing
                </Button>
              </Link>
            </div>
            
            <div className="mt-12">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/24c0b6757_MSRlogo.png" 
                alt="MyShopRun Logo" 
                className="h-48 w-auto mx-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* MOVED & RESTORED: Scrolling Supermarket Logos */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-gray-600 uppercase tracking-wider">
              Comparing prices across all major UK supermarkets
            </h2>
            <div className="mt-8 overflow-hidden">
              <div className="scroll-container">
                {allLogos.map((store, index) => (
                  <div key={index} className="flex-shrink-0 mx-8 flex items-center">
                    <img className="h-10 sm:h-12 w-auto object-contain" src={store.logo} alt={store.name} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REDESIGNED: How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Easy as 1, 2, 3...
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start saving on your groceries with just a few clicks.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Dashed Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
              <svg width="100%" height="100%">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#d1d5db" strokeWidth="2" strokeDasharray="8 8" />
              </svg>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                  <ClipboardPaste className="w-12 h-12" />
                  <div className="absolute -top-2 -right-2 bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">1</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Your List</h3>
                <p className="text-gray-600 leading-relaxed min-h-[6rem]">
                  Paste your shopping list, or fetch your last order from a connected supermarket account.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                  <Scale className="w-12 h-12" />
                   <div className="absolute -top-2 -right-2 bg-white text-teal-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">2</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Compare Prices</h3>
                <p className="text-gray-600 leading-relaxed min-h-[6rem]">
                  Our AI finds the cheapest supermarket for your entire basket in real-time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                  <Sparkles className="w-12 h-12" />
                   <div className="absolute -top-2 -right-2 bg-white text-amber-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">3</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Shop & Save</h3>
                <p className="text-gray-600 leading-relaxed min-h-[6rem]">
                  Checkout at the cheapest store with your items pre-added to your basket, or save your list for later.
                </p>
              </div>
            </div>
          </div>
          
          {/* Food Delivery Mention */}
          <div className="mt-16 text-center border-t pt-12">
            <p className="text-lg text-gray-700 mb-4 font-semibold">
              Pssst... We Compare Food Delivery Too!
            </p>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              You can also quick-compare by pasting your last food order. Find the best prices on Uber Eats, Deliveroo, and Just Eat!
            </p>
            <div className="flex justify-center items-center gap-6">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd90136a7_image.png"
                alt="Uber Eats"
                className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0"
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/234d89b82_image.png"
                alt="Deliveroo"
                className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0"
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6d1b0ead6_image.png"
                alt="Just Eat"
                className="h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Advanced Features Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200 px-4 py-2 text-sm">
              🚀 Advanced Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Next-Generation Shopping Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Beyond price comparison - experience the future of smart grocery shopping with AI-powered features that save you time, money, and effort.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* AI Voice Assistant */}
            <div className="relative">
              <Card className="h-full shadow-xl border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Mic className="w-8 h-8" />
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">Voice AI</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">AI Voice Shopping Assistant</CardTitle>
                  <p className="text-purple-100">
                    Just speak naturally: "Add milk, bread, and bananas to my list" - and watch the magic happen.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Natural voice recognition in 10+ languages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Instant shopping list creation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Smart item matching and categorization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Hands-free shopping experience</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="text-sm text-purple-100 mb-2">Try saying:</div>
                    <div className="font-medium">"Add ingredients for spaghetti bolognese"</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Meal Planner */}
            <div className="relative">
              <Card className="h-full shadow-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 -translate-x-20"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">Smart AI</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">AI Meal Planner</CardTitle>
                  <p className="text-emerald-100">
                    Tell us your budget and preferences - get a complete week of meals with automatically generated shopping lists.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Personalized meal plans for any budget</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Dietary restrictions & preferences</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Auto-generated shopping lists</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Nutritionally balanced recipes</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="text-sm text-emerald-100 mb-2">Example plan:</div>
                    <div className="font-medium">7 days • £50 budget • 4 people • Vegetarian</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Live Coupon Engine */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">Live Coupon Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Auto-find and apply the best coupons during price comparison</p>
                <div className="space-y-2 text-sm">
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">£5 off £40 at Tesco</div>
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">15% off at ASDA</div>
                </div>
              </CardContent>
            </Card>

            {/* Price Predictions */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">AI Price Predictions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Know when to buy and when to wait with AI-powered price forecasting</p>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">↘️ Buy next week</div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">📈 Stock up now</div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Budget Tracker */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PoundSterling className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">Smart Budget Tracker</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Set budgets, track spending, and get insights on your grocery habits</p>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">£180/£200 monthly</div>
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">10% under budget</div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Inventory */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">Smart Inventory</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">Track what you have at home and never buy duplicates again</p>
                <div className="space-y-2 text-sm">
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">🥛 Milk expires today</div>
                  <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full">🍞 Bread running low</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-indigo-600 mb-2">30 sec</div>
              <div className="text-gray-600">Create meal plan with voice command</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">£15+</div>
              <div className="text-600">Extra savings with auto-applied coupons</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Accuracy in price predictions</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Experience the Future?</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of smart shoppers who are already saving time and money with our AI-powered features.
            </p>
            <Button
              onClick={handleGetStarted} // Uses handleGetStarted
              disabled={loading} // Uses loading state
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="w-5 h-5 ml-2" />}
              Start Free Trial
            </Button>
            <p className="text-sm text-gray-500 mt-3">All advanced features included • No credit card required</p>
          </div>
        </div>
      </section>

      {/* NEW: Receipt Scanner Feature Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Instant Receipt Scanner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simply snap a photo of your receipt and let AI instantly extract all items, brands, and prices.
              No more typing - just scan and compare!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center pt-8">
            {/* Feature Benefits */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CameraIcon className="w-6 h-6 text-white" /> {/* Changed from Camera to CameraIcon */}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart AI Recognition</h3>
                  <p className="text-gray-600">Advanced AI automatically detects store names, item quantities, brands, and prices with 95%+ accuracy.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Processing</h3>
                  <p className="text-gray-600">Scan any receipt in seconds. Our AI processes multiple receipt parts and combines them automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Suggestions</h3>
                  <p className="text-gray-600">Review and edit items with intelligent brand suggestions. Perfect your list before comparing prices.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Price Comparison</h3>
                  <p className="text-gray-600">Once scanned, immediately compare your receipt items across all major UK supermarkets to find savings.</p>
                </div>
              </div>
            </div>

            {/* Mobile Screenshots Showcase with Better Phone Mockups */}
            <div className="relative">
              {/* Top Row - Steps 1, 2, 3 */}
              <div className="flex justify-center items-start gap-4 mb-12">

                {/* Step 1: Dashboard with Scan Button */}
                <div className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300 mt-6">
                  <div className="relative bg-gray-900 rounded-[2rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b5a0e0404_image.png"
                        alt="Step 1: Dashboard with Scan Receipt button"
                        className="w-44 h-auto"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-3 left-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">1</div>
                </div>

                {/* Step 2: Camera Interface */}
                <div className="relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 z-20 mt-6">
                  <div className="relative bg-gray-900 rounded-[2rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b09c853dc_image.png"
                        alt="Step 2: Camera interface with receipt capture"
                        className="w-44 h-auto"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-3 -left-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">2</div>
                </div>

                {/* Step 3: AI Processing */}
                <div className="relative transform rotate-1 hover:rotate-0 transition-transform duration-300 mt-6">
                  <div className="relative bg-gray-900 rounded-[2rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/1a028e735_image.png"
                        alt="Step 3: AI processing and analyzing receipt"
                        className="w-44 h-auto"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-3 -left-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">3</div>
                </div>
              </div>

              {/* Bottom Row - Steps 4, 5 */}
              <div className="flex justify-center gap-6">
                {/* Step 4: Review Items */}
                <div className="relative transform -rotate-2 hover:rotate-0 transition-transform duration-300 mt-6">
                  <div className="relative bg-gray-900 rounded-[2rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/1c945fe14_image.png"
                        alt="Step 4: Review and edit extracted items"
                        className="w-40 h-auto"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-3 -left-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">4</div>
                </div>

                {/* Step 5: Complete List Ready */}
                <div className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300 mt-6">
                  <div className="relative bg-gray-900 rounded-[2rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ab599aa53_image.png"
                        alt="Step 5: Complete shopping list ready for price comparison"
                        className="w-40 h-auto"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-3 -left-2 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">5</div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-8 right-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-8 left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-30 animate-bounce"></div>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h4 className="font-semibold text-gray-900 mb-2">Open Dashboard</h4>
                <p className="text-sm text-gray-600">Access the scanner from your dashboard</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h4 className="font-semibold text-gray-900 mb-2">Capture Receipt</h4>
                <p className="text-sm text-gray-600">Snap a clear photo of your receipt</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Processing</h4>
                <p className="text-sm text-gray-600">Our AI extracts all items and details</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
                <h4 className="font-semibold text-gray-900 mb-2">Review & Edit</h4>
                <p className="text-sm text-gray-600">Perfect your list with smart suggestions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">5</div>
                <h4 className="font-semibold text-gray-900 mb-2">Compare Prices</h4>
                <p className="text-sm text-gray-600">Find the cheapest supermarket instantly</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={handleGetStarted} // Uses handleGetStarted
              disabled={loading} // Uses loading state
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CameraIcon className="w-5 h-5 ml-2" />} {/* Changed from Camera to CameraIcon */}
              Try Receipt Scanner Free
            </Button>
            <p className="text-sm text-gray-500 mt-3">3-day free trial • No credit card required</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              How MyShopRun Saves You Money
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our smart comparison engine works 24/7 to ensure you always get the best deals on your groceries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-teal-50/30">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Demo Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-indigo-100 text-indigo-800 border-indigo-200 px-4 py-2 text-sm">
              🚀 Advanced Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              From Comparison to Checkout in One Click
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Why stop at finding savings? Our advanced automation gets you from price comparison to checkout faster than ever before.
            </p>
          </div>

          {/* Auto Registration & Basket Fill Demo */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">New Feature</Badge>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  Auto-Registration & Instant Basket Fill
                </h3>

                <p className="text-lg text-gray-600 mb-8">
                  Found a cheaper supermarket you're not signed up with? No problem! We can automatically create your account using your saved details and fill your basket with all your items, ready for checkout.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Automatic Account Creation</p>
                      <p className="text-gray-600 text-sm">Securely register you with new supermarkets using your saved details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Instant Basket Population</p>
                      <p className="text-gray-600 text-sm">All your items are pre-added to your basket, ready for checkout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">One-Click Shopping</p>
                      <p className="text-gray-600 text-sm">Go from price comparison to checkout in under 30 seconds</p>
                    </div>
                  </div>
                </div>

                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Zap className="w-5 h-5 mr-2" />
                  Try Auto-Shop Now
                </Button>
              </div>

              {/* Mock Interface showing auto-registration flow */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Price Comparison Results</h4>
                      <p className="text-sm text-gray-500">Found better prices at ASDA</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <div>
                        <p className="font-medium text-gray-900">Current Store: Tesco</p>
                        <p className="text-sm text-gray-600">Total: £47.83</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div>
                        <p className="font-medium text-gray-900">Cheaper at: ASDA</p>
                        <p className="text-sm text-gray-600">Total: £39.21 • Save £8.62</p>
                      </div>
                      <Badge className="bg-green-600 text-white">Cheapest</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleAutoRegister}
                      disabled={isRegistering}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting</>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" /> Auto Register & Fill Basket</>
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      We'll create your ASDA account and add all items to your basket
                    </p>
                  </div>
                </div>

                {/* Floating animation elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-30 animate-bounce"></div>
              </div>
            </div>
          </div>

          {/* Price Alert Notifications Demo */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mock notification interface */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                {/* Mock browser notification */}
                <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white text-xs ml-4">Notifications</span>
                </div>

                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-green-600" />
                    Price Alerts
                  </h4>

                  <div className="space-y-4">
                    {/* Sample alert notifications */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Heinz Tomato Ketchup 460g</p>
                        <p className="text-xs text-gray-600">Now £2.15 at Sainsbury's (was £2.50)</p>
                        <p className="text-xs text-green-600 font-medium">✓ Target price reached!</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Coca-Cola 2L Bottle</p>
                        <p className="text-xs text-gray-600">Now £1.75 at ASDA (was £2.25)</p>
                        <p className="text-xs text-blue-600 font-medium">✓ 22% price drop!</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Bread - Warburtons Medium</p>
                        <p className="text-xs text-gray-600">Now £1.25 at Tesco (was £1.40)</p>
                        <p className="text-xs text-orange-600 font-medium">✓ Weekly deal active</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                    View All Favorites
                  </Button>
                </div>
              </div>

              {/* Floating notification badge */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                3
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-purple-100 text-purple-800">Smart Alerts</Badge>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                Never Miss a Deal Again
              </h3>

              <p className="text-lg text-gray-600 mb-8">
                Set target prices for your favorite products and get instant notifications when they drop. Our smart alert system monitors prices 24/7 across all major supermarkets.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Real-Time Price Monitoring</p>
                    <p className="text-gray-600 text-sm">Track prices across all supermarkets automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Instant Email & Browser Alerts</p>
                    <p className="text-gray-600 text-sm">Get notified the moment your target price is reached</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Smart Deal Recognition</p>
                    <p className="text-gray-600 text-sm">We identify the best weekly deals and promotional offers</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Heart className="w-5 h-5 mr-2" />
                Set Price Alerts
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-indigo-600 mb-2">30 sec</div>
              <div className="text-gray-600">Average time from comparison to checkout</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">£8.50</div>
              <div className="text-gray-600">Average savings per auto-shop session</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Price monitoring across all stores</div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Matching Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm">
              🧠 Smart Technology
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Intelligent Product Matching
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced matching system compares 68,000+ products across all 10 UK supermarkets,
              ensuring you get true like-for-like comparisons for maximum savings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Brand-to-Brand Matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    When you add branded items like <strong>Branston Baked Beans</strong>, we compare the exact same brand across all supermarkets.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Example comparison:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Tesco - Branston Baked Beans 410g</span>
                        <span className="font-semibold text-teal-600">£1.25</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ASDA - Branston Baked Beans 410g</span>
                        <span className="font-semibold text-green-600">£1.15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sainsbury's - Branston Baked Beans 410g</span>
                        <span className="font-semibold">£1.30</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Like-for-Like Own Brand
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    For own-brand items like <strong>ASDA White Bread</strong>, we intelligently match with equivalent own-brand products from other stores.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Example comparison:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>ASDA Smart Price White Bread 800g</span>
                        <span className="font-semibold">£0.85</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tesco Everyday Value White Bread 800g</span>
                        <span className="font-semibold text-green-600">£0.75</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sainsbury's Basic White Bread 800g</span>
                        <span className="font-semibold">£0.80</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white">
                <div className="text-5xl font-bold mb-2">68,000+</div>
                <div className="text-xl mb-6">Products Tracked</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold">10</div>
                    <div>Supermarkets</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold">Daily</div>
                    <div>Price Updates</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold">AI</div>
                    <div>Matching</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold">Real-time</div>
                    <div>Comparison</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-left">
                <h3 className="font-bold text-gray-900 mb-4">Why This Matters:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>True like-for-like comparisons ensure fair pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>No more comparing premium brands to budget alternatives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Maintain your preferred quality level while saving money</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Automatic matching saves hours of manual comparison</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start saving money today. All plans include a 3-day free trial.
            </p>
          </div>

          {!plansLoading ? (
            plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-8 items-stretch">
                {plans.map((plan, index) => (
                  <Card
                    key={plan.id}
                    className={`relative shadow-xl border-0 flex flex-col ${isPopularPlan(plan.name) ? 'scale-105' : ''}`}
                  >
                    {isPopularPlan(plan.name) && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader className="text-center pb-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getPlanColor(plan.name, index)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        £{plan.price.toFixed(2)}
                        <span className="text-base font-normal text-gray-500">/month</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-grow">
                      <ul className="space-y-3 mb-6 flex-grow">
                        {plan.features.filter(f => f && f.trim()).slice(0, 4).map((featureId, featureIndex) => {
                           const displayName = featureIdMap[featureId.trim()] || featureId;
                           return (
                              <li key={featureIndex} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{displayName}</span>
                              </li>
                           );
                        })}
                      </ul>

                      {plan.features.length > 4 && (
                        <button
                           onClick={() => {
                            setModalPlan(plan);
                            setShowFeaturesModal(true);
                           }}
                           className="text-sm text-teal-600 hover:text-teal-700 font-semibold mb-6 text-left w-full"
                        >
                          +{plan.features.length - 4} more features...
                        </button>
                      )}

                      <div className="mt-auto">
                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          className={`w-full bg-gradient-to-r ${getPlanColor(plan.name, index)} hover:opacity-90`}
                        >
                          {user ? 'Upgrade' : 'Start Free Trial'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Plans are being configured. Check back soon!</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading plans...</p>
            </div>
          )}

          <div className="text-center">
            <Link to={createPageUrl("Pricing")}>
              <Button variant="outline" size="lg">
                Compare All Plans & Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Modal */}
      <Dialog open={showFeaturesModal} onOpenChange={setShowFeaturesModal}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{modalPlan?.name} - All Features</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                {ALL_FEATURES.map(group => {
                    const featuresInPlan = group.features.filter(f => modalPlan?.features.includes(f.id));
                    if (featuresInPlan.length === 0) return null;

                    return (
                        <div key={group.category}>
                            <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b">{group.category}</h4>
                            <ul className="space-y-3">
                            {featuresInPlan.map(feature => (
                                <li key={feature.id} className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                                        <p className="text-xs text-gray-500">{feature.description}</p>
                                    </div>
                                </li>
                            ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Features Section - New Content from Outline */}
      <div className="space-y-20">
      {/* Feature X: Barcode Scanner - REDESIGNED */}
      <div id="barcode-scanner" className="py-24 bg-gradient-to-br from-purple-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full opacity-10 -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200 rounded-full opacity-10 translate-y-40 -translate-x-40"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200 px-4 py-2 text-sm">
              📱 In-Store Scanner
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Scan Any Product, Find Better Deals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Shopping in-store? Scan any barcode to instantly compare prices across all UK supermarkets and add items to your favorites for ongoing price tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left side: Step-by-step visual - REDESIGNED */}
            <div className="relative flex items-center justify-center min-h-[450px]">
              {/* Main in-store action shot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
                className="relative z-10"
              >
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6897713c362f7585d795fbee/e1ce5f588_image.png"
                  alt="Woman scanning a product barcode in a supermarket"
                  className="rounded-2xl shadow-2xl w-full max-w-md"
                />
              </motion.div>

              {/* Floating "Compare Prices" card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-4 -left-4 sm:-left-6 bg-white rounded-lg shadow-lg p-3 border z-20"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold">Compare Prices</span>
                </div>
                <div className="text-[10px] leading-tight text-gray-600 pl-1">
                  <div>Tesco: £2.50</div>
                  <div className="text-green-600 font-bold">ASDA: £1.95 ✓</div>
                </div>
              </motion.div>

              {/* Floating "Add to Favorites" card - FIXED: z-index changed from z-0 to z-20 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute bottom-1/4 -right-4 sm:-right-12 bg-white rounded-lg shadow-lg p-2.5 border z-20"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold">Track for Later</span>
                </div>
              </motion.div>
            </div>

            {/* Right side: Benefits and features */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Barcode Recognition</h3>
                  <p className="text-gray-600">Point your phone at any product barcode and get instant price comparisons across all major UK supermarkets in seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Price Comparison</h3>
                  <p className="text-gray-600">See live prices from Tesco, ASDA, Sainsbury's, Morrisons, and more. Know immediately if you're getting the best deal.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Favorites Tracking</h3>
                  <p className="text-gray-600">Add scanned items to your favorites and get notifications when prices drop. Never miss a deal on products you love.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Price Drop Alerts</h3>
                  <p className="text-gray-600">Set target prices for your scanned products. We'll alert you the moment they hit your desired price point.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works steps */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h4 className="font-bold text-gray-900 mb-2">Open Scanner</h4>
                <p className="text-sm text-gray-600">Access the barcode scanner from your dashboard</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h4 className="font-bold text-gray-900 mb-2">Scan Product</h4>
                <p className="text-sm text-gray-600">Point camera at any barcode while shopping</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h4 className="font-bold text-gray-900 mb-2">Compare Prices</h4>
                <p className="text-sm text-gray-600">See instant price comparison across all stores</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
                <h4 className="font-bold text-gray-900 mb-2">Track & Save</h4>
                <p className="text-sm text-gray-600">Add to favorites for ongoing price monitoring</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">2sec</div>
              <div className="text-gray-600">Average scan time</div>
            </div>
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-gray-600">Supermarkets compared</div>
            </div>
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">£25</div>
              <div className="text-gray-600">Average monthly savings</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={handleGetStarted}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CameraIcon className="w-5 h-5 mr-2" />}
              Start Scanning Products
            </Button>
            <p className="text-sm text-gray-500 mt-3">Works on any smartphone • No app download required</p>
          </div>
        </div>
      </div>

      {/* Feature 3: Family Sharing - COMPLETELY REDESIGNED */}
      <div id="family-sharing" className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full opacity-10 -translate-y-48 -translate-x-48"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-200 rounded-full opacity-10 translate-y-40 translate-x-40"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2 text-sm">
              👨‍👩‍👧‍👦 Family Features
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Shop Together, Save Together
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Unite your household with powerful family sharing features. Create groups, invite members, share lists and budgets, and save money as a team with granular permission controls.
            </p>
          </div>

          {/* Main Feature Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            
            {/* Left Side: Interactive Demo */}
            <div className="relative">
              {/* Main Admin Dashboard Mockup */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">The Johnson Family</h3>
                    <p className="text-sm text-gray-500">4 members • Admin: Sarah</p>
                  </div>
                </div>

                {/* Family Members List */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>
                      <div>
                        <p className="font-medium text-gray-900">Sarah (You)</p>
                        <p className="text-xs text-emerald-600">Admin • All permissions</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">Admin</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
                      <div>
                        <p className="font-medium text-gray-900">Mike</p>
                        <p className="text-xs text-gray-500">Can edit lists & budget</p>
                      </div>
                    </div>
                    <Badge variant="outline">Member</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">E</div>
                      <div>
                        <p className="font-medium text-gray-900">Emma</p>
                        <p className="text-xs text-gray-500">View only access</p>
                      </div>
                    </div>
                    <Badge variant="outline">View Only</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">?</div>
                      <div>
                        <p className="font-medium text-gray-900">grandma@email.com</p>
                        <p className="text-xs text-yellow-600">Invitation pending</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Invited</Badge>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Invite Member
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Permissions
                  </Button>
                </div>
              </motion.div>

              {/* Floating Invitation Methods */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -left-8 top-1/3 bg-white rounded-xl shadow-lg p-4 border w-56"
              >
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Invite Family Members</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">@</span>
                    </div>
                    <span>Send email invitation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">🔗</span>
                    </div>
                    <span>Share invitation link</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600">📱</span>
                    </div>
                    <span>Generate QR code</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Budget Widget */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -right-8 bottom-8 bg-white rounded-xl shadow-lg p-4 border w-64"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Family Budget</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Monthly Groceries</span>
                    <span className="font-medium">£320 / £400</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>£80 remaining</span>
                    <span>3 days left</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side: Feature Benefits */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Group Management</h3>
                  <p className="text-gray-600">Create family groups with up to 8 members. Set different permission levels for each member - from view-only access to full admin control.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Multiple Invitation Methods</h3>
                  <p className="text-gray-600">Invite family members via email, shareable links, or QR codes. Perfect for tech-savvy teens or less tech-comfortable grandparents.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Shared Lists</h3>
                  <p className="text-gray-600">Everyone sees updates instantly. Add items on the go, check off purchases in-store, and never miss anything again.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Unified Budget Control</h3>
                  <p className="text-gray-600">Set budgets, track expenses in real-time, and get alerts when approaching budget limits. Perfect financial visibility for the whole household.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Granular Permissions</h3>
                  <p className="text-gray-600">Control exactly what each member can do - edit lists, manage budget, invite others, or just view and add items. Perfect for families with children.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How Family Sharing Works - Step by Step */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">How Family Sharing Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                >
                  1
                </motion.div>
                <h4 className="font-bold text-gray-900 mb-2">Create Your Group</h4>
                <p className="text-sm text-gray-600">Set up your family group and choose a name. You become the admin with full control.</p>
              </div>
              
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                >
                  2
                </motion.div>
                <h4 className="font-bold text-gray-900 mb-2">Invite Family Members</h4>
                <p className="text-sm text-gray-600">Send email invites, share links, or show QR codes. Set their permission level during invitation.</p>
              </div>
              
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                >
                  3
                </motion.div>
                <h4 className="font-bold text-gray-900 mb-2">Set Shared Budget</h4>
                <p className="text-sm text-gray-600">Define monthly or weekly grocery budgets that everyone can see and track together.</p>
              </div>
              
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                >
                  4
                </motion.div>
                <h4 className="font-bold text-gray-900 mb-2">Shop & Save Together</h4>
                <p className="text-sm text-gray-600">Everyone contributes to lists, compares prices, and helps the family save money together.</p>
              </div>
            </div>
          </div>

          {/* Permission Levels Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Admin Level</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Manage all family members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Set budgets and permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Invite new members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Access all shared features</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Member Level</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Edit shared shopping lists</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Add items to favorites</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>View budget status</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Compare prices and shop</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">View Only</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span>View shared shopping lists</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span>See family favorites</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span>Monitor budget progress</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span>Perfect for young children</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center mb-16">
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-emerald-600 mb-2">8</div>
              <div className="text-gray-600">Max family members</div>
            </div>
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">Real-time</div>
              <div className="text-600">List synchronization</div>
            </div>
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-gray-600">Permission levels</div>
            </div>
            <div className="bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">£45</div>
              <div className="text-gray-600">Average family savings</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={handleGetStarted}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="w-5 h-5 mr-2" />}
              Start Family Sharing
            </Button>
            <p className="text-sm text-gray-500 mt-3">Unite your household • Save money together • Free to start</p>
          </div>
        </div>
      </div>

      {/* Feature 4: AI Shopping Assistant - REDESIGNED */}
      <div id="ai-assistant" className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
             <Badge className="mb-6 bg-teal-400/20 text-teal-300 border-teal-400/30 px-4 py-2 text-sm">
              🤖 Your Shopping Co-Pilot
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Meet Your Personal Shopping AI
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From voice commands to smart suggestions, our AI is here to make your shopping faster, cheaper, and easier. Just ask.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side - feature list */}
              <div className="md:w-1/3 space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5"/>
                  </div>
                  <div>
                    <h4 className="font-semibold">Voice Commands</h4>
                    <p className="text-sm text-gray-400">"Add milk and bread to my list."</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="w-5 h-5"/>
                  </div>
                  <div>
                    <h4 className="font-semibold">Smart Suggestions</h4>
                    <p className="text-sm text-gray-400">Find healthier alternatives or cheaper swaps.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5"/>
                  </div>
                  <div>
                    <h4 className="font-semibold">Recipe Finder</h4>
                    <p className="text-sm text-gray-400">"What can I make with chicken and rice?"</p>
                  </div>
                </div>
              </div>

              {/* Right side - chat interface */}
              <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-700">
                {/* Chat messages */}
                <div className="space-y-4 h-64 overflow-y-auto pr-2">
                  {/* User message (voice) */}
                   <motion.div initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="flex justify-end">
                    <div className="bg-teal-600 rounded-lg p-3 max-w-xs flex items-center gap-2">
                      <Mic className="w-4 h-4"/>
                      <p className="text-sm">"Find me a cheap recipe for chicken pasta"</p>
                    </div>
                  </motion.div>
                  {/* AI response */}
                  <motion.div initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.8}} className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Sure! Here's a Creamy Chicken Pasta recipe that costs about £5.40. I've added the ingredients to a new shopping list for you.</p>
                    </div>
                  </motion.div>
                  {/* AI voice indicator */}
                  <motion.div initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 1.2}} className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg p-2 flex items-center gap-2">
                       <Volume2 className="w-4 h-4 text-teal-400"/>
                       <div className="flex gap-0.5 items-center h-4">
                         <div className="w-0.5 h-full bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-0.5 h-2/3 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                         <div className="w-0.5 h-full bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                         <div className="w-0.5 h-1/2 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                       </div>
                    </div>
                  </motion.div>
                </div>
                {/* Input bar */}
                <div className="mt-4 flex items-center gap-2 border-t border-gray-700 pt-3">
                  <input type="text" placeholder="Type or speak your request..." className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm border-gray-600 focus:ring-teal-500 focus:border-teal-500"/>
                  <Button size="icon" className="bg-teal-600 hover:bg-teal-700 rounded-full"><Send className="w-4 h-4"/></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: AI Meal Planner & Recipes Section */}
      <div id="meal-planner" className="py-24 bg-gradient-to-br from-slate-50 to-gray-100 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-amber-100 text-amber-800 border-amber-200 px-4 py-2 text-sm">
              🧑‍🍳 Smart Cooking
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Effortless Meal Planning & Recipes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tell our AI your budget, diet, and preferences to get a delicious weekly meal plan with an auto-generated shopping list.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left side: Interactive Process */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900">From Plan to Plate in 3 Steps:</h3>
              
              <motion.div 
                initial={{opacity:0, x:-20}} 
                whileInView={{opacity:1, x:0}} 
                transition={{delay: 0.1}} 
                className="flex items-start gap-4"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">1</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">Set Your Preferences</h4>
                  <p className="text-gray-600">Choose your budget, number of people, diet (vegan, gluten-free, etc.), and favorite cuisines.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">£50/week</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Vegetarian</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">4 people</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{opacity:0, x:-20}} 
                whileInView={{opacity:1, x:0}} 
                transition={{delay: 0.2}} 
                className="flex items-start gap-4"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">2</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">Get Your Weekly Plan</h4>
                  <p className="text-gray-600">Our AI instantly generates a 7-day meal plan with delicious, easy-to-follow recipes.</p>
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">This week's plan:</div>
                    <div className="text-sm font-medium text-gray-900">7 meals • 23 ingredients • £47.20 total</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{opacity:0, x:-20}} 
                whileInView={{opacity:1, x:0}} 
                transition={{delay: 0.3}} 
                className="flex items-start gap-4"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">3</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">Shop in One Click</h4>
                  <p className="text-gray-600">A complete shopping list is created for you. Compare prices and add everything to your cart instantly.</p>
                  <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Generate Shopping List
                  </Button>
                </div>
              </motion.div>
            </div>
            
            {/* Right side: Modern Interactive Demo */}
            <div className="relative">
              {/* Main AI Interface Mockup */}
              <motion.div 
                initial={{opacity:0, scale:0.9}} 
                whileInView={{opacity:1, scale:1}} 
                transition={{duration: 0.6, delay: 0.2}}
                className="bg-white rounded-2xl shadow-2xl p-6 border relative z-10"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">AI Meal Planner</h3>
                    <p className="text-sm text-gray-500">Creating your perfect week...</p>
                  </div>
                </div>

                {/* Weekly Meal Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-3 rounded-lg border border-orange-200">
                    <div className="w-full h-16 bg-orange-200 rounded-md mb-2 flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900">Mon: Chicken Stir Fry</h4>
                    <p className="text-xs text-gray-600">Quick & healthy</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="w-full h-16 bg-green-200 rounded-md mb-2 flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900">Tue: Veggie Pasta</h4>
                    <p className="text-xs text-gray-600">Budget-friendly</p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Weekly Budget</span>
                    <span className="font-semibold text-gray-900">£47.20 / £50.00</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "94%" }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  Generate Shopping List
                </Button>
              </motion.div>

              {/* Floating Elements */}
              <motion.div 
                initial={{opacity:0, rotate: 10, scale:0.8}} 
                whileInView={{opacity:1, rotate: 5, scale:1}} 
                transition={{delay: 0.6}}
                className="absolute -top-4 -left-8 bg-white rounded-lg shadow-xl p-3 border z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-xs font-semibold">AI Generated</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{opacity:0, rotate: -8, scale:0.8}} 
                whileInView={{opacity:1, rotate: -5, scale:1}} 
                transition={{delay: 0.8}}
                className="absolute -bottom-6 -right-8 bg-white rounded-lg shadow-xl p-3 border z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold">Under Budget</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-emerald-600 mb-2">30 sec</div>
              <div className="text-gray-600">To generate meal plan</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
              <div className="text-gray-600">Recipe database</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">£15+</div>
              <div className="text-gray-600">Average weekly savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 5: Financial Tools - COMPLETELY REDESIGNED */}
      <div id="financial-tools" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-gradient-to-r from-purple-600/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-gradient-to-l from-teal-500/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your Financial <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Superpowers</span>
            </h2>
            <p className="text-lg text-slate-300">
              Take full control of your spending. Our tools help you predict future price changes, track your budget, and get insights to save even more.
            </p>
          </div>
          
          {/* Main Visual - Command Center */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-slate-700 grid md:grid-cols-2 gap-8 items-center"
          >
            {/* Left: Price Prediction Graph */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400"/>
                AI Price Predictions
              </h3>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Hovis Wholemeal Bread (800g)</p>
                <div className="relative h-32">
                  {/* Fake graph background lines */}
                  <div className="absolute top-0 left-0 w-full h-full grid grid-rows-4">
                    <div className="border-b border-slate-700/50"></div>
                    <div className="border-b border-slate-700/50"></div>
                    <div className="border-b border-slate-700/50"></div>
                    <div></div>
                  </div>
                  {/* Fake graph line */}
                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <motion.path
                      d="M 0 30 Q 25 10, 50 20 T 100 5"
                      stroke="#0d9488"
                      strokeWidth="1.5"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
                    />
                  </svg>
                </div>
                 <div className="mt-2 text-xs text-center text-teal-400 font-medium">Price expected to drop next week!</div>
              </div>
            </div>

            {/* Right: Budget Tracker */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-purple-400"/>
                Smart Budgeting
              </h3>
              <div className="space-y-4">
                {/* Budget 1 */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Monthly Groceries</span>
                    <span className="text-slate-400">£321 / £400</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                {/* Budget 2 */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Takeaways</span>
                    <span className="text-slate-400">£45 / £50</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Breakdown */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
            {/* Card 1 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: 0.2}}>
              <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center rounded-lg mb-4">
                  <TrendingUp className="w-6 h-6"/>
                </div>
                <h4 className="font-bold text-lg mb-2">Predict the Future</h4>
                <p className="text-slate-400 text-sm">Our AI analyzes historical data to forecast future price changes, telling you the best time to buy to maximize savings.</p>
              </div>
            </motion.div>
            {/* Card 2 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: 0.3}}>
              <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center rounded-lg mb-4">
                  <PiggyBank className="w-6 h-6"/>
                </div>
                <h4 className="font-bold text-lg mb-2">Never Overspend</h4>
                <p className="text-slate-400 text-sm">Set weekly or monthly budgets for different categories. Get alerts when you’re approaching your limit to stay on track.</p>
              </div>
            </motion.div>
            {/* Card 3 */}
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: 0.4}}>
              <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center rounded-lg mb-4">
                  <BarChart className="w-6 h-6"/>
                </div>
                <h4 className="font-bold text-lg mb-2">Get Clear Insights</h4>
                <p className="text-slate-400 text-sm">Visualize where your money is going with easy-to-read charts and reports. Identify opportunities to save even more.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>

      {/* Social Proof */}
      <section className="py-24 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Trusted by Smart Shoppers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">£200+</div>
              <div className="text-gray-600">Average Monthly Savings</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">30mins</div>
              <div className="text-gray-600">Time Saved Per Shop</div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">98%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-8">
            {Array(5).fill(0).map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
            <span className="ml-3 text-lg font-medium text-gray-700">4.9/5 rating</span>
          </div>

          <p className="text-lg text-gray-600 italic max-w-2xl mx-auto">
            "MyShopRun has transformed how I shop. I save over £250 every month without changing what I buy - just where I buy it!"
          </p>
          <p className="text-sm text-gray-500 mt-2">- Sarah M., London</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Start Saving Today
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of smart shoppers saving hundreds of pounds every month. Try MyShopRun free for 3 days.
          </p>

          <Button
            size="lg"
            className="bg-white text-teal-600 hover:bg-teal-50 text-lg px-8 py-4 h-auto mb-4"
            onClick={handleGetStarted} // Uses handleGetStarted
            disabled={loading} // Uses loading state
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="w-5 h-5 ml-2" />}
            Start Your Free Trial
          </Button>

          <p className="text-sm text-teal-200">
            No credit card required • Cancel anytime • 3-day free trial
          </p>
        </div>
      </section>

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              For any inquiries, please reach out to us at:
            </p>
            <p className="font-semibold text-teal-600 mt-2">
              support@myshoprun.com
            </p>
            <p className="text-sm text-gray-500 mt-4">
              We aim to respond to all inquiries within 24-48 hours.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsContactModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
