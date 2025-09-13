
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createStripeCheckout } from '@/api/functions';
import { SubscriptionPlan } from '@/api/entities';
import { CheckCircle, Crown, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { featureIdMap } from '@/components/lib/featureDefinitions';

function AllFeaturesModal({ plan, onClose }) {
  if (!plan) return null;

  return (
    <Dialog open={!!plan} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>All Features: {plan.name}</DialogTitle>
          <DialogDescription>
            Here is a complete list of all features included in the {plan.name} plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {plan.features?.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{featureIdMap[feature] || feature}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UpgradeSubscriptionModal({ isOpen, onClose, featureName }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [viewingFeaturesOf, setViewingFeaturesOf] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchPlans = async () => {
        try {
          setLoading(true);
          setError(null);
          // Use a filter that is unlikely to match old, incorrect data
          const activePlans = await SubscriptionPlan.filter({ is_active: true });
          // Filter client-side to be absolutely sure
          const validPlans = activePlans.filter(p => p.stripe_price_id && p.stripe_price_id.startsWith('price_'));
          
          if (validPlans.length === 0) {
              console.warn("No valid subscription plans with Stripe IDs found. Displaying all active plans as a fallback.");
              setPlans(activePlans.sort((a, b) => a.price - b.price));
          } else {
              setPlans(validPlans.sort((a, b) => a.price - b.price));
          }

        } catch (err) {
          console.error("Failed to fetch subscription plans:", err);
          setError("Could not load subscription plans. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }
  }, [isOpen]);

  const handleCheckout = async (plan) => {
    setProcessingPlanId(plan.id);
    try {
      const { data } = await createStripeCheckout({ planId: plan.id });
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Could not create a checkout session.');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setProcessingPlanId(null);
    }
  };

  return (
    <>
      <AllFeaturesModal plan={viewingFeaturesOf} onClose={() => setViewingFeaturesOf(null)} />

      <Dialog open={isOpen && !viewingFeaturesOf} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Crown className="w-6 h-6 text-amber-500" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
              {featureName 
                ? `The "${featureName}" feature requires a premium subscription.` 
                : "Choose a plan to unlock all of MyShopRun's powerful features."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {loading && (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            )}
            {error && (
              <div className="flex flex-col justify-center items-center h-48 text-red-600">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="flex flex-col shadow-lg border-2 border-transparent hover:border-teal-500 transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-teal-700">{plan.name}</CardTitle>
                        {plan.is_premium_plan && <Badge className="bg-teal-100 text-teal-800">Most Popular</Badge>}
                      </div>
                      <div className="text-4xl font-bold text-gray-900 pt-2">
                        £{plan.price}
                        <span className="text-base font-normal text-gray-500">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <ul className="space-y-2 text-sm text-gray-600">
                        {plan.features?.slice(0, 8).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{featureIdMap[feature] || feature}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.features && plan.features.length > 8 && (
                        <Button
                          variant="link"
                          className="text-teal-600 p-0 h-auto text-sm"
                          onClick={() => setViewingFeaturesOf(plan)}
                        >
                          + {plan.features.length - 8} more features...
                        </Button>
                      )}
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        disabled={processingPlanId === plan.id}
                        onClick={() => handleCheckout(plan)}
                      >
                        {processingPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : 'Upgrade Now'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Maybe Later</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
