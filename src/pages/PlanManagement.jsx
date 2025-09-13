
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { SubscriptionPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  Crown,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Star,
  Zap,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ScanLine,
  History,
  BookOpen
} from "lucide-react";
import { ALL_FEATURES, featureIdMap } from '@/components/lib/featureDefinitions';


export default function PlanManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    currency: 'GBP',
    features: [],
    is_active: true,
    is_premium_plan: false, // Added is_premium_plan
    stripe_price_id: '',
    paypal_plan_id: '',
  });

  const loadPlans = React.useCallback(async () => {
    try {
      const allPlans = await SubscriptionPlan.list();
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        await loadPlans();
      } catch (error) {
        navigate(createPageUrl("SuperAdmin"));
      }
      setLoading(false);
    };

    checkAdminAccess();
  }, [navigate, loadPlans]);

  const handleCreatePlan = async () => {
    try {
      await SubscriptionPlan.create(newPlan);
      setSuccessMessage('Plan created successfully!');
      setShowCreateDialog(false);
      resetNewPlan();
      await loadPlans();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleUpdatePlan = async () => {
    try {
      const { id, ...planData } = editingPlan;
      await SubscriptionPlan.update(id, planData);
      setSuccessMessage('Plan updated successfully!');
      setEditingPlan(null);
      await loadPlans();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        await SubscriptionPlan.delete(planId);
        setSuccessMessage('Plan deleted successfully!');
        await loadPlans();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const resetNewPlan = () => {
    setNewPlan({
      name: '',
      price: 0,
      currency: 'GBP',
      features: [],
      is_active: true,
      is_premium_plan: false, // Added is_premium_plan
      stripe_price_id: '',
      paypal_plan_id: '',
    });
  };

  const handleFeatureToggle = (planSetter, featureId, isChecked) => {
    planSetter(prev => {
      const currentFeatures = prev.features || [];
      if (isChecked) {
        return { ...prev, features: [...new Set([...currentFeatures, featureId])] };
      } else {
        return { ...prev, features: currentFeatures.filter(id => id !== featureId) };
      }
    });
  };

  const handlePremiumPlanToggle = async (planId, isPremium) => {
    try {
      // If setting a plan as premium, ensure all other plans are unset
      if (isPremium) {
        const updatePromises = plans.map(async (plan) => {
          if (plan.id !== planId && plan.is_premium_plan) {
            return SubscriptionPlan.update(plan.id, { is_premium_plan: false });
          }
          return Promise.resolve(); // Return a resolved promise for plans not being updated
        });
        await Promise.all(updatePromises);
      }
      
      // Then update the selected plan
      await SubscriptionPlan.update(planId, { is_premium_plan: isPremium });
      await loadPlans(); // Reload to reflect changes
      setSuccessMessage(isPremium ? 'Premium plan updated!' : 'Premium status removed!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling premium plan status:', error);
      setSuccessMessage('Failed to update premium plan status.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const PlanForm = ({ plan, setPlan }) => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${plan?.id || 'new'}-name`}>Plan Name</Label>
            <Input
              id={`${plan?.id || 'new'}-name`}
              placeholder="e.g., Basic Plan"
              value={plan.name}
              onChange={(e) => setPlan({...plan, name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor={`${plan?.id || 'new'}-price`}>Monthly Price (£)</Label>
            <Input
              id={`${plan?.id || 'new'}-price`}
              type="number"
              step="0.01"
              placeholder="1.99"
              value={plan.price}
              onChange={(e) => setPlan({...plan, price: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        <div>
          <Label>Features</Label>
          <Accordion type="multiple" className="w-full mt-2 border rounded-md px-2">
            {ALL_FEATURES.map((group) => (
              <AccordionItem key={group.category} value={group.category}>
                <AccordionTrigger className="font-semibold">{group.category}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 p-2">
                    {group.features.map((feature) => (
                      <div key={feature.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`${plan?.id || 'new'}-${feature.id}`}
                          checked={plan.features?.includes(feature.id)}
                          onCheckedChange={(checked) => handleFeatureToggle(setPlan, feature.id, checked)}
                          onClick={(e) => e.stopPropagation()} // Prevent accordion from closing
                        />
                        <div 
                          className="grid gap-1.5 leading-none"
                          onClick={(e) => e.stopPropagation()} // Prevent accordion from closing
                        >
                          <label 
                            htmlFor={`${plan?.id || 'new'}-${feature.id}`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from closing
                          >
                            {feature.name}
                          </label>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <Label htmlFor={`${plan?.id || 'new'}-stripe_price_id`} className="font-semibold text-blue-800">Stripe Price ID (Optional)</Label>
            <Input
              id={`${plan?.id || 'new'}-stripe_price_id`}
              placeholder="price_1... (leave blank to create automatically)"
              value={plan.stripe_price_id}
              onChange={(e) => setPlan({...plan, stripe_price_id: e.target.value})}
              className="mt-1"
            />
            <p className="text-xs text-blue-700 mt-2">
              <strong>Optional:</strong> If you have a pre-created Price ID in Stripe, paste it here. Otherwise, leave blank and we'll create the price automatically during checkout.
              <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1 inline-flex items-center gap-1">
                Stripe Products <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id={`${plan?.id || 'new'}-is_active`}
              checked={plan.is_active}
              onCheckedChange={(checked) => setPlan({...plan, is_active: checked})}
            />
            <Label htmlFor={`${plan?.id || 'new'}-is_active`}>Plan is active</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id={`${plan?.id || 'new'}-is_premium_plan`}
              checked={plan.is_premium_plan}
              onCheckedChange={(checked) => setPlan({...plan, is_premium_plan: checked})}
            />
            <Label htmlFor={`${plan?.id || 'new'}-is_premium_plan`}>
              This is the premium plan (free trial users get these features)
            </Label>
          </div>
        </div>
      </div>
    );
  };

  const createDefaultPlans = async () => {
    const defaultPlans = [
      {
        name: "Basic",
        price: 1.99,
        currency: "GBP",
        features: ["GROCERY_PASTE_LIST", "GROCERY_SAVE_LISTS", "FAVORITES_SAVE_ITEMS", "FOOD_BROWSE_RESTAURANTS"],
        is_active: true,
        is_premium_plan: false, // Default plans also get this field
      },
      {
        name: "Enhanced Shopper",
        price: 4.99,
        currency: "GBP",
        features: [
            "GROCERY_PASTE_LIST", "GROCERY_SAVE_LISTS", "FAVORITES_SAVE_ITEMS", "FOOD_BROWSE_RESTAURANTS", // Basic
            "GROCERY_PRICE_HISTORY", "FAVORITES_PRICE_ALERTS", "AI_MEAL_PLANNER", "COUPON_ENGINE",
            "SCAN_RECEIPT", "LIMIT_UNLIMITED_LISTS"
        ],
        is_active: true,
        is_premium_plan: false, // Default plans also get this field
      },
      {
        name: "Expert Shopper",
        price: 9.99,
        currency: "GBP",
        features: ALL_FEATURES.flatMap(g => g.features).map(f => f.id), // All features
        is_active: true,
        is_premium_plan: true, // This is the premium plan
      }
    ];

    try {
      for (const plan of defaultPlans) {
        await SubscriptionPlan.create(plan);
      }
      setSuccessMessage('Default plans created successfully! Expert Shopper is set as the premium plan for free trials.');
      await loadPlans();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error creating default plans:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Plan Management</h1>
                  <p className="text-sm text-gray-500">Create and manage subscription plans</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {plans.length === 0 && (
                <Button variant="outline" onClick={createDefaultPlans} className="border-amber-200 hover:bg-amber-50">
                  <Star className="w-4 h-4 mr-2" />
                  Create Default Plans
                </Button>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Subscription Plan</DialogTitle>
                  </DialogHeader>
                  <PlanForm plan={newPlan} setPlan={setNewPlan} />
                  <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetNewPlan(); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePlan} disabled={!newPlan.name.trim() || newPlan.price < 0}>
                        Create Plan
                      </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="shadow-lg border-0 relative flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {plan.name}
                        {plan.is_premium_plan && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium Plan
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        £{plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {plan.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:border-red-200"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-3">
                    {plan.features?.map((featureId, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{featureIdMap[featureId] || featureId}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Premium Plan (for trials)</Label>
                      <Switch
                        checked={plan.is_premium_plan}
                        onCheckedChange={(checked) => handlePremiumPlanToggle(plan.id, checked)}
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Free trial users get access to features in the premium plan
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    {!plan.stripe_price_id ? (
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-bold p-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-md">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        <span>Price will be created automatically at checkout.</span>
                      </div>
                    ) : plan.stripe_price_id.startsWith('price_') ? (
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">
                          Stripe ID: <code className="font-mono bg-gray-200 text-gray-700 px-1 py-0.5 rounded">{plan.stripe_price_id}</code>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-red-700 font-bold p-2 bg-red-50 border-2 border-dashed border-red-200 rounded-md">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Invalid Price ID format. Must start with 'price_'.</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-16">
              <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscription plans yet</h3>
              <p className="text-gray-500 mb-6">Create your first subscription plan to start monetizing your app</p>
              <div className="flex justify-center gap-4">
                <Button onClick={createDefaultPlans} className="bg-amber-600 hover:bg-amber-700">
                  <Star className="w-4 h-4 mr-2" />
                  Create Default Plans
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Plan
                </Button>
              </div>
            </div>
          )}

          {editingPlan && (
            <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Subscription Plan</DialogTitle>
                </DialogHeader>
                <PlanForm plan={editingPlan} setPlan={setEditingPlan} />
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setEditingPlan(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePlan}>
                    Update Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
