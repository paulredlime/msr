import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Confetti from '@/components/Confetti';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Here you could optionally verify the session status with your backend
    // For now, we assume success if they land here.
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-gray-600">Finalizing your subscription...</p>
        </div>
      ) : (
        <div className="text-center bg-white p-10 rounded-xl shadow-lg">
          <Confetti />
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">Welcome! Your subscription is now active.</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700">Go to Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  );
}