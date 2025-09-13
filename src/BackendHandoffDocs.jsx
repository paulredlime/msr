/**
 * BACKEND HANDOFF PACKAGE
 * MyShopRun - UK Grocery Price Comparison App
 * 
 * This file contains the complete API contract and specifications
 * for backend developers to implement live data integration.
 */

export const API_CONTRACT = {
  "openapi": "3.0.3",
  "info": {
    "title": "MyShopRun Backend API",
    "description": "UK grocery price comparison backend service",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:3001/api",
      "description": "Local development server"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "summary": "Health check endpoint",
        "responses": {
          "200": {
            "description": "Service is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string", "example": "ok" },
                    "timestamp": { "type": "string", "format": "date-time" },
                    "version": { "type": "string", "example": "1.0.0" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/catalog/latest": {
      "get": {
        "summary": "Get product catalog with optional filtering",
        "parameters": [
          {
            "name": "store",
            "in": "query",
            "schema": { "type": "string" },
            "description": "Store ID to filter by"
          },
          {
            "name": "q",
            "in": "query",
            "schema": { "type": "string" },
            "description": "Search query text"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 50 },
            "description": "Maximum number of results"
          }
        ],
        "responses": {
          "200": {
            "description": "Product catalog results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "products": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/Product" }
                    },
                    "total": { "type": "integer" },
                    "query": { "type": "string" },
                    "store_id": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/match": {
      "post": {
        "summary": "Match raw shopping list items to products",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "raw_text": { "type": "string" },
                        "qty": { "type": "integer", "default": 1 }
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
            "description": "Matching results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "matches": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/MatchResult" }
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
        "summary": "Get basket pricing across all stores",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "product_id": { "type": "string" },
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
            "description": "Basket pricing results",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/BasketPricing" }
              }
            }
          }
        }
      }
    },
    "/products/{product_id}": {
      "get": {
        "summary": "Get detailed product information",
        "parameters": [
          {
            "name": "product_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Product details",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ProductDetails" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Product": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "gtin": { "type": "string" },
          "brand": { "type": "string" },
          "title": { "type": "string" },
          "quantity": { "type": "string" },
          "unit": { "type": "string" },
          "category": { "type": "string" },
          "image_url": { "type": "string" },
          "normalized_title": { "type": "string" },
          "base_quantity": { "type": "number" }
        }
      },
      "MatchResult": {
        "type": "object",
        "properties": {
          "raw_text": { "type": "string" },
          "qty": { "type": "integer" },
          "matches": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "product": { "$ref": "#/components/schemas/Product" },
                "confidence": { "type": "number" },
                "match_type": { "type": "string", "enum": ["exact_gtin", "title_fuzzy", "brand_category", "manual"] }
              }
            }
          },
          "best_match": {
            "type": "object",
            "properties": {
              "product": { "$ref": "#/components/schemas/Product" },
              "confidence": { "type": "number" }
            }
          }
        }
      },
      "BasketPricing": {
        "type": "object",
        "properties": {
          "stores": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "store_id": { "type": "string" },
                "store_name": { "type": "string" },
                "total_price": { "type": "number" },
                "total_loyalty_price": { "type": "number" },
                "items_found": { "type": "integer" },
                "items_total": { "type": "integer" },
                "loyalty_savings": { "type": "number" },
                "items": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "product_id": { "type": "string" },
                      "qty": { "type": "integer" },
                      "unit_price": { "type": "number" },
                      "promo_price": { "type": "number" },
                      "loyalty_price": { "type": "number" },
                      "total_price": { "type": "number" },
                      "available": { "type": "boolean" }
                    }
                  }
                }
              }
            }
          },
          "cheapest_store": { "type": "object" },
          "most_expensive_store": { "type": "object" },
          "max_savings": { "type": "number" }
        }
      },
      "ProductDetails": {
        "type": "object",
        "allOf": [
          { "$ref": "#/components/schemas/Product" },
          {
            "type": "object",
            "properties": {
              "availability": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "store_id": { "type": "string" },
                    "store_name": { "type": "string" },
                    "price": { "type": "number" },
                    "promo_price": { "type": "number" },
                    "loyalty_price": { "type": "number" },
                    "availability": { "type": "string", "enum": ["in_stock", "low_stock", "out_of_stock"] },
                    "url": { "type": "string" },
                    "last_seen": { "type": "string", "format": "date-time" }
                  }
                }
              },
              "price_range": {
                "type": "object",
                "properties": {
                  "min": { "type": "number" },
                  "max": { "type": "number" },
                  "avg": { "type": "number" }
                }
              }
            }
          }
        ]
      }
    }
  }
};

export const DATABASE_SCHEMA = `
-- Exact database schema for backend implementation

-- Stores table
CREATE TABLE stores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(200) NOT NULL,
    logo_url TEXT,
    loyalty_program VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table  
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    gtin VARCHAR(14), -- EAN/UPC barcode
    brand VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    quantity VARCHAR(50), -- "500g", "2L", "4-pack"
    unit VARCHAR(20), -- "g", "ml", "pack", "each"
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    normalized_title VARCHAR(500), -- lowercase, stripped for matching
    base_quantity DECIMAL(10,3), -- normalized quantity in base units
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gtin (gtin),
    INDEX idx_title_quantity (title, quantity),
    INDEX idx_normalized_title (normalized_title),
    INDEX idx_category (category)
);

-- Store-specific product pricing
CREATE TABLE store_products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    store_sku VARCHAR(100), -- store's internal product code
    price DECIMAL(8,0) NOT NULL, -- price in pence
    promo_price DECIMAL(8,0), -- promotional price in pence
    promo_text VARCHAR(200), -- "Buy 2 Get 1 Free", "25% Off"
    loyalty_price DECIMAL(8,0), -- price with loyalty card
    availability ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
    url TEXT, -- direct link to product page
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_per_unit DECIMAL(10,4), -- price per gram/ml/item for comparison
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_store_product (store_id, product_id),
    INDEX idx_store_sku (store_id, store_sku),
    INDEX idx_last_seen (last_seen),
    UNIQUE KEY unique_store_product (store_id, product_id)
);

-- Product aliases for improved matching
CREATE TABLE product_aliases (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    alias_text VARCHAR(500) NOT NULL,
    source ENUM('user_input', 'ocr', 'manual', 'automatic') DEFAULT 'automatic',
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_alias_text (alias_text),
    INDEX idx_product_aliases (product_id)
);

-- User shopping lists (enhanced from existing)
CREATE TABLE user_shopping_lists (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    postcode VARCHAR(10), -- for location-specific pricing
    status ENUM('draft', 'comparing', 'completed') DEFAULT 'draft',
    home_store_id VARCHAR(36), -- user's preferred store
    total_items INT DEFAULT 0,
    matched_items INT DEFAULT 0,
    last_comparison_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    FOREIGN KEY (home_store_id) REFERENCES stores(id) ON DELETE SET NULL,
    INDEX idx_user_lists (user_id),
    INDEX idx_status (status)
);

-- Shopping list items with matching data
CREATE TABLE list_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    list_id VARCHAR(36) NOT NULL,
    raw_text VARCHAR(500) NOT NULL, -- original user input
    quantity DECIMAL(8,2) DEFAULT 1,
    quantity_text VARCHAR(50), -- "2x", "500g"
    parsed_brand VARCHAR(100),
    parsed_product VARCHAR(300),
    parsed_size VARCHAR(50),
    matched_product_id VARCHAR(36), -- best match
    match_confidence DECIMAL(3,2), -- 0.00 to 1.00
    match_type ENUM('exact_gtin', 'title_fuzzy', 'brand_category', 'manual') DEFAULT 'title_fuzzy',
    user_confirmed BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    FOREIGN KEY (list_id) REFERENCES user_shopping_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (matched_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_list_items (list_id),
    INDEX idx_matched_product (matched_product_id)
);

-- Ingestion logs for monitoring data updates
CREATE TABLE ingestion_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id VARCHAR(36),
    status ENUM('running', 'completed', 'failed') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    products_processed INT DEFAULT 0,
    products_updated INT DEFAULT 0,
    products_added INT DEFAULT 0,
    error_message TEXT,
    source ENUM('apify_tesco', 'apify_asda', 'apify_sainsburys', 'apify_morrisons', 'apify_waitrose', 'open_food_facts', 'manual') NOT NULL,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
    INDEX idx_ingestion_status (status),
    INDEX idx_ingestion_date (started_at)
);
`;

export const ENV_SAMPLE = `
# MyShopRun Backend Environment Variables

# Database
DATABASE_URL=mysql://user:password@localhost:3306/myshoprun
DATABASE_SSL=false

# API Configuration  
PORT=3001
API_BASE_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Apify Integration
APIFY_TOKEN=your_apify_api_token_here
APIFY_TESCO_ACTOR_ID=jupri/tesco-grocery
APIFY_ASDA_ACTOR_ID=jupri/asda-scraper  
APIFY_SAINSBURYS_ACTOR_ID=natanielsantos/sainsbury-s-scraper
APIFY_MORRISONS_ACTOR_ID=thenetaji/morrisons-scraper
APIFY_WAITROSE_ACTOR_ID=thenetaji/waitrose-scraper

# Open Food Facts
OFF_API_BASE=https://world.openfoodfacts.org/api/v0
OFF_USER_AGENT=MyShopRun/1.0 (your-email@domain.com)

# GS1 (Optional - for GTIN validation)
GS1_API_KEY=your_gs1_api_key_here
GS1_API_BASE=https://api.gs1.org

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL_HOURS=24

# Logging
LOG_LEVEL=info
LOG_FILE=logs/backend.log
`;

export const SAMPLE_REQUESTS_RESPONSES = {
  "health_check": {
    "request": "GET /api/health",
    "response": {
      "status": "ok",
      "timestamp": "2024-01-15T10:30:00Z",
      "version": "1.0.0"
    }
  },
  "catalog_search": {
    "request": "GET /api/catalog/latest?q=milk&store=tesco_store_id&limit=10",
    "response": {
      "products": [
        {
          "id": "prod_001",
          "gtin": "5000169001234",
          "brand": "Tesco",
          "title": "Semi Skimmed Milk",
          "quantity": "2L",
          "unit": "L",
          "category": "dairy",
          "image_url": "https://digitalcontent.api.tesco.com/v2/media/ghs/001.jpg",
          "normalized_title": "semi skimmed milk",
          "base_quantity": 2000
        }
      ],
      "total": 15,
      "query": "milk",
      "store_id": "tesco_store_id"
    }
  },
  "match_items": {
    "request": {
      "method": "POST",
      "url": "/api/match",
      "body": {
        "items": [
          { "raw_text": "2x milk 2L", "qty": 2 },
          { "raw_text": "bread hovis medium", "qty": 1 }
        ]
      }
    },
    "response": {
      "matches": [
        {
          "raw_text": "2x milk 2L",
          "qty": 2,
          "matches": [
            {
              "product": {
                "id": "prod_001",
                "brand": "Tesco",
                "title": "Semi Skimmed Milk",
                "quantity": "2L"
              },
              "confidence": 0.95,
              "match_type": "title_fuzzy"
            }
          ],
          "best_match": {
            "product": { "id": "prod_001" },
            "confidence": 0.95
          }
        }
      ]
    }
  },
  "basket_pricing": {
    "request": {
      "method": "POST", 
      "url": "/api/basket/price",
      "body": {
        "items": [
          { "product_id": "prod_001", "qty": 2 },
          { "product_id": "prod_002", "qty": 1 }
        ]
      }
    },
    "response": {
      "stores": [
        {
          "store_id": "store_tesco",
          "store_name": "Tesco",
          "total_price": 450,
          "total_loyalty_price": 420,
          "items_found": 2,
          "items_total": 2,
          "loyalty_savings": 30,
          "items": [
            {
              "product_id": "prod_001",
              "qty": 2,
              "unit_price": 130,
              "loyalty_price": 120,
              "total_price": 240,
              "available": true
            }
          ]
        }
      ],
      "cheapest_store": { "store_id": "store_aldi", "total_loyalty_price": 380 },
      "max_savings": 70
    }
  }
};

export const CATEGORY_SEED_LIST = [
  // Tesco Categories
  "fresh-food/dairy-eggs-chilled",
  "fresh-food/meat-fish", 
  "fresh-food/fruit-vegetables",
  "fresh-food/bakery",
  "groceries/tinned-packaged-food",
  "groceries/breakfast-cereals",
  "groceries/rice-pasta-pulses",
  "groceries/condiments-dressings",
  "drinks/soft-drinks",
  "drinks/tea-coffee-hot-drinks",
  "frozen-food",
  "health-beauty/toiletries",
  "household/cleaning-products",
  "household/kitchen-utensils",
  "baby/baby-toddler-food",
  
  // ASDA Categories  
  "food/fresh-food/meat-poultry-fish",
  "food/fresh-food/fruit-vegetables", 
  "food/food-cupboard/rice-pasta-noodles",
  "food/food-cupboard/cooking-ingredients",
  "food/food-cupboard/breakfast-spreads",
  "food/drinks/soft-drinks-mixers",
  "food/frozen-food/frozen-ready-meals",
  "food/frozen-food/ice-cream-desserts",
  
  // Sainsbury's Categories
  "groceries-food-drink/fresh-food/dairy-milk-eggs",
  "groceries-food-drink/fresh-food/meat-fish-poultry", 
  "groceries-food-drink/food-cupboard/pasta-rice-noodles",
  "groceries-food-drink/food-cupboard/tins-jars-packets",
  "groceries-food-drink/drinks/soft-drinks",
  "groceries-food-drink/frozen/ready-meals",
  
  // Morrisons Categories
  "fresh/fresh-meat-poultry",
  "fresh/fresh-fruit-vegetables",
  "fresh/fresh-fish-seafood",
  "food-drink/food-cupboard/cooking-baking",
  "food-drink/food-cupboard/breakfast-cereal",
  "food-drink/drinks/soft-drinks-juices",
  
  // Waitrose Categories  
  "groceries/fresh-dairy-eggs",
  "groceries/meat-poultry-game", 
  "groceries/fruit-vegetables",
  "groceries/store-cupboard/pasta-rice-grains",
  "groceries/store-cupboard/herbs-spices-seasonings",
  "groceries/drinks/soft-drinks-cordials",
  "groceries/frozen/ready-meals-pizza"
];

// Postman Collection Export
export const POSTMAN_COLLECTION = {
  "info": {
    "name": "MyShopRun Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Get Catalog",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/catalog/latest?q=milk&limit=10",
          "host": ["{{base_url}}"],
          "path": ["catalog", "latest"],
          "query": [
            { "key": "q", "value": "milk" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Match Items",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": JSON.stringify({
            "items": [
              { "raw_text": "milk 2L", "qty": 1 },
              { "raw_text": "bread", "qty": 1 }
            ]
          })
        },
        "url": {
          "raw": "{{base_url}}/match",
          "host": ["{{base_url}}"],
          "path": ["match"]
        }
      }
    },
    {
      "name": "Get Basket Pricing",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": JSON.stringify({
            "items": [
              { "product_id": "prod_001", "qty": 2 },
              { "product_id": "prod_002", "qty": 1 }
            ]
          })
        },
        "url": {
          "raw": "{{base_url}}/basket/price",
          "host": ["{{base_url}}"],
          "path": ["basket", "price"]
        }
      }
    },
    {
      "name": "Get Product Details",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/products/prod_001",
          "host": ["{{base_url}}"],
          "path": ["products", "prod_001"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001/api"
    }
  ]
};

export default {
  API_CONTRACT,
  DATABASE_SCHEMA,
  ENV_SAMPLE,
  SAMPLE_REQUESTS_RESPONSES,
  CATEGORY_SEED_LIST,
  POSTMAN_COLLECTION
};