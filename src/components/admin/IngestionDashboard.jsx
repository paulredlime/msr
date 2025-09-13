import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Store } from "@/api/entities";
import IngestionService from "@/components/services/IngestionService";
import { 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  AlertCircle
} from "lucide-react";

export default function IngestionDashboard() {
  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storeList, ingestionLogs] = await Promise.all([
        Store.list(),
        IngestionService.getIngestionStatus()
      ]);
      
      setStores(storeList);
      setLogs(ingestionLogs);
    } catch (error) {
      console.error('Error loading ingestion data:', error);
    }
    setLoading(false);
  };

  const handleRefreshStore = async (storeId) => {
    setRefreshing(prev => ({ ...prev, [storeId]: true }));
    
    try {
      await IngestionService.refreshStore(storeId);
      await loadData(); // Reload logs
    } catch (error) {
      console.error('Error refreshing store:', error);
    }
    
    setRefreshing(prev => ({ ...prev, [storeId]: false }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading ingestion status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Ingestion Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => {
              const storeLog = logs.find(log => 
                log.store_id === store.id && log.status === 'running'
              );
              const lastCompleted = logs.find(log => 
                log.store_id === store.id && log.status === 'completed'
              );

              return (
                <Card key={store.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={store.logo_url} 
                          alt={store.name}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="font-medium">{store.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefreshStore(store.id)}
                        disabled={refreshing[store.id] || !!storeLog}
                      >
                        {refreshing[store.id] ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {storeLog && (
                      <div className="mb-3">
                        <Badge className={`${getStatusColor(storeLog.status)} mb-2`}>
                          {getStatusIcon(storeLog.status)}
                          <span className="ml-1">{storeLog.status}</span>
                        </Badge>
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          Processing products...
                        </p>
                      </div>
                    )}

                    {lastCompleted && !storeLog && (
                      <div className="text-sm text-gray-600">
                        <p>Last updated: {new Date(lastCompleted.completed_at).toLocaleDateString()}</p>
                        <p>Products: +{lastCompleted.products_added} / ~{lastCompleted.products_updated}</p>
                      </div>
                    )}

                    {!storeLog && !lastCompleted && (
                      <p className="text-sm text-gray-500">Never updated</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Backend Developer Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">🔌 Backend Integration Points</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <div className="space-y-2 text-sm">
            <p><strong>IngestionService.js:</strong> Replace mock functions with actual Apify API calls</p>
            <p><strong>Apify Actors needed:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Tesco: apify.com/jupri/tesco-grocery</li>
              <li>ASDA: apify.com/jupri/asda-scraper</li>
              <li>Sainsbury's: apify.com/natanielsantos/sainsbury-s-scraper</li>
              <li>Morrisons: apify.com/thenetaji/morrisons-scraper</li>
              <li>Waitrose: apify.com/thenetaji/waitrose-scraper</li>
            </ul>
            <p><strong>Open Food Facts:</strong> Implement GTIN lookups for nutrition data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}