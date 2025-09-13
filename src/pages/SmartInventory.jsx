import React from 'react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartInventory() {
  // This feature has been removed as requested
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center">
        <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-3xl font-bold mb-4">Smart Inventory</h1>
        <p className="text-xl text-gray-600 mb-8">
          This feature is being redesigned. Coming soon!
        </p>
        <Link to={createPageUrl('Dashboard')}>
          <Button>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}