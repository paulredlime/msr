export const ALL_FEATURES = [
  {
    category: "Core Grocery",
    features: [
      { id: "GROCERY_PASTE_LIST", name: "Paste & Compare", description: "Allow users to paste a simple shopping list for comparison across multiple supermarkets." },
      { id: "GROCERY_SAVE_LISTS", name: "Save Shopping Lists", description: "Users can create, save, and manage multiple shopping lists." },
      { id: "GROCERY_PRICE_HISTORY", name: "Price History Tracking", description: "View historical price charts for products to identify trends." },
    ]
  },
  {
    category: "Premium Grocery",
    features: [
      { id: "GROCERY_CONNECT_ACCOUNTS", name: "Connect Supermarket Accounts", description: "Link accounts from major supermarkets (e.g., Tesco, ASDA) to import history and preferences." },
      { id: "GROCERY_AUTO_CHECKOUT", name: "One-Click Basket Fill", description: "Use browser extension/bookmarklet to automatically add selected items to your online grocery cart." },
      { id: "SMART_SUBSTITUTIONS", name: "Smart Substitutions", description: "Get AI-powered suggestions for out-of-stock items." },
    ]
  },
  {
    category: "Food Delivery",
    features: [
      { id: "FOOD_BROWSE_RESTAURANTS", name: "Browse Restaurants & Menus", description: "Users can search and view menus from various food delivery platforms." },
      { id: "FOOD_DELIVERY_COMPARISON", name: "Food Delivery Price Check", description: "Compare takeaway prices across different delivery services (Uber Eats, Deliveroo, Just Eat)." }
    ]
  },
  {
    category: "Favorites & Alerts",
    features: [
      { id: "FAVORITES_SAVE_ITEMS", name: "Save Favorite Items", description: "Users can save frequently purchased or desired items to a favorites list." },
      { id: "FAVORITES_PRICE_ALERTS", name: "Price Drop Alerts", description: "Receive notifications when a favorite item's price drops below a certain threshold." },
      { id: "FAVORITES_ALERT_FREQUENCY", name: "Set Alert Frequency", description: "Choose between daily or weekly price checks for your favorited items." }
    ]
  },
  {
    category: "AI & Smart Features",
    features: [
        { id: 'AI_MEAL_PLANNER', name: 'AI Meal Planner', description: 'Generate weekly meal plans based on dietary preferences and budget.' },
        { id: 'AI_CHAT_ASSISTANT', name: 'AI Shopping Assistant', description: 'Chat with AI to get shopping advice, find deals, and manage your lists.' },
        { id: 'SMART_INVENTORY', name: 'Smart Inventory', description: 'Track your pantry items and get reminders to restock.' },
        { id: 'COUPON_ENGINE', name: 'Coupons & Deals', description: 'Automatically find and apply relevant coupons to your shopping.' },
        { id: 'BUDGET_ANALYTICS', name: 'Budget Analytics', description: 'Analyze your spending habits and get insights to save more.' },
        { id: 'PREDICTIVE_INTELLIGENCE', name: 'Price Predictions', description: 'See forecasted prices for your favorite items.' },
        { id: 'VOICE_SHOPPING', name: 'Voice Shopping', description: 'Add items to your list using your voice.' },
    ]
  },
  {
    category: "Family & Sharing",
    features: [
      { id: "FAMILY_SHARING", name: "Family Sharing", description: "Share shopping lists, budgets, and favorites with up to 5 family members." },
      { id: "FAMILY_BUDGETS", name: "Shared Family Budgets", description: "Create and manage budgets that all family members can contribute to and track." },
      { id: "FAMILY_LISTS", name: "Shared Shopping Lists", description: "Create shopping lists that all family members can view and edit in real-time." },
      { id: "FAMILY_INVITES", name: "Family Member Invites", description: "Invite family members via email to join your shared shopping experience." },
      { id: "FAMILY_PERMISSIONS", name: "Family Permissions", description: "Control what family members can see and edit in your shared account." }
    ]
  },
   {
    category: "Scanning & History",
    features: [
      { id: "SCAN_PRODUCT_IN_STORE", name: "Scan Product In Store", description: "Scan barcodes in-store to compare prices instantly." },
      { id: "SCAN_RECEIPT", name: "Scan Receipt", description: "Scan your physical receipts to track purchases and prices." },
      { id: "FETCH_LAST_SHOPS", name: "Fetch Last Shops", description: "Import your recent online shopping baskets." },
      { id: "FETCH_LAST_ORDERS", name: "Fetch Last Orders", description: "Import your recent online takeaway orders." },
    ]
  },
  {
    category: "Advanced Tools",
    features: [
      { id: "BULK_CALCULATOR", name: "Bulk Calculator", description: "Calculate the best bulk buying deals and unit prices." },
      { id: "SEASONAL_DEALS", name: "Seasonal Deals", description: "Get notified about seasonal produce and holiday deals." },
      { id: "LOCAL_DEALS", name: "Local Store Deals", description: "Upload and share local store flyers and special offers." },
      { id: "RECIPE_IMPORTER", name: "Recipe Importer", description: "Import recipes from websites and convert ingredients to shopping lists." }
    ]
  },
  {
    category: "Account & Limits",
    features: [
      { id: "LIMIT_UNLIMITED_LISTS", name: "Unlimited Shopping Lists", description: "Create and save an unlimited number of shopping lists without restrictions." },
      { id: "LIMIT_UNLIMITED_FAVORITES", name: "Unlimited Favorite Items", description: "Track an unlimited number of favorite products for price monitoring." },
      { id: "SUPPORT_PRIORITY", name: "Priority Support", description: "User's support tickets are prioritized, ensuring faster response times." }
    ]
  }
];

export const featureIdMap = ALL_FEATURES.flatMap(group => group.features).reduce((acc, feature) => {
  acc[feature.id] = feature.name;
  return acc;
}, {});