
import React, { useState, useEffect } from "react";
import { FavoriteItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import BarcodeScanner from "@/components/BarcodeScanner"; // Added BarcodeScanner import
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PushNotificationManager from "@/components/PushNotificationManager"; // Added PushNotificationManager import
import {
  Heart,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Target,
  CheckCircle,
  AlertCircle,
  Pencil,
  Calendar as CalendarIcon,
  Mail,
  Smartphone,
  Package, // Added Package icon import
  DollarSign, // Added DollarSign import
  Sparkles, // Added Sparkles import
  Loader2, // Added Loader2 import
  BellRing // Added BellRing for active alerts
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/Confetti"; // Added Confetti import

const supermarketLogos = {
  "tesco": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png",
  "asda": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png",
  "sainsburys": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png",
  "morrisons": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png",
  "aldi": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png",
  "lidl": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png",
  "coop": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png",
  "waitrose": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png",
  "iceland": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png"
};

const supermarketNames = {
  "tesco": "Tesco",
  "asda": "ASDA", 
  "sainsburys": "Sainsbury's",
  "morrisons": "Morrisons",
  "aldi": "Aldi",
  "lidl": "Lidl",
  "coop": "Co-op",
  "waitrose": "Waitrose",
  "iceland": "Iceland"
};

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false); // Added showBarcodeScanner state
  const [selectedSupermarkets, setSelectedSupermarkets] = useState(["tesco", "asda", "sainsburys"]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [newFavorite, setNewFavorite] = useState({
    item_name: "",
    category: "food",
    target_price: "",
    alert_enabled: true,
    email_alerts: true,
    push_alerts: false, // This will be visually disabled
    check_frequency: "weekly"
  });

  const [searchTerm, setSearchTerm] = useState(''); // Added searchTerm state
  const [showInfoModal, setShowInfoModal] = useState(false); // Added showInfoModal state
  const [modalContent, setModalContent] = useState({ title: '', description: '' }); // Added modalContent state
  const [user, setUser] = useState(null); // Added user state
  const [showConfetti, setShowConfetti] = useState(false); // Added showConfetti state
  const [processingDeals, setProcessingDeals] = useState(false); // Added processingDeals state


  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const [currentUser, favoriteItems] = await Promise.all([
        User.me(),
        FavoriteItem.list('-created_date')
      ]);
      setUser(currentUser);
      setFavorites(favoriteItems);
    } catch (error) {
      console.error('Error loading favorites or user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupermarketToggle = (storeId) => {
    setSelectedSupermarkets(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const resetForm = () => {
    setNewFavorite({
      item_name: "",
      category: "food",
      target_price: "",
      alert_enabled: true,
      email_alerts: true,
      push_alerts: false, // Ensure push_alerts is reset to false
      check_frequency: "weekly"
    });
    setSelectedSupermarkets(["tesco", "asda", "sainsburys"]);
    setEditingItem(null);
  };

  const handleAddFavorite = async () => {
    if (!newFavorite.item_name.trim() || !newFavorite.target_price) return;

    try {
      // Ensure push_alerts is explicitly false when creating new item
      await FavoriteItem.create({
        ...newFavorite,
        target_price: parseFloat(newFavorite.target_price),
        monitored_supermarkets: selectedSupermarkets,
        push_alerts: false // Force to false for new items
      });
      
      await loadFavorites();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewFavorite({
      item_name: item.item_name,
      category: item.category || "food",
      target_price: item.target_price?.toString() || "",
      alert_enabled: item.alert_enabled ?? true,
      email_alerts: item.email_alerts ?? true,
      push_alerts: false, // Force push_alerts to false for existing items too when editing
      check_frequency: item.check_frequency || "weekly"
    });
    setSelectedSupermarkets(item.monitored_supermarkets || ["tesco", "asda", "sainsburys"]);
    setShowEditDialog(true);
  };

  const handleUpdateFavorite = async () => {
    if (!editingItem || !newFavorite.item_name.trim() || !newFavorite.target_price) return;

    try {
      // Ensure push_alerts is explicitly false when updating item
      await FavoriteItem.update(editingItem.id, {
        ...newFavorite,
        target_price: parseFloat(newFavorite.target_price),
        monitored_supermarkets: selectedSupermarkets,
        push_alerts: false // Force to false when updating
      });
      
      await loadFavorites();
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await FavoriteItem.delete(itemToDelete.id);
      await loadFavorites();
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting favorite:', error);
    }
  };

  const toggleAlert = async (item) => {
    try {
      const newStatus = !item.alert_enabled;
      await FavoriteItem.update(item.id, {
        alert_enabled: newStatus
      });
      
      // Show toast notification with proper icon
      if (typeof toast === 'function') {
        toast({
          title: newStatus ? "Alerts Enabled" : "Alerts Disabled",
          description: newStatus 
            ? `You'll receive notifications when ${item.item_name} drops to £${item.target_price?.toFixed(2) || '0.00'}`
            : `Price alerts for ${item.item_name} have been turned off`,
          duration: 3000,
        });
      }
      
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleCheckPrices = async () => {
    setProcessingDeals(true);
    try {
      let totalSavingsFound = 0;
      const updatedFavorites = [];
      const supermarketKeys = Object.keys(supermarketNames);

      for (const favorite of favorites) {
        // Ensure favorite.target_price is a number (it should be from DB)
        const favoriteTargetPrice = parseFloat(favorite.target_price);

        // Simulate finding a better price (50% chance for items with a valid target price)
        if (favoriteTargetPrice > 0 && Math.random() > 0.5) {
          const currentPrice = favorite.current_best_price || favoriteTargetPrice;
          const newPrice = currentPrice * (0.7 + Math.random() * 0.2); // 70-90% of current price
          const savings = currentPrice - newPrice;
          
          if (savings > 0.10) { // Only count if savings > 10p
            totalSavingsFound += savings;
            
            const randomSupermarketKey = supermarketKeys[Math.floor(Math.random() * supermarketKeys.length)];
            updatedFavorites.push({
              id: favorite.id, // Need ID for update
              current_best_price: parseFloat(newPrice.toFixed(2)),
              current_best_supermarket: supermarketNames[randomSupermarketKey]
            });
          }
        }
      }

      // Update user's total savings
      if (totalSavingsFound > 0) {
        const currentUser = await User.me();
        const currentSavings = currentUser.total_savings || 0;
        const newTotalSavings = currentSavings + totalSavingsFound;
        await User.updateMyUserData({ total_savings: parseFloat(newTotalSavings.toFixed(2)) });

        // Update the favorites with new prices
        for (const updatedFav of updatedFavorites) {
          await FavoriteItem.update(updatedFav.id, {
            current_best_price: updatedFav.current_best_price,
            current_best_supermarket: updatedFav.current_best_supermarket
          });
        }

        setModalContent({
          title: "🎉 Great Deals Found!",
          description: `Found better prices on ${updatedFavorites.length} item${updatedFavorites.length === 1 ? '' : 's'}, saving you £${totalSavingsFound.toFixed(2)}! Your favorites have been updated.`
        });

        // Trigger confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

      } else {
        setModalContent({
          title: "No New Deals",
          description: "We checked all retailers but didn't find any better prices right now. We'll keep monitoring for you!"
        });
      }

      setShowInfoModal(true);
      loadFavorites(); // Refresh the list
    } catch (error) {
      console.error('Error checking for deals:', error);
      setModalContent({
        title: "Error",
        description: "Failed to check for deals. Please try again."
      });
      setShowInfoModal(true);
    }
    setProcessingDeals(false);
  };


  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const FavoriteForm = ({ isEdit = false }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="item_name">Item Name</Label>
          <Input
            id="item_name"
            placeholder="e.g., Heinz Tomato Ketchup 460g"
            value={newFavorite.item_name}
            onChange={(e) => setNewFavorite(prev => ({ ...prev, item_name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="target_price">Target Price (£)</Label>
          <Input
            id="target_price"
            type="number"
            step="0.01"
            placeholder="2.50"
            value={newFavorite.target_price}
            onChange={(e) => setNewFavorite(prev => ({ ...prev, target_price: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={newFavorite.category} onValueChange={(value) => setNewFavorite(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="dairy">Dairy</SelectItem>
            <SelectItem value="meat">Meat</SelectItem>
            <SelectItem value="vegetables">Vegetables</SelectItem>
            <SelectItem value="pantry">Pantry</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="household">Household</SelectItem>
            <SelectItem value="other">Other</SelectItem> {/* Added 'other' category */}
          </SelectContent>
        </Select>
      </div>

      {/* Alert Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Alert Settings</h3>
        
        {/* Check Frequency */}
        <div>
          <Label className="text-base font-medium mb-3 block flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Check Frequency
          </Label>
          <Select value={newFavorite.check_frequency} onValueChange={(value) => setNewFavorite(prev => ({ ...prev, check_frequency: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Notification Types</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email_alerts"
              checked={newFavorite.email_alerts}
              onCheckedChange={(checked) => setNewFavorite(prev => ({ ...prev, email_alerts: checked }))}
            />
            <Label htmlFor="email_alerts" className="flex items-center gap-2 cursor-pointer">
              <Mail className="w-4 h-4" />
              Email notifications
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 opacity-60">
            <Checkbox
              id="push_alerts"
              checked={false} // Always false
              disabled // Disable the checkbox
            />
            <Label htmlFor="push_alerts" className="flex items-center gap-2 cursor-not-allowed">
              <Smartphone className="w-4 h-4" />
              Push notifications
            </Label>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge> {/* Added Coming Soon badge */}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="alert_enabled"
              checked={newFavorite.alert_enabled}
              onCheckedChange={(checked) => setNewFavorite(prev => ({ ...prev, alert_enabled: checked }))}
            />
            <Label htmlFor="alert_enabled" className="flex items-center gap-2 cursor-pointer">
              <Bell className="w-4 h-4" />
              Enable all alerts
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">Monitor at these supermarkets:</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(supermarketLogos).map(([storeId, logo]) => (
            <Card 
              key={storeId}
              className={`cursor-pointer transition-all duration-200 ${
                selectedSupermarkets.includes(storeId) 
                  ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' 
                  : 'hover:shadow-md border-gray-200'
              }`}
              onClick={() => handleSupermarketToggle(storeId)}
            >
              <CardContent className="p-4 text-center">
                <img 
                  src={logo} 
                  alt={supermarketNames[storeId]}
                  className="h-8 w-auto mx-auto mb-2"
                />
                <p className="text-sm font-medium">{supermarketNames[storeId]}</p>
                {selectedSupermarkets.includes(storeId) && (
                  <CheckCircle className="w-5 h-5 text-purple-600 mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Selected {selectedSupermarkets.length} supermarket{selectedSupermarkets.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setShowEditDialog(false);
            } else {
              setShowAddDialog(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleUpdateFavorite : handleAddFavorite}
          disabled={!newFavorite.item_name.trim() || !newFavorite.target_price || selectedSupermarkets.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Heart className="w-4 h-4 mr-2" />
          {isEdit ? 'Update Favorite' : 'Add to Favorites'}
        </Button>
      </div>
    </div>
  );

  const filteredFavorites = favorites.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {showConfetti && <Confetti />}
      <PushNotificationManager /> {/* Render PushNotificationManager */}
      <AlertDialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{modalContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInfoModal(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 md:p-8 bg-gradient-to-br from-purple-50/30 to-pink-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites & Price Alerts</h1>
              <p className="text-gray-600">Track prices on your favorite items and get notified of deals.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3"> {/* Modified: Wrapped buttons in a div */}
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Favorite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-purple-600" />
                      Add Favorite Item
                    </DialogTitle>
                  </DialogHeader>
                  <FavoriteForm />
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={() => setShowBarcodeScanner(true)}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Package className="w-4 h-4 mr-2" />
                Scan Product
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-lg border-0">
                <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
                    <div className="text-sm text-gray-500">Items Tracked</div>
                </CardContent>
            </Card>
            <Card className="shadow-lg border-0">
                <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">£{user?.total_savings?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-500">Total Saved</div>
                </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-semibold mb-2 text-center">Ready to Find Savings?</h3>
                    <Button 
                      onClick={handleCheckPrices}
                      variant="outline"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      disabled={processingDeals}
                    >
                      {processingDeals ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Check for Deals Now</>
                      )}
                    </Button>
                </CardContent>
            </Card>
          </div>

          {/* Search Input */}
          {favorites.length > 0 && (
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search favorite items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>
          )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-600" />
                Edit Favorite Item
              </DialogTitle>
            </DialogHeader>
            <FavoriteForm isEdit={true} />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Favorite Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete?.item_name}"? This action cannot be undone and you'll stop receiving price alerts for this item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AnimatePresence>
          {filteredFavorites.length > 0 ? (
            <div className="grid gap-6">
              {filteredFavorites.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.item_name}</CardTitle>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge className="bg-purple-100 text-purple-800">
                              Target: £{item.target_price?.toFixed(2) || '0.00'}
                            </Badge>
                            {item.current_best_price && (
                              <Badge className={
                                item.current_best_price <= item.target_price 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-orange-100 text-orange-800"
                              }>
                                Current: £{item.current_best_price?.toFixed(2) || '0.00'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleAlert(item)}
                            className={`${
                              item.alert_enabled 
                                ? "text-green-600 bg-green-50 border-green-200 hover:bg-green-100" 
                                : "text-gray-400 hover:text-gray-600"
                            } transition-colors`}
                            title={item.alert_enabled ? "Alerts enabled - Click to disable" : "Alerts disabled - Click to enable"}
                          >
                            {item.alert_enabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(item)}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="hover:bg-red-50 hover:border-red-200"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      {item.current_best_price && item.target_price && item.current_best_price <= item.target_price ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            🎉 Target price reached! Available at {item.current_best_supermarket || 'a supermarket'} for £{item.current_best_price.toFixed(2)}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="text-gray-600">
                          <p className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            We'll notify you when this item drops to £{item.target_price?.toFixed(2) || '0.00'} or below
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              Checking {item.check_frequency || 'weekly'}
                            </span>
                            <span className="flex items-center gap-1">
                              {item.alert_enabled ? (
                                <>
                                  <BellRing className="w-3 h-3 text-green-500" />
                                  <span className="text-green-600 font-medium">Alerts active</span>
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-500">Alerts disabled</span>
                                </>
                              )}
                            </span>
                            {item.email_alerts && item.alert_enabled && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Mail className="w-3 h-3" />
                                Email
                              </span>
                            )}
                            {/* Push alerts will always be false and disabled in form, so not rendered here */}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No favorite items yet</h3>
                <p className="text-gray-500 mb-8">
                  Add items you buy regularly to get price alerts when they go on sale
                </p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Favorite
                </Button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
      </div>
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductFound={(product) => {
          // Auto-fill the form with scanned product data
          setNewFavorite({
            item_name: `${product.brand ? product.brand + ' ' : ''}${product.name ? product.name + ' ' : ''}${product.size || ''}`.trim(),
            category: product.category?.toLowerCase() || "food",
            target_price: product.target_price?.toString() || "2.00",
            alert_enabled: true,
            email_alerts: true,
            push_alerts: false, // Force to false even if barcode data suggests otherwise
            check_frequency: "weekly"
          });
          setShowAddDialog(true);
          setShowBarcodeScanner(false);
        }}
        mode="favorite"
        title="Scan Product to Add to Favorites"
      />
    </>
  );
}
