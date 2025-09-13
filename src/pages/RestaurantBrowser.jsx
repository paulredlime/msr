
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  UtensilsCrossed,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const platformLogos = {
  ubereats: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd90136a7_image.png",
  deliveroo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/234d89b82_image.png",
  justeat: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6d1b0ead6_image.png"
};

const platformNames = {
  ubereats: "Uber Eats",
  deliveroo: "Deliveroo", 
  justeat: "Just Eat"
};

// UK outcodes for area selection
const ukOutcodes = [
  "SE1", "SW1", "E1", "W1", "NW1", "N1", "EC1", "WC1", "SW7", "SE10",
  "E14", "W2", "NW3", "N4", "EC2", "WC2", "SW3", "SE16", "E2", "W14",
  "B1", "M1", "L1", "EH1", "G1", "CF10", "BS1", "LS1", "S1", "NE1",
  "DN1", "LE1", "NG1", "CV1", "DE1", "LN1", "PE1", "NR1", "IP1", "CB1",
  "RG1", "SL1", "HP1", "AL1", "MK1", "OX1", "PO1", "SO14", "BN1", "CT1",
  "ME1", "TN1", "DA1", "RM1", "IG1", "HA1", "UB1", "TW1", "KT1", "CR0",
  "SM1", "BR1", "CR4" // Added more diverse postcodes for better demo
];

// Popular restaurants for autocomplete
const popularRestaurants = [
  "McDonald's", "KFC", "Burger King", "Subway", "Pizza Hut", "Domino's Pizza",
  "Nando's", "Five Guys", "Greggs", "Starbucks", "Costa Coffee", "Pret A Manger",
  "Wagamama", "YO! Sushi", "Pizza Express", "Zizzi", "ASK Italian", "TGI Friday's",
  "Harvester", "Frankie & Benny's", "Chiquito", "Las Iguanas", "Bella Italia",
  "Prezzo", "Café Rouge", "Bills", "Gourmet Burger Kitchen", "Byron", "Honest Burgers",
  "Leon", "Itsu", "Wasabi", "Chopstix", "Tossed", "EAT", "Crussh", "Pure",
  "Indian", "Chinese", "Thai", "Italian", "Mexican", "Japanese", "Turkish", "Greek"
];

export default function RestaurantBrowser() {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [error, setError] = useState(null);
  
  // Search filters
  const [selectedPlatforms, setSelectedPlatforms] = useState(["ubereats"]);
  const [area, setArea] = useState("SE1");
  const [searchQuery, setSearchQuery] = useState("");
  const [postcodeSuggestions, setPostcodeSuggestions] = useState([]);
  const [restaurantSuggestions, setRestaurantSuggestions] = useState([]);


  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        // Don't allow deselecting if it's the last selected platform
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const searchRestaurants = async () => {
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Always use demo mode for now since DataClient is not available
      setRestaurants(getDemoRestaurants());
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setError("Failed to search restaurants. Please try again.");
      // Fallback to demo data
      setRestaurants(getDemoRestaurants());
    }
    setLoading(false);
  };

  const getDemoRestaurants = () => {
    const demoData = [
      {
        id: "demo-mcdonalds-ue",
        name: "McDonald's",
        platform: "ubereats",
        area: "SE1",
        rating: 4.2,
        cuisine: "Fast Food",
        delivery_time: "15-30 min",
        delivery_fee: 2.49,
        minimum_order: 0,
        restaurant_url: "https://www.ubereats.com/gb/store/mcdonalds",
        last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&h=200&fit=crop"
      },
      {
        id: "demo-pizza-express-deliveroo",
        name: "PizzaExpress",
        platform: "deliveroo",
        area: "SE1",
        rating: 4.1,
        cuisine: "Italian",
        delivery_time: "25-40 min",
        delivery_fee: 3.49,
        minimum_order: 15.00,
        restaurant_url: "https://deliveroo.co.uk/menu/london/southwark/pizzaexpress",
        last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop"
      },
      {
        id: "demo-kfc-justeat",
        name: "KFC",
        platform: "justeat",
        area: "SE1",
        rating: 3.9,
        cuisine: "Chicken",
        delivery_time: "20-35 min",
        delivery_fee: 1.99,
        minimum_order: 8.00,
        restaurant_url: "https://www.just-eat.co.uk/restaurants-kfc-delivery",
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1626082927389-6ac097b636c8?w=300&h=200&fit=crop"
      },
      {
        id: "demo-nandos-ubereats",
        name: "Nando's",
        platform: "ubereats",
        area: "SE1",
        rating: 4.3,
        cuisine: "Portuguese",
        delivery_time: "20-35 min",
        delivery_fee: 2.99,
        minimum_order: 12.00,
        restaurant_url: "https://www.ubereats.com/gb/store/nandos",
        last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop"
      },
      {
        id: "demo-five-guys-deliveroo",
        name: "Five Guys",
        platform: "deliveroo",
        area: "SE1",
        rating: 4.4,
        cuisine: "American",
        delivery_time: "30-45 min",
        delivery_fee: 3.99,
        minimum_order: 15.00,
        restaurant_url: "https://deliveroo.co.uk/menu/london/southwark/five-guys",
        last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop"
      },
      {
        id: "demo-subway-justeat",
        name: "Subway",
        platform: "justeat",
        area: "SE1",
        rating: 4.0,
        cuisine: "Sandwiches",
        delivery_time: "15-25 min",
        delivery_fee: 1.49,
        minimum_order: 5.00,
        restaurant_url: "https://www.just-eat.co.uk/restaurants-subway",
        last_updated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop"
      },
      // Adding a restaurant for a different postcode
      {
        id: "demo-burgerking-m1",
        name: "Burger King",
        platform: "ubereats",
        area: "M1", // Manchester
        rating: 3.8,
        cuisine: "Fast Food",
        delivery_time: "20-35 min",
        delivery_fee: 2.50,
        minimum_order: 7.00,
        restaurant_url: "https://www.ubereats.com/gb/store/burgerking",
        last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1606131731446-ce7b2976766d?w=300&h=200&fit=crop"
      },
      {
        id: "demo-greggs-eh1",
        name: "Greggs",
        platform: "justeat",
        area: "EH1", // Edinburgh
        rating: 4.5,
        cuisine: "Bakery",
        delivery_time: "10-20 min",
        delivery_fee: 1.00,
        minimum_order: 3.00,
        restaurant_url: "https://www.just-eat.co.uk/restaurants-greggs",
        last_updated: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: "https://images.unsplash.com/photo-1569032644265-1d4e0e5a5b5c?w=300&h=200&fit=crop"
      }
    ];
    
    return demoData.filter(restaurant => {
      const platformMatch = selectedPlatforms.includes(restaurant.platform);
      const areaMatch = restaurant.area === area; // Exact match for demo
      const queryMatch = !searchQuery || restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      return platformMatch && areaMatch && queryMatch;
    });
  };

  const loadMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setMenuLoading(true);
    setShowMenuDialog(true);
    setBasket([]);
    setError(null);
    
    try {
      // Always use demo mode since DataClient is not available
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setMenuItems(getDemoMenu(restaurant));
    } catch (error) {
      console.error('Error loading menu:', error);
      setError("Failed to load menu. Please try again.");
      setMenuItems([]);
    }
    setMenuLoading(false);
  };

  const getDemoMenu = (restaurant) => {
    const menus = {
      "McDonald's": [
        { id: "1", name: "Big Mac", description: "Two all-beef patties, special sauce, lettuce, cheese...", price: 4.49, category: "Burgers", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop" },
        { id: "2", name: "Quarter Pounder with Cheese", description: "Fresh beef, cheese, onions, pickles", price: 4.89, category: "Burgers" },
        { id: "3", name: "Chicken McNuggets (6 piece)", description: "Tender chicken pieces", price: 3.49, category: "Chicken" },
        { id: "4", name: "Large Fries", description: "Golden fries", price: 1.89, category: "Sides" },
        { id: "5", name: "McFlurry Oreo", description: "Vanilla soft serve with Oreo pieces", price: 1.49, category: "Desserts" }
      ],
      "PizzaExpress": [
        { id: "1", name: "Margherita", description: "Tomato, mozzarella, basil", price: 8.95, category: "Pizza" },
        { id: "2", name: "American Hot", description: "Pepperoni, mozzarella, hot green peppers", price: 11.25, category: "Pizza" },
        { id: "3", name: "Quattro Stagioni", description: "Ham, mushrooms, artichokes, olives", price: 12.45, category: "Pizza" },
        { id: "4", name: "Dough Balls", description: "Pizza bread with garlic butter", price: 4.95, category: "Starters" },
        { id: "5", name: "Tiramisu", description: "Classic Italian dessert", price: 5.95, category: "Desserts" }
      ],
      "KFC": [
        { id: "1", name: "Original Recipe Burger", description: "100% chicken breast fillet", price: 4.99, category: "Burgers" },
        { id: "2", name: "6 Hot Wings", description: "Spicy chicken wings", price: 3.99, category: "Chicken" },
        { id: "3", name: "Family Feast", description: "6 pieces, 2 large sides, 4 drives", price: 19.99, category: "Sharing" },
        { id: "4", name: "Regular Popcorn Chicken", description: "Bite-sized chicken pieces", price: 3.49, category: "Chicken" },
        { id: "5", name: "Gravy", description: "Our famous gravy", price: 0.80, category: "Sides" }
      ],
      "Nando's": [
        { id: "1", name: "Butterfly Chicken (Half)", description: "Marinated in PERi-PERi", price: 7.95, category: "Chicken" },
        { id: "2", name: "Chicken Wrap", description: "With lettuce, tomato and PERi-PERi sauce", price: 6.75, category: "Wraps" },
        { id: "3", name: "PERi-PERi Chips", description: "With PERi-PERi seasoning", price: 3.25, category: "Sides" },
        { id: "4", name: "Halloumi & Red Pepper Wrap", description: "Grilled halloumi with peppers", price: 6.25, category: "Wraps" },
        { id: "5", name: "Chocolate Cake", description: "Rich chocolate cake", price: 4.95, category: "Desserts" }
      ],
      "Five Guys": [
        { id: "1", name: "Hamburger", description: "Fresh ground beef, hand-formed patties", price: 7.75, category: "Burgers" },
        { id: "2", name: "Cheeseburger", description: "With American cheese", price: 8.25, category: "Burgers" },
        { id: "3", name: "Little Fries", description: "Fresh cut potatoes", price: 3.75, category: "Sides" },
        { id: "4", name: "Bacon Cheeseburger", description: "With crispy bacon and cheese", price: 9.50, category: "Burgers" },
        { id: "5", name: "Milkshake", description: "Hand-spun vanilla milkshake", price: 4.50, category: "Drinks" }
      ],
      "Subway": [
        { id: "1", name: "Italian B.M.T.", description: "Ham, pepperoni, salami", price: 5.49, category: "Subs" },
        { id: "2", name: "Chicken Teriyaki", description: "Chicken strips with teriyaki sauce", price: 5.99, category: "Subs" },
        { id: "3", name: "Veggie Delite", description: "Fresh vegetables", price: 4.29, category: "Subs" },
        { id: "4", name: "Cookies (3)", description: "Freshly baked cookies", price: 1.50, category: "Treats" },
        { id: "5", name: "Crisps", description: "Various flavours available", price: 1.00, category: "Sides" }
      ],
      "Burger King": [
        { id: "1", name: "Whopper", description: "Flame-grilled beef patty with fresh vegetables", price: 5.99, category: "Burgers" },
        { id: "2", name: "Chicken Royale", description: "Crispy chicken patty with lettuce and mayo", price: 5.49, category: "Burgers" },
        { id: "3", name: "Fries (Large)", description: "Classic salted fries", price: 2.29, category: "Sides" },
        { id: "4", name: "Onion Rings", description: "Crispy battered onion rings", price: 2.59, category: "Sides" }
      ],
      "Greggs": [
        { id: "1", name: "Sausage Roll", description: "Pork sausage meat seasoned and baked in golden puff pastry", price: 1.20, category: "Savouries" },
        { id: "2", name: "Steak Bake", description: "Diced prime beef in a rich gravy, encased in golden puff pastry", price: 1.80, category: "Savouries" },
        { id: "3", name: "Vegan Sausage Roll", description: "Vegan-friendly sausage meat in golden puff pastry", price: 1.20, category: "Savouries" },
        { id: "4", name: "Doughnut (Sugar Strand)", description: "Ring doughnut topped with colourful sugar strands", price: 1.00, category: "Sweet Treats" }
      ]
    };
    
    return menus[restaurant.name] || [];
  };

  const addToBasket = (item) => {
    const existingItem = basket.find(b => b.id === item.id);
    if (existingItem) {
      setBasket(basket.map(b => 
        b.id === item.id ? { ...b, quantity: b.quantity + 1 } : b
      ));
    } else {
      setBasket([...basket, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setBasket(basket.filter(b => b.id !== itemId));
    } else {
      setBasket(basket.map(b => 
        b.id === itemId ? { ...b, quantity: newQuantity } : b
      ));
    }
  };

  const handleOrderNow = async (restaurant, basketItems = []) => {
    try {
      // Fallback behavior since DataClient is not available
      const itemsList = basketItems.map(b => `${b.quantity}x ${b.name}`).join(', ');
      window.open(restaurant.restaurant_url, '_blank');
      if (basketItems.length > 0) {
        alert(`We've opened ${restaurant.name} for you. Please add these items manually: ${itemsList}`);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      // Fallback - just open the restaurant
      window.open(restaurant.restaurant_url, '_blank');
    }
  };

  const handleAreaChange = (e) => {
    const value = e.target.value.toUpperCase();
    setArea(value);
    if (value) {
      setPostcodeSuggestions(
        ukOutcodes.filter(p => p.startsWith(value))
      );
    } else {
      setPostcodeSuggestions([]);
    }
  };

  const selectPostcode = (postcode) => {
    setArea(postcode);
    setPostcodeSuggestions([]);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setRestaurantSuggestions(
        popularRestaurants.filter(restaurant => 
          restaurant.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setRestaurantSuggestions([]);
    }
  };

  const selectRestaurant = (restaurant) => {
    setSearchQuery(restaurant);
    setRestaurantSuggestions([]);
  };

  const basketTotal = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50/30 to-red-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-orange-600" />
            Restaurant Browser
          </h1>
          <p className="text-gray-600">Browse restaurants and menus from delivery platforms</p>
        </div>

        {/* Search Filters */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Platform Selection */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Select Delivery Platforms</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(platformLogos).map(([platform, logo]) => (
                    <motion.div
                      key={platform}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        selectedPlatforms.includes(platform)
                          ? 'border-orange-500 bg-orange-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => togglePlatform(platform)}
                    >
                      {selectedPlatforms.includes(platform) && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-3">
                        <img src={logo} alt={platformNames[platform]} className="h-12 w-auto object-contain" />
                        <span className="font-medium text-gray-900">{platformNames[platform]}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {selectedPlatforms.length === 0 && (
                  <p className="text-red-500 text-sm mt-2">Please select at least one platform</p>
                )}
              </div>

              {/* Area and Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Label htmlFor="area">Area (UK Outcode)</Label>
                  <Input
                    id="area"
                    placeholder="e.g., SE1, SW1"
                    value={area}
                    onChange={handleAreaChange}
                    onFocus={handleAreaChange}
                    onBlur={() => setTimeout(() => setPostcodeSuggestions([]), 150)}
                    className="mt-1"
                    autoComplete="off"
                  />
                  {postcodeSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <ul className="py-1">
                        {postcodeSuggestions.slice(0, 7).map(postcode => (
                          <li
                            key={postcode}
                            className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                            onMouseDown={() => selectPostcode(postcode)}
                          >
                            {postcode}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <Label htmlFor="search">Search (Optional)</Label>
                  <Input
                    id="search"
                    placeholder="Restaurant or cuisine..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onBlur={() => setTimeout(() => setRestaurantSuggestions([]), 150)}
                    className="mt-1"
                    autoComplete="off"
                  />
                  {restaurantSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <ul className="py-1">
                        {restaurantSuggestions.slice(0, 8).map(restaurant => (
                          <li
                            key={restaurant}
                            className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                            onMouseDown={() => selectRestaurant(restaurant)}
                          >
                            {restaurant}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={searchRestaurants} 
                    disabled={loading || selectedPlatforms.length === 0} 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Search Restaurants
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-gray-600">Searching restaurants...</p>
            </div>
          ) : restaurants.length > 0 ? (
            <AnimatePresence>
              {restaurants.map((restaurant) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {restaurant.image_url && (
                            <img 
                              src={restaurant.image_url} 
                              alt={restaurant.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                              <img 
                                src={platformLogos[restaurant.platform]} 
                                alt={platformNames[restaurant.platform]}
                                className="w-6 h-6"
                              />
                              {restaurant.rating && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {restaurant.rating}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {restaurant.area || area}
                                </span>
                                {restaurant.delivery_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {restaurant.delivery_time}
                                  </span>
                                )}
                                {restaurant.delivery_fee && (
                                  <span>Delivery: £{restaurant.delivery_fee}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {restaurant.cuisine} • Min order: £{restaurant.minimum_order}
                              </div>
                              {restaurant.last_updated && (
                                <div className="text-xs text-gray-500">
                                  Last updated: {new Date(restaurant.last_updated).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => loadMenu(restaurant)}
                          >
                            View Menu
                          </Button>
                          <Button
                            onClick={() => handleOrderNow(restaurant, [])}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Order Now
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-16">
              <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search filters or area</p>
              {!loading && selectedPlatforms.length === 0 && (
                <p className="text-sm text-red-600">Please select at least one platform to search</p>
              )}
            </div>
          )}
        </div>

        {/* Menu Dialog */}
        <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedRestaurant && (
                  <>
                    <img 
                      src={platformLogos[selectedRestaurant.platform]} 
                      alt={platformNames[selectedRestaurant.platform]}
                      className="w-6 h-6"
                    />
                    {selectedRestaurant.name} Menu
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-6 h-[calc(90vh-120px)]">
              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto">
                {menuLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading menu...
                  </div>
                ) : menuItems.length > 0 ? (
                  <div className="space-y-4">
                    {menuItems.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  £{item.price?.toFixed(2) || 'N/A'}
                                </span>
                                {item.category && (
                                  <Badge variant="outline">{item.category}</Badge>
                                )}
                              </div>
                            </div>
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md ml-4"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <Button
                              onClick={() => addToBasket(item)}
                              size="sm"
                              className="ml-4 bg-orange-600 hover:bg-orange-700"
                              disabled={!item.price}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Menu not cached yet — try again later after the monthly crawl.
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadMenu(selectedRestaurant)}
                        className="ml-2"
                        disabled={menuLoading}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Basket Sidebar */}
              <div className="w-80 border-l border-gray-200 pl-6">
                <div className="sticky top-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Basket ({basket.length})
                  </h3>
                  
                  {basket.length > 0 ? (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {basket.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600">£{item.price?.toFixed(2) || '0.00'} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Add items from the menu to start your order
                    </p>
                  )}

                  {basket.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          £{basketTotal.toFixed(2)}
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => handleOrderNow(selectedRestaurant, basket)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        size="lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Order Now
                      </Button>
                      
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Opens restaurant website with your items
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
