import React from 'react';
import { Restaurant } from "@/api/entities";
import { MenuItem } from "@/api/entities";
import { QuarantinedItem } from "@/api/entities";

export default function AuditRestaurants() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Audit Restaurants API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>This endpoint provides restaurant audit data.</p>
        <p className="mt-2">GET request will return JSON with platform statistics.</p>
        <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
{`{
  "platformStats": [...],
  "quarantineStats": {...}
}`}
        </pre>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  if (req.method === 'GET' && req.url === '/AuditRestaurants') {
    try {
      // Get all restaurants and menu items
      const allRestaurants = await Restaurant.list();
      const allMenuItems = await MenuItem.list();
      const allQuarantined = await QuarantinedItem.list('-created_date', 100);

      // Group by platform
      const platformStats = {};
      allRestaurants.forEach(restaurant => {
        const platform = restaurant.platform || 'unknown';
        if (!platformStats[platform]) {
          platformStats[platform] = { platform, restaurantCount: 0, menuItemCount: 0, lastSeen: null };
        }
        platformStats[platform].restaurantCount++;
        if (!platformStats[platform].lastSeen || restaurant.created_date > platformStats[platform].lastSeen) {
          platformStats[platform].lastSeen = restaurant.created_date;
        }
      });

      // Add menu item counts
      allMenuItems.forEach(item => {
        // Find the restaurant to get platform
        const restaurant = allRestaurants.find(r => r.id === item.restaurant_id);
        if (restaurant) {
          const platform = restaurant.platform || 'unknown';
          if (platformStats[platform]) {
            platformStats[platform].menuItemCount++;
          }
        }
      });

      // Restaurant quarantine stats
      const restaurantQuarantined = allQuarantined.filter(q => 
        q.source_store && ['deliveroo', 'ubereats', 'justeat'].includes(q.source_store)
      );

      const reasonsBreakdown = {};
      restaurantQuarantined.forEach(q => {
        reasonsBreakdown[q.reason] = (reasonsBreakdown[q.reason] || 0) + 1;
      });

      const result = {
        platformStats: Object.values(platformStats),
        quarantineStats: {
          total: restaurantQuarantined.length,
          reasons: reasonsBreakdown,
          latestItems: restaurantQuarantined.slice(0, 10).map(q => ({
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
      console.error('[AuditRestaurants] Error:', error);
      
      const fallbackResult = {
        platformStats: [],
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