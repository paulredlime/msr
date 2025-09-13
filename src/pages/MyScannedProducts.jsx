import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ScannedProduct } from "@/api/entities";
import { ScannedPrice } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Barcode, ChevronDown, ChevronUp } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, XCircle } from "lucide-react";

export default function MyScannedProducts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        await User.me();
        await loadData();
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };
    checkUserAndLoadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      // RLS automatically filters these lists to the current user
      const allProducts = await ScannedProduct.list('-created_date');
      const allPrices = await ScannedPrice.list();

      const combinedData = allProducts.map(product => {
        const prices = allPrices
          .filter(price => price.scanned_product_id === product.id)
          .sort((a, b) => a.price - b.price);
        
        const availablePrices = prices.filter(p => p.available);
        const cheapestPrice = availablePrices.length > 0 ? availablePrices[0] : null;
        
        return { 
          ...product, 
          prices, 
          cheapestPrice,
          totalStores: prices.length,
          availableStores: availablePrices.length
        };
      });
      
      setProducts(combinedData);
    } catch (error) {
      console.error("Failed to load your scanned products:", error);
    }
  };

  const toggleExpanded = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-teal-700 font-medium">Loading Your Scans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Scanned Products</h1>
                  <p className="text-sm text-gray-500">Your personal scanning history ({products.length} products)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">You Haven't Scanned Any Products Yet</h3>
              <p className="text-gray-500">Use the 'Scan Product In-Store' feature on the dashboard to start building your history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Collapsible key={product.id}>
                  <Card className="shadow-md border-0 hover:shadow-lg transition-shadow">
                    <CollapsibleTrigger 
                      className="w-full cursor-pointer"
                      onClick={() => toggleExpanded(product.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-grow">
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.product_name} 
                                className="w-16 h-16 object-contain rounded-md bg-white p-1 border"
                              />
                            )}
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {product.product_name || "Unknown Product"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {product.brand || "Unknown Brand"} 
                                {product.size && ` • ${product.size}`}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <Barcode className="w-3 h-3 mr-1" />
                                  {product.barcode}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Best Price Found</div>
                              {product.cheapestPrice ? (
                                <div className="text-xl font-bold text-green-600">
                                  £{product.cheapestPrice.price.toFixed(2)}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Not available</div>
                              )}
                            </div>
                            
                            <div className="text-gray-400">
                              {expandedProducts.has(product.id) ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 px-6 pb-6">
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 text-gray-800">Price Comparison from your scan:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Supermarket</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-center">Available</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {product.prices.map((price, index) => (
                                <TableRow key={price.id} className={index === 0 && price.available ? "bg-green-50" : ""}>
                                  <TableCell className="font-medium">{price.store_name}</TableCell>
                                  <TableCell className="text-right font-semibold">£{price.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-center">
                                    {price.available ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}