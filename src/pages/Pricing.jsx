
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SubscriptionPlan } from "@/api/entities";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, // Used for feature list checks
  Check, // Added from outline
  X, // Added from outline
  Star,
  Zap,
  Crown,
  ShoppingCart,
  ArrowRight
} from "lucide-react";
import { createStripeCheckout } from '@/api/stripe'; // Assuming this path for Stripe API calls
import { featureIdMap } from '@/components/lib/featureDefinitions'; // Importing the centralized feature map

// The ALL_FEATURES and featureIdMap definitions are now moved to '@/utils/featureDefinitions'

const getBaseUrl = () => {
  if (window.location.hostname === 'myshoprun.app') {
    return 'https://myshoprun.app';
  }
  return window.location.origin;
};

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPlansAndUser();
  }, []);

  const loadPlansAndUser = async () => {
    try {
      const [activePlans, currentUser] = await Promise.all([
        SubscriptionPlan.filter({ is_active: true }, 'price'),
        User.me().catch(() => null)
      ]);
      
      setPlans(activePlans);
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleGetStarted = async (plan) => {
    try {
      const currentUser = await User.me();
      if (currentUser) {
        if (currentUser.subscription_plan_id === plan.id && currentUser.subscription_status === 'active') {
          // User is already on this plan, do nothing or show a message
          console.log(`User is already on ${plan.name} plan.`);
          return;
        }
        const { data } = await createStripeCheckout({ priceId: plan.stripe_price_id, userEmail: currentUser.email });
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      // User not logged in (User.me() threw an error), redirect to login then to pricing page
      localStorage.setItem('deferredAction', `upgrade:${plan.id}`);
      await User.loginWithRedirect(
        `${getBaseUrl()}${window.location.pathname}${window.location.search}`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-700 font-medium">Loading Plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Pricing Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start saving money on groceries today. All plans include a 3-day free trial.
            </p>
          </div>

          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => (
                <Card key={plan.id} className={`relative shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 flex flex-col ${
                  index === 1 ? 'md:scale-105 border-2 border-teal-200' : ''
                }`}>
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-8 flex-shrink-0">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                      index === 1 ? 'bg-gradient-to-r from-teal-500 to-cyan-600' :
                      'bg-gradient-to-r from-orange-500 to-amber-600'
                    }`}>
                      {index === 0 ? <Zap className="w-8 h-8 text-white" /> :
                       index === 1 ? <Zap className="w-8 h-8 text-white" /> :
                       <Crown className="w-8 h-8 text-white" />}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </CardTitle>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      £{plan.price.toFixed(2)}
                      <span className="text-lg font-normal text-gray-500">/month</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.features.filter(f => f && f.trim()).map((feature, featureIndex) => {
                        const displayName = featureIdMap[feature.trim()] || feature; // Uses the imported featureIdMap
                        return (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{displayName}</span>
                          </li>
                        );
                      })}
                    </ul>
                    
                    <div className="mt-auto">
                      {user ? (
                        <Link to={createPageUrl("Profile")}>
                          <Button className={`w-full py-3 text-lg font-semibold ${
                            index === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' :
                            index === 1 ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700' :
                            'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                          }`}>
                            Manage Subscription
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          onClick={() => handleGetStarted(plan)} // Changed from handleLogin
                          className={`w-full py-3 text-lg font-semibold ${
                            index === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' :
                            index === 1 ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700' :
                            'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                          }`}
                        >
                          Start Free Trial
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans available</h3>
              <p className="text-gray-500 mb-6">Plans are being configured. Please check back soon!</p>
              <Link to={createPageUrl("Home")}>
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          )}

          {/* FAQ Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How does the free trial work?</h3>
                <p className="text-gray-600">You get 3 days of full access to all features. No credit card required to start.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
                <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time from your profile settings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Which supermarkets do you support?</h3>
                <p className="text-gray-600">We support Tesco, ASDA, Sainsbury's, Morrisons, Waitrose, Lidl, Aldi, Co-op, and Iceland.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How much money will I save?</h3>
                <p className="text-gray-600">Our users save an average of £200+ per month by shopping at the cheapest supermarket.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
