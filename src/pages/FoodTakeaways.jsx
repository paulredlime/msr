
import React, { useState, useEffect } from "react";
import { TakeawayOrder } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  UtensilsCrossed,
  Plus,
  Trash2,
  CheckCircle,
  PlayCircle,
  Download,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/Confetti"; // New import
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // New import

const deliveryServices = [
  { 
    name: 'Uber Eats', 
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd90136a7_image.png'
  },
  { 
    name: 'Just Eat', 
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6d1b0ead6_image.png'
  },
  { 
    name: 'Deliveroo', 
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/234d89b82_image.png'
  },
];

const deliveryUrls = {
  'Uber Eats': 'https://www.ubereats.com/',
  'Just Eat': 'https://www.just-eat.co.uk/',
  'Deliveroo': 'https://deliveroo.co.uk/'
};

const popularRestaurants = ["McDonald's", "KFC", "Pizza Hut", "Domino's Pizza", "Burger King", "Subway"];

export default function FoodTakeaways() {
  const [orders, setOrders] = useState([]);
  const [historicalOrders, setHistoricalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("my-comparisons");
  const [showInfoModal, setShowInfoModal] = useState(false); // New state for info modal
  const [modalContent, setModalContent] = useState({ title: '', description: '' }); // New state for modal content
  const [showConfetti, setShowConfetti] = useState(false); // New state for confetti

  const [newOrder, setNewOrder] = useState({
    restaurant_name: "",
    order_text: ""
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await TakeawayOrder.list('-created_date');
      setOrders(data);
    } catch (error) {
      console.error('Error loading takeaway orders:', error);
    }
    setLoading(false);
  };
  
  const handleCreateOrder = async () => {
    if (!newOrder.restaurant_name.trim() || !newOrder.order_text.trim()) return;
    setProcessing(true);
    try {
      const createdOrder = await TakeawayOrder.create(newOrder);
      setOrders(prev => [createdOrder, ...prev]);
      setShowCreateDialog(false);
      setNewOrder({ restaurant_name: "", order_text: "" });
      await runComparison(createdOrder);
      await loadOrders(); // Refresh to get the updated status and results
    } catch (error) {
      console.error('Error creating order:', error);
    }
    setProcessing(false);
  };
  
  const runComparison = async (order) => {
    setProcessing(true);
    await TakeawayOrder.update(order.id, { status: 'comparing' });
    setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: 'comparing' } : o));

    const prompt = `
    You are a UK food delivery price simulation engine.
    A user wants to order the following from "${order.restaurant_name}":
    ${order.order_text}

    Simulate the final price on Uber Eats, Just Eat, and Deliveroo.
    Provide realistic UK prices considering:
    - Base food cost (should be consistent across platforms).
    - Delivery Fee (Deliveroo often higher, Just Eat can be lower).
    - Service Fee (Uber Eats and Deliveroo have variable service fees, Just Eat often doesn't).
    - Special Offers (e.g., "10% off on orders over £20" - apply creatively to one platform).

    Return a list of JSON objects, one for each service (Uber Eats, Just Eat, Deliveroo), with:
    - platform: The name of the delivery service.
    - total_price: The final, all-inclusive price in GBP.
    - breakdown: A short string explaining the costs (e.g., "£25.00 items + £3.49 delivery + £2.80 service fee").
    `;
    try {
      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            prices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  total_price: { type: "number" },
                  breakdown: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Calculate savings: savings for a platform is the difference between the max price and its price.
      const prices = result.prices || [];
      const maxPrice = prices.length > 0 ? Math.max(...prices.map(p => p.total_price)) : 0;
      
      const comparisonResultsWithSavings = prices
        .map(p => ({
          ...p,
          savings: maxPrice > 0 ? Math.max(0, maxPrice - p.total_price) : 0 // Ensure savings is non-negative
        }))
        .sort((a,b) => a.total_price - b.total_price); // Sort by total_price ascending

      await TakeawayOrder.update(order.id, { comparison_results: comparisonResultsWithSavings, status: 'completed' });
      await loadOrders();
    } catch (error) {
      console.error("Error comparing prices:", error);
      await TakeawayOrder.update(order.id, { status: 'draft' }); // Reset on error
      await loadOrders();
    }
    setProcessing(false);
  };

  const handleSelectPlatform = async (result) => {
    // Track savings
    if (result.savings > 0) {
        try {
            const currentUser = await User.me();
            const currentSavings = currentUser.total_savings || 0;
            const newTotalSavings = currentSavings + result.savings;
            await User.updateMyUserData({ total_savings: parseFloat(newTotalSavings.toFixed(2)) });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds
        } catch(e) {
            console.error("Failed to update savings:", e);
        }
    }
    
    // Redirect logic
    const platformUrl = deliveryUrls[result.platform];
    if (platformUrl) {
        window.open(platformUrl, '_blank');
    }
    setModalContent({
        title: "Great Choice!",
        description: `Redirecting you to ${result.platform} to complete your order.`
    });
    setShowInfoModal(true);
  };

  const handleFetchHistory = async () => {
    setIsFetchingHistory(true);
    setHistoricalOrders([]);
    try {
      const user = await User.me();
      const connected = user.connected_delivery_services || [];
      
      if (connected.length === 0) {
        setModalContent({
          title: "No Connected Apps",
          description: "No connected delivery apps found. Please connect your accounts in the Profile page first to import history."
        });
        setShowInfoModal(true);
        setIsFetchingHistory(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData = connected.map(serviceName => {
        const generateRealisticItems = (listIndex) => {
          const itemSets = {
            "Uber Eats": [
              [{ name: `Big Mac Meal`, quantity: 1}, { name: `6 Chicken McNuggets`, quantity: 1}],
              [{ name: `Margherita Pizza`, quantity: 1}, { name: `Garlic Bread`, quantity: 1}],
              [{ name: `Zinger Burger Meal`, quantity: 2}],
            ],
            "Just Eat": [
              [{ name: `Family Feast Bucket`, quantity: 1}],
              [{ name: `Pad Thai`, quantity: 1}, { name: `Spring Rolls`, quantity: 1}],
              [{ name: `Donner Kebab`, quantity: 2}, { name: `Chips`, quantity: 1}],
            ],
            "Deliveroo": [
              [{ name: `Pepperoni Pizza`, quantity: 2}],
              [{ name: `Chicken Katsu Curry`, quantity: 1}, { name: `Miso Soup`, quantity: 1}],
              [{ name: `Gourmet Beef Burger`, quantity: 1}, { name: `Sweet Potato Fries`, quantity: 1}],
            ]
          };
          return itemSets[serviceName][listIndex] || itemSets[serviceName][0];
        };
        
        const lists = [];
        for (let i = 0; i < 3; i++) {
          const date = new Date(Date.now() - (3 + i * 5) * 24 * 60 * 60 * 1000);
          lists.push({
            id: `${serviceName}-${i}`,
            date: date.toISOString().split('T')[0],
            items: generateRealisticItems(i),
            restaurant_name: ["McDonald's", "Pizza Hut", "KFC", "Wagamama", "Local Kebab"][Math.floor(Math.random()*5)],
            totalEstimated: (15 + Math.random() * 20).toFixed(2)
          });
        }
        return {
          id: serviceName,
          service: serviceName,
          logo: deliveryServices.find(s => s.name === serviceName)?.logo,
          orders: lists.sort((a,b) => new Date(b.date) - new Date(a.date)),
        };
      });

      setHistoricalOrders(mockData);
    } catch (error) {
      console.error("Error fetching historical orders:", error);
    }
    setIsFetchingHistory(false);
  };

  const handleRunComparisonFromHistory = async (historicalOrder) => {
    setProcessing(true);
    try {
      const orderData = {
        restaurant_name: historicalOrder.restaurant_name,
        order_text: historicalOrder.items.map(item => `${item.quantity}x ${item.name}`).join('\n'),
        status: 'draft',
      };
      
      const newOrder = await TakeawayOrder.create(orderData);
      await loadOrders(); // Refresh the orders list to show the new entry
      setActiveTab('my-comparisons'); // Switch to the main tab
      await runComparison(newOrder); // This will handle status updates
    } catch (error) {
      console.error('Error creating order from history:', error);
    }
    setProcessing(false);
  };

  const deleteOrder = async (orderId) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await TakeawayOrder.delete(orderId);
        await loadOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <AlertDialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{modalContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInfoModal(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="p-4 md:p-8 bg-gradient-to-br from-amber-50/30 to-orange-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <UtensilsCrossed className="w-8 h-8 text-amber-600" />
                Food Takeaway Comparison
              </h1>
              <p className="text-gray-600">Compare takeaway prices from your favorite restaurants</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Takeaway Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Takeaway Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Restaurant</Label>
                    <Input 
                      placeholder="e.g., McDonald's, KFC"
                      value={newOrder.restaurant_name}
                      onChange={(e) => setNewOrder({...newOrder, restaurant_name: e.target.value})}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {popularRestaurants.map(r => (
                        <Button key={r} variant="outline" size="sm" onClick={() => setNewOrder({...newOrder, restaurant_name: r})}>{r}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Your Order</Label>
                    <Textarea 
                      placeholder="e.g., 1x Big Mac Meal, 6x Chicken Nuggets, 1x McFlurry"
                      className="min-h-32"
                      value={newOrder.order_text}
                      onChange={(e) => setNewOrder({...newOrder, order_text: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700" 
                      onClick={handleCreateOrder}
                      disabled={processing}
                    >
                      {processing ? "Saving..." : "Create Order"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-comparisons">My Comparisons</TabsTrigger>
              <TabsTrigger value="import-history">Import from History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-comparisons" className="mt-6">
              <AnimatePresence>
                {orders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                  >
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{order.restaurant_name}</CardTitle>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap mt-1">{order.order_text}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Badge variant={order.status === 'completed' ? 'default' : (order.status === 'comparing' ? 'outline' : 'secondary')} className={order.status === 'comparing' ? 'text-blue-600 border-blue-400' : ''}>
                              {order.status === 'comparing' && <div className="w-2 h-2 mr-2 bg-blue-500 rounded-full animate-pulse" />}
                              {order.status}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {order.comparison_results && order.comparison_results.length > 0 ? (
                          <div>
                            <h3 className="font-semibold mb-2">Comparison Results:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {order.comparison_results.map((result, index) => (
                                <Card key={result.platform} className={`${index === 0 ? 'border-2 border-teal-500 bg-teal-50' : ''}`}>
                                  <CardContent className="p-4 text-center">
                                    <img src={deliveryServices.find(s => s.name === result.platform)?.logo} alt={result.platform} className="h-12 mx-auto mb-3 object-contain"/>
                                    
                                    <div className="flex flex-col items-center justify-between">
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">£{result.total_price.toFixed(2)}</div>
                                        {result.savings > 0 && (
                                          <Badge className="bg-green-100 text-green-800 mt-1">Save £{result.savings.toFixed(2)}</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mb-2">{result.breakdown}</p>
                                      {index === 0 && <Badge className="bg-teal-600 text-white mb-3"><CheckCircle className="w-3 h-3 mr-1"/> Best Deal</Badge>}
                                      <Button 
                                        size="sm"
                                        className="w-full mt-2 bg-gray-800 hover:bg-gray-900"
                                        onClick={() => handleSelectPlatform(result)} // Changed to handleSelectPlatform
                                      >
                                        Select & Go to App
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button onClick={() => runComparison(order)} disabled={processing || order.status === 'comparing'} className="bg-teal-600 hover:bg-teal-700">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {processing && order.status === 'comparing' ? "Comparing..." : "Compare Prices"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {orders.length === 0 && !loading && (
                <div className="text-center py-16">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No takeaway comparisons</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new order or importing from your history.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="import-history" className="mt-6">
              <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-600"/>
                    Import from Connected Apps
                  </CardTitle>
                  <CardDescription>Fetch past takeaway orders from your connected delivery service accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleFetchHistory}
                    disabled={isFetchingHistory}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isFetchingHistory ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Fetching Past Orders...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Fetch Takeaway History
                      </>
                    )}
                  </Button>
                  
                  {historicalOrders.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Orders from Connected Apps</h3>
                      <div className="space-y-6">
                        {historicalOrders.map((serviceData) => (
                          <div key={serviceData.service} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <img src={serviceData.logo} alt={serviceData.service} className="h-8 w-auto object-contain" />
                              <h3 className="font-bold text-xl text-gray-800">{serviceData.service}</h3>
                              <Badge variant="outline" className="ml-auto">{serviceData.orders.length} recent orders</Badge>
                            </div>
                            
                            <Accordion type="single" collapsible className="w-full">
                              {serviceData.orders.map((order) => (
                                <AccordionItem key={order.id} value={order.id}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full mr-4 text-left">
                                        <span className="font-medium">
                                          Order from {order.restaurant_name}
                                        </span>
                                      <div className="text-sm text-gray-500 text-right">
                                        {new Date(order.date).toLocaleDateString('en-GB')} • Est. £{order.totalEstimated}
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-4">
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {order.items.map((item, itemIndex) => (
                                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-700">{item.name}</span>
                                            <span className="text-gray-500">{item.quantity}x</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex justify-end items-center">
                                      <Button 
                                        size="sm"
                                        className="bg-teal-600 hover:bg-teal-700"
                                        onClick={() => handleRunComparisonFromHistory(order)}
                                        disabled={processing}
                                      >
                                        {processing ? "Starting..." : "Run New Comparison"}
                                      </Button>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
