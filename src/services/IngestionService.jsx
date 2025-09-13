import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { StoreProduct } from "@/api/entities";
import { IngestionLog } from "@/api/entities";

class IngestionService {
  // Backend hook point - this is where your backend developer will plug in
  static async ingestStoreData(storeId, source = 'manual') {
    const log = await IngestionLog.create({
      store_id: storeId,
      status: 'running',
      started_at: new Date().toISOString(),
      source,
      products_processed: 0,
      products_updated: 0,
      products_added: 0
    });

    try {
      // TODO: Backend developer replaces this with actual Apify integration
      console.log(`[INGESTION] Starting ${source} ingestion for store ${storeId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Call appropriate Apify Actor API
      // 2. Process returned JSON data
      // 3. Update Product and StoreProduct entities
      // 4. Handle GTIN lookups via Open Food Facts
      
      await IngestionLog.update(log.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        products_processed: 100, // Mock data
        products_updated: 45,
        products_added: 12
      });

      return { success: true, logId: log.id };

    } catch (error) {
      await IngestionLog.update(log.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      });

      throw error;
    }
  }

  // Get ingestion status
  static async getIngestionStatus(storeId = null) {
    const filter = storeId ? { store_id: storeId } : {};
    return await IngestionLog.filter(filter, '-started_at', 10);
  }

  // Manual trigger for single store refresh
  static async refreshStore(storeId) {
    const store = await Store.list();
    const targetStore = store.find(s => s.id === storeId);
    
    if (!targetStore) {
      throw new Error('Store not found');
    }

    // Determine source based on store
    const sourceMap = {
      'Tesco': 'apify_tesco',
      'ASDA': 'apify_asda',
      'Sainsbury\'s': 'apify_sainsburys',
      'Morrisons': 'apify_morrisons',
      'Waitrose': 'apify_waitrose'
    };

    const source = sourceMap[targetStore.name] || 'manual';
    
    return await this.ingestStoreData(storeId, source);
  }

  // Open Food Facts integration hook
  static async enrichWithNutritionData(gtin) {
    try {
      // TODO: Backend developer implements Open Food Facts API call
      console.log(`[NUTRITION] Looking up GTIN: ${gtin}`);
      
      // Mock response - replace with actual API call
      return {
        product_name: "Mock Product",
        brands: "Mock Brand",
        quantity: "500g",
        image_url: "https://images.openfoodfacts.org/images/products/mock.jpg",
        categories: "Dairy",
        nutrition_grades: "b"
      };

    } catch (error) {
      console.error('Nutrition lookup failed:', error);
      return null;
    }
  }

  // Price update hook for real-time updates
  static async updateProductPrice(storeProductId, newPrice, promoPrice = null) {
    try {
      const updateData = {
        price: Math.round(newPrice * 100), // Convert to pence
        last_seen: new Date().toISOString()
      };

      if (promoPrice !== null) {
        updateData.promo_price = Math.round(promoPrice * 100);
      }

      await StoreProduct.update(storeProductId, updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Price update failed:', error);
      throw error;
    }
  }
}

export default IngestionService;