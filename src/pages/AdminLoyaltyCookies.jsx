import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Key, Save, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORES = ['tesco', 'sainsburys', 'morrisons', 'asda', 'waitrose', 'ocado'];

export default function AdminLoyaltyCookies() {
  const [selectedStore, setSelectedStore] = useState('');
  const [cookieValue, setCookieValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStore || !cookieValue) {
      setStatusMessage({ type: 'error', text: 'Please select a store and provide a cookie value.' });
      return;
    }
    
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    // In a real app, this would call DataClient.saveLoyaltyCookie(selectedStore, cookieValue)
    console.log(`[DEMO] Saving cookie for ${selectedStore}`);
    await new Promise(res => setTimeout(res, 1500));

    setIsLoading(false);
    setStatusMessage({ type: 'success', text: `Cookie for ${selectedStore} saved successfully!` });
    setCookieValue('');
    setSelectedStore('');

    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Loyalty Cookies</h1>
          <p className="text-lg text-gray-600 mt-1">Securely store authentication cookies to enable loyalty pricing.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key /> Add or Update Store Cookie</CardTitle>
            <CardDescription>
              Paste the full cookie string from your browser's developer tools. This value is encrypted before being stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="store-select">Select Store</Label>
                 <Select onValueChange={setSelectedStore} value={selectedStore}>
                  <SelectTrigger id="store-select" className="w-full mt-1">
                    <SelectValue placeholder="Select a store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STORES.map(store => (
                      <SelectItem key={store} value={store} className="capitalize">
                        {store}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cookie-value">Cookie String</Label>
                <Textarea
                  id="cookie-value"
                  value={cookieValue}
                  onChange={(e) => setCookieValue(e.target.value)}
                  placeholder="e.g., tesco-token=...; another-cookie=..."
                  className="min-h-[120px] mt-1 font-mono text-sm"
                  disabled={!selectedStore}
                />
              </div>

              <div className="flex justify-between items-center">
                 {statusMessage.text && (
                    <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {statusMessage.text}
                    </p>
                )}
                <Button type="submit" disabled={isLoading || !selectedStore || !cookieValue} className="ml-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Encrypted Cookie
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}