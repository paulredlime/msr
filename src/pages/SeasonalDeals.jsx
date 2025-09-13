import React, { useState, useEffect } from 'react';
import { SeasonalProduct } from '@/api/entities';
import { FavoriteItem } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sprout, Calendar, Tag, Heart, TrendingDown, MapPin, Clock, Star, ShoppingCart } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { toast } from 'sonner';

export default function SeasonalDeals() {
  const [seasonalItems, setSeasonalItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentSeason, setCurrentSeason] = useState('');
  const [seasonalTips, setSeasonalTips] = useState(null);
  const [nearbySeasons, setNearbySeasons] = useState([]);

  useEffect(() => {
    loadSeasonalData();
  }, []);

  const loadSeasonalData = async () => {
    const date = new Date();
    const monthIndex = date.getMonth() + 1;
    const monthName = date.toLocaleString('default', { month: 'long' });
    setCurrentMonth(monthName);

    // Determine season
    const seasons = {
      spring: [3, 4, 5],
      summer: [6, 7, 8], 
      autumn: [9, 10, 11],
      winter: [12, 1, 2]
    };
    
    const currentSeasonName = Object.keys(seasons).find(season => 
      seasons[season].includes(monthIndex)
    );
    setCurrentSeason(currentSeasonName);

    try {
      const [currentUser, currentItems, nextMonthItems, prevMonthItems] = await Promise.all([
        User.me(),
        SeasonalProduct.filter({ month: monthIndex }),
        SeasonalProduct.filter({ month: monthIndex === 12 ? 1 : monthIndex + 1 }),
        SeasonalProduct.filter({ month: monthIndex === 1 ? 12 : monthIndex - 1 })
      ]);
      
      setUser(currentUser);
      setSeasonalItems(currentItems);
      setNearbySeasons([...prevMonthItems, ...nextMonthItems]);

      // Get AI seasonal tips
      const prompt = `It's ${monthName} in the UK. Give seasonal shopping advice including: what's in peak season, money-saving tips, storage advice, and recipe suggestions. Return as JSON with seasonal_highlights, money_tips, storage_advice, recipe_ideas.`;
      
      try {
        const tips = await InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              seasonal_highlights: { type: "string" },
              money_tips: { type: "string" },
              storage_advice: { type: "string" },
              recipe_ideas: { type: "string" }
            }
          }
        });
        setSeasonalTips(tips);
      } catch (error) {
        console.error('AI tips failed:', error);
      }

    } catch (error) {
      console.error("Failed to fetch seasonal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (item) => {
    try {
      await FavoriteItem.create({
        item_name: item.product_name,
        category: 'seasonal',
        target_price: item.average_price,
        current_best_price: item.average_price,
        alert_enabled: true
      });
      toast.success(`${item.product_name} added to favorites!`);
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const getSeasonIcon = (season) => {
    const icons = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️'
    };
    return icons[season] || '🌱';
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{getSeasonIcon(currentSeason)}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seasonal Shopping Assistant</h1>
          <p className="text-lg text-gray-600">Discover the best seasonal produce and save money on quality ingredients</p>
        </div>

        {/* Current Season Overview */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-green-200" />
              <h3 className="text-xl font-bold">{currentMonth}</h3>
              <p className="text-green-200">Current Month</p>
            </div>
            <div className="text-center">
              <Sprout className="w-12 h-12 mx-auto mb-2 text-green-200" />
              <h3 className="text-xl font-bold capitalize">{currentSeason}</h3>
              <p className="text-green-200">Season</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 mx-auto mb-2 text-green-200" />
              <h3 className="text-xl font-bold">{seasonalItems.length}</h3>
              <p className="text-green-200">Seasonal Products</p>
            </div>
          </div>
        </div>

        {/* Seasonal Tips */}
        {seasonalTips && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <TrendingDown className="w-6 h-6" />
                  Money-Saving Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">{seasonalTips.money_tips}</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  Storage Advice
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">{seasonalTips.storage_advice}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Season Products */}
        {seasonalItems.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sprout className="w-8 h-8 text-green-600" />
              What's in Season Now - {currentMonth}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {seasonalItems.map(item => (
                <Card key={item.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur group hover:scale-[1.02]">
                  <CardHeader className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <span className="flex items-center gap-3">
                        🥬
                        {item.product_name}
                      </span>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Peak Season
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 mb-4">{item.deal_description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">£{item.average_price?.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Average Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-blue-600">{currentMonth}</div>
                        <div className="text-sm text-gray-500">Best Month</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => addToFavorites(item)}
                        variant="outline"
                        className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Add to Favorites
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to List
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Alert className="mb-8 bg-yellow-50 border-yellow-200">
            <MapPin className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              No specific seasonal highlights for {currentMonth} in our database yet. Check back soon as we're constantly adding new seasonal data!
            </AlertDescription>
          </Alert>
        )}

        {/* Coming Soon / Recently Passed */}
        {nearbySeasons.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Coming Soon & Recently Passed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbySeasons.slice(0, 8).map(item => (
                <Card key={item.id} className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">{item.product_name}</h4>
                    <Badge variant="outline" className="mb-2">
                      {new Date(2024, item.month - 1).toLocaleString('default', { month: 'long' })}
                    </Badge>
                    <div className="text-sm text-gray-600">£{item.average_price?.toFixed(2)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Recipe Ideas */}
        {seasonalTips?.recipe_ideas && (
          <Card className="mt-8 shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <Tag className="w-6 h-6" />
                Seasonal Recipe Ideas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{seasonalTips.recipe_ideas}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}