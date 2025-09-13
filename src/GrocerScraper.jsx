import React, { useState } from 'react';
import { useGrocerScraper } from './hooks/useGrocerScraper';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SUPPORTED_STORES = [
  { name: 'Tesco', domain: 'tesco.com' },
  { name: 'ASDA', domain: 'asda.com' },
  { name: 'Sainsbury\'s', domain: 'sainsburys.co.uk' },
  { name: 'Morrisons', domain: 'morrisons.com' },
  { name: 'Waitrose', domain: 'waitrose.com' },
  { name: 'Iceland', domain: 'iceland.co.uk' },
  { name: 'Co-op', domain: 'shop.coop.co.uk' },
  { name: 'Aldi', domain: 'groceries.aldi.co.uk' },
  { name: 'Lidl', domain: 'groceries.lidl.co.uk' },
  { name: 'Ocado', domain: 'ocado.com' },
];

export function GrocerScraper() {
  const [store, setStore] = useState('Tesco');
  const [url, setUrl] = useState('');
  const { scrape, loading, error, data } = useGrocerScraper();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scrape({ store, listUrl: url });
    } catch (err) {
      console.error('Scraping failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Grocery Scraper</CardTitle>
        <CardDescription>Test single URL scraping against the live API.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={store} onValueChange={setStore}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_STORES.map(s => (
                <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g., https://www.tesco.com/groceries/..."
            required
            className="flex-grow"
          />
          
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Scraping...' : 'Scrape Products'}
          </Button>
        </form>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="ml-4 text-gray-600">Fetching live data...</p>
          </div>
        )}

        {error && 
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }
        
        {data && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Found {data.count} products</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {data.products?.map((product, i) => (
                <Card key={i} className="flex flex-col">
                  <CardHeader className="p-4">
                    {product.image && <img src={product.image} alt={product.title} className="w-full h-32 object-contain mb-4 rounded"/>}
                    <CardTitle className="text-base line-clamp-2">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-end">
                    <p className="text-lg font-bold mb-2">{product.priceText || 'N/A'}</p>
                    {product.url && <Button asChild variant="outline" size="sm"><a href={product.url} target="_blank" rel="noopener noreferrer">View Product</a></Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Audit Info</summary>
              <pre className="mt-2 bg-gray-900 text-white text-xs p-4 rounded-lg overflow-x-auto">{JSON.stringify(data.audit, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}