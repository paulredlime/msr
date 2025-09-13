import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { MealPlan } from '@/api/entities';
import { ShoppingList } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UtensilsCrossed, Plus, ShoppingCart, Crown, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MealPlanner() {
  const [user, setUser] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    budget: 50,
    people_count: 2,
    dietary_preferences: '',
    cuisine_preferences: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const plans = await MealPlan.list('-created_date');
      setMealPlans(plans);
    } catch (error) {
      console.error('Error loading meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = () => {
    return user?.subscription_status === 'active' || user?.subscription_status === 'free_trial';
  };

  const generateMealPlan = async () => {
    if (!hasAccess()) return;
    
    setCreating(true);
    try {
      const dietaryPrefs = newPlan.dietary_preferences.split(',').map(s => s.trim()).filter(s => s);
      const cuisinePrefs = newPlan.cuisine_preferences.split(',').map(s => s.trim()).filter(s => s);

      const prompt = `
        Create a weekly meal plan for ${newPlan.people_count} people with a £${newPlan.budget} budget.
        Dietary preferences: ${dietaryPrefs.length ? dietaryPrefs.join(', ') : 'None'}
        Cuisine preferences: ${cuisinePrefs.length ? cuisinePrefs.join(', ') : 'Mixed'}
        
        Generate 7 days of meals (breakfast, lunch, dinner) with:
        - Recipe names that are realistic and appealing
        - Estimated cost per meal in GBP
        - Complete ingredient lists with quantities for UK supermarkets
        - Focus on budget-friendly, nutritious meals that minimize waste
        
        Make sure the total weekly cost stays within the £${newPlan.budget} budget.
      `;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  meal_type: { type: "string" },
                  recipe_name: { type: "string" },
                  estimated_cost: { type: "number" },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string" },
                        estimated_price: { type: "number" }
                      }
                    }
                  }
                }
              }
            },
            total_cost: { type: "number" },
            shopping_list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Create shopping list first
      const shoppingListText = result.shopping_list?.map(item => `${item.quantity} ${item.name}`).join('\n') || 'Generated shopping list';
      
      const shoppingList = await ShoppingList.create({
        name: `${newPlan.name} - Shopping List`,
        original_text: shoppingListText,
        items: result.shopping_list || [],
        status: 'draft'
      });

      // Create meal plan
      const mealPlan = await MealPlan.create({
        name: newPlan.name,
        budget: newPlan.budget,
        people_count: newPlan.people_count,
        dietary_preferences: dietaryPrefs,
        cuisine_preferences: cuisinePrefs,
        meals: result.meals || [],
        total_estimated_cost: result.total_cost || newPlan.budget,
        shopping_list_id: shoppingList.id,
        status: 'active'
      });

      setMealPlans([mealPlan, ...mealPlans]);
      setShowForm(false);
      setNewPlan({
        name: '',
        budget: 50,
        people_count: 2,
        dietary_preferences: '',
        cuisine_preferences: ''
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Sorry, there was an error generating your meal plan. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-4">AI Meal Planner</h1>
          <p className="text-xl text-gray-600 mb-8">
            Upgrade to access our AI meal planning feature
          </p>
          <Link to={createPageUrl('Pricing')}>
            <Button className="bg-yellow-500 hover:bg-yellow-600">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Meal Planner</h1>
            <p className="text-gray-600">Smart meal planning that fits your budget and preferences</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Meal Plan
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Create New Meal Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Meal Plan Name</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="e.g., This Week's Meals"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Weekly Budget (£)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newPlan.budget}
                    onChange={(e) => setNewPlan({...newPlan, budget: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="people">Number of People</Label>
                <Input
                  id="people"
                  type="number"
                  value={newPlan.people_count}
                  onChange={(e) => setNewPlan({...newPlan, people_count: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="dietary">Dietary Preferences (comma separated)</Label>
                <Input
                  id="dietary"
                  placeholder="vegetarian, gluten-free, low-carb"
                  value={newPlan.dietary_preferences}
                  onChange={(e) => setNewPlan({...newPlan, dietary_preferences: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="cuisine">Cuisine Preferences (comma separated)</Label>
                <Input
                  id="cuisine"
                  placeholder="Italian, Asian, British"
                  value={newPlan.cuisine_preferences}
                  onChange={(e) => setNewPlan({...newPlan, cuisine_preferences: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={generateMealPlan} disabled={creating || !newPlan.name}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      Generate Meal Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {mealPlans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-teal-600" />
                      {plan.name}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                      <span>£{plan.total_estimated_cost?.toFixed(2)} budget</span>
                      <span>{plan.people_count} people</span>
                      <span>{plan.meals?.length || 0} meals</span>
                    </div>
                  </div>
                  <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {plan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">This Week's Meals</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {plan.meals?.map((meal, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-medium">{meal.day} - {meal.meal_type}</span>
                          <span>{meal.recipe_name} (£{meal.estimated_cost?.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">Shopping List</h4>
                      {plan.shopping_list_id && (
                        <Link to={createPageUrl(`ComparisonResults?id=${plan.shopping_list_id}`)}>
                          <Button size="sm" variant="outline">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Compare Prices
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Auto-generated shopping list ready for price comparison
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mealPlans.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No meal plans yet</h3>
            <p className="text-gray-500">Create your first AI-powered meal plan to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}