import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { Coupon } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Gift, 
  Plus, 
  Edit, 
  Trash2,
  Tag,
  Calendar,
  Percent
} from "lucide-react";

export default function CouponManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    is_active: true,
    expires_at: null,
    max_uses: null,
    times_used: 0
  });

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
      await loadCoupons();
    } catch (error) {
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  };

  const loadCoupons = async () => {
    try {
      const allCoupons = await Coupon.list('-created_date');
      setCoupons(allCoupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const handleSaveCoupon = async () => {
    const couponData = editingCoupon || newCoupon;

    // Basic validation
    if (!couponData.code.trim() || !couponData.discount_value) {
        alert("Coupon code and discount value are required.");
        return;
    }
    
    // Ensure numbers are numbers
    const dataToSave = {
        ...couponData,
        code: couponData.code.toUpperCase(),
        discount_value: Number(couponData.discount_value),
        max_uses: couponData.max_uses ? Number(couponData.max_uses) : null,
    };

    try {
      if (editingCoupon) {
        await Coupon.update(editingCoupon.id, dataToSave);
        setSuccessMessage('Coupon updated successfully!');
      } else {
        await Coupon.create(dataToSave);
        setSuccessMessage('Coupon created successfully!');
      }
      setShowDialog(false);
      setEditingCoupon(null);
      resetNewCoupon();
      await loadCoupons();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await Coupon.delete(couponId);
        setSuccessMessage('Coupon deleted successfully!');
        await loadCoupons();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const resetNewCoupon = () => {
    setNewCoupon({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      is_active: true,
      expires_at: null,
      max_uses: null,
      times_used: 0
    });
  };
  
  const openEditDialog = (coupon) => {
    setEditingCoupon(coupon);
    setShowDialog(true);
  }

  const openCreateDialog = () => {
    setEditingCoupon(null);
    resetNewCoupon();
    setShowDialog(true);
  }

  const CouponForm = ({ coupon, setCoupon }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="code">Coupon Code</Label>
        <Input id="code" placeholder="e.g., WELCOME10" value={coupon.code} onChange={(e) => setCoupon({...coupon, code: e.target.value.toUpperCase()})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select value={coupon.discount_type} onValueChange={(value) => setCoupon({...coupon, discount_type: value})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="free_days">Free Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discount_value">Value</Label>
          <Input id="discount_value" type="number" placeholder={coupon.discount_type === 'percentage' ? "10" : "30"} value={coupon.discount_value || ''} onChange={(e) => setCoupon({...coupon, discount_value: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
            <Input id="expires_at" type="date" value={coupon.expires_at ? coupon.expires_at.split('T')[0] : ''} onChange={(e) => setCoupon({...coupon, expires_at: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="max_uses">Max Uses (Optional)</Label>
            <Input id="max_uses" type="number" placeholder="e.g., 100" value={coupon.max_uses || ''} onChange={(e) => setCoupon({...coupon, max_uses: e.target.value})} />
          </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is_active" checked={coupon.is_active} onCheckedChange={(checked) => setCoupon({...coupon, is_active: checked})} />
        <Label htmlFor="is_active">Coupon is active</Label>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(createPageUrl("AdminDashboard"))}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Coupon Management</h1>
                  <p className="text-sm text-gray-500">Create and manage discounts</p>
                </div>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Create Coupon
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Coupons ({coupons.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{coupon.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? <Percent className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                          <span>
                            {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' free days'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.times_used} / {coupon.max_uses || '∞'}
                      </TableCell>
                      <TableCell>
                        {coupon.is_active ? 
                          <Badge className="bg-green-100 text-green-800">Active</Badge> : 
                          <Badge variant="secondary">Inactive</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
          </DialogHeader>
          <CouponForm coupon={editingCoupon || newCoupon} setCoupon={editingCoupon ? setEditingCoupon : setNewCoupon} />
          <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCoupon}>Save Coupon</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}