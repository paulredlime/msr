import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Package, Calendar, Home, DollarSign } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function BulkCalculator() {
  const [products, setProducts] = useState([
    { size: 'Small', price: '', quantity: '', unit: 'g' },
    { size: 'Large', price: '', quantity: '', unit: 'g' }
  ]);
  const [productName, setProductName] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  const addProduct = () => {
    setProducts([...products, { size: `Option ${products.length + 1}`, price: '', quantity: '', unit: 'g' }]);
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const calculateBulkValue = async () => {
    const validProducts = products.filter(p => p.price && p.quantity);
    if (validProducts.length < 2) return;

    setCalculating(true);
    
    // Calculate unit prices and basic comparison
    const calculations = validProducts.map(product => {
      const price = parseFloat(product.price);
      const quantity = parseFloat(product.quantity);
      const unitPrice = price / quantity;
      
      return {
        ...product,
        price,
        quantity,
        unitPrice,
        totalValue: price
      };
    });

    // Find best value
    const bestValue = calculations.reduce((best, current) => 
      current.unitPrice < best.unitPrice ? current : best
    );

    // Calculate savings
    const resultsData = calculations.map(calc => {
      const savingsVsBest = calc.unitPrice - bestValue.unitPrice;
      const savingsPercentage = (savingsVsBest / bestValue.unitPrice) * 100;
      
      return {
        ...calc,
        isBestValue: calc === bestValue,
        savingsVsBest: savingsVsBest,
        savingsPercentage: Math.abs(savingsPercentage),
        recommendation: calc === bestValue ? 'Best Value' : 
                      savingsPercentage > 20 ? 'Poor Value' : 'Fair Value'
      };
    });

    setResults(resultsData);

    // Get AI insights about the product
    if (productName.trim()) {
      try {
        const prompt = `Analyze bulk buying for "${productName}". Consider: storage requirements, shelf life, usage frequency, and practical advice. Return JSON with storage_advice, shelf_life_estimate, usage_tips, and smart_recommendation.`;
        
        const insights = await InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              storage_advice: { type: "string" },
              shelf_life_estimate: { type: "string" },
              usage_tips: { type: "string" },
              smart_recommendation: { type: "string" }
            }
          }
        });
        
        setAiInsights(insights);
      } catch (error) {
        console.error('AI insights failed:', error);
      }
    }

    setCalculating(false);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Calculator className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Purchase Calculator</h1>
          <p className="text-lg text-gray-600">Smart analysis to find the best value and avoid false economies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6" />
                  Compare Product Sizes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Fairy Washing Up Liquid"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label>Size Option</Label>
                        <Input
                          placeholder="e.g., Small, Large"
                          value={product.size}
                          onChange={(e) => updateProduct(index, 'size', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Price (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2.99"
                          value={product.price}
                          onChange={(e) => updateProduct(index, 'price', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={product.unit}
                          onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                        >
                          <option value="g">grams</option>
                          <option value="ml">ml</option>
                          <option value="items">items</option>
                          <option value="kg">kg</option>
                          <option value="L">litres</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={addProduct} variant="outline" className="flex-1">
                    <Package className="w-4 h-4 mr-2" />
                    Add Another Size
                  </Button>
                  <Button 
                    onClick={calculateBulkValue} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={calculating}
                  >
                    {calculating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Best Value
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {results && (
              <>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6" />
                      Value Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={index} className={`p-4 rounded-lg border-2 ${
                          result.isBestValue ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{result.size}</h4>
                            <Badge className={result.isBestValue ? 'bg-green-600' : 
                              result.recommendation === 'Poor Value' ? 'bg-red-500' : 'bg-yellow-500'}>
                              {result.recommendation}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Price: £{result.price.toFixed(2)}</div>
                            <div>Unit Price: £{result.unitPrice.toFixed(4)}/{result.unit}</div>
                            {!result.isBestValue && (
                              <div className="text-red-600 font-medium">
                                {result.savingsPercentage > 0 ? '+' : ''}{result.savingsPercentage.toFixed(1)}% more expensive
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {aiInsights && (
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <Home className="w-6 h-6" />
                        Smart Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h5 className="font-semibold">Storage</h5>
                          <p className="text-sm text-gray-600">{aiInsights.storage_advice}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <h5 className="font-semibold">Shelf Life</h5>
                          <p className="text-sm text-gray-600">{aiInsights.shelf_life_estimate}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                        <div>
                          <h5 className="font-semibold">Usage Tips</h5>
                          <p className="text-sm text-gray-600">{aiInsights.usage_tips}</p>
                        </div>
                      </div>
                      <Alert className="bg-blue-50 border-blue-200">
                        <DollarSign className="w-4 h-4" />
                        <AlertDescription className="font-medium">
                          {aiInsights.smart_recommendation}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!results && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur text-center p-8">
                <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Calculate</h3>
                <p className="text-gray-500">Add product details and click "Calculate Best Value" to see intelligent recommendations.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}