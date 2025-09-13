import React, { useState } from 'react';
import { useOrdersFetcher } from './hooks/useOrdersFetcher';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SUPPORTED_PROVIDERS = ['Uber Eats', 'Just Eat', 'Deliveroo'];

export function OrdersFetcher() {
  const [provider, setProvider] = useState('Uber Eats');
  const [account, setAccount] = useState('');
  const { fetchOrders, loading, error, data } = useOrdersFetcher();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      alert('Please enter an account identifier (e.g., email).');
      return;
    }
    try {
      await fetchOrders({ provider, account });
    } catch (err) {
      console.error('Order fetching failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fetch Order History</CardTitle>
        <CardDescription>
          Fetch the last 10 orders for a specific account from a delivery provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_PROVIDERS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="Account Email or Identifier"
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch Orders'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div>
            <Alert className="mb-4">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Fetched {data.orders?.length || 0} orders for {data.account} from {data.provider}.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {data.orders?.map((order, i) => (
                <div key={i} className="p-3 border rounded-lg bg-gray-50 text-sm">
                  <div className="font-semibold">{order.restaurant_name}</div>
                  <div className="text-gray-600">
                    {new Date(order.date).toLocaleDateString()} - £{order.total_price.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {order.items.map(item => item.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}