import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import ApiConfig from "@/components/services/ApiConfig";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  AlertTriangle,
  CheckCircle,
  Crown,
  Database,
  Settings
} from "lucide-react";

export default function AdminMatching() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("aliases");
  
  // Product Aliases State
  const [aliases, setAliases] = useState([]);
  const [newAlias, setNewAlias] = useState({ product_id: "", alias_text: "", confidence: 0.9 });
  
  // Brand Families State
  const [brandFamilies, setBrandFamilies] = useState([]);
  const [newFamily, setNewFamily] = useState({ family_name: "", brands: "" });
  
  // Manual Overrides State
  const [overrides, setOverrides] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      setUser(currentUser);
      await loadMatchingData();
    } catch (error) {
      navigate(createPageUrl("Dashboard"));
    }
    setLoading(false);
  };

  const loadMatchingData = async () => {
    try {
      // Load demo data for now
      setAliases([
        { id: 1, product_id: "123", alias_text: "hovis bread", confidence: 0.95, source: "manual" },
        { id: 2, product_id: "124", alias_text: "warburtons loaf", confidence: 0.90, source: "automatic" },
        { id: 3, product_id: "125", alias_text: "tesco bread", confidence: 0.85, source: "user_input" }
      ]);
      
      setBrandFamilies([
        { id: 1, family_name: "white bread 800g", brands: ["Tesco", "ASDA", "Sainsbury's", "Morrisons"] },
        { id: 2, family_name: "semi skimmed milk 2l", brands: ["Tesco", "ASDA", "Sainsbury's"] },
        { id: 3, family_name: "baked beans 400g", brands: ["Tesco", "ASDA", "Heinz", "Branston"] }
      ]);
      
      setOverrides([
        { 
          id: 1, 
          canonical_query: "white bread 800g", 
          store: "tesco", 
          store_sku: "SKU123", 
          product_title: "Tesco White Bread 800g",
          reason: "size_mismatch_corrected",
          created_date: "2024-01-15"
        }
      ]);
    } catch (error) {
      console.error('Error loading matching data:', error);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.product_id || !newAlias.alias_text) return;
    
    try {
      // In real implementation, call API
      const alias = {
        id: Date.now(),
        ...newAlias,
        source: "manual"
      };
      
      setAliases([...aliases, alias]);
      setNewAlias({ product_id: "", alias_text: "", confidence: 0.9 });
    } catch (error) {
      console.error('Error adding alias:', error);
    }
  };

  const handleAddBrandFamily = async () => {
    if (!newFamily.family_name || !newFamily.brands) return;
    
    try {
      const family = {
        id: Date.now(),
        family_name: newFamily.family_name,
        brands: newFamily.brands.split(',').map(b => b.trim())
      };
      
      setBrandFamilies([...brandFamilies, family]);
      setNewFamily({ family_name: "", brands: "" });
    } catch (error) {
      console.error('Error adding brand family:', error);
    }
  };

  const handleDeleteAlias = async (aliasId) => {
    if (confirm('Are you sure you want to delete this alias?')) {
      setAliases(aliases.filter(a => a.id !== aliasId));
    }
  };

  const handleDeleteFamily = async (familyId) => {
    if (confirm('Are you sure you want to delete this brand family?')) {
      setBrandFamilies(brandFamilies.filter(f => f.id !== familyId));
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    if (confirm('Are you sure you want to delete this override?')) {
      setOverrides(overrides.filter(o => o.id !== overrideId));
    }
  };

  const filteredOverrides = overrides.filter(override =>
    override.canonical_query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    override.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    override.product_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading matching data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Navigation */}
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
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Product Matching</h1>
                  <p className="text-sm text-gray-500">Manage aliases, brand families, and manual overrides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="aliases">Product Aliases</TabsTrigger>
              <TabsTrigger value="families">Brand Families</TabsTrigger>
              <TabsTrigger value="overrides">Manual Overrides</TabsTrigger>
            </TabsList>

            {/* Product Aliases Tab */}
            <TabsContent value="aliases" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Product Aliases Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-4">Add New Alias</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="product_id">Product ID</Label>
                          <Input
                            id="product_id"
                            value={newAlias.product_id}
                            onChange={(e) => setNewAlias({...newAlias, product_id: e.target.value})}
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <Label htmlFor="alias_text">Alias Text</Label>
                          <Input
                            id="alias_text"
                            value={newAlias.alias_text}
                            onChange={(e) => setNewAlias({...newAlias, alias_text: e.target.value})}
                            placeholder="hovis bread 800g"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confidence">Confidence (0-1)</Label>
                          <Input
                            id="confidence"
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={newAlias.confidence}
                            onChange={(e) => setNewAlias({...newAlias, confidence: parseFloat(e.target.value)})}
                          />
                        </div>
                        <Button onClick={handleAddAlias} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Alias
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-4">Existing Aliases</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {aliases.map((alias) => (
                          <Card key={alias.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{alias.alias_text}</div>
                                <div className="text-sm text-gray-500">
                                  Product ID: {alias.product_id}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    Confidence: {alias.confidence}
                                  </Badge>
                                  <Badge className={
                                    alias.source === 'manual' ? 'bg-blue-100 text-blue-800' :
                                    alias.source === 'automatic' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }>
                                    {alias.source}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteAlias(alias.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brand Families Tab */}
            <TabsContent value="families" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Brand Families Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-4">Add New Brand Family</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="family_name">Family Name</Label>
                          <Input
                            id="family_name"
                            value={newFamily.family_name}
                            onChange={(e) => setNewFamily({...newFamily, family_name: e.target.value})}
                            placeholder="white bread 800g"
                          />
                        </div>
                        <div>
                          <Label htmlFor="brands">Brands (comma-separated)</Label>
                          <Textarea
                            id="brands"
                            value={newFamily.brands}
                            onChange={(e) => setNewFamily({...newFamily, brands: e.target.value})}
                            placeholder="Tesco, ASDA, Sainsbury's, Morrisons"
                            className="h-24"
                          />
                        </div>
                        <Button onClick={handleAddBrandFamily} className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Brand Family
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-4">Existing Brand Families</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {brandFamilies.map((family) => (
                          <Card key={family.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{family.family_name}</div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {family.brands.map((brand, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {brand}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFamily(family.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Overrides Tab */}
            <TabsContent value="overrides" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Manual Overrides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search overrides..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Query</th>
                            <th className="text-left py-2">Store</th>
                            <th className="text-left py-2">Product</th>
                            <th className="text-left py-2">Reason</th>
                            <th className="text-left py-2">Date</th>
                            <th className="text-center py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOverrides.map((override) => (
                            <tr key={override.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 font-medium">{override.canonical_query}</td>
                              <td className="py-3 capitalize">{override.store}</td>
                              <td className="py-3">{override.product_title}</td>
                              <td className="py-3">
                                <Badge variant="outline">{override.reason}</Badge>
                              </td>
                              <td className="py-3 text-sm text-gray-500">{override.created_date}</td>
                              <td className="py-3 text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteOverride(override.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}