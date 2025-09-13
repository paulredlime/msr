
import React from 'react';
import { OrdersFetcher } from '../components/OrdersFetcher';

export default function OrdersFetcherTest() {
  const orchestratorEndpoint = 'NOT SET';
  const ordersEndpoint = 'NOT SET';

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Order History Fetcher</h1>
          <p className="text-lg text-gray-600 mt-1">
            Live testing interface for the orders history API.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1">
            <p><strong>Single Fetch Endpoint:</strong> {ordersEndpoint}</p>
            <p><strong>Batch Fetch Endpoint:</strong> {orchestratorEndpoint}</p>
            <p className="text-xs text-blue-700">Note: If endpoints show placeholder URLs, the agent has hardcoded them as a fallback. Set the environment variables in your project settings to use your live URLs.</p>
          </div>
        </header>
        
        <OrdersFetcher />
        
        {/* Placeholder for future batch fetcher UI */}
        <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
            <h2 className="font-semibold text-gray-700">Batch Fetcher</h2>
            <p className="text-sm text-gray-500">A UI for the batch orchestrator can be added here.</p>
        </div>
      </div>
    </div>
  );
}
