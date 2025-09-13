import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, Key, ShoppingCart, UserCheck, Search, CloudUpload, Shield, Zap } from 'lucide-react';

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

export default function BackendHandoffDocs() {
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
          <Card>
            <CardHeader>
              <CardTitle>Authentication & User Management</CardTitle>
              <CardDescription>User authentication is handled by Base44. Your backend will receive authenticated requests with an <code>x-user-id</code> header to identify users.</CardDescription>
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
              <CardDescription>Your backend needs to implement these key endpoints for grocery price comparison.</CardDescription>
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
      "id": "prod_123",
      "name": "Heinz Baked Beans",
      "brand": "Heinz",
      "price": 1.25,
      "unit_price": "0.30/100g",
      "image_url": "https://...",
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
      "items_matched": 8,
      "items_total": 10,
      "missing_items": ["Organic Milk", "Sourdough Bread"]
    }
  ]
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure Account Integration</CardTitle>
              <CardDescription>Handle user grocery account credentials securely for auto-basket features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Store Credentials</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">POST /api/auth/vault</Badge></p>
                <CodeBlock>{`// Store encrypted credentials
{
  "store": "tesco",
  "username": "user@example.com",
  "password": "encrypted_password",
  "validateLogin": true
}

// Response
{
  "ok": true,
  "validated": true,
  "message": "Credentials stored successfully"
}`}</CodeBlock>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Connection Status</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">GET /api/auth/connections</Badge></p>
                 <CodeBlock>{`// Response - which stores user has connected
{
  "tesco": { "connected": true },
  "asda": { "connected": false },
  "morrisons": { "connected": true }
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Price Reporting</CardTitle>
              <CardDescription>Collect pricing data from user receipts and shopping lists to improve your database.</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Endpoint:</strong> <Badge variant="outline">POST /api/v1/pricing/report</Badge></p>
              <CodeBlock>{`// Frontend sends user-sourced pricing data
{
  "sightings": [
    {
      "storeName": "ASDA",
      "productName": "Heinz Baked Beans",
      "price": 1.25,
      "quantityText": "415g",
      "isOwnBrand": false,
      "source": "receipt_scan"
    }
  ]
}

// Simple acknowledgment response
{ "status": "accepted" }`}</CodeBlock>
              <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg text-sm">
                💡 <strong>Crowdsourced Price Intelligence:</strong> Every time users scan receipts or import shopping history, you get real pricing data to keep your database current and discover new products.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Auto-Basket Integration</CardTitle>
                <CardDescription>Enable one-click shopping by automating basket creation on grocery websites.</CardDescription>
            </CardHeader>
            <CardContent>
                <p><strong>Endpoint:</strong> <Badge variant="outline">POST /cart/:store/prepare</Badge></p>
                <CodeBlock>{`// Prepare shopping data for browser extension
{
  "items": [
    { "product_id": 123, "qty": 2 },
    { "product_id": 456, "qty": 1 }
  ],
  "store_id": 1
}

// Response with product URLs for extension
{
  "mode": "extension",
  "payload": {
    "store_home_url": "https://www.tesco.com/groceries/",
    "lines": [
      {
        "product_url": "https://www.tesco.com/groceries/en-GB/products/123",
        "qty": 2
      }
    ]
  }
}`}</CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working Store Integrations</CardTitle>
              <CardDescription>Based on testing, these UK supermarkets have working API integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>✅ <strong>Fully Working:</strong> Tesco (tesco), ASDA (asda), Morrisons (morrisons), Waitrose (waitrose), Aldi (aldi), Lidl (lidl), Ocado (ocado), Co-op (co-op), Iceland (iceland)</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                <p className="font-semibold text-amber-900">⚠️ Store Slug Mapping</p>
                <p className="text-amber-800">Important: Use exact slugs in API calls. e.g., "Sainsbury's" → "sainsburys", "Co-op" → "co-op", "ASDA" → "asda".</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}