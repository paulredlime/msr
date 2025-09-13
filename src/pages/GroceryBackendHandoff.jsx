import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, Key, ShoppingCart, UserCheck, Search, CloudUpload, Shield, Zap } from 'lucide-react';

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

export default function GroceryBackendHandoff() {
  const appBaseUrl = window.location.origin;
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Grocery Backend Developer Handoff</h1>
          <p className="text-lg text-gray-600 mt-2">
            Complete technical specifications for the MyShopRun grocery comparison backend.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Zap className="w-6 h-6" />
                MarketBridge Integration Available
              </CardTitle>
              <CardDescription>
                For store automation, order fetching, and basket management, we have integrated with MarketBridge which handles:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">✅ Fully Automated</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Store login & credential management</li>
                    <li>• Order history fetching (last 5 orders + receipts)</li>
                    <li>• Auto-fill baskets across all stores</li>
                    <li>• Account registration automation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">🏪 Supported Stores (9)</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Tesco, Sainsbury's, ASDA, Morrisons</li>
                    <li>• Waitrose, Iceland, Co-op</li>
                    <li>• Lidl Plus, Aldi</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">MarketBridge Endpoints:</h4>
                <p className="text-sm text-blue-800 font-mono">Store Automation: https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation</p>
                <p className="text-sm text-blue-800 font-mono">Health Monitoring: https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-health</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication & User Management</CardTitle>
              <CardDescription>User authentication is handled by Base44. Your backend will receive authenticated requests with user identification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2"><UserCheck /> No Authentication Backend Needed</h4>
                  <p className="text-sm text-green-800">Base44 handles all user signup, login, session management, and payments. Focus on the grocery comparison features.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Core API Endpoints Required</CardTitle>
              <CardDescription>Your backend needs to implement these key endpoints for grocery price comparison using the ingested data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Product Search</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">GET /api/v1/products/search</Badge></p>
                <p><strong>Parameters:</strong> <code>store</code>, <code>query</code>, <code>limit</code></p>
                <CodeBlock>{`// Example Request
GET /api/v1/products/search?store=tesco&query=heinz beans&limit=10

// Expected Response
{
  "products": [
    {
      "external_id": "254643195",
      "title": "Heinz Baked Beans 415g",
      "brand": "Heinz",
      "price": 1.25,
      "loyalty_price": 1.15,
      "promo_text": "Clubcard Price",
      "unit_price": "0.30/100g",
      "image_url": "https://...",
      "product_url": "https://www.tesco.com/groceries/...",
      "availability": "in_stock"
    }
  ]
}`}</CodeBlock>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. Basket Comparison</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">POST /groceries/compare</Badge></p>
                <CodeBlock>{`// Example Request Body
{
  "listId": "list_456",
  "items": [
    {
      "title": "Heinz Baked Beans",
      "qty": 2,
      "brand": "Heinz",
      "isOwnBrand": false
    }
  ]
}

// Expected Response
{
  "comparisons": [
    {
      "store": "tesco",
      "total": 12.45,
      "loyalty_total": 11.20,
      "items_matched": 8,
      "items_total": 10,
      "missing_items": ["Organic Milk", "Sourdough Bread"],
      "matched_products": [
        {
          "item_name": "Heinz Baked Beans", 
          "matched_product": {
            "external_id": "254643195",
            "title": "Heinz Baked Beans 415g",
            "price": 1.25,
            "loyalty_price": 1.15
          }
        }
      ]
    }
  ]
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Ingestion Integration</CardTitle>
              <CardDescription>Your backend will receive fresh product data via our ingestion endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">📡 Data Flow</h4>
                <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>External scrapers send product data to MyShopRun ingestion endpoints</li>
                  <li>MyShopRun forwards processed data to your backend for storage</li>
                  <li>Your backend serves this data via the comparison and search APIs</li>
                  <li>MarketBridge handles all store interactions and automation</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Product Data Structure</h4>
                <CodeBlock>{`// Data you'll receive from ingestion
{
  "external_id": "254643195",
  "title": "Tesco All Rounder Potatoes 2.5Kg", 
  "brand": "Tesco",
  "price": 1.69,
  "loyalty_price": 1.49,
  "promo_text": "Clubcard Price",
  "gtin": "5052910029323",
  "image_url": "https://...",
  "product_url": "https://www.tesco.com/groceries/...",
  "category_path": ["Fresh Food", "Fresh Vegetables", "Potatoes"],
  "availability": "in_stock",
  "quantity_text": "2.5Kg",
  "price_per_unit_text": "£0.68/kg"
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MarketBridge Store Operations</CardTitle>
              <CardDescription>Use MarketBridge for all store interactions instead of building your own automation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fetch User Orders</h4>
                <CodeBlock>{`// Request to MarketBridge
POST https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation
{
  "operation": "fetch_orders",
  "store": "tesco",
  "credentials": {
    "username": "user@example.com",
    "password": "encrypted_password"
  },
  "options": {
    "limit": 5,
    "include_receipts": true
  }
}

// Response
{
  "status": "success",
  "orders": [
    {
      "order_id": "12345",
      "date": "2024-01-15",
      "total": 45.67,
      "items": [...],
      "receipt_html": "..."
    }
  ]
}`}</CodeBlock>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Auto-Fill User Basket</h4>
                <CodeBlock>{`// Request to MarketBridge  
POST https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation
{
  "operation": "fill_basket",
  "store": "tesco", 
  "credentials": {
    "username": "user@example.com",
    "password": "encrypted_password"
  },
  "items": [
    {
      "external_id": "254643195",
      "quantity": 2
    }
  ]
}

// Response
{
  "status": "success",
  "basket_url": "https://www.tesco.com/groceries/basket",
  "items_added": 2,
  "total_estimate": 12.45
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working Store Integrations</CardTitle>
              <CardDescription>Based on MarketBridge testing, these UK supermarkets have working integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Fully Working (9 stores)</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li><strong>Tesco</strong> - Full automation support</li>
                    <li><strong>Sainsbury's</strong> - Orders, baskets, registration</li>
                    <li><strong>ASDA</strong> - Complete integration</li>
                    <li><strong>Morrisons</strong> - All features working</li>
                    <li><strong>Waitrose</strong> - Full support</li>
                    <li><strong>Iceland</strong> - Complete automation</li>
                    <li><strong>Co-op</strong> - All operations</li>
                    <li><strong>Lidl Plus</strong> - App integration</li>
                    <li><strong>Aldi</strong> - Basic operations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">🍔 Food Delivery (3 platforms)</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li><strong>Uber Eats</strong> - Menu scraping, ordering</li>
                    <li><strong>Deliveroo</strong> - Restaurant data, baskets</li>
                    <li><strong>Just Eat</strong> - Full integration</li>
                  </ul>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm mt-4">
                <p className="font-semibold text-amber-900">⚠️ Store Slug Mapping</p>
                <p className="text-amber-800">Important: Use exact slugs in API calls. e.g., "Sainsbury's" → "sainsburys", "Co-op" → "coop", "ASDA" → "asda".</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Priority</CardTitle>
              <CardDescription>Recommended development phases for your grocery backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-700">Phase 1: Core Comparison (Week 1-2)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Set up ingestion data processing and storage</li>
                    <li>• Implement basic product search API</li>
                    <li>• Build basket comparison logic for 3 main stores</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-700">Phase 2: Store Integration (Week 3-4)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Integrate with MarketBridge for order fetching</li>
                    <li>• Add auto-basket functionality via MarketBridge</li>
                    <li>• Expand to all 9 supported grocery stores</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-700">Phase 3: Advanced Features (Week 5+)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Smart product matching and substitution suggestions</li>
                    <li>• Price history tracking and predictions</li>
                    <li>• Loyalty program optimization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}