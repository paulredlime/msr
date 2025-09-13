import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, MapPin, Clock, CreditCard, Zap } from 'lucide-react';

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

export default function FoodBackendHandoff() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Food Delivery Backend Handoff</h1>
          <p className="text-lg text-gray-600 mt-2">
            Complete specifications for takeaway and restaurant comparison backend.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Zap className="w-6 h-6" />
                MarketBridge Food Delivery Integration
              </CardTitle>
              <CardDescription>
                MarketBridge handles automation for all major UK food delivery platforms:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">🍔 Supported Platforms (3)</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• <strong>Uber Eats</strong> - Menu scraping, ordering</li>
                    <li>• <strong>Deliveroo</strong> - Restaurant data, baskets</li>
                    <li>• <strong>Just Eat</strong> - Full integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">⚡ Automated Operations</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Restaurant search by postcode</li>
                    <li>• Menu extraction and parsing</li>
                    <li>• Order history fetching</li>
                    <li>• Basket creation and checkout</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-1">MarketBridge Food Endpoint:</h4>
                <p className="text-sm text-orange-800 font-mono">https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Core API Endpoints Required</CardTitle>
              <CardDescription>Your food backend needs these endpoints to power takeaway comparisons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Restaurant Search</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">GET /api/v1/restaurants/search</Badge></p>
                <p><strong>Parameters:</strong> <code>postcode</code>, <code>cuisine</code>, <code>platform</code></p>
                <CodeBlock>{`// Example Request
GET /api/v1/restaurants/search?postcode=SW1A 1AA&cuisine=indian&platform=deliveroo

// Expected Response
{
  "restaurants": [
    {
      "id": "rest_123",
      "name": "Dishoom", 
      "cuisine": "Indian",
      "platform": "deliveroo",
      "rating": 4.6,
      "delivery_fee": 2.49,
      "minimum_order": 15.00,
      "estimated_delivery": "25-40 mins",
      "image_url": "https://...",
      "menu_url": "https://deliveroo.co.uk/menu/london/..."
    }
  ]
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">2. Menu Item Search</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">GET /api/v1/menu/search</Badge></p>
                <CodeBlock>{`// Example Request
GET /api/v1/menu/search?restaurant_id=rest_123&query=chicken curry

// Expected Response  
{
  "items": [
    {
      "id": "item_456",
      "name": "Chicken Ruby Murray",
      "description": "House black daal, pilau rice, raita", 
      "price": 16.90,
      "category": "House Favourites",
      "dietary": ["gluten_free_option"],
      "image_url": "https://..."
    }
  ]
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3. Order Comparison</h3>
                <p><strong>Endpoint:</strong> <Badge variant="outline">POST /food/compare</Badge></p>
                <CodeBlock>{`// Example Request Body
{
  "postcode": "SW1A 1AA",
  "items": [
    {
      "name": "Chicken Curry", 
      "qty": 2,
      "restaurant_hint": "Indian"
    },
    {
      "name": "Pilau Rice",
      "qty": 1
    }
  ]
}

// Expected Response
{
  "comparisons": [
    {
      "platform": "deliveroo",
      "restaurant": "Dishoom",
      "total": 45.30,
      "breakdown": {
        "subtotal": 38.80,
        "delivery_fee": 2.49,
        "service_charge": 1.94,
        "small_order_fee": 0.00,
        "total": 43.23
      },
      "items_matched": 2,
      "items_total": 2,
      "estimated_delivery": "25-40 mins"
    }
  ]
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MarketBridge Food Operations</CardTitle>
              <CardDescription>Use MarketBridge to interact with food delivery platforms instead of building scrapers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Search Restaurants by Area</h4>
                <CodeBlock>{`// Request to MarketBridge
POST https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation
{
  "operation": "search_restaurants",
  "platform": "deliveroo", 
  "postcode": "SW1A 1AA",
  "filters": {
    "cuisine": "indian",
    "delivery_fee_max": 3.00,
    "rating_min": 4.0
  }
}

// Response
{
  "status": "success",
  "restaurants": [
    {
      "platform_id": "12345",
      "name": "Dishoom",
      "cuisine": "Indian", 
      "rating": 4.6,
      "delivery_fee": 2.49,
      "menu_data": {...}
    }
  ]
}`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Extract Menu Data</h4>
                <CodeBlock>{`// Request to MarketBridge
POST https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation  
{
  "operation": "get_menu",
  "platform": "ubereats",
  "restaurant_id": "67890",
  "options": {
    "include_descriptions": true,
    "include_prices": true,
    "include_dietary_info": true
  }
}

// Response
{
  "status": "success", 
  "menu": {
    "categories": [
      {
        "name": "Starters",
        "items": [
          {
            "name": "Onion Bhaji", 
            "description": "Crispy onion fritters",
            "price": 6.90,
            "dietary": ["vegetarian", "vegan_option"]
          }
        ]
      }
    ]
  }
}`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Place Order (Auto-Checkout)</h4>
                <CodeBlock>{`// Request to MarketBridge
POST https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation
{
  "operation": "place_order",
  "platform": "justeat",
  "credentials": {
    "username": "user@example.com", 
    "password": "encrypted_password"
  },
  "order": {
    "restaurant_id": "abc123",
    "items": [
      {
        "item_id": "item_456", 
        "quantity": 2,
        "customizations": []
      }
    ],
    "delivery_address": {
      "postcode": "SW1A 1AA",
      "full_address": "..."
    }
  }
}

// Response
{
  "status": "success",
  "order_id": "ORD789",
  "total": 24.50, 
  "estimated_delivery": "35-50 mins"
}`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform-Specific Considerations</CardTitle>
              <CardDescription>Important differences between the major food delivery platforms.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-green-600 mb-2">🚗 Uber Eats</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Largest restaurant selection</li>
                    <li>• Dynamic pricing during peak times</li>
                    <li>• Service fee varies by order value</li>
                    <li>• Real-time delivery tracking</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-teal-600 mb-2">🛴 Deliveroo</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Premium restaurant focus</li>
                    <li>• Deliveroo Plus subscription model</li>
                    <li>• Higher average order values</li>
                    <li>• Strong in central London</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-orange-600 mb-2">🍕 Just Eat</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Established local restaurants</li>
                    <li>• Lower delivery fees typically</li>
                    <li>• Good coverage outside London</li>
                    <li>• Collection options available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Phases</CardTitle>
              <CardDescription>Suggested development roadmap for the food delivery backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-700">Phase 1: Core Search (Week 1-2)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Integrate with MarketBridge restaurant search</li>
                    <li>• Build basic menu item matching logic</li>
                    <li>• Implement simple order comparison for 1 platform</li>
                  </ul>
                </div>
                <div className="border-l-4 border-teal-500 pl-4">
                  <h4 className="font-semibold text-teal-700">Phase 2: Multi-Platform (Week 3-4)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Expand to all 3 delivery platforms</li>
                    <li>• Add fee calculation (delivery, service, etc.)</li>
                    <li>• Implement postcode-based filtering</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-700">Phase 3: Advanced Features (Week 5+)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Smart restaurant recommendations</li>
                    <li>• Cuisine-based meal suggestions</li>
                    <li>• Order optimization (min delivery fees, etc.)</li>
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