
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pingAPI } from "@/components/lib/grocersApi";

export default function TestApiConnection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runAllTests();
  }, []);

  const addResult = (test, status, message, data = null) => {
    setResults(prev => [...prev, { 
      test, 
      status, 
      message, 
      data, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testPing = async () => {
    try {
      const result = await pingAPI();
      if (result.ok && result.ping === "pong") {
        addResult('API Ping GET', 'success', `Backend is reachable and responding correctly`, result);
      } else {
        addResult('API Ping GET', 'error', `Backend responded but with unexpected format`, result);
      }
    } catch (error) {
      addResult('API Ping GET', 'error', error.message);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    const apiEndpoint = 'https://eov213rrft8rpja.m.pipedream.net';
    addResult('Info', 'info', `Testing API_ENDPOINT: ${apiEndpoint}`);
    
    await testPing();
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>API Health Check</CardTitle>
          <CardDescription>
            Pinging the configured backend endpoint to ensure it's reachable from the frontend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runAllTests} disabled={loading} className="mb-4">
              {loading ? 'Pinging...' : 'Ping API'}
            </Button>
            
            {results.length > 0 && results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {result.status === 'success' ? '✅' : 
                       result.status === 'error' ? '❌' : 'ℹ️'} {result.test}
                    </Badge>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                </div>
                <p className="text-sm mb-2 font-medium">{result.message}</p>
                {result.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Pinging backend...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
