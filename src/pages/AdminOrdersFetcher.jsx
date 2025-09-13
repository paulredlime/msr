
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchLast10Orders } from '@/components/lib/ordersApi';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SUPPORTED_PROVIDERS = [
  'Uber Eats', 
  'Just Eat', 
  'Deliveroo',
  'Tesco',
  'ASDA',
  'Sainsbury\'s',
  'Morrisons',
  'Waitrose',
  'Iceland',
  'Co-op',
  'Aldi',
  'Lidl',
  'Ocado'
];

export default function AdminOrdersFetcher() {
  const [provider, setProvider] = useState('Tesco');
  // Changed state from 'account' to 'alias'
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alias) {
      setError('Please enter an Account Alias (e.g., main, secondary).');
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // Updated the call to use the 'alias' field
      const result = await fetchLast10Orders({ provider, alias });
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Order fetching failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("AdminDashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Order History Fetcher</CardTitle>
            <CardDescription>
              Test fetching the last 10 orders for a specific account from your Pipedream backend.
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
                type="text"
                placeholder="Account Alias (e.g. main)"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="flex-grow"
              />

              <Button type="submit" disabled={loading} className="min-w-[150px]">
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Fetching...
                  </div>
                ) : (
                  'Fetch Last 10 Orders'
                )}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {data && (
              <div>
                <h3 className="text-lg font-semibold mb-2">API Response</h3>
                <pre className="bg-gray-900 text-white p-4 rounded-md text-xs overflow-auto max-h-[500px]">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
