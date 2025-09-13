import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Upload, 
  Search, 
  TrendingUp, 
  Store as StoreIcon,
  Package,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { shopperBridgeClient } from '../services/ShopperBridgeClient';

export default function ShopperBridgeAdmin() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await shopperBridgeClient.getStores();
      setStores(storesData.stores || []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const result = await shopperBridgeClient.searchProducts({
        query: searchQuery,
        store: selectedStore || undefined,
        limit: 50
      });
      setProducts(result.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setProducts([]);
    }
    setLoading(false);
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const result = await shopperBridgeClient.searchRestaurants({
        limit: 50
      });
      setRestaurants(result.restaurants || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    }
    setLoading(false);
  };

  const triggerZyteImport = async (storeSlug) => {
    setLoading(true);
    setImportStatus({ store: storeSlug, status: 'running' });
    
    try {
      // This would trigger Zyte scraping job for the store
      const response = await fetch(`${shopperBridgeClient.baseUrl}/scrape/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: storeSlug })
      });
      
      if (response.ok) {
        setImportStatus({ store: storeSlug, status: 'success' });
      } else {
        setImportStatus({ store: storeSlug, status: 'error' });
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus({ store: storeSlug, status: 'error' });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ShopperBridge Admin</h1>
        <Button onClick={loadStores} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stores Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5" />
            Connected Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card key={store.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{store.name}</h3>
                    <Badge variant={store.type === 'supermarket' ? 'default' : 'secondary'}>
                      {store.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{store.slug}</p>
                  <Button 
                    size="sm" 
                    onClick={() => triggerZyteImport(store.slug)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Import Products
                  </Button>
                  {importStatus?.store === store.slug && (
                    <div className="mt-2">
                      {importStatus.status === 'running' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Import in progress...</AlertDescription>
                        </Alert>
                      )}
                      {importStatus.status === 'success' && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>Import completed successfully!</AlertDescription>
                        </Alert>
                      )}
                      {importStatus.status === 'error' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Import failed. Check logs.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Product Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select 
              className="px-3 py-2 border rounded-md"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.filter(s => s.type === 'supermarket').map(store => (
                <option key={store.id} value={store.slug}>{store.name}</option>
              ))}
            </select>
            <Button onClick={searchProducts} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.brand} • {product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{product.price}</p>
                    <p className="text-sm text-gray-500">{product.store}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Takeaway Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadRestaurants} disabled={loading} className="mb-4">
            Load Restaurants
          </Button>
          
          {restaurants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <Badge>{restaurant.store}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{restaurant.cuisine} • {restaurant.location}</p>
                    {restaurant.rating && (
                      <p className="text-sm">⭐ {restaurant.rating}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}