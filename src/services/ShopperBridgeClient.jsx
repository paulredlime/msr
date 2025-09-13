/**
 * ShopperBridge API Client
 * Handles communication with the ShopperBridge backend for product data
 */

class ShopperBridgeClient {
  constructor() {
    // Use window location to determine environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = isDevelopment 
      ? 'http://localhost:3001/api'
      : 'https://bridge.myshoprun.app/api';
  }

  /**
   * Import products from Zyte scraping job
   */
  async importProducts(storeSlug, products) {
    const response = await fetch(`${this.baseUrl}/products/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store: storeSlug,
        products: products
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to import products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search products across stores
   */
  async searchProducts({ store, category, query, limit = 50, offset = 0 }) {
    const params = new URLSearchParams({
      ...(store && { store }),
      ...(category && { category }),
      ...(query && { q: query }),
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`${this.baseUrl}/products?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get single product details
   */
  async getProduct(productId) {
    const response = await fetch(`${this.baseUrl}/products/${productId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get product: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get product price history
   */
  async getProductPriceHistory(productId) {
    const response = await fetch(`${this.baseUrl}/products/price-history/${productId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get price history: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search restaurants for takeaway comparison
   */
  async searchRestaurants({ store, location, cuisine, limit = 50 }) {
    const params = new URLSearchParams({
      ...(store && { store }),
      ...(location && { location }),
      ...(cuisine && { cuisine }),
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/restaurants?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search restaurants: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Compare basket across multiple stores
   */
  async compareBasket(items) {
    const response = await fetch(`${this.baseUrl}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error(`Failed to compare basket: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all active stores
   */
  async getStores(type = null) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const response = await fetch(`${this.baseUrl}/stores?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get stores: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const shopperBridgeClient = new ShopperBridgeClient();
export default ShopperBridgeClient;