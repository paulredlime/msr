
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShoppingList } from "@/api/entities";
import { User } from "@/api/entities"; // Keep User import for potential future use or if other components rely on its presence
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Tabs are still imported, but not used in the final JSX structure of the page, potentially for future reintroduction or other components.
import { createPageUrl } from "@/utils";
import AutoFillBasketButton from "@/components/AutoFillBasketButton"; // Add this import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Added for modal

import {
  ArrowLeft,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Crown,
  ExternalLink,
  RefreshCw,
  Loader2,
  XCircle,
  Check, // Used for badges or indicators
  AlertCircle, // Added missing icon
  ArrowRight, // Added for navigation buttons
  TrendingDown, // Added for savings indicator
  Info, // Added for general information alerts
  ShoppingBasket, // Added for basket icon
  Flame, // Added for potential future use
  BarChart3 // Added for potential future use
} from "lucide-react";
import Confetti from "@/components/Confetti";

const supermarketLogos = {
  tesco: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6102_image.png",
  asda: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png",
  sainsburys: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png",
  morrisons: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png",
  aldi: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png",
  lidl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png",
  coop: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png",
  waitrose: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png",
  iceland: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png",
  ocado: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ae15bfc78_image.png"
};

const renderPrice = (price) => `£${(price || 0).toFixed(2)}`;

export default function ComparisonResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Added from outline, though not used here directly
  const [list, setList] = useState(null); // Renamed from shoppingList
  const [comparisonResults, setComparisonResults] = useState(null); // Keep for raw backend response and total parsed items count
  const [comparing, setComparing] = useState(true); // Initialized to true as per outline
  const [allowSubstitutions, setAllowSubstitutions] = useState(true); // Initialized to true as per outline
  const [error, setError] = useState(null);
  // New state for structured results
  const [originalBasket, setOriginalBasket] = useState(null);
  const [comparisonBaskets, setComparisonBaskets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false); // New state for confetti
  const [showInfoModal, setShowInfoModal] = useState(false); // New state for modal
  const [modalContent, setModalContent] = useState({ title: '', description: '' }); // New state for modal content

  const runComparison = useCallback(async (pastedList, useSubstitutions, sourceSupermarket = null) => {
    setComparing(true);
    setError(null);
    setOriginalBasket(null);
    setComparisonBaskets([]);
    setSummary(null);

    try {
      // Replaced DataClient with a direct fetch call to the comparison endpoint
      const response = await fetch("https://eov213rrft8rpja.m.pipedream.net/groceries/compare", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedList: pastedList,
          allowSubstitutions: useSubstitutions,
          sourceSupermarket: sourceSupermarket
        })
      });

      if (!response.ok) {
        throw new Error(`Comparison service failed with status ${response.status}`);
      }

      const results = await response.json();

      const storeResultsArray = Object.values(results.store_results || {});

      // Smartly find original basket subtotal from pasted list text
      const priceRegex = /(?:total|price|£)\s*(\d+\.?\d*)/i;
      const match = pastedList.match(priceRegex);
      const parsedSubtotal = match ? parseFloat(match[1]) : null;

      if (sourceSupermarket) {
        // Identify the original basket if a source supermarket is detected
        const original = storeResultsArray.find(r => r.store_id.toLowerCase() === sourceSupermarket.toLowerCase());
        if (original) {
          original.subtotal = parsedSubtotal ?? original.subtotal; // Use parsed price if available
          setOriginalBasket(original);
        }
        // Filter out the original store from comparison results if it's there
        const comparisons = storeResultsArray
          .filter(r => r.store_id.toLowerCase() !== sourceSupermarket.toLowerCase() && r.comparable_subtotal > 0)
          .sort((a, b) => a.comparable_subtotal - b.comparable_subtotal);
        setComparisonBaskets(comparisons);
      } else {
        // If no source supermarket, all stores are comparison baskets, sorted by price
        const allSorted = storeResultsArray
          .filter(r => r.comparable_subtotal > 0)
          .sort((a, b) => a.comparable_subtotal - b.comparable_subtotal);

        if (allSorted.length > 0) {
          const original = allSorted.shift(); // Assume first is original for now without source
          original.subtotal = parsedSubtotal ?? original.subtotal; // Use parsed price
          setOriginalBasket(original);
          setComparisonBaskets(allSorted); // The rest are comparison baskets
        }
      }

      setComparisonResults(results); // Store raw results for general info like parsed_items count
      setSummary(results.summary);

    } catch (err) {
      console.error('Comparison error:', err);
      setError(`Comparison failed: ${err.message || 'Unknown error'}`);
    }
    setComparing(false);
  }, []); // Dependencies for runComparison: State setters (setComparing, setError, etc.) are stable by React, so an empty array is appropriate if no other external values are used.

  const loadData = useCallback(async () => {
    setComparing(true);
    setError(null);
    setList(null);
    setComparisonResults(null);
    setOriginalBasket(null);
    setComparisonBaskets([]);
    setSummary(null);

    try {
      const urlParams = new URLSearchParams(location.search);
      const listId = urlParams.get('id');

      if (listId) {
        // Fetch the shopping list from the database
        const fetchedLists = await ShoppingList.filter({ id: listId });
        if (fetchedLists.length > 0) {
          const currentList = fetchedLists[0];
          setList(currentList); // Renamed from setShoppingList
          // Pass source_supermarket from the list for auto-detection
          await runComparison(currentList.original_text, allowSubstitutions, currentList.source_supermarket);
        } else {
          setError("Shopping list not found.");
        }
      } else {
        setError("No shopping list ID provided in URL.");
      }
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError(`Failed to load shopping list data: ${err.message || 'An unknown error occurred.'}`);
    }
    setComparing(false); // Changed from setLoading to setComparing
  }, [location.search, allowSubstitutions, runComparison]); // Dependencies for loadData

  useEffect(() => {
    loadData();
  }, [loadData]); // useEffect depends on the memoized loadData

  const handleRefresh = async () => {
    if (list) { // Renamed from shoppingList
      await runComparison(list.original_text, allowSubstitutions, list.source_supermarket); // Renamed from shoppingList
    }
  };

  const handleSubstitutionsToggle = async (checked) => {
    setAllowSubstitutions(checked);
    if (list) { // Renamed from shoppingList
      await runComparison(list.original_text, checked, list.source_supermarket); // Renamed from shoppingList
    }
  };

  const handleAddToBasket = async (storeResult) => {
    const currentSavings = originalBasket && storeResult.comparable_subtotal < originalBasket.subtotal
      ? originalBasket.subtotal - storeResult.comparable_subtotal
      : 0;

    try {
      // Mark the shopping list as completed
      if (list && list.id) {
        await ShoppingList.update(list.id, { status: "completed" });
        setList(prev => ({ ...prev, status: "completed" })); // Optimistically update UI
      }

      // Update User Stats
      const currentUser = await User.me();
      if (currentUser) {
        const updatedData = {
          total_shops_completed: (currentUser.total_shops_completed || 0) + 1,
          total_savings: (currentUser.total_savings || 0) + currentSavings,
        };
        await User.updateMyUserData(updatedData);
      }
    } catch (error) {
      console.error("Failed to update user stats or shopping list status:", error);
      // Depending on importance, could set an error state here, but not critical for user flow.
    }

    if (currentSavings > 0) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        window.open(storeResult.store_url, '_blank', 'noopener,noreferrer');
      }, 4000); // Confetti duration
    } else {
      window.open(storeResult.store_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Derived state for all sorted comparisons, including original if desired, but here it's for all *comparison* stores
  const sortedComparisons = useMemo(() => {
    if (!comparisonResults || !comparisonResults.store_results) return [];
    const allStores = Object.values(comparisonResults.store_results);
    return allStores
      .filter(s => s.comparable_subtotal > 0 && s.store_id.toLowerCase() !== originalBasket?.store_id.toLowerCase()) // Filter out original and invalid subtotals
      .sort((a, b) => a.comparable_subtotal - b.comparable_subtotal)
      .map(s => ({
        id: s.store_id,
        name: s.store_name,
        logo: supermarketLogos[s.store_id.toLowerCase()],
        subtotal: s.comparable_subtotal,
        url: s.store_url,
        matchedItems: s.matched_items, // Assuming backend provides this array of matched product objects
        savings: (originalBasket && originalBasket.subtotal) ? originalBasket.subtotal - s.comparable_subtotal : 0
      }));
  }, [comparisonResults, originalBasket]);

  if (comparing && !comparisonResults) { // Use comparing and check if results are null, not loading
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <span className="ml-3 text-lg font-medium text-teal-700">Running your comparison...</span>
      </div>
    );
  }

  const bestDeal = comparisonBaskets[0]; // The cheapest among comparison baskets
  const savings = originalBasket && bestDeal ? originalBasket.subtotal - bestDeal.comparable_subtotal : 0;


  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      {showConfetti && <Confetti />}
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("ShoppingLists"))} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lists
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{list?.name || "Comparison Results"}</h1> {/* Renamed from shoppingList */}
              <p className="text-gray-500 mt-1">
                {comparisonResults?.parsed_items?.length || 0} items analyzed. Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="substitutions-switch"
                  checked={allowSubstitutions}
                  onCheckedChange={handleSubstitutionsToggle}
                  disabled={comparing}
                />
                <Label htmlFor="substitutions-switch">Allow substitutions</Label>
              </div>
              <Button onClick={handleRefresh} disabled={comparing} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${comparing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary and Original Basket */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-blue-600" /> Your Shopping Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Items Analyzed</p>
                  <p className="text-4xl font-bold text-gray-900">{comparisonResults?.parsed_items?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Potential Savings</p>
                  <p className="text-4xl font-bold text-green-600">
                    {renderPrice(savings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {originalBasket && (
            <Card className="shadow-lg border-2 border-gray-300 bg-gray-50 p-6">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center gap-3">
                  {supermarketLogos[originalBasket.store_id.toLowerCase()] && (
                    <img src={supermarketLogos[originalBasket.store_id.toLowerCase()]} alt={originalBasket.store_name} className="h-8 w-auto" />
                  )}
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Your Original Basket</CardTitle>
                    <CardDescription>From {originalBasket.store_name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 text-center">
                <p className="text-5xl font-bold text-gray-800">{renderPrice(originalBasket.subtotal)}</p>
                <p className="text-sm text-gray-600 mt-1">{originalBasket.matched_count} / {originalBasket.total_items} items matched</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Best Deal */}
        {bestDeal && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Your Best Deal</h2>
            <Card className="shadow-2xl border-2 border-green-400 bg-gradient-to-r from-green-50 to-teal-50 p-6">
              <CardContent className="p-0 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  {supermarketLogos[bestDeal.store_id.toLowerCase()] && (
                    <img src={supermarketLogos[bestDeal.store_id.toLowerCase()]} alt={bestDeal.store_name} className="h-16 w-auto" />
                  )}
                  <div>
                    <CardTitle className="text-3xl font-bold text-green-800 capitalize">{bestDeal.store_name}</CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                      You could get these groceries for:
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-green-700">{renderPrice(bestDeal.comparable_subtotal)}</p>
                    {savings > 0 && (
                      <Badge className="mt-2 bg-green-600 hover:bg-green-700 text-base">
                        <TrendingDown className="w-4 h-4 mr-2" /> You save {renderPrice(savings)}!
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-lg py-6 px-8"
                    onClick={() => handleAddToBasket(bestDeal)}
                  >
                    Add to Basket & Save {renderPrice(savings)}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Comparisons */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Other Options</h2>
          {comparisonBaskets.slice(1).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisonBaskets.slice(1).map(result => (
                <Card key={result.store_id} className="shadow-lg border-0 bg-white p-4">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center gap-3">
                      {supermarketLogos[result.store_id.toLowerCase()] && (
                        <img src={supermarketLogos[result.store_id.toLowerCase()]} alt={result.store_name} className="h-8 w-auto" />
                      )}
                      <h3 className="text-xl font-bold capitalize">{result.store_name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500">Basket Total</span>
                      <span className="text-2xl font-bold text-gray-800">{renderPrice(result.comparable_subtotal)}</span>
                    </div>
                    {bestDeal && (result.comparable_subtotal - bestDeal.comparable_subtotal) > 0.01 && (
                      <div className="text-sm text-red-600 font-medium mb-4">
                        + {renderPrice(result.comparable_subtotal - bestDeal.comparable_subtotal)} vs best deal
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAddToBasket(result)}
                    >
                      Add to Basket
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-800">
                No other comparable stores found for your list beyond the best deal.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {summary && summary.stores_compared && summary.stores_compared.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">All Comparison Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedComparisons.map((comparison, index) => {
                const isAsdaUnder40 = comparison.id === 'asda' && comparison.subtotal < 40;
                const finalTotal = isAsdaUnder40 ? comparison.subtotal + 5 : comparison.subtotal;

                return (
                  <Card key={comparison.id} className={`flex flex-col ${index === 0 ? 'border-2 border-teal-500 bg-teal-50/50' : 'bg-white'}`}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        {comparison.logo && (
                          <img src={comparison.logo} alt={comparison.name} className="h-8 w-auto object-contain" />
                        )}
                        <CardTitle className="text-lg capitalize">{comparison.name}</CardTitle>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-teal-600 text-white">Best Value</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-gray-600 mb-2">{comparison.matchedItems?.length || 0} items matched</p>
                      {isAsdaUnder40 && (
                        <Alert variant="destructive" className="mt-4 text-xs p-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Includes £5.00 ASDA basket fee for orders under £40.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch p-4 bg-gray-50/50 mt-auto">
                      <div className="text-center mb-4">
                        <span className="text-xs text-gray-500">Total Price</span>
                        <p className="text-3xl font-bold">£{finalTotal.toFixed(2)}</p>
                        {comparison.savings > 0 && (
                          <Badge className="bg-green-100 text-green-800">Save £{comparison.savings.toFixed(2)}</Badge>
                        )}
                      </div>
                      <AutoFillBasketButton
                        comparison={{ ...comparison, subtotal: finalTotal, hasBasketFee: isAsdaUnder40 }}
                        items={comparison.matchedItems || []} // Pass matchedItems for this specific store
                        onComplete={(result) => {
                          setModalContent({
                            title: result.autoRegistered ? "Account Created & Basket Filled! 🎉" : "Basket Filled! 🛒",
                            description: `${result.autoRegistered ? `We've registered you with ${result.store} and ` : ''}Added ${result.itemsAdded} items to your basket. Total: £${result.total.toFixed(2)}`
                          });
                          setShowInfoModal(true);
                        }}
                      />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Fallback for no comparison results after loading */}
      {!comparing && !comparisonResults && (
        <Card className="text-center py-12 mt-8">
          <CardContent>
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No comparison results available</h3>
            <p className="text-gray-600 mb-4">
              We couldn't generate results for your shopping list. This might be due to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 max-w-sm mx-auto text-left">
              <li>An empty or unrecognized shopping list.</li>
              <li>No products matching your items across all stores.</li>
              <li>Temporary issues with the comparison service.</li>
            </ul>
            <Button onClick={() => list && handleRefresh()}> {/* Renamed from shoppingList */}
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Modal for AutoFillBasketButton completion */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalContent.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {modalContent.description}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowInfoModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
