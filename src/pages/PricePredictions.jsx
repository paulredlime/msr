import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { FavoriteItem } from '@/api/entities';
import { PricePrediction } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, TrendingDown, BarChart3, AlertTriangle, CheckCircle, Clock, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PricePredictions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [predictionsList, favoritesList] = await Promise.all([
        PricePrediction.list('-created_date'),
        FavoriteItem.list()
      ]);
      
      setPredictions(predictionsList);
      setFavorites(favoritesList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = () => {
    return user?.subscription_status === 'active' || user?.subscription_status === 'free_trial';
  };

  const generatePredictions = async () => {
    if (favorites.length === 0) return;
    
    setGenerating(true);
    try {
      for (const favorite of favorites.slice(0, 5)) { // Limit to first 5 favorites
        const prompt = `
          Based on current UK market trends, seasonal patterns, and economic factors, predict the price movement for "${favorite.item_name}" currently priced at £${favorite.current_best_price || 2.50} at ${favorite.current_best_supermarket || 'supermarkets'}.
          
          Consider:
          - Seasonal demand patterns
          - Supply chain factors  
          - Historical price data
          - Current economic conditions
          - Promotional cycles
          
          Provide realistic price predictions for the next 1-2 weeks.
        `;

        const result = await InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              predicted_price: { type: "number" },
              trend: { type: "string", enum: ["increasing", "decreasing", "stable"] },
              confidence_score: { type: "number" },
              prediction_date: { type: "string" },
              recommendation: { type: "string", enum: ["buy_now", "wait", "stock_up"] },
              factors: { type: "array", items: { type: "string" } }
            }
          }
        });

        await PricePrediction.create({
          product_name: favorite.item_name,
          store_name: favorite.current_best_supermarket || 'Various Stores',
          current_price: favorite.current_best_price || 2.50,
          predicted_price: result.predicted_price,
          prediction_date: result.prediction_date,
          confidence_score: result.confidence_score,
          trend: result.trend,
          factors: result.factors || [],
          recommendation: result.recommendation
        });
      }
      
      await loadData();
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setGenerating(false);
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
          <h1 className="text-3xl font-bold mb-4">Price Predictions</h1>
          <p className="text-xl text-gray-600 mb-8">
            Upgrade to access AI-powered price predictions and smart shopping recommendations
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Predictions</h1>
            <p className="text-gray-600">AI-powered insights to help you shop smarter</p>
          </div>
          <Button 
            onClick={generatePredictions} 
            disabled={generating || favorites.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Predictions
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {predictions.filter(p => p.trend === 'decreasing').length}
              </div>
              <div className="text-sm text-gray-600">Price Drops Expected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {predictions.filter(p => p.trend === 'increasing').length}
              </div>
              <div className="text-sm text-gray-600">Price Rises Expected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {predictions.filter(p => p.recommendation === 'buy_now').length}
              </div>
              <div className="text-sm text-gray-600">Buy Now Recommendations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {predictions.filter(p => p.recommendation === 'wait').length}
              </div>
              <div className="text-sm text-gray-600">Wait for Better Price</div>
            </CardContent>
          </Card>
        </div>

        {/* Predictions List */}
        <div className="grid gap-6">
          {predictions.map((prediction) => {
            const priceChange = prediction.predicted_price - prediction.current_price;
            const percentageChange = (priceChange / prediction.current_price) * 100;
            
            return (
              <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{prediction.product_name}</h3>
                        <Badge className={
                          prediction.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                          prediction.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {prediction.trend === 'decreasing' ? 'Price Dropping' : 
                           prediction.trend === 'increasing' ? 'Price Rising' : 'Stable'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Current Price</div>
                          <div className="text-2xl font-bold">£{prediction.current_price.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Predicted Price</div>
                          <div className={`text-2xl font-bold ${priceChange < 0 ? 'text-green-600' : priceChange > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            £{prediction.predicted_price.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Expected Change</div>
                          <div className={`text-2xl font-bold ${priceChange < 0 ? 'text-green-600' : priceChange > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {priceChange >= 0 ? '+' : ''}£{priceChange.toFixed(2)} ({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            prediction.confidence_score > 0.8 ? 'bg-green-500' :
                            prediction.confidence_score > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            {Math.round(prediction.confidence_score * 100)}% Confidence
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Expected by: {new Date(prediction.prediction_date).toLocaleDateString()}
                        </div>
                      </div>

                      {prediction.factors && prediction.factors.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Key Factors:</div>
                          <div className="flex flex-wrap gap-2">
                            {prediction.factors.map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                        prediction.recommendation === 'buy_now' ? 'bg-green-100 text-green-800' :
                        prediction.recommendation === 'wait' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {prediction.recommendation === 'buy_now' && <CheckCircle className="w-4 h-4" />}
                        {prediction.recommendation === 'wait' && <Clock className="w-4 h-4" />}
                        {prediction.recommendation === 'stock_up' && <Zap className="w-4 h-4" />}
                        {prediction.recommendation === 'buy_now' ? 'Buy Now' :
                         prediction.recommendation === 'wait' ? 'Wait' : 'Stock Up'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No predictions yet</h3>
            <p className="text-gray-500 mb-4">Add some favorite items first, then generate price predictions</p>
            <Link to={createPageUrl('Favorites')}>
              <Button variant="outline">
                Manage Favorites
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}