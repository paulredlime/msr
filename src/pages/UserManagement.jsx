
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ShoppingList } from "@/api/entities"; 
import { SubscriptionPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Crown,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Calendar,
  Mail,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Clock,
  Activity,
  MapPin,
  Globe,
  ChevronLeft,
  CheckCircle,
  XCircle,
  MoreVertical,
  Star,
  Gift,
  Trash2,
  PoundSterling,
  ClipboardList // Added for "Total Lists Created" card
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const USERS_PER_PAGE = 25;

export default function UserManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [signupMethodFilter, setSignupMethodFilter] = useState("all");
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0); // This now represents the total count from the backend
  const [loadingMore, setLoadingMore] = useState(false);
  const [backendPage, setBackendPage] = useState(0);

  // New states for the subscription modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // New state for delete confirmation
  const [userToDelete, setUserToDelete] = useState(null);

  // NEW: Add states for overall stats across all users
  const [overallStats, setOverallStats] = useState({
    totalUsers: 0,
    totalLists: 0,
    totalCompletedShops: 0,
    totalSavings: 0, // NEW: Added totalSavings
    premiumUsers: 0,
    trialUsers: 0
  });

  const loadSubscriptionPlans = async () => {
    try {
      const allPlans = await SubscriptionPlan.list();
      setPlans(allPlans);
    } catch (error) {
      console.error("Failed to load subscription plans:", error);
    }
  };

  // NEW: Function to calculate overall stats across all users
  const calculateOverallStats = async () => {
    try {
      // Get ALL users to calculate real totals (assuming User.list() without limit/offset fetches all)
      const allUsers = await User.list('-created_date');
      
      const stats = {
        totalUsers: allUsers.length,
        totalLists: allUsers.reduce((sum, user) => sum + (user.total_lists_created || 0), 0),
        totalCompletedShops: allUsers.reduce((sum, user) => sum + (user.total_shops_completed || 0), 0),
        totalSavings: allUsers.reduce((sum, user) => sum + (user.total_savings || 0), 0), // NEW: Calculate total savings
        premiumUsers: allUsers.filter(u => u.subscription_status === 'active').length,
        trialUsers: allUsers.filter(u => u.subscription_status === 'free_trial').length
      };

      setOverallStats(stats);
      setTotalUsers(stats.totalUsers); // Update the totalUsers state used for loading more
    } catch (error) {
      console.error('Error calculating overall stats:', error);
    }
  };

  const fetchUsersData = async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const offset = (page - 1) * USERS_PER_PAGE;
      const allUsersBatch = await User.list('-created_date', USERS_PER_PAGE, offset);

      if (append && page > 1) {
        setUsers(prev => [...prev, ...allUsersBatch]);
      } else {
        setUsers(allUsersBatch);
      }
      
      setBackendPage(page);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // Memoize checkAdminAccess to prevent unnecessary re-renders
  const checkAdminAccess = useCallback(async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      await loadSubscriptionPlans();
      await calculateOverallStats(); // Calculate stats first
      await fetchUsersData(); // Then fetch first page of users
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  }, [navigate]);

  // Memoize filterUsers to prevent unnecessary re-renders
  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription_status === statusFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription_plan_id === planFilter);
    }

    if (signupMethodFilter !== 'all') {
      filtered = filtered.filter(user => (user.signup_method || 'google') === signupMethodFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, planFilter, signupMethodFilter]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter, signupMethodFilter]);

  const loadMoreUsers = async () => {
    const nextPage = backendPage + 1;
    await fetchUsersData(nextPage, true);
  };

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'free_trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Premium';
      case 'free_trial': return 'Free Trial';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getSignupMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'google': return '🔗 Google';
      case 'facebook': return '📘 Facebook';
      case 'email': return '📧 Email';
      default: return '🔗 Google';
    }
  };

  const getDeviceType = (user) => {
    return user.device_type || 'unknown';
  };

  const calculateMonthsWithService = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const getNextPaymentDate = (user) => {
    if (user.subscription_status !== 'active') return null;
    if (!user.subscription_end_date) return null;

    const endDate = new Date(user.subscription_end_date);
    return endDate.toLocaleDateString();
  };

  const getLastPaymentDate = (user) => {
    if (!user.subscription_start_date) return null;

    const startDate = new Date(user.subscription_start_date);
    const lastPayment = new Date(startDate);
    lastPayment.setMonth(lastPayment.getMonth() + Math.floor(calculateMonthsWithService(user.subscription_start_date)) - 1);

    return lastPayment.toLocaleDateString();
  };

  const getUserPlanName = (user) => {
    if (!user.subscription_plan_id) return 'No Plan';
    const plan = plans.find(p => p.id === user.subscription_plan_id);
    return plan ? plan.name : 'Unknown Plan';
  };

  const calculateTrialTimeLeft = (user) => {
    if (user.subscription_status !== 'free_trial' || !user.trial_end_date) {
      return null;
    }

    const trialEnd = new Date(user.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays <= 0) {
      return 'Expires today';
    } else {
      return `${diffDays} days left`;
    }
  };

  const getTrialDuration = (user) => {
    if (!user.subscription_start_date || !user.trial_end_date) {
      return 'N/A';
    }

    const start = new Date(user.subscription_start_date);
    const end = new Date(user.trial_end_date);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} days`;
  };

  const exportUserData = () => {
    const csvData = filteredUsers.map(user => ({
      Name: user.full_name,
      Email: user.email,
      'Signup Method': user.signup_method || 'google',
      'Subscription Status': getStatusText(user.subscription_status),
      'Plan': getUserPlanName(user),
      'Registration Date': new Date(user.created_date).toLocaleDateString(),
      'Total Lists': user.total_lists_created || 0,
      'Completed Shops': user.total_shops_completed || 0,
      'Device Type': getDeviceType(user),
      'Months with Service': calculateMonthsWithService(user.subscription_start_date),
      'Total Savings': (user.total_savings || 0).toFixed(2),
      'Trial Time Left': calculateTrialTimeLeft(user) || 'N/A',
      'Trial Duration': getTrialDuration(user) || 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [headers.join(','), ...csvData.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-2"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    );

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="mx-1"
        >
          {i}
        </Button>
      );
    }

    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-2"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );

    return pages;
  };

  // New functions for modal
  const handleShowPlanModal = (user) => {
    setSelectedUser(user);
    setSelectedPlanId(user.subscription_plan_id || ''); // Pre-select current plan if exists
    setShowPlanModal(true);
  };

  const handleUpdateUserPlan = async () => {
    if (!selectedUser || !selectedPlanId) return;

    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) {
      console.error("Selected plan not found.");
      return;
    }

    try {
      const now = new Date();
      const newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + 1); // Set to 1 month from now

      await User.update(selectedUser.id, {
        subscription_status: 'active', // Assuming setting a plan makes them active
        subscription_plan_id: selectedPlanId,
        subscription_start_date: now.toISOString(),
        subscription_end_date: newEndDate.toISOString()
      });

      // Refresh the user list and overall stats
      await calculateOverallStats();
      await fetchUsersData(backendPage, false); // Reload current backend page to reflect changes
      setShowPlanModal(false);
      setSelectedUser(null);
      setSelectedPlanId('');
    } catch (error) {
      console.error("Failed to update user plan:", error);
      alert("Failed to update user plan. Please try again.");
    }
  };

  // New function for handling user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await User.delete(userToDelete.id);
      setUserToDelete(null); // Close the dialog
      // Refresh the user list from the beginning to update counts and remove the user
      await calculateOverallStats(); // Recalculate stats after deletion
      await fetchUsersData(1, false);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Change Subscription Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription for {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Manually assign a new subscription plan to this user. This will override their current status and set them to active for one month.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label htmlFor="plan-select">Select a Plan</Label>
            <Select onValueChange={setSelectedPlanId} value={selectedPlanId} id="plan-select">
              <SelectTrigger>
                <SelectValue placeholder="Choose a subscription plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} (£{plan.price}/month)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateUserPlan} disabled={!selectedPlanId}>Update Subscription</Button>
        </DialogContent>
      </Dialog>

      {/* NEW: Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{userToDelete?.full_name} ({userToDelete?.email})</span> and all of their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                  <p className="text-sm text-gray-500">Manage and monitor user accounts</p>
                </div>
              </div>
            </div>

            <Button onClick={exportUserData} variant="outline" className="border-amber-200 hover:bg-amber-50">
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards - FIXED: Show real counts from overallStats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
                <Users className="w-4 h-4 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs opacity-75 mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Premium Users</CardTitle>
                <Crown className="w-4 h-4 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overallStats.premiumUsers.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">Active subscriptions</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Savings</CardTitle>
                <PoundSterling className="w-4 h-4 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  £{overallStats.totalSavings.toLocaleString('en-UK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs opacity-75 mt-1">Across all users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Lists Created</CardTitle>
                <ClipboardList className="w-4 h-4 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overallStats.totalLists.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">Across all users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Completed Shops</CardTitle>
                <ShoppingCart className="w-4 h-4 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overallStats.totalCompletedShops.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">Comparisons finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Premium</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={signupMethodFilter} onValueChange={setSignupMethodFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by signup method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Users ({filteredUsers.length.toLocaleString()})</CardTitle>
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length.toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Signup Method</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Shopping Activity</TableHead>
                      <TableHead>Savings & Trial</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.map((user) => (
                      <React.Fragment key={user.id}>
                        <TableRow
                          className="border-b hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => toggleUserExpansion(user.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                                <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {getSignupMethodIcon(user.signup_method)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {getUserPlanName(user)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(user.subscription_status)} border-0 flex items-center gap-1`}>
                              {user.subscription_status === 'active' && <CheckCircle className="w-3 h-3" />}
                              {user.subscription_status === 'free_trial' && <Clock className="w-3 h-3" />}
                              {user.subscription_status === 'expired' && <XCircle className="w-3 h-3" />}
                              {getStatusText(user.subscription_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(user.created_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{user.total_lists_created || 0} lists created</div>
                              <div className="text-gray-500">{user.total_shops_completed || 0} completed</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <PoundSterling className="w-3 h-3 text-green-600" />
                                <span className="font-medium text-green-600">
                                  £{(user.total_savings || 0).toFixed(2)}
                                </span>
                              </div>
                              {user.subscription_status === 'free_trial' && (
                                <div className="text-xs text-orange-600 font-medium">
                                  {calculateTrialTimeLeft(user) || 'Trial info N/A'}
                                </div>
                              )}
                              {user.subscription_status === 'free_trial' && (
                                <div className="text-xs text-gray-500">
                                  {getTrialDuration(user)} total
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              {getDeviceType(user) === 'mobile' ? (
                                <><Smartphone className="w-4 h-4" /> Mobile</>
                              ) : getDeviceType(user) === 'desktop' ? (
                                <><Monitor className="w-4 h-4" /> Desktop</>
                              ) : getDeviceType(user) === 'tablet' ? (
                                <><Monitor className="w-4 h-4" /> Tablet</>
                              ) : (
                                <><Monitor className="w-4 h-4" /> Unknown</>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowPlanModal(user)}>
                                  <Star className="w-4 h-4 mr-2" />
                                  Change Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleUserExpansion(user.id)}>
                                  {expandedUsers.has(user.id) ? (
                                    <><EyeOff className="w-4 h-4 mr-2" /> Hide Details</>
                                  ) : (
                                    <><Eye className="w-4 h-4 mr-2" /> View Details</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => setUserToDelete(user)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Details Row */}
                        {expandedUsers.has(user.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="p-0">
                              <div className="bg-gray-50 p-6 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      Account Info
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Current Plan:</span>
                                        <span className="ml-2 font-medium">{getUserPlanName(user)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Months with service:</span>
                                        <span className="ml-2 font-medium">{calculateMonthsWithService(user.subscription_start_date)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">User ID:</span>
                                        <span className="ml-2 font-mono text-xs break-all">{user.id}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Role:</span>
                                        <span className={`ml-2 ${user.role === 'admin' ? 'font-bold text-amber-600' : 'text-gray-900'}`}>
                                          {user.role === 'admin' ? 'Administrator' : (user.role || 'user')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <CreditCard className="w-4 h-4" />
                                      Billing Info
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Last payment:</span>
                                        <span className="ml-2">{getLastPaymentDate(user) || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Next payment:</span>
                                        <span className="ml-2">{getNextPaymentDate(user) || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Subscription ends:</span>
                                        <span className="ml-2">{user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Coupon Used:</span>
                                        {user.last_coupon_used ?
                                          <Badge className="ml-2 bg-blue-100 text-blue-800">{user.last_coupon_used}</Badge> :
                                          <span className="ml-2">None</span>
                                        }
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Activity className="w-4 h-4" />
                                      Activity
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Last activity:</span>
                                        <span className="ml-2">{user.updated_date ? new Date(user.updated_date).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Connected accounts:</span>
                                        <span className="ml-2">{(user.connected_supermarkets || []).length}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Food delivery addon:</span>
                                        <span className="ml-2">{user.has_food_delivery_addon ? 'Yes' : 'No'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Globe className="w-4 h-4" />
                                      Technical
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Primary device:</span>
                                        <span className="ml-2 capitalize">{getDeviceType(user)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Last login:</span>
                                        <span className="ml-2">{user.last_login_date ? new Date(user.last_login_date).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Favorite supermarkets:</span>
                                        <span className="ml-2">{(user.favorite_supermarkets || []).length > 0 ? (user.favorite_supermarkets || []).join(', ') : 'None'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {users.length >= USERS_PER_PAGE && backendPage * USERS_PER_PAGE < totalUsers && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={loadMoreUsers}
                    disabled={loadingMore}
                    variant="outline"
                    className="min-w-32"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Users
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center">
                    {renderPagination()}
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No users found</h3>
                  <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
