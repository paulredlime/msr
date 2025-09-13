
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, FlaskConical, Utensils, Database, Zap, Link as LinkIcon, UtensilsCrossed, RefreshCw, Download } from "lucide-react";
import DataClient from "@/components/services/DataClient";

const STORES = ['iceland', 'tesco', 'asda', 'sainsburys', 'morrisons', 'waitrose', 'aldi', 'lidl', 'coop', 'ocado'];
const TAKEAWAYS = ['deliveroo', 'ubereats', 'justeat'];

export default function AdminZyteDashboard() {
  const [fetchStatus, setFetchStatus] = useState({});
  const [testResults, setTestResults] = useState({});
  const [connectivityResults, setConnectivityResults] = useState([]);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);
  const [appConfig, setAppConfig] = useState({ 
    isMockMode: false, // Default to production mode
    isRealDataRequired: true, 
    configErrors: [] 
  });
  
  // State for restaurant fetching
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('deliveroo');

  useEffect(() => {
    handleConnectivityCheck();
  }, []);

  const handleConnectivityCheck = async () => {
    setIsCheckingConnectivity(true);
    
    try {
      const data = await DataClient.connectivityCheck();
      setConnectivityResults(data.results || []);
      setAppConfig({
        isMockMode: data.isMockMode || false, // Default to production
        isRealDataRequired: data.isRealDataRequired || true,
        configErrors: data.configErrors || []
      });
    } catch (error) {
      console.error('[AdminZyteDashboard] Connectivity check failed:', error);
      setConnectivityResults([]);
      // Even on error, default to production mode
      setAppConfig({ 
        isMockMode: false, 
        isRealDataRequired: true, 
        configErrors: ['Failed to connect to backend configuration.'] 
      });
    }
    
    setIsCheckingConnectivity(false);
  };

  const handleTestFetch = async (store) => {
    setFetchStatus(prev => ({ ...prev, [store]: 'loading' }));
    setTestResults(prev => ({ ...prev, [store]: null }));

    try {
      const results = await DataClient.testStoreFetch(store, 10);
      setFetchStatus(prev => ({ ...prev, [store]: 'success' }));
      setTestResults(prev => ({ ...prev, [store]: results }));
    } catch (error) {
      console.error(`[AdminZyteDashboard] Real Zyte fetch failed for ${store}:`, error);
      setFetchStatus(prev => ({ ...prev, [store]: 'error' }));
      setTestResults(prev => ({ ...prev, [store]: { error: error.message } }));
    }
  };

  const handleRestaurantFetch = async () => {
    if (!restaurantUrl.trim()) {
      alert('Please enter a restaurant URL');
      return;
    }

    setFetchStatus(prev => ({ ...prev, [selectedPlatform]: 'running' }));
    
    try {
      console.log(`[AdminZyteDashboard] Testing REAL Zyte restaurant fetch for ${selectedPlatform}: ${restaurantUrl}`);
      
      const response = await fetch('/ZyteRestaurantsFetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          restaurantUrl: restaurantUrl.trim()
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        setTestResults(prev => ({ 
          ...prev, 
          [selectedPlatform]: {
            success: true,
            restaurant: result.restaurant,
            totalItems: result.totalItems,
            categories: result.categories.length,
            sampleItems: result.categories[0]?.items?.slice(0, 3) || [],
            extractedAt: result.extractedAt
          }
        }));
        alert(`✅ Success! Found ${result.totalItems} items from ${result.restaurant.name}`);
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          [selectedPlatform]: {
            success: false,
            error: result.error || result.code,
            status: response.status
          }
        }));
        alert(`❌ Failed: ${result.error || result.code}`);
      }

      setFetchStatus(prev => ({ ...prev, [selectedPlatform]: 'completed' }));

    } catch (error) {
      console.error(`[AdminZyteDashboard] Restaurant fetch failed for ${selectedPlatform}:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [selectedPlatform]: {
          success: false,
          error: error.message
        }
      }));
      setFetchStatus(prev => ({ ...prev, [selectedPlatform]: 'failed' }));
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleVerifyUrl = async (event, url) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const result = await DataClient.verifyUrl(url);
      alert(`URL Verification: ${result.ok ? 'LIVE' : 'FAILED'} (Status: ${result.status})`);
    } catch (error) {
      alert(`URL Verification Failed: ${error.message}`);
    }
  };

  // NEW: Handle mass ingestion system navigation
  const handleMassIngestionClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Open in same tab, not new tab
    window.location.href = '/AdminProductIngestion';
  };

  const renderStoreCard = (store) => {
    const status = fetchStatus[store];
    const results = testResults[store];

    return (
      <Card key={store} className="shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="capitalize flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              {store}
            </CardTitle>
            <Button size="sm" onClick={() => handleTestFetch(store)} disabled={status === 'loading' || appConfig.isMockMode}>
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Real Zyte Fetch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appConfig.isMockMode && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mock Mode Enabled</AlertTitle>
              <AlertDescription>Set MOCK_MODE=0 to enable real Zyte fetching</AlertDescription>
            </Alert>
          )}
          
          {status === 'loading' && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Calling Zyte API for real {store} products...
            </div>
          )}
          
          {status === 'error' && results?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Real Zyte Fetch Failed</AlertTitle>
              <AlertDescription>{results.error}</AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && Array.isArray(results) && results.length > 0 && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Real Data Retrieved</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully fetched {results.length} real products from {store} via Zyte API
                </AlertDescription>
              </Alert>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Loyalty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          {item.brand && <span className="text-gray-500">{item.brand}</span>}
                        </div>
                      </TableCell>
                      <TableCell>£{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</TableCell>
                      <TableCell>{item.loyaltyPrice ? `£${item.loyaltyPrice.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => handleVerifyUrl(e, item.url)}
                        >
                          Verify URL
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {results.length > 5 && (
                <p className="text-sm text-gray-500">...and {results.length - 5} more products</p>
              )}
            </div>
          )}
          
          {status === 'success' && (!results || !Array.isArray(results) || results.length === 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Products Found</AlertTitle>
              <AlertDescription>The Zyte fetch completed but no products were extracted. The store's layout might have changed or products were quarantined.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real Zyte Integration Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Live data extraction from grocery stores and takeaways via Zyte API</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleMassIngestionClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Mass Ingestion System
              </Button>
            </div>
          </div>
          
          {appConfig.isMockMode || appConfig.configErrors.length > 0 ? (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Configuration Notice</AlertTitle>
              <AlertDescription className="text-orange-700">
                {appConfig.configErrors.length > 0 
                  ? `Configuration: ${appConfig.configErrors.join(', ')}`
                  : "Mock Mode is enabled in settings."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Production Mode Active</AlertTitle>
              <AlertDescription className="text-green-700">
                Connected to live Zyte API - all data is real and quarantined for quality
              </AlertDescription>
            </Alert>
          )}
        </header>

        {/* Connectivity Status */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Connectivity Status</h2>
            <Button onClick={handleConnectivityCheck} disabled={isCheckingConnectivity}>
              {isCheckingConnectivity ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FlaskConical className="w-4 h-4 mr-2" />
              )}
              Refresh Check
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {isCheckingConnectivity ? (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                  <p className="mt-2 text-gray-600">Checking connectivity to all targets...</p>
                </div>
              ) : connectivityResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectivityResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                        <p className="text-xs text-gray-500">{result.responseTimeMs}ms</p>
                      </div>
                      <Badge className={result.accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No connectivity data available</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Grocery Stores */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-6">Grocery Stores (Real Zyte Integration)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {STORES.map(renderStoreCard)}
          </div>
        </section>

        {/* Restaurant Data Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-6">Takeaway Platforms</h2> {/* Keep this section title for consistency */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                Restaurant Menu Extraction (REAL Zyte API)
              </CardTitle>
              <CardDescription>
                Test real menu extraction from Deliveroo, Uber Eats, and Just Eat using Zyte browser rendering + JSON parsing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">🔥 How This Works</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Makes REAL Zyte API calls (will show in your dashboard)</li>
                  <li>• Extracts embedded JSON (__NEXT_DATA__, __PRELOADED_STATE__)</li>
                  <li>• Blocks mock/test data with strict validation</li>
                  <li>• Returns real restaurant names, prices, and menu items</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform-select">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger id="platform-select">
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deliveroo">Deliveroo</SelectItem>
                      <SelectItem value="ubereats">Uber Eats</SelectItem>
                      <SelectItem value="justeat">Just Eat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="restaurant-url">Restaurant URL</Label>
                  <Input
                    id="restaurant-url"
                    value={restaurantUrl}
                    onChange={(e) => setRestaurantUrl(e.target.value)}
                    placeholder="https://deliveroo.co.uk/menu/london/soho/restaurant-name"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleRestaurantFetch}
                disabled={fetchStatus[selectedPlatform] === 'running'}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {fetchStatus[selectedPlatform] === 'running' ? (
                  <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Extracting Menu via Zyte...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" />Extract Real Menu Data</>
                )}
              </Button>

              {/* Restaurant Results */}
              {testResults[selectedPlatform] && (
                <Card className={`mt-4 ${testResults[selectedPlatform].success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardContent className="p-4">
                    {testResults[selectedPlatform].success ? (
                      <div>
                        <h4 className="font-semibold text-green-900 mb-2">
                          ✅ {testResults[selectedPlatform].restaurant.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-3">
                          <div>Total Items: {testResults[selectedPlatform].totalItems}</div>
                          <div>Categories: {testResults[selectedPlatform].categories}</div>
                        </div>
                        
                        {testResults[selectedPlatform].sampleItems?.length > 0 && (
                          <div>
                            <p className="font-medium text-green-900 mb-2">Sample Items:</p>
                            <div className="space-y-1">
                              {testResults[selectedPlatform].sampleItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name}</span>
                                  <span className="font-medium">£{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-green-600 mt-2">
                          Extracted: {new Date(testResults[selectedPlatform].extractedAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">❌ Extraction Failed</h4>
                        <p className="text-sm text-red-800">{testResults[selectedPlatform].error}</p>
                        {testResults[selectedPlatform].status && (
                          <p className="text-xs text-red-600 mt-1">Status: {testResults[selectedPlatform].status}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
