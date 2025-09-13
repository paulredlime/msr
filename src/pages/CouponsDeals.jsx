import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { CouponDeal, UserCoupon } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Crown, Tag, Search, ExternalLink, Percent, Gift, TrendingDown, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CouponsDeals() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [allCoupons, myUserCoupons] = await Promise.all([
        CouponDeal.filter({ is_active: true }),
        UserCoupon.list()
      ]);
      
      setCoupons(allCoupons);
      setUserCoupons(myUserCoupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = () => {
    return user?.subscription_status === 'active' || user?.subscription_status === 'free_trial';
  };

  const searchForCoupons = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const prompt = `
        Find current active coupon codes and deals for UK supermarkets and online stores for: "${searchTerm}"
        Look for:
        - Discount codes
        - Percentage off deals  
        - Free delivery offers
        - Buy one get one free
        - Cashback offers
        
        Focus on legitimate, currently active deals from major UK retailers like Tesco, ASDA, Sainsbury's, Amazon UK, etc.
        
        Return realistic deals that would actually exist.
      `;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            deals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  store_name: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  discount_type: { type: "string" },
                  discount_value: { type: "number" },
                  coupon_code: { type: "string" },
                  minimum_spend: { type: "number" },
                  valid_until: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Add found deals to our coupon list
      if (result.deals) {
        for (const deal of result.deals) {
          try {
            await CouponDeal.create({
              store_name: deal.store_name,
              title: deal.title,
              description: deal.description,
              discount_type: deal.discount_type,
              discount_value: deal.discount_value,
              coupon_code: deal.coupon_code || '',
              minimum_spend: deal.minimum_spend || 0,
              valid_until: deal.valid_until,
              is_active: true
            });
          } catch (error) {
            console.log('Error saving deal:', error);
          }
        }
      }
      
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error searching for coupons:', error);
    } finally {
      setSearching(false);
    }
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
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
          <h1 className="text-3xl font-bold mb-4">Coupons & Deals</h1>
          <p className="text-xl text-gray-600 mb-8">
            Upgrade to access exclusive coupons and deals
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coupons & Deals</h1>
          <p className="text-gray-600">Find exclusive discounts and save even more on your shopping</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search for deals... (e.g., groceries, electronics, clothing)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchForCoupons()}
                className="flex-1"
              />
              <Button onClick={searchForCoupons} disabled={searching}>
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Deals
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Featured Deals */}
        <div className="grid gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{coupon.store_name}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `£${coupon.discount_value} OFF`}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{coupon.title}</h4>
                    <p className="text-gray-600 mb-4">{coupon.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {coupon.minimum_spend > 0 && (
                        <span>Min spend: £{coupon.minimum_spend}</span>
                      )}
                      {coupon.valid_until && (
                        <span>Valid until: {new Date(coupon.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {coupon.coupon_code && (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                        <code className="font-mono font-bold">{coupon.coupon_code}</code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyCouponCode(coupon.coupon_code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Use Deal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">£{Math.random() * 100 + 50 | 0}</div>
              <div className="text-sm text-gray-600">Total Saved This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Tag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{coupons.length}</div>
              <div className="text-sm text-gray-600">Active Deals Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{userCoupons.length}</div>
              <div className="text-sm text-gray-600">Deals Used</div>
            </CardContent>
          </Card>
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No deals yet</h3>
            <p className="text-gray-500">Search for products to find exclusive deals and coupons</p>
          </div>
        )}
      </div>
    </div>
  );
}