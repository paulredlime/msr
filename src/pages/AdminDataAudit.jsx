import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingCart, Utensils, AlertTriangle, Loader2, RefreshCw, Database, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDataAudit() {
  const [loading, setLoading] = useState(true);
  const [grocerStats, setGrocerStats] = useState([]);
  const [restaurantStats, setRestaurantStats] = useState([]);
  const [quarantine, setQuarantine] = useState({ grocers: { total: 0, reasons: {}, latestItems: [] }, restaurants: { total: 0, reasons: {}, latestItems: [] }});
  const [verifyingUrl, setVerifyingUrl] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    setLoading(true);
    setVerifyResult(null);
    setError(null);
    
    try {
      console.log('[AdminDataAudit] Loading audit data...');
      
      // Load grocer audit data
      const grocerRes = await fetch('/AuditGrocers', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[AdminDataAudit] Grocer response status:', grocerRes.status);
      
      let grocerData = { storeStats: [], quarantineStats: { total: 0, reasons: {}, latestItems: [] } };
      
      if (grocerRes.ok) {
        const grocerText = await grocerRes.text();
        console.log('[AdminDataAudit] Grocer response text:', grocerText.substring(0, 200));
        
        try {
          grocerData = JSON.parse(grocerText);
        } catch (parseError) {
          console.error('[AdminDataAudit] Failed to parse grocer JSON:', parseError);
          console.log('[AdminDataAudit] Raw grocer response:', grocerText);
          // Set default values if parsing fails
        }
      } else {
        console.error('[AdminDataAudit] Grocer request failed:', grocerRes.status, grocerRes.statusText);
      }
      
      // Load restaurant audit data
      const restaurantRes = await fetch('/AuditRestaurants', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[AdminDataAudit] Restaurant response status:', restaurantRes.status);
      
      let restaurantData = { platformStats: [], quarantineStats: { total: 0, reasons: {}, latestItems: [] } };
      
      if (restaurantRes.ok) {
        const restaurantText = await restaurantRes.text();
        console.log('[AdminDataAudit] Restaurant response text:', restaurantText.substring(0, 200));
        
        try {
          restaurantData = JSON.parse(restaurantText);
        } catch (parseError) {
          console.error('[AdminDataAudit] Failed to parse restaurant JSON:', parseError);
          console.log('[AdminDataAudit] Raw restaurant response:', restaurantText);
          // Set default values if parsing fails
        }
      } else {
        console.error('[AdminDataAudit] Restaurant request failed:', restaurantRes.status, restaurantRes.statusText);
      }
      
      // Set state with defaults if data is missing
      setGrocerStats(grocerData.storeStats || []);
      setRestaurantStats(restaurantData.platformStats || []);

      setQuarantine({
          grocers: grocerData.quarantineStats || { total: 0, reasons: {}, latestItems: [] },
          restaurants: restaurantData.quarantineStats || { total: 0, reasons: {}, latestItems: [] }
      });

      console.log('[AdminDataAudit] Data loaded successfully');

    } catch (error) {
      console.error('[AdminDataAudit] Failed to load audit data:', error);
      setError(`Failed to load audit data: ${error.message}`);
    }
    setLoading(false);
  };

  const handleVerifyUrl = async (url) => {
    if (!url) {
      setVerifyResult({ ok: false, status: 'N/A', error: 'No URL provided in payload.'});
      return;
    }
    
    setVerifyingUrl(url);
    setVerifyResult(null);
    
    try {
      const res = await fetch(`/UrlVerify?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setVerifyResult(data);
        } catch (parseError) {
          setVerifyResult({ ok: false, status: 'ERROR', error: 'Invalid JSON response from URL verify' });
        }
      } else {
        setVerifyResult({ ok: false, status: res.status, error: `HTTP ${res.status}` });
      }
    } catch (error) {
      setVerifyResult({ ok: false, status: 'ERROR', error: error.message });
    }
    
    setVerifyingUrl(null);
  };
  
  const renderQuarantineTable = (items) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No quarantined items found
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reason</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>URL / Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => {
            const payload = typeof item.payload === 'string' ? 
              (() => {
                try { return JSON.parse(item.payload); } 
                catch { return { title: 'Parse Error', url: null }; }
              })() : 
              item.payload || {};
            
            return (
              <TableRow key={i}>
                <TableCell><Badge variant="destructive">{item.reason}</Badge></TableCell>
                <TableCell><code className="text-xs">{payload.title || 'N/A'}</code></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {payload.url && (
                      <Button size="sm" variant="outline" onClick={() => handleVerifyUrl(payload.url)}>
                        {verifyingUrl === payload.url ? 
                          <Loader2 className="w-4 h-4 animate-spin"/> : 
                          <LinkIcon className="w-4 h-4"/>
                        }
                      </Button>
                    )}
                    <span className="text-xs text-gray-500 truncate">{payload.url || 'No URL'}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  const renderStatsTable = (stats, type) => {
    if (!stats || stats.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No {type} data available yet
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === 'grocer' ? 'Store' : 'Platform'}</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((s, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium capitalize">{s.store || s.platform}</TableCell>
              <TableCell>{type === 'grocer' ? (s.productCount || 0) : (s.menuItemCount || 0)}</TableCell>
              <TableCell>{s.lastSeen ? new Date(s.lastSeen).toLocaleString() : 'Never'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
        <p className="mt-4 text-blue-800">Loading audit data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Data Audit</h1>
            <p className="text-lg text-gray-600 mt-1">Real-time monitoring of Zyte data quality and coverage</p>
          </div>
          <Button onClick={loadAuditData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </header>

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Error Loading Data</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {verifyResult && (
            <Alert className={`mb-4 ${verifyResult.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <AlertTitle className={`${verifyResult.ok ? 'text-green-800' : 'text-red-800'}`}>URL Verification Result</AlertTitle>
                <AlertDescription>
                    Status: <Badge variant={verifyResult.ok ? 'default' : 'destructive'}>{verifyResult.status}</Badge> | Reachable: {verifyResult.ok ? 'Yes' : 'No'} {verifyResult.error && `- ${verifyResult.error}`}
                </AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="grocers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grocers"><ShoppingCart className="w-4 h-4 mr-2"/>Grocers</TabsTrigger>
                <TabsTrigger value="restaurants"><Utensils className="w-4 h-4 mr-2"/>Restaurants</TabsTrigger>
            </TabsList>
            <TabsContent value="grocers" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Grocery Store Coverage</CardTitle>
                        <CardDescription>Product counts per store</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderStatsTable(grocerStats, 'grocer')}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Grocer Quarantine</CardTitle>
                        <CardDescription>{quarantine.grocers.total} items rejected</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderQuarantineTable(quarantine.grocers.latestItems)}
                      </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="restaurants" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Restaurant Platform Coverage</CardTitle>
                        <CardDescription>Menu items per platform</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderStatsTable(restaurantStats, 'restaurant')}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Restaurant Quarantine</CardTitle>
                        <CardDescription>{quarantine.restaurants.total} items rejected</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderQuarantineTable(quarantine.restaurants.latestItems)}
                      </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}