
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { IngestionEvent } from '@/api/entities';
import { 
  ArrowLeft, 
  Rss, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Store,
  Eye,
  Search
} from 'lucide-react';

export default function AdminProductIngestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedStore, setSelectedStore] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalProducts: 0,
    successfulBatches: 0,
    failedBatches: 0,
    storeBreakdown: {}
  });

  const stores = [
    "tesco", "sainsburys", "asda", "morrisons", "waitrose", 
    "iceland", "coop", "lidl", "aldi", "ocado"
  ];

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        await loadIngestionData();
      } catch (error) {
        console.error('Authentication error:', error);
        navigate(createPageUrl("SuperAdmin"));
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoad();
  }, [navigate]);

  // Auto-refresh every 5 seconds when live mode is on
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      loadIngestionData(true); // silent refresh
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const loadIngestionData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Load recent ingestion events (last 50)
      let recentEvents = await IngestionEvent.list('-created_date', 50);

      // Filter out old events that don't have proper retailer data in their products
      recentEvents = recentEvents.filter(event => 
          event.sample_products && 
          event.sample_products.length > 0 && 
          event.sample_products.some(p => p.retailer)
      );

      setEvents(recentEvents);

      // Calculate statistics from the filtered, valid events
      const totalEvents = recentEvents.length;
      const totalProducts = recentEvents.reduce((sum, event) => sum + (event.product_count || 0), 0);
      const successfulBatches = recentEvents.filter(e => e.status === 'success').length;
      const failedBatches = recentEvents.filter(e => e.status === 'failure').length;

      // Store breakdown - extract from actual product retailers
      const storeBreakdown = {};
      recentEvents.forEach(event => {
        const uniqueRetailersInThisEvent = new Set();
        if (event.sample_products && event.sample_products.length > 0) {
          event.sample_products.forEach(product => {
            const retailer = (product.retailer || '').toLowerCase();
            if (retailer) { // Only process if retailer exists
                if (!storeBreakdown[retailer]) {
                  storeBreakdown[retailer] = { events: 0, products: 0, lastSeen: null };
                }
                storeBreakdown[retailer].products++;
                uniqueRetailersInThisEvent.add(retailer);
                if (!storeBreakdown[retailer].lastSeen || new Date(event.created_date) > new Date(storeBreakdown[retailer].lastSeen)) {
                  storeBreakdown[retailer].lastSeen = event.created_date;
                }
            }
          });
          // After processing all products in an event, increment events for each unique retailer found
          uniqueRetailersInThisEvent.forEach(retailer => {
            if (storeBreakdown[retailer]) {
                storeBreakdown[retailer].events++;
            }
          });
        }
      });

      setStats({
        totalEvents,
        totalProducts,
        successfulBatches,
        failedBatches,
        storeBreakdown
      });

    } catch (error) {
      console.error("Failed to load ingestion data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    // Filter by store in the sample products (use the actual retailer field)
    const storeMatch = selectedStore === "all" || 
      (event.sample_products && event.sample_products.some(product => 
        (product.retailer || '').toLowerCase() === selectedStore.toLowerCase()
      ));

    // Filter by search term
    const searchMatch = searchTerm === "" || 
      (event.sample_products && event.sample_products.some(product => 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.retailer?.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    return storeMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial_failure': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failure': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-700 font-medium">Loading Live Feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                className="border-green-200 hover:bg-green-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Rss className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Live Product Ingestion
                    {isLive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-normal text-green-600">LIVE</span>
                      </div>
                    )}
                  </h1>
                  <p className="text-sm text-gray-500">Monitor product data as it arrives from external scrapers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className={isLive ? "border-green-500 text-green-600" : "border-gray-300"}
              >
                {isLive ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                {isLive ? "Live" : "Paused"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadIngestionData()}>
                Refresh Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Events</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                  </div>
                  <Rss className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Products Ingested</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Successful Batches</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.successfulBatches}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Failed Batches</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.failedBatches}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-gray-600" />
                Store Breakdown
              </CardTitle>
              <CardDescription>Activity summary by supermarket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(stats.storeBreakdown).map(([store, data]) => (
                  <div key={store} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 capitalize">{store}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">{data.events} events</p>
                      <p className="text-sm text-gray-600">{data.products.toLocaleString()} products</p>
                      <p className="text-xs text-gray-500">
                        Last: {data.lastSeen ? formatTimeAgo(data.lastSeen) : 'Never'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store} value={store} className="capitalize">
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by product or store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Badge variant="outline" className="ml-auto">
              Showing {filteredEvents.length} of {events.length} events
            </Badge>
          </div>

          {/* Live Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Live Ingestion Feed
              </CardTitle>
              <CardDescription>Real-time view of incoming product batches</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No ingestion events yet</h3>
                  <p className="text-gray-500">Product data will appear here when scrapers send data to the ingestion endpoint.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${getStatusColor(event.status)} border`}>
                              {event.status}
                            </Badge>
                            <h4 className="font-semibold text-gray-900">
                              Batch from {event.store} ({event.product_count} products)
                            </h4>
                            <span className="text-sm text-gray-500">{formatTimeAgo(event.created_date)}</span>
                          </div>

                          {/* Show retailers in this batch */}
                          {event.sample_products && event.sample_products.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(event.sample_products.map(p => p.retailer))).filter(Boolean).map(retailer => (
                                  <Badge key={retailer} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {retailer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Enhanced Product Display with Retailer and Pricing */}
                          {event.sample_products && event.sample_products.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                              <h5 className="text-sm font-semibold text-gray-800 mb-3">
                                Products from Multiple Retailers ({event.sample_products.length}):
                              </h5>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {event.sample_products.map((product, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-md border border-gray-200">
                                    <div className="flex items-start gap-3">
                                      {product.image_url ? (
                                        <img 
                                          src={product.image_url} 
                                          alt={product.title || product.name}
                                          className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                                          <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                          <h6 className="font-medium text-gray-900 text-sm mb-1">
                                            {product.title || product.name || 'Untitled Product'}
                                          </h6>
                                          <div className="flex items-center gap-1 ml-2">
                                            <Store className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-white font-bold bg-indigo-600 px-2 py-1 rounded uppercase">
                                              {product.retailer || 'Unknown Store'}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {product.brand && (
                                          <p className="text-xs text-gray-600 mb-2">Brand: {product.brand}</p>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                                          {product.price && (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                                              Regular: £{product.price}
                                            </span>
                                          )}
                                          {product.loyalty_price && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                                              {product.loyalty_program || 'Loyalty'}: £{product.loyalty_price}
                                            </span>
                                          )}
                                          {product.category && (
                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                              {product.category}
                                            </span>
                                          )}
                                          {product.availability && (
                                            <span className={`px-2 py-1 rounded ${
                                              product.availability === 'in_stock' 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {product.availability.replace('_', ' ')}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {product.promo_text && (
                                          <p className="text-xs text-orange-600 mt-1 font-medium">
                                            🏷️ {product.promo_text}
                                          </p>
                                        )}
                                        {product.unit_price && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Unit price: {product.unit_price}
                                          </p>
                                        )}
                                        {product.sku && (
                                          <p className="text-xs text-gray-400 mt-1">
                                            SKU: {product.sku}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error Details */}
                          {event.error_details && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <h5 className="text-xs font-medium text-red-700 mb-1">Error Details:</h5>
                              <p className="text-xs text-red-600">{event.error_details}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
