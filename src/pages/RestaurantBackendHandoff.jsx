import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CodeBlock = ({ language, code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-7 w-7 z-10" 
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function RestaurantBackendHandoff() {
  const navigate = useNavigate();
  
  const openApiSpec = `{
  "openapi": "3.0.0",
  "info": {
    "title": "MyShopRun Restaurant API",
    "version": "1.0.0",
    "description": "API contract for restaurant/food delivery comparison integration."
  },
  "servers": [
    {
      "url": "http://localhost:3002/api",
      "description": "Local development server"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "summary": "Health Check",
        "responses": {
          "200": {
            "description": "API is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string", "example": "ok" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/restaurants/search": {
      "get": {
        "summary": "Search Restaurants",
        "parameters": [
          { "name": "postcode", "in": "query", "required": true, "schema": { "type": "string", "example": "DA2 7XX" } },
          { "name": "platform", "in": "query", "schema": { "type": "string", "enum": ["ubereats", "deliveroo", "justeat"] } },
          { "name": "cuisine", "in": "query", "schema": { "type": "string", "example": "pizza" } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 50 } }
        ],
        "responses": {
          "200": {
            "description": "List of restaurants",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "restaurants": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "platform_restaurant_id": { "type": "string" },
                          "name": { "type": "string" },
                          "cuisine": { "type": "string" },
                          "platform": { "type": "string" },
                          "rating": { "type": "number" },
                          "delivery_time": { "type": "string" },
                          "delivery_fee": { "type": "number" },
                          "minimum_order": { "type": "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/menus/{platform_restaurant_id}": {
      "get": {
        "summary": "Get Restaurant Menu",
        "parameters": [
          { "name": "platform_restaurant_id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "Restaurant menu with items",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "restaurant_id": { "type": "string" },
                    "restaurant_name": { "type": "string" },
                    "platform": { "type": "string" },
                    "categories": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "items": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "menu_item_platform_id": { "type": "string" },
                                "name": { "type": "string" },
                                "description": { "type": "string" },
                                "price": { "type": "number" },
                                "image_url": { "type": "string" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/basket/price": {
      "post": {
        "summary": "Calculate Basket Price with Fees",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "platform": { "type": "string", "enum": ["ubereats", "deliveroo", "justeat"] },
                  "postcode": { "type": "string", "example": "DA2 7XX" },
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "menu_item_platform_id": { "type": "string" },
                        "qty": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Total basket price with breakdown",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "platform": { "type": "string" },
                    "subtotal": { "type": "number" },
                    "delivery_fee": { "type": "number" },
                    "service_fee": { "type": "number" },
                    "small_order_fee": { "type": "number" },
                    "total": { "type": "number" },
                    "items": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "qty": { "type": "integer" },
                          "unit_price": { "type": "number" },
                          "total_price": { "type": "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/ingest/webhook": {
      "post": {
        "summary": "Apify Ingestion Webhook",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "datasetId": { "type": "string" },
                  "platform": { "type": "string", "enum": ["ubereats", "deliveroo", "justeat"] }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Webhook processed successfully" }
        }
      }
    }
  }
}`;

  const postmanCollection = `{
  "info": {
    "_postman_id": "restaurant-api-collection",
    "name": "MyShopRun Restaurant API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3002/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3002",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Search Restaurants",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3002/api/restaurants/search?postcode=DA2 7XX&platform=ubereats&cuisine=pizza&limit=10",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3002",
          "path": ["api", "restaurants", "search"],
          "query": [
            {"key": "postcode", "value": "DA2 7XX"},
            {"key": "platform", "value": "ubereats"},
            {"key": "cuisine", "value": "pizza"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "Get Restaurant Menu",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3002/api/menus/RESTAURANT_ID_HERE",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3002",
          "path": ["api", "menus", "RESTAURANT_ID_HERE"]
        }
      }
    },
    {
      "name": "Calculate Basket Price",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\\"platform\\": \\"ubereats\\", \\"postcode\\": \\"DA2 7XX\\", \\"items\\": [{\\"menu_item_platform_id\\": \\"ITEM_ID_1\\", \\"qty\\": 2}]}"
        },
        "url": {
          "raw": "http://localhost:3002/api/basket/price",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3002",
          "path": ["api", "basket", "price"]
        }
      }
    },
    {
      "name": "Ingestion Webhook",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\\"datasetId\\": \\"dataset_123\\", \\"platform\\": \\"ubereats\\"}"
        },
        "url": {
          "raw": "http://localhost:3002/api/ingest/webhook",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3002",
          "path": ["api", "ingest", "webhook"]
        }
      }
    }
  ]
}`;

  const envSample = `# .env.sample for Restaurant Backend
# Server configuration
PORT=3002

# Database
DATABASE_URL="postgresql://user:password@host:port/restaurant_db"

# Apify API Token for restaurant data ingestion
APIFY_API_TOKEN="your_apify_token_here"

# Platform API Keys (if available)
UBEREATS_API_KEY=""
DELIVEROO_API_KEY=""
JUSTEAT_API_KEY=""

# Webhook security
WEBHOOK_SECRET="your_webhook_secret"

# Rate limiting
MAX_REQUESTS_PER_MINUTE=100`;

  const dbSchema = `-- Restaurant Backend Database Schema

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_restaurant_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- 'ubereats', 'deliveroo', 'justeat'
  cuisine VARCHAR,
  postcode VARCHAR,
  rating DECIMAL(2,1),
  delivery_time VARCHAR,
  delivery_fee INTEGER, -- in pence
  minimum_order INTEGER, -- in pence
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  menu_item_platform_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in pence
  category VARCHAR,
  image_url VARCHAR,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR NOT NULL,
  postcode VARCHAR,
  delivery_fee INTEGER, -- in pence
  service_fee_percentage DECIMAL(4,2),
  small_order_fee INTEGER, -- in pence
  small_order_threshold INTEGER, -- in pence
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR NOT NULL,
  status VARCHAR NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  restaurants_processed INTEGER DEFAULT 0,
  menu_items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  dataset_id VARCHAR
);

-- Indexes for performance
CREATE INDEX idx_restaurants_platform ON restaurants(platform);
CREATE INDEX idx_restaurants_postcode ON restaurants(postcode);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_platform_id ON menu_items(menu_item_platform_id);
CREATE INDEX idx_platform_fees_platform_postcode ON platform_fees(platform, postcode);`;

  const seedData = `{
  "postcodes": ["DA2 7XX", "SE1 2AA", "E1 6AN", "SW1A 1AA", "M1 1AA", "B1 1AA", "L1 8JQ", "NE1 7RU"],
  "cuisines": ["pizza", "burgers", "indian", "chinese", "sushi", "breakfast", "desserts", "italian", "thai", "mexican"],
  "sample_restaurants": [
    {
      "platform": "ubereats",
      "name": "Mario's Pizza Palace",
      "cuisine": "pizza",
      "postcode": "DA2 7XX",
      "rating": 4.5,
      "delivery_time": "25-40 mins",
      "delivery_fee": 199,
      "minimum_order": 1000,
      "menu_items": [
        {"name": "Margherita Pizza", "price": 1299, "category": "Pizza"},
        {"name": "Pepperoni Pizza", "price": 1499, "category": "Pizza"},
        {"name": "Garlic Bread", "price": 499, "category": "Sides"}
      ]
    },
    {
      "platform": "deliveroo",
      "name": "Mario's Pizza Palace",
      "cuisine": "pizza",
      "postcode": "DA2 7XX",
      "rating": 4.3,
      "delivery_time": "30-45 mins",
      "delivery_fee": 349,
      "minimum_order": 1200,
      "menu_items": [
        {"name": "Margherita Pizza", "price": 1349, "category": "Pizza"},
        {"name": "Pepperoni Pizza", "price": 1549, "category": "Pizza"},
        {"name": "Garlic Bread", "price": 549, "category": "Sides"}
      ]
    },
    {
      "platform": "justeat",
      "name": "Mario's Pizza Palace",
      "cuisine": "pizza",
      "postcode": "DA2 7XX",
      "rating": 4.4,
      "delivery_time": "20-35 mins",
      "delivery_fee": 299,
      "minimum_order": 800,
      "menu_items": [
        {"name": "Margherita Pizza", "price": 1249, "category": "Pizza"},
        {"name": "Pepperoni Pizza", "price": 1449, "category": "Pizza"},
        {"name": "Garlic Bread", "price": 449, "category": "Sides"}
      ]
    }
  ]
}`;

  const moduleContracts = `// components/services/RestaurantDataClient.js
/**
 * Restaurant Data Client - handles demo/live data toggle
 */
class RestaurantDataClient {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3002/api';
  }

  async getDemoMode() {
    // Check user settings for demo mode
    try {
      const user = await User.me();
      return user.restaurant_demo_mode !== undefined ? user.restaurant_demo_mode : true;
    } catch {
      return true;
    }
  }

  async searchRestaurants({ postcode, platform, cuisine, limit = 50 }) {
    if (await this.getDemoMode()) {
      return this._getDemoRestaurants({ postcode, platform, cuisine, limit });
    }
    
    const params = new URLSearchParams({
      postcode,
      ...(platform && { platform }),
      ...(cuisine && { cuisine }),
      limit: limit.toString()
    });
    
    const response = await fetch(\`\${this.apiBaseUrl}/restaurants/search?\${params}\`);
    return await response.json();
  }

  async getMenu(platformRestaurantId) {
    if (await this.getDemoMode()) {
      return this._getDemoMenu(platformRestaurantId);
    }
    
    const response = await fetch(\`\${this.apiBaseUrl}/menus/\${platformRestaurantId}\`);
    return await response.json();
  }

  async calculateBasketPrice({ platform, postcode, items }) {
    if (await this.getDemoMode()) {
      return this._getDemoBasketPrice({ platform, postcode, items });
    }
    
    const response = await fetch(\`\${this.apiBaseUrl}/basket/price\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, postcode, items })
    });
    return await response.json();
  }
}

// components/services/OrderCalculator.js
/**
 * Order Calculator - applies platform-specific fees and promotions
 */
class OrderCalculator {
  static PLATFORM_FEES = {
    ubereats: { serviceFeePercent: 0.15, deliveryFee: 299, smallOrderFee: 199, smallOrderThreshold: 1500 },
    deliveroo: { serviceFeePercent: 0.125, deliveryFee: 349, smallOrderFee: 199, smallOrderThreshold: 1200 },
    justeat: { serviceFeePercent: 0.0, deliveryFee: 299, smallOrderFee: 0, smallOrderThreshold: 0 }
  };

  static calculateTotal(items, platform, postcode) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const fees = this.PLATFORM_FEES[platform] || this.PLATFORM_FEES.ubereats;
    
    const serviceFee = Math.round(subtotal * fees.serviceFeePercent);
    const deliveryFee = fees.deliveryFee;
    const smallOrderFee = subtotal < fees.smallOrderThreshold ? fees.smallOrderFee : 0;
    
    return {
      subtotal,
      serviceFee,
      deliveryFee,
      smallOrderFee,
      total: subtotal + serviceFee + deliveryFee + smallOrderFee
    };
  }
}

// components/services/MatchService.js
/**
 * Match Service - fuzzy matches user input to menu items
 */
class MatchService {
  static async matchOrderToMenuItems(orderText, restaurantName, postcode) {
    // Parse order text into individual items
    const items = this.parseOrderText(orderText);
    
    // Search for restaurants matching the name
    const restaurants = await RestaurantDataClient.searchRestaurants({
      postcode,
      q: restaurantName,
      limit: 5
    });
    
    // For each restaurant, get menu and find best matches
    const matches = [];
    for (const restaurant of restaurants) {
      const menu = await RestaurantDataClient.getMenu(restaurant.platform_restaurant_id);
      const itemMatches = this.findBestMatches(items, menu.categories);
      matches.push({
        restaurant,
        platform: restaurant.platform,
        itemMatches,
        confidence: this.calculateOverallConfidence(itemMatches)
      });
    }
    
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
  
  static parseOrderText(text) {
    // Simple parsing - in production would be more sophisticated
    return text.split(/[,\\n]+/).map(line => {
      const match = line.match(/(\\d+)x?\\s*(.+)/);
      if (match) {
        return { qty: parseInt(match[1]), name: match[2].trim() };
      }
      return { qty: 1, name: line.trim() };
    }).filter(item => item.name);
  }
}`;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate(createPageUrl("AdminDashboard"))} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
      
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Restaurant Backend Handoff Package</h1>
          <p className="text-lg text-gray-600 mt-2">Complete technical specifications for food delivery comparison backend.</p>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. OpenAPI Specification</CardTitle>
              <CardDescription>Complete API contract for restaurant/food delivery endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json" code={openApiSpec} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Database Schema & Data Dictionary</CardTitle>
              <CardDescription>Complete PostgreSQL schema for restaurant data.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="sql" code={dbSchema} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Demo Data & Seed Lists</CardTitle>
              <CardDescription>Sample data for testing and development, plus seed lists for scraping.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json" code={seedData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Environment Variables</CardTitle>
              <CardDescription>Required environment configuration for the restaurant backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="bash" code={envSample} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Postman Collection</CardTitle>
              <CardDescription>Complete API testing collection for all endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json" code={postmanCollection} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Frontend Module Contracts</CardTitle>
              <CardDescription>TypeScript/JavaScript modules the frontend expects to interface with.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" code={moduleContracts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Integration Notes</CardTitle>
              <CardDescription>Key implementation details for the backend developer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <h4 className="font-semibold">Demo Mode Integration</h4>
                <p>The frontend will check <code>User.restaurant_demo_mode</code> to toggle between local demo data and live API calls.</p>
                
                <h4 className="font-semibold mt-4">Apify Integration</h4>
                <ul className="list-disc list-inside">
                  <li>Use Apify actors for Uber Eats, Deliveroo, and Just Eat restaurant scraping</li>
                  <li>Process webhook calls at <code>/ingest/webhook</code> when scraping completes</li>
                  <li>Update restaurant and menu data, maintaining platform-specific IDs</li>
                </ul>
                
                <h4 className="font-semibold mt-4">Price Calculation</h4>
                <p>Each platform has different fee structures. The <code>/basket/price</code> endpoint should apply the correct fees based on platform and location.</p>
                
                <h4 className="font-semibold mt-4">Fuzzy Matching</h4>
                <p>Restaurant and menu item matching should handle variations in naming across platforms and user input.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}