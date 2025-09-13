import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { BudgetTracker as BudgetEntity } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, PoundSterling, Plus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetTracker() {
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    budget_name: '',
    budget_amount: 200,
    period: 'monthly',
    categories: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const userBudgets = await BudgetEntity.list('-created_date');
      setBudgets(userBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = () => {
    return user?.subscription_status === 'active' || user?.subscription_status === 'free_trial';
  };

  const createBudget = async () => {
    if (!newBudget.budget_name || !newBudget.budget_amount) return;
    
    try {
      const defaultCategories = [
        { name: 'Groceries', allocated_amount: newBudget.budget_amount * 0.4, spent_amount: 0 },
        { name: 'Takeaways', allocated_amount: newBudget.budget_amount * 0.2, spent_amount: 0 },
        { name: 'Household Items', allocated_amount: newBudget.budget_amount * 0.2, spent_amount: 0 },
        { name: 'Other', allocated_amount: newBudget.budget_amount * 0.2, spent_amount: 0 }
      ];

      const budget = await BudgetEntity.create({
        ...newBudget,
        categories: defaultCategories,
        current_spent: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      setBudgets([budget, ...budgets]);
      setShowForm(false);
      setNewBudget({
        budget_name: '',
        budget_amount: 200,
        period: 'monthly',
        categories: []
      });
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-4">Budget Tracker</h1>
          <p className="text-xl text-gray-600 mb-8">
            Upgrade to access advanced budget tracking and analytics
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Tracker</h1>
            <p className="text-gray-600">Monitor your spending and stay on track with your financial goals</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-8 border-2 border-teal-200">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2 text-teal-800">
                    <Target className="w-5 h-5" />
                    Create Your Budget Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="budget_name" className="text-lg font-medium">What's this budget for?</Label>
                        <Input
                          id="budget_name"
                          value={newBudget.budget_name}
                          onChange={(e) => setNewBudget({...newBudget, budget_name: e.target.value})}
                          placeholder="e.g., Monthly Groceries, Weekly Spending"
                          className="mt-2 text-lg p-3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget_amount" className="text-lg font-medium">Monthly Budget Amount</Label>
                        <div className="relative mt-2">
                          <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="budget_amount"
                            type="number"
                            value={newBudget.budget_amount}
                            onChange={(e) => setNewBudget({...newBudget, budget_amount: parseFloat(e.target.value)})}
                            className="pl-12 text-lg p-3 text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-gray-800">We'll automatically split your budget:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">£{(newBudget.budget_amount * 0.4).toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Groceries (40%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">£{(newBudget.budget_amount * 0.2).toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Takeaways (20%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">£{(newBudget.budget_amount * 0.2).toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Household (20%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">£{(newBudget.budget_amount * 0.2).toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Other (20%)</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createBudget} disabled={!newBudget.budget_name || !newBudget.budget_amount} className="bg-teal-600 hover:bg-teal-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Budget
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6">
          {budgets.map((budget) => {
            const spentPercentage = (budget.current_spent / budget.budget_amount) * 100;
            const isOverBudget = spentPercentage > 100;
            const isNearLimit = spentPercentage > 80;

            return (
              <motion.div key={budget.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`hover:shadow-lg transition-all duration-300 ${isOverBudget ? 'border-red-300' : isNearLimit ? 'border-yellow-300' : 'border-green-300'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <PoundSterling className="w-5 h-5 text-teal-600" />
                          {budget.budget_name}
                        </CardTitle>
                        <div className="flex gap-4 text-sm text-gray-600 mt-2">
                          <span>£{budget.budget_amount} budget</span>
                          <span>{budget.period}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          £{budget.current_spent.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          of £{budget.budget_amount} spent
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Budget Progress</span>
                          <span className={spentPercentage > 100 ? 'text-red-600' : spentPercentage > 80 ? 'text-yellow-600' : 'text-green-600'}>
                            {spentPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(spentPercentage, 100)} 
                          className={`h-3 ${isOverBudget ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {budget.categories?.map((category, index) => {
                          const categoryPercentage = (category.spent_amount / category.allocated_amount) * 100;
                          const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                          
                          return (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-1">{category.name}</div>
                              <div className="text-lg font-bold">£{category.spent_amount.toFixed(0)}</div>
                              <div className="text-xs text-gray-500">of £{category.allocated_amount.toFixed(0)}</div>
                              <div className={`w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden`}>
                                <div 
                                  className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                                  style={{ width: `${Math.min(categoryPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {isOverBudget && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-red-800 font-medium">Over budget by £{(budget.current_spent - budget.budget_amount).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {isNearLimit && !isOverBudget && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <span className="text-yellow-800 font-medium">Approaching budget limit - £{(budget.budget_amount - budget.current_spent).toFixed(2)} remaining</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {budgets.length === 0 && (
          <div className="text-center py-12">
            <PoundSterling className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No budgets created yet</h3>
            <p className="text-gray-500">Create your first budget to start tracking your spending goals</p>
          </div>
        )}
      </div>
    </div>
  );
}