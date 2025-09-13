import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Database, 
  Shield, 
  Zap, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2,
  Server,
  Globe,
  Lock
} from "lucide-react";

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

export default function ZyteIntegrationHandoff() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zyte API Integration Handoff</h1>
          <p className="text-lg text-gray-600">Complete technical specification for implementing Zyte Extract API with Base44 server functions</p>
        </header>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Current Status</AlertTitle>
          <AlertDescription className="text-blue-700">
            The frontend is ready and showing mock data. This document provides the exact implementation needed to replace mock data with live Zyte API integration using Base44's server functions.
          </AlertDescription>
        </Alert>

        <div className="grid gap-8">
          {/* Environment Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server /> Environment Setup</CardTitle>
              <CardDescription>Required environment variables for Base44 server functions</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{`# Add to Base44 environment secrets
ZYTE_API_KEY=your_actual_zyte_api_key_here
REAL_DATA_REQUIRED=1        # hard block any non-real data at ingest
ZYTE_JS_RENDER=1            # allow Zyte to render JS for dynamic sites
MOCK_MODE=0                 # 0=off in prod; 1=dev-only demo data`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Connectivity Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe /> Connectivity Smoke Test</CardTitle>
              <CardDescription>Server function to test site accessibility (no scraping)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Create a Base44 server function for connectivity testing:</p>
              <CodeBlock>{`// Base44 Server Function: connectivity-check
const TARGETS = [
  "https://www.tesco.com/groceries/en-GB/shop",
  "https://groceries.asda.com",
  "https://www.sainsburys.co.uk/gol-ui/groceries",
  "https://groceries.morrisons.com",
  "https://www.waitrose.com",
  "https://www.aldi.co.uk",
  "https://www.lidl.co.uk", 
  "https://www.iceland.co.uk",
  "https://www.ocado.com",
  "https://www.coop.co.uk",
  "https://www.ubereats.com/gb",
  "https://deliveroo.co.uk",
  "https://www.just-eat.co.uk"
];

export async function connectivityCheck() {
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  const results = [];
  
  for (const url of TARGETS) {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": ua, Accept: "text/html" }
      });
      results.push({ 
        url, 
        status: response.status, 
        responseTimeMs: Date.now() - started,
        accessible: response.ok
      });
    } catch (error) {
      results.push({ 
        url, 
        status: 0, 
        responseTimeMs: Date.now() - started,
        accessible: false,
        error: error.message 
      });
    }
  }
  
  return { ok: true, results };
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Zyte Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock /> Zyte API Client</CardTitle>
              <CardDescription>Server function to interact with Zyte Extract API using Basic Auth</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{`// Base44 Server Function: zyte-extract
export async function zyteExtract(request) {
  const apiKey = process.env.ZYTE_API_KEY;
  if (!apiKey) throw new Error("ZYTE_API_KEY missing");
  
  const body = {
    url: request.url,
    browserHtml: request.browserHtml ?? (process.env.ZYTE_JS_RENDER === "1"),
    httpResponseBody: request.httpResponseBody ?? true,
    httpRequest: request.httpRequest
  };
  
  const response = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(\`\${apiKey}:\`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Zyte API error \${response.status}: \${errorText}\`);
  }
  
  return await response.json();
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Store Extractors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch /> Store Extractors</CardTitle>
              <CardDescription>HTML parsing logic for each store (using Cheerio or similar)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Create store-specific extractors that parse HTML into normalized product data:</p>
              <CodeBlock>{`// Base44 Server Function: extract-iceland
export function extractIceland(html, pageUrl) {
  // Use Cheerio or similar HTML parsing library
  const $ = cheerio.load(html);
  const products = [];
  
  $('.product-tile, .product-grid__item').each((_, element) => {
    const title = $(element).find('.product-title, .product-title__name').text().trim();
    const priceText = $(element).find('.product-prices__price, .product-sales-price').first().text();
    const price = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));
    const relativeUrl = $(element).find('a[href*="/products/"]').first().attr('href');
    const url = relativeUrl ? new URL(relativeUrl, pageUrl).toString() : '';
    
    if (title && url && !isNaN(price)) {
      products.push({
        title,
        price,
        url,
        brand: 'Iceland', // Store brand default
        category: 'grocery' // Can be enhanced with category detection
      });
    }
  });
  
  return products;
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Real-Only Guards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield /> Real-Only Data Guards</CardTitle>
              <CardDescription>Data validation and quarantine system</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{`// Base44 Server Function: validate-product-data
const ALLOWED_DOMAINS = [
  'tesco.com', 'asda.com', 'sainsburys.co.uk', 'morrisons.com',
  'waitrose.com', 'aldi.co.uk', 'lidl.co.uk', 'iceland.co.uk',
  'ocado.com', 'coop.co.uk', 'ubereats.com', 'deliveroo.co.uk',
  'just-eat.co.uk'
];

const MOCK_KEYWORDS = ['test', 'demo', 'sample', 'mock', 'example'];

export async function validateAndQuarantine(products, sourceStore) {
  const accepted = [];
  const quarantined = [];
  
  for (const product of products) {
    // Domain check
    const domain = new URL(product.url).hostname.replace('www.', '');
    if (!ALLOWED_DOMAINS.some(allowed => domain.includes(allowed))) {
      quarantined.push({
        ...product,
        reason: 'domain-not-allowed',
        sourceStore
      });
      continue;
    }
    
    // Mock keyword check
    if (MOCK_KEYWORDS.some(keyword => 
      product.title.toLowerCase().includes(keyword) ||
      product.url.toLowerCase().includes(keyword)
    )) {
      quarantined.push({
        ...product,
        reason: 'mock-keyword-detected',
        sourceStore
      });
      continue;
    }
    
    // Live URL check
    try {
      const urlCheck = await fetch(product.url, { method: 'HEAD' });
      if (!urlCheck.ok) {
        quarantined.push({
          ...product,
          reason: \`url-status-\${urlCheck.status}\`,
          sourceStore
        });
        continue;
      }
    } catch (error) {
      quarantined.push({
        ...product,
        reason: 'url-unreachable',
        sourceStore
      });
      continue;
    }
    
    accepted.push(product);
  }
  
  // Store quarantined items in QuarantinedItem entity
  for (const item of quarantined) {
    await QuarantinedItem.create({
      payload: JSON.stringify(item),
      reason: item.reason,
      source_store: sourceStore
    });
  }
  
  return { accepted, quarantined };
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database /> API Integration Points</CardTitle>
              <CardDescription>How to connect the frontend to server functions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Update DataClient to call Base44 server functions instead of using InvokeLLM:</p>
              <CodeBlock>{`// Updated DataClient.js
class DataClient {
  async testStoreFetch(store, limit = 5) {
    // Call Base44 server function instead of InvokeLLM
    const response = await this.callServerFunction('zyte-store-fetch', {
      store,
      limit,
      testMode: true
    });
    
    return response.products || [];
  }
  
  async callServerFunction(functionName, payload) {
    // This would use Base44's server function calling mechanism
    // Replace with actual Base44 server function call syntax
    const response = await fetch(\`/api/functions/\${functionName}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(\`Server function error: \${response.statusText}\`);
    }
    
    return await response.json();
  }
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Implementation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 /> Implementation Checklist</CardTitle>
              <CardDescription>Step-by-step implementation guide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">1</Badge>
                  <span>Set up environment variables (ZYTE_API_KEY, etc.)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">2</Badge>
                  <span>Create connectivity-check server function</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">3</Badge>
                  <span>Implement zyte-extract server function with Basic Auth</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">4</Badge>
                  <span>Build store extractors (start with Iceland as simplest)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">5</Badge>
                  <span>Implement real-only data validation guards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">6</Badge>
                  <span>Create zyte-store-fetch endpoint that combines extraction + validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">7</Badge>
                  <span>Update DataClient to call server functions instead of InvokeLLM</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">8</Badge>
                  <span>Test with one store (Iceland) to verify end-to-end flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">9</Badge>
                  <span>Expand to remaining 9 stores with store-specific extractors</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">10</Badge>
                  <span>Add takeaway platform extractors (Uber Eats, Deliveroo, Just Eat)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}