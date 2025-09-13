import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, AlertTriangle, ShoppingCart } from 'lucide-react';
import DataClient from "@/components/services/DataClient";
import SecureCredentialsManager from "@/components/services/SecureCredentialsManager";
import { User } from "@/api/entities";

const STORES = ['iceland', 'tesco', 'asda', 'sainsburys'];

export default function TestOrderFetch() {
  const [selectedStore, setSelectedStore] = useState('iceland');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleTestFetch = async () => {
    if (!user) {
      setError('User not loaded');
      return;
    }

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setTesting(true);
    setError(null);
    setResults(null);

    try {
      // First, store the credentials securely
      await SecureCredentialsManager.storeCredentials(
        user.id, 
        selectedStore, 
        credentials.username, 
        credentials.password
      );

      // Then trigger the order sync
      const syncResult = await DataClient.syncOrderHistory(user.id, selectedStore);
      
      setResults(syncResult);

    } catch (err) {
      console.error('Order fetch test failed:', err);
      setError(err.message);
    }

    setTesting(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Order History Fetch</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Live Order Extraction Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Select Store</Label>
              <select 
                value={selectedStore} 
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
              >
                {STORES.map(store => (
                  <option key={store} value={store}>
                    {store.charAt(0).toUpperCase() + store.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Username/Email</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Security Note</AlertTitle>
              <AlertDescription className="text-blue-700">
                Credentials are encrypted at rest using AES-256. This is a test interface - 
                in production, users would enter credentials through a secure form on their profile page.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleTestFetch}
              disabled={testing || !credentials.username || !credentials.password}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Order History via Zyte...
                </>
              ) : (
                'Test Live Order Fetch'
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Fetch Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Order Fetch Results</CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {results.ordersFound} orders found
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {results.ordersSaved} saved to DB
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {results.orders && results.orders.length > 0 ? (
                <div className="space-y-6">
                  {results.orders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold">Order #{order.order_id}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.order_date).toLocaleDateString()} • {selectedStore}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">£{order.total_amount.toFixed(2)}</p>
                          {order.delivery_fee > 0 && (
                            <p className="text-sm text-gray-500">
                              +£{order.delivery_fee.toFixed(2)} delivery
                            </p>
                          )}
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.slice(0, 5).map((item, itemIndex) => (
                              <TableRow key={itemIndex}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>£{item.price.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      {order.items && order.items.length > 5 && (
                        <p className="text-sm text-gray-500 mt-2">
                          ...and {order.items.length - 5} more items
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No orders found or failed to parse order data.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}