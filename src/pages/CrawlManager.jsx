import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Rocket, Utensils, Activity, Download, ClipboardCheck } from 'lucide-react';

const CRAWL_START_PRODUCTS = "https://eov213rrft8rpja.m.pipedream.net/crawl/products/start";
const CRAWL_START_TAKEAWAY = "https://eov213rrft8rpja.m.pipedream.net/crawl/takeaway/start";
const CRAWL_STATUS = "https://eov213rrft8rpja.m.pipedream.net/crawl/status";
const CRAWL_EXPORT = "https://eov213rrft8rpja.m.pipedream.net/crawl/export";

const GROCERY_PROVIDERS = ["tesco", "asda", "sainsburys", "morrisons", "waitrose", "iceland", "coop", "aldi", "lidl", "ocado"];
const TAKEAWAY_PROVIDERS = ["deliveroo", "ubereats", "justeat"];

export default function CrawlManager() {
  const [loading, setLoading] = useState(null);
  const [jobId, setJobId] = useState('');
  const [statusJobId, setStatusJobId] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const [selectedProductProviders, setSelectedProductProviders] = useState([]);
  const [selectedTakeawayProviders, setSelectedTakeawayProviders] = useState([]);
  const [postcode, setPostcode] = useState('SW1A 0AA'); // Default postcode

  const handleProviderToggle = (provider, type) => {
    const setter = type === 'product' ? setSelectedProductProviders : setSelectedTakeawayProviders;
    const list = type === 'product' ? selectedProductProviders : selectedTakeawayProviders;
    
    if (list.includes(provider)) {
      setter(list.filter(p => p !== provider));
    } else {
      setter([...list, provider]);
    }
  };

  const startCrawl = async (type) => {
    setLoading(type);
    setError(null);
    setResponse(null);

    const url = type === 'product' ? CRAWL_START_PRODUCTS : CRAWL_START_TAKEAWAY;
    const providers = type === 'product' ? selectedProductProviders : selectedTakeawayProviders;
    let body = { providers };
    if (type === 'takeaway') {
      body.postcode = postcode;
    }
    
    if (providers.length === 0) {
      setError("Please select at least one provider.");
      setLoading(null);
      return;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setResponse(data);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatusJobId(data.jobId); // Also set it in the status input
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const checkStatus = async () => {
    if (!statusJobId) {
      setError("Please enter a Job ID.");
      return;
    }
    setLoading('status');
    setError(null);
    setResponse(null);
    try {
      const res = await fetch(`${CRAWL_STATUS}?jobId=${statusJobId}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const ProviderSelector = ({ providers, selected, onToggle, type }) => (
    <div className="flex flex-wrap gap-2">
      {providers.map(provider => (
        <Button
          key={provider}
          variant={selected.includes(provider) ? 'default' : 'outline'}
          onClick={() => onToggle(provider, type)}
          className="capitalize"
        >
          {provider}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Crawl Manager</h1>
          <p className="text-gray-600 mt-1">Initiate and monitor product and takeaway data crawls.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket /> Start a New Crawl</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Products Crawl */}
            <div className="p-4 border rounded-lg">
              <Label className="font-semibold text-lg">Products Crawl</Label>
              <p className="text-sm text-gray-500 mb-4">Select providers to start a grocery product crawl.</p>
              <ProviderSelector providers={GROCERY_PROVIDERS} selected={selectedProductProviders} onToggle={handleProviderToggle} type="product" />
              <Button onClick={() => startCrawl('product')} disabled={loading} className="mt-4">
                {loading === 'product' ? 'Starting...' : 'Start Products Crawl'}
              </Button>
            </div>

            {/* Takeaway Crawl */}
            <div className="p-4 border rounded-lg">
              <Label className="font-semibold text-lg">Takeaway Crawl</Label>
              <p className="text-sm text-gray-500 mb-4">Select providers and enter a postcode to start a takeaway menu crawl.</p>
              <div className="mb-4">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="max-w-xs" />
              </div>
              <ProviderSelector providers={TAKEAWAY_PROVIDERS} selected={selectedTakeawayProviders} onToggle={handleProviderToggle} type="takeaway" />
              <Button onClick={() => startCrawl('takeaway')} disabled={loading} className="mt-4">
                {loading === 'takeaway' ? 'Starting...' : 'Start Takeaway Crawl'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity /> Monitor Crawl Job</CardTitle>
            <CardDescription>Use the Job ID returned after starting a crawl to check its status or download results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobId">Job ID</Label>
              <Input id="jobId" placeholder="Enter Job ID" value={statusJobId} onChange={e => setStatusJobId(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={loading}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                {loading === 'status' ? 'Checking...' : 'View Status'}
              </Button>
              <a 
                href={`${CRAWL_EXPORT}?jobId=${statusJobId}&format=ndjson`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 ${!statusJobId ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download NDJSON
              </a>
            </div>
          </CardContent>
        </Card>
        
        {(response || error) && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Result</h3>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {response && (
              <pre className="bg-black text-white p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}