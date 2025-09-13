
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Database, Shield, Zap } from 'lucide-react';

const CodeBlock = ({ children, language = 'json' }) => (
  <div className="relative">
    <div className="absolute top-2 right-2">
      <Badge variant="outline" className="text-xs">{language}</Badge>
    </div>
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border">
      <code>{children}</code>
    </pre>
  </div>
);

export default function ExtensionApiSpec() {
  const brandConfig = `export const MYSHOPRUN_BRAND = {
  // Primary brand colors
  colors: {
    primary: '#0d9488',      // Teal-600 (main brand)
    primaryHover: '#0f766e', // Teal-700
    secondary: '#f59e0b',    // Amber-500 (accent)
    
    // UI colors
    background: '#ffffff',
    surface: '#f8fafc',      // Gray-50
    text: '#1f2937',         // Gray-800
    textMuted: '#6b7280',    // Gray-500
    border: '#e5e7eb',       // Gray-200
    
    // Status colors
    success: '#10b981',      // Emerald-500
    warning: '#f59e0b',      // Amber-500
    error: '#ef4444',        // Red-500
    info: '#3b82f6'          // Blue-500
  },
  
  // Typography
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif'
  },
  
  // Spacing & Layout
  radius: '12px',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2 px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Logo
  logoUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/34646ddf9_MyShopRunlogo.png'
};`;

  const configTs = `export const CONFIG = {
  // Base44 hosted app URL (where login happens)
  WEB_APP_URL: "https://myshoprun.base44.app",
  
  // Authentication strategy: redirect to web app
  AUTH_STRATEGY: "web_redirect",
  
  // Feature flags
  FEATURES: {
    DRY_RUN_MODE: true,
    TELEMETRY: false,
    DEBUG_LOGGING: false
  }
};`;

  const authFlowExample = `// SIMPLIFIED Authentication Flow for Base44
// No OAuth server needed - just redirect to the web app

const authenticate = async (): Promise<void> => {
  // Generate a nonce for this specific auth request
  const nonce = \`myshoprun-ext-\${Date.now()}-\${Math.random()}\`;

  // Open the MyShopRun web app in a new tab for login
  const authUrl = \`\${CONFIG.WEB_APP_URL}/dashboard?extension_auth=true&ext_nonce=\${nonce}\`;
  
  chrome.tabs.create({ 
    url: authUrl,
    active: true 
  });
  
  // Listen for the web app to send authentication data
  const authData = await waitForAuthMessage(nonce);
  
  // Store the session data
  await chrome.storage.local.set({
    'user_email': authData.email,
    'user_name': authData.fullName,
    'subscription_status': authData.subscriptionStatus,
    'auth_timestamp': Date.now()
  });
  
  console.log('✅ Authentication successful');
};

// Listen for authentication messages from the web app
const waitForAuthMessage = (expectedNonce: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const messageListener = (event) => {
      // We only accept messages from our own window
      // Note: This example is illustrative. In a real extension, 
      // cross-origin messages from a web page to the background script 
      // are typically handled via chrome.runtime.onMessage, 
      // with a content script acting as a relay, or by directly sending 
      // from the web page via chrome.runtime.sendMessage(EXTENSION_ID, message).
      // This \`window.addEventListener\` might be used if the opened tab 
      // itself is an extension page which then talks to the web app.
      if (event.source !== window) {
        return;
      }

      const message = event.data;
      if (message.type === 'MYSHOPRUN_AUTH_SUCCESS' && message.nonce === expectedNonce) {
        window.removeEventListener('message', messageListener);
        resolve(message.userData);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Timeout after 2 minutes
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error('Authentication timed out.'));
    }, 120000);
  });
};`;

  const webAppIntegration = `// Web App Integration (Dashboard.js)
// This code is already implemented in the dashboard.

useEffect(() => {
  // When user is logged in and URL has specific params...
  const params = new URLSearchParams(window.location.search);
  const isExtensionAuth = params.get('extension_auth') === '1' || params.get('extension_auth') === 'true';
  const nonce = params.get('ext_nonce') || '';

  if (isExtensionAuth && user) {
    // We use window.postMessage for secure, cross-origin communication
    // without requiring extra permissions in the extension's manifest.
    // The '*' target origin is used here for simplicity in example,
    // but in production, specify the extension's origin for security.
    window.postMessage({
      type: 'MYSHOPRUN_AUTH_SUCCESS',
      nonce, // Return the nonce to prevent replay attacks
      userData: {
        email: user.email,
        fullName: user.full_name,
        subscriptionStatus: user.subscription_status,
        canUseExtension: user.subscription_status === 'active'
      }
    }, '*');
    
    // The extension is responsible for closing this tab upon success.
  }
}, [user]);`;

  const userDataAccess = `// How the extension accesses user shopping lists
// Since there's no custom API, we'll use web scraping or localStorage communication.

const getCurrentShoppingList = async (): Promise<ShoppingList> => {
  // Method 1: Open dashboard in hidden tab and scrape data
  const dashboardTab = await chrome.tabs.create({
    url: \`\${CONFIG.WEB_APP_URL}/dashboard\`,
    active: false
  });
  
  // Inject content script to extract shopping list data
  const results = await chrome.scripting.executeScript({
    target: { tabId: dashboardTab.id },
    function: extractShoppingListData
  });
  
  await chrome.tabs.remove(dashboardTab.id);
  return results[0].result;
};

// Function injected into dashboard to extract data
function extractShoppingListData() {
  // Look for shopping list data in the DOM or localStorage
  const listData = localStorage.getItem('current_shopping_list');
  if (listData) {
    return JSON.parse(listData);
  }
  
  // Alternative: scrape from DOM
  const listItems = Array.from(document.querySelectorAll('[data-list-item]')).map(item => ({
    name: item.dataset.itemName,
    quantity: parseInt(item.dataset.quantity) || 1,
    brand: item.dataset.brand
  }));
  
  return {
    items: listItems,
    listName: 'Current List'
  };
}`;

  const manifestExample = `{
  "manifest_version": 3,
  "name": "MyShopRun - Smart Grocery Shopping",
  "version": "2.0.0",
  "description": "Automatically add your optimized shopping lists to supermarket baskets",
  
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs"
  ],
  
  "host_permissions": [
    "https://*.tesco.com/*",
    "https://*.sainsburys.co.uk/*",
    "https://*.asda.com/*",
    "https://*.morrisons.com/*",
    "https://myshoprun.base44.app/*"
  ],
  
  "icons": {
    "16": "assets/images/icon16.png",
    "48": "assets/images/icon48.png", 
    "128": "assets/images/icon128.png"
  },
  
  "action": {
    "default_popup": "popup/index.html",
    "default_title": "MyShopRun"
  },
  
  "options_page": "options/index.html",
  
  "background": {
    "service_worker": "background.js"
  },
  
  "content_scripts": [
    {
      "matches": ["https://*.tesco.com/*", "https://*.sainsburys.co.uk/*"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": ["assets/images/*"],
      "matches": ["<all_urls>"]
    }
  ]
}`;

  const retailerAdapter = `export const tescoAdapter: RetailerAdapter = {
  name: "tesco",
  displayName: "Tesco",
  
  matches: (host: string) => 
    /tesco\\.com$|groceries\\.tesco\\.com$/.test(host),
  
  searchUrl: (query: string) => 
    \`https://www.tesco.com/groceries/en-GB/search?query=\${encodeURIComponent(query)}\`,
  
  selectors: {
    // Product listing page
    productCard: '[data-auto="product-tile"]',
    productTitle: '[data-auto="product-tile-title"]',
    productPrice: '[data-auto="product-price"]',
    addToBasketBtn: '[data-auto="add-to-trolley"]',
    
    // Search results
    searchResults: '[data-auto="product-results"]',
    noResults: '[data-auto="no-results"]',
    
    // Product details
    productImage: '[data-auto="product-image"]',
    productBrand: '[data-auto="product-brand"]',
    productSize: '[data-auto="product-size"]',
    
    // Basket/trolley
    basketCount: '[data-auto="mini-trolley-count"]',
    basketTotal: '[data-auto="mini-trolley-total"]'
  },
  
  // Matching strategy
  matchProduct: (item: ExtensionItem, productElements: Element[]) => {
    // 1. Try exact title match first
    const exactMatch = productElements.find(el => {
      const title = el.querySelector('[data-auto="product-tile-title"]')?.textContent?.toLowerCase();
      return title?.includes(item.name.toLowerCase());
    });
    
    if (exactMatch) {
      return { element: exactMatch, confidence: 0.9, method: 'exact_title' };
    }
    
    // 2. Try fuzzy matching
    const fuzzyMatches = productElements.map(el => {
      const title = el.querySelector('[data-auto="product-tile-title"]')?.textContent || '';
      const similarity = calculateSimilarity(item.name.toLowerCase(), title.toLowerCase());
      
      return {
        element: el,
        confidence: similarity,
        method: 'fuzzy'
      };
    }).filter(match => match.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence);
    
    return fuzzyMatches[0] || null;
  },
  
  // Actions
  async addToBasket(productElement: Element): Promise<boolean> {
    const addButton = productElement.querySelector('[data-auto="add-to-trolley"]') as HTMLButtonElement;
    if (!addButton) return false;
    
    addButton.click();
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
};

// Simple similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}`;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            MyShopRun Chrome Extension v2 - Base44 Integration
          </h1>
          <p className="text-gray-600 text-lg">
            Simplified extension specification using Base44's built-in authentication
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔄 Updated Approach</h4>
            <p className="text-blue-800 text-sm">
              Since MyShopRun uses Base44 for authentication, we've simplified the extension to redirect users to the web app for login, 
              then communicate back via Chrome extension messaging. No OAuth server setup required.
            </p>
          </div>
        </div>

        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="config">Config & Brand</TabsTrigger>
            <TabsTrigger value="data">Data Access</TabsTrigger>
            <TabsTrigger value="retailers">Retailer Adapters</TabsTrigger>
            <TabsTrigger value="assets">Store Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Base44 Authentication Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Simplified Flow:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-green-800">
                    <li>User clicks "Login" in extension popup</li>
                    <li>Extension opens MyShopRun dashboard in new tab</li>
                    <li>User logs in via Base44's Google auth (if not already logged in)</li>
                    <li>Dashboard detects extension auth request and sends user data back</li>
                    <li>Extension stores user session and closes auth tab</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Extension Authentication Code:</h4>
                  <CodeBlock language="typescript">{authFlowExample}</CodeBlock>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Web App Integration Code:</h4>
                  <p className="text-gray-600 text-sm">Add this to your Dashboard component:</p>
                  <CodeBlock language="typescript">{webAppIntegration}</CodeBlock>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Brand Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Use these exact brand values to ensure consistency:
                </p>
                <CodeBlock language="typescript">{brandConfig}</CodeBlock>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extension Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock language="typescript">{configTs}</CodeBlock>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Updated Manifest.json</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Note the simplified permissions - no OAuth/identity needed:
                </p>
                <CodeBlock language="json">{manifestExample}</CodeBlock>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Shopping List Data Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">⚠️ No API Available</h4>
                  <p className="text-amber-800 text-sm">
                    Since Base44 doesn't expose custom APIs, the extension will need to extract shopping list data 
                    by scraping the dashboard or using localStorage communication.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Data Extraction Method:</h4>
                  <CodeBlock language="typescript">{userDataAccess}</CodeBlock>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retailers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Retailer Adapter System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Simplified adapter system for supermarket websites:
                </p>
                <CodeBlock language="typescript">{retailerAdapter}</CodeBlock>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Tesco', priority: 'Phase 1', status: 'Start Here' },
                    { name: "Sainsbury's", priority: 'Phase 1', status: 'Second' },
                    { name: 'ASDA', priority: 'Phase 2', status: 'Later' },
                    { name: 'Morrisons', priority: 'Phase 2', status: 'Later' }
                  ].map((retailer) => (
                    <div key={retailer.name} className="border rounded-lg p-3">
                      <div className="font-semibold">{retailer.name}</div>
                      <div className="text-sm text-gray-600">{retailer.priority}</div>
                      <Badge 
                        variant={retailer.status === 'Start Here' ? 'default' : 'secondary'}
                        className="mt-2"
                      >
                        {retailer.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Development & Testing Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Phase 1: Basic Authentication</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Build extension with login redirect to <code>myshoprun.base44.app/dashboard?extension_auth=true</code></li>
                    <li>Test login flow - extension should store user email/name</li>
                    <li>Add "Connected" status detection to dashboard</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Phase 2: Data Extraction</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Test extracting shopping list data from dashboard localStorage</li>
                    <li>Implement fallback scraping method if localStorage is empty</li>
                    <li>Validate data format matches retailer adapter expectations</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Phase 3: Retailer Integration</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Test Tesco.com selectors and auto-add functionality</li>
                    <li>Add dry-run mode (highlight products, don't click)</li>
                    <li>Test Sainsbury's as second retailer</li>
                    <li>Polish UI and add proper error handling</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Icons & Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Extension Icons</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• icon16.png (16×16) - Toolbar</li>
                      <li>• icon48.png (48×48) - Extensions page</li>
                      <li>• icon128.png (128×128) - Store listing</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Store Promotion</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Large promo: 1280×800px</li>
                      <li>• Small promo: 440×280px</li>
                      <li>• Screenshots: 1280×800px</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-900 mb-2">🚀 Ready to Build</h3>
            <div className="text-green-800 space-y-2">
              <p><strong>Simplified approach:</strong> No OAuth server setup needed</p>
              <p><strong>Authentication:</strong> Redirect to Base44 web app, receive user data via extension messaging</p>
              <p><strong>Data access:</strong> Extract shopping lists from dashboard DOM/localStorage</p>
              <p><strong>Testing:</strong> Start with Tesco, add Sainsbury's second</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
