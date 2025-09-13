
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ScannedProduct } from "@/api/entities";
import { ScannedPrice } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Barcode, PoundSterling, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Check, Edit, X } from "lucide-react";


export default function AdminScannedProducts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [editingProduct, setEditingProduct] = useState({ id: null, brand: '' });

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        await loadData();
      } catch (error) {
        console.error('Authentication error:', error);
        navigate(createPageUrl("SuperAdmin"));
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const allProducts = await ScannedProduct.list('-created_date');
      const allPrices = await ScannedPrice.list();

      const combinedData = allProducts.map(product => {
        const prices = allPrices.filter(price => price.scanned_product_id === product.id)
                                .sort((a, b) => a.price - b.price); // Sort by price ascending
        
        const availablePrices = prices.filter(p => p.available);
        const cheapestPrice = availablePrices.length > 0 ? availablePrices[0] : null;
        const totalStores = prices.length;
        const availableStores = availablePrices.length;
        
        return { 
          ...product, 
          prices, 
          cheapestPrice,
          totalStores,
          availableStores
        };
      });
      
      setProducts(combinedData);
    } catch (error) {
      console.error("Failed to load scanned products data:", error);
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

  const handleUpdateBrand = async () => {
    if (!editingProduct.id || editingProduct.brand === null) {
        console.warn("Attempted to update brand with invalid data:", editingProduct);
        return;
    }
    try {
      await ScannedProduct.update(editingProduct.id, { brand: editingProduct.brand });
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, brand: editingProduct.brand } : p
      ));
      setEditingProduct({ id: null, brand: '' });
    } catch (error) {
      console.error("Failed to update brand:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Scanned Products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Scanned Products Database</h1>
                  <p className="text-sm text-gray-500">User-generated product and price information ({products.length} products)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Scanned Yet</h3>
              <p className="text-gray-500">User-scanned products will appear here once they are added.</p>
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
                          <div className="flex items-center gap-4">
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
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {editingProduct.id === product.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      value={editingProduct.brand}
                                      onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                                      className="h-8"
                                      autoFocus
                                    />
                                    <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={handleUpdateBrand}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingProduct({id: null, brand: ''})}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <span>{product.brand || "Unknown Brand"}</span>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                      onClick={() => setEditingProduct({ id: product.id, brand: product.brand })}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                {product.size && ` • ${product.size}`}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <Barcode className="w-3 h-3 mr-1" />
                                  {product.barcode}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {product.category}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Best Price */}
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Best Price</div>
                              {product.cheapestPrice ? (
                                <>
                                  <div className="text-xl font-bold text-green-600">
                                    £{product.cheapestPrice.price.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    at {product.cheapestPrice.store_name}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">Not available</div>
                              )}
                            </div>

                            {/* Store Count */}
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Availability</div>
                              <div className="text-lg font-semibold">
                                {product.availableStores}/{product.totalStores}
                              </div>
                              <div className="text-sm text-gray-600">stores</div>
                            </div>

                            {/* Scan Date */}
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Scanned</div>
                              <div className="text-sm font-medium">
                                {new Date(product.created_date).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Expand Icon */}
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
                          <h4 className="font-semibold mb-3 text-gray-800">Full Price Comparison:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Supermarket</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-center">Available</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {product.prices.length > 0 ? product.prices.map((price, index) => (
                                <TableRow key={price.id} className={index === 0 && price.available ? "bg-green-50" : ""}>
                                  <TableCell className="font-medium">
                                    {price.store_name}
                                    {index === 0 && price.available && (
                                      <Badge variant="outline" className="ml-2 text-xs text-green-700 border-green-200">
                                        Cheapest
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    £{price.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {price.available ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-500">
                                    {price.promotion_text || "—"}
                                  </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan="4" className="text-center text-gray-500">
                                    No price data was recorded for this scan.
                                  </TableCell>
                                </TableRow>
                              )}
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
