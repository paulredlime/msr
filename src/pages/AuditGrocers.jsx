import React from 'react';
import { Product } from "@/api/entities";
import { StoreProduct } from "@/api/entities";
import { QuarantinedItem } from "@/api/entities";

export default function AuditGrocers() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Audit Grocers API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>This endpoint provides grocery store audit data.</p>
        <p className="mt-2">GET request will return JSON with store statistics.</p>
        <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
{`{
  "storeStats": [...],
  "quarantineStats": {...}
}`}
        </pre>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  if (req.method === 'GET' && req.url === '/AuditGrocers') {
    try {
      // Get all products and group by store
      const allProducts = await Product.list();
      const allQuarantined = await QuarantinedItem.list('-created_date', 100);

      // Group products by store
      const storeStats = {};
      allProducts.forEach(product => {
        const store = product.source_store || 'unknown';
        if (!storeStats[store]) {
          storeStats[store] = { store, productCount: 0, lastSeen: null };
        }
        storeStats[store].productCount++;
        if (!storeStats[store].lastSeen || product.created_date > storeStats[store].lastSeen) {
          storeStats[store].lastSeen = product.created_date;
        }
      });

      // Quarantine stats
      const grocerQuarantined = allQuarantined.filter(q => 
        q.source_store && !['deliveroo', 'ubereats', 'justeat'].includes(q.source_store)
      );

      const reasonsBreakdown = {};
      grocerQuarantined.forEach(q => {
        reasonsBreakdown[q.reason] = (reasonsBreakdown[q.reason] || 0) + 1;
      });

      const result = {
        storeStats: Object.values(storeStats),
        quarantineStats: {
          total: grocerQuarantined.length,
          reasons: reasonsBreakdown,
          latestItems: grocerQuarantined.slice(0, 10).map(q => ({
            reason: q.reason,
            payload: typeof q.payload === 'string' ? JSON.parse(q.payload) : q.payload,
            created_at: q.created_date
          }))
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(result);
      return { props: {} };

    } catch (error) {
      console.error('[AuditGrocers] Error:', error);
      
      const fallbackResult = {
        storeStats: [],
        quarantineStats: { total: 0, reasons: {}, latestItems: [] },
        error: error.message
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json(fallbackResult);
      return { props: {} };
    }
  }

  return { props: {} };
}