import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { shopperBridgeClient } from './services/ShopperBridgeClient';

export default function ShopperBridgeProductSearch({ onProductSelect, category }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const result = await shopperBridgeClient.getStores('supermarket');
      setStores(result.stores || []);
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
        category: category || undefined,
        limit: 20
      });
      setProducts(result.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setProducts([]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Product Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <select 
            className="px-3 py-2 border rounded-md"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.slug}>{store.name}</option>
            ))}
          </select>
          <Button onClick={searchProducts} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onProductSelect && onProductSelect(product)}
              >
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {product.brand && <span>{product.brand}</span>}
                      {product.category && <Badge variant="outline" className="text-xs">{product.category}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">£{product.price}</p>
                  <p className="text-sm text-gray-500">{product.store}</p>
                  <Badge 
                    variant={product.availability === 'In Stock' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {product.availability || 'Unknown'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No products found for "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}