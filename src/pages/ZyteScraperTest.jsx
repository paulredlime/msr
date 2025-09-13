
import React from 'react';
import { GrocerScraper } from '../components/GrocerScraper';

export default function ZyteScraperTest() {
  const apiEndpoint = 'https://eov213rrft8rpja.m.pipedream.net';

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live API Scraper Test</h1>
          <p className="text-gray-600 mt-2">
            This page uses the live Pipedream API to scrape grocery store product lists.
          </p>
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-sm text-green-800">
            <strong>API Endpoint Configured:</strong> {apiEndpoint}
          </div>
        </div>
        
        <GrocerScraper />
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900">How to Use:</h3>
          <ol className="list-decimal list-inside mt-2 text-sm text-blue-800 space-y-1">
            <li>Select a store from the dropdown.</li>
            <li>Navigate to a product category page on that store's website (e.g., Tesco's frozen food section).</li>
            <li>Copy the URL from your browser's address bar.</li>
            <li>Paste the URL into the input field above.</li>
            <li>Click "Scrape Products" and wait for the results.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
