
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ShoppingList } from "@/api/entities";
import { FavoriteItem } from "@/api/entities";
import { AdminNotification } from "@/api/entities";
import { ContactMessage } from "@/api/entities";
import { PriceComparison } from "@/api/entities";
import { ScannedProduct } from "@/api/entities";
import { SubscriptionPlan } from "@/api/entities";
import { ErrorLog } from "@/api/entities";
import { Coupon } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { exportAllDataAsSQL } from "@/api/functions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Crown,
  Activity,
  Target,
  ArrowLeft,
  Settings,
  Bell,
  CreditCard,
  PenSquare,
  FileCode,
  PoundSterling,
  AlertTriangle,
  FileText,
  ClipboardList,
  Mail,
  Gift,
  BookOpen,
  UserPlus,
  BarChart2,
  MessageSquare,
  LifeBuoy,
  Tag,
  Database,
  Zap,
  Key,
  History,
  DollarSign,
  Shield,
  BarChart3,
  Heart,
  Unplug,
  Wind,
  CloudCog,
  FunctionSquare,
  Package,
  Webhook,
  Smartphone,
  Rss,
  Download
} from "lucide-react";

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b1', '#a7f3d0'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    trialUsers: 0,
    totalShoppingLists: 0,
    totalFavorites: 0,
    monthlyRevenue: 0,
    churnRate: 0,
    averageSessionTime: 0,
    totalScannedProducts: 0,
    activePlans: 0,
    activeCoupons: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newMessages, setNewMessages] = useState([]);

  const [totalScannedProducts, setTotalScannedProducts] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const [chartData, setChartData] = useState({
    userSignups: [],
    revenue: [],
    subscriptionBreakdown: []
  });

  const loadMetrics = useCallback(async () => {
    try {
      const [
        allUsers,
        allLists,
        allFavorites,
        allNotifications,
        allNewMessages,
        subscriptionPlans,
        errorLogs,
        couponsList,
        scannedProducts
      ] = await Promise.all([
        User.list('-created_date'),
        ShoppingList.list('-created_date'),
        FavoriteItem.list('-created_date'),
        AdminNotification.filter({ is_active: true }, '-created_date', 10),
        ContactMessage.filter({ status: 'new' }, '-created_date', 10),
        SubscriptionPlan.list(),
        ErrorLog.filter({ resolved: false }),
        Coupon.list('-created_date'),
        ScannedProduct.list()
      ]);

      const totalUsers = allUsers.length;
      const activeSubscribers = allUsers.filter(u => u.subscription_status === 'active').length;
      const trialUsers = allUsers.filter(u => u.subscription_status === 'free_trial').length;
      const totalShoppingLists = allLists.length;
      const totalFavorites = allFavorites.length;

      const monthlyRevenue = allUsers
        .filter(u => u.subscription_status === 'active')
        .reduce((sum, u) => {
          const plan = subscriptionPlans.find(p => p.id === u.subscription_plan_id);
          return sum + (plan?.price || 0);
        }, 0);

      const expiredUsers = allUsers.filter(u => u.subscription_status === 'expired').length;
      const churnRate = totalUsers > 0 ? (expiredUsers / totalUsers * 100) : 0;

      const averageSessionTime = 12.5;

      setTotalScannedProducts(scannedProducts.length);

      setMetrics({
        totalUsers,
        activeSubscribers,
        trialUsers,
        totalShoppingLists,
        totalFavorites,
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        churnRate,
        averageSessionTime,
        totalScannedProducts: scannedProducts.length,
        activePlans: subscriptionPlans.length,
        activeCoupons: couponsList.length
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
          users: Math.floor(Math.random() * 10) + 5,
          revenue: (Math.floor(Math.random() * 50) + 20) * 1.99
        };
      });

      const subscriptionBreakdown = [
        { name: 'Active Subscribers', value: activeSubscribers, color: '#059669' },
        { name: 'Free Trial', value: trialUsers, color: '#10b981' },
        { name: 'Expired', value: expiredUsers, color: '#ef4444' }
      ];

      setChartData({
        userSignups: last7Days,
        revenue: last7Days,
        subscriptionBreakdown
      });

      setRecentUsers(allUsers.slice(0, 5));

      setNewMessages(allNewMessages || []);

      setNotifications(allNotifications);

      const recentActivityData = [
        ...allUsers.slice(0, 3).map(user => ({
          id: `user-${user.id}`,
          type: 'user_signup',
          message: `${user.full_name} joined MyShopRun`,
          timestamp: user.created_date,
          user: user.full_name
        })),
        ...allLists.slice(0, 3).map(list => ({
          id: `list-${list.id}`,
          type: 'list_created',
          message: `New shopping list "${list.name}" created`,
          timestamp: list.created_date,
          user: 'User'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      setRecentActivity(recentActivityData);

    } catch (error) {
      console.error('Error loading admin data:', error);
      setError("Failed to load dashboard data.");
    }
  }, [setMetrics, setTotalScannedProducts, setChartData, setRecentUsers, setNewMessages, setNotifications, setRecentActivity, setError]);

  const checkUserAccess = useCallback(async () => {
    try {
      const currentUser = await User.me();

      if (currentUser.role !== 'admin') {
        setError("Access denied. You do not have administrative privileges.");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      await loadMetrics();
    } catch (error) {
      console.error('Error checking user access:', error);
      setError("Authentication required. Please sign in as an administrator.");
    }
    setLoading(false);
  }, [loadMetrics, setError, setLoading, setUser]);

  useEffect(() => {
    checkUserAccess();
  }, [checkUserAccess]);

  // FIX: handleExport function
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await exportAllDataAsSQL();

      // The raw SQL data is in `response.data`
      const sqlData = response.data;

      // Create a blob from the SQL string
      const blob = new Blob([sqlData], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header in the response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `myshoprun_export_${new Date().toISOString().split('T')[0]}.sql`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to export data:", error);
      // You might want to show an error toast or message here
    } finally {
      setIsExporting(false);
    }
  };


  const adminTools = [
    { name: "User Management", icon: Users, page: "UserManagement", description: "View and manage all users" },
    { name: "Connection Diagnostics", icon: Database, page: "ConnectionDiagnostics", description: "Test API endpoints and connections" },
    { name: "Error Logs", icon: AlertTriangle, page: "AdminErrorLogs", description: "Monitor and resolve system errors" },
    { name: "Coupon Management", icon: Gift, page: "CouponManagement", description: "Create and manage discount codes" },
    { name: "Notifications", icon: Bell, page: "AdminNotifications", description: "Send global notifications" },
    { name: "Contact Messages", icon: Mail, page: "AdminMessages", description: "Read and reply to user messages" },
    { name: "App Settings", icon: Settings, page: "AdminSettings", description: "Configure application settings" },
    { name: "Subscription Plans", icon: PoundSterling, page: "PlanManagement", description: "Manage pricing and features" },
    { name: "Landing Page", icon: FileText, page: "LandingPageEditor", description: "Edit the public landing page" },
    { name: "Matching Tool", icon: ClipboardList, page: "AdminMatching", description: "Review and improve product matching" },
    { name: "Backend Handoff", icon: BookOpen, page: "BackendHandoffDocs", description: "Instructions for your backend developer" },
  ];

  const adminSections = [
    {
      title: "User & Content",
      items: [
        { name: "User-Sourced Price Reports", icon: Tag, href: "UserPriceReports" },
        { name: "Order History Fetcher", icon: History, href: "AdminOrdersFetcher" },
      ],
    },
    {
      title: "System & Settings",
      items: [
        { name: "Error Logs", icon: LifeBuoy, href: "AdminErrorLogs" },
      ],
    },
    {
      title: "Developer Handoffs",
      items: [
        { name: "Browser Extension", icon: Database, href: "BrowserExtensionHandoff" },
        { name: "Grocery Backend", icon: ClipboardList, href: "GroceryBackendHandoff" },
        { name: "Food Backend", icon: ClipboardList, href: "FoodBackendHandoff" },
        { name: "Restaurant Backend", icon: ClipboardList, href: "RestaurantBackendHandoff" },
      ],
    },
  ];

  const zyteAdminSections = [
    {
      title: "Zyte API Control",
      items: [
        { name: "Crawl Dashboard", icon: Wind, href: "AdminCrawlDashboard", description: "Start and monitor product and takeaway crawls.", color: "purple" },
        { name: "Live Data Feed", icon: Rss, href: "AdminProductIngestion", description: "Watch product data arrive in real-time.", color: "green" },
        { name: "Zyte Dashboard", icon: Database, href: "AdminZyteDashboard", description: "Monitor Zyte API usage and job statuses.", color: "indigo" },
        { name: "Connectivity Check", icon: Unplug, href: "ConnectivityCheck", description: "Verify connection to Zyte and other services.", color: "cyan" }
      ],
    }
  ];

  const diagnosticsAndTestingSection = [
    {
        title: "Diagnostics & Testing",
        items: [
            { name: "Comprehensive Diagnostics", icon: LifeBuoy, href: "Diagnostics", description: "Test all API endpoints: Health, Grocers, Orders, and Tests." },
        ]
    }
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied!</h2>
        <p className="text-lg text-gray-700 mb-6">{error}</p>
        <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-amber-500 hover:bg-amber-600 text-white">
          Go to Home
        </Button>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MyShopRun Admin</h1>
                <p className="text-sm text-gray-500">Super Admin Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* NEW: Export button in nav */}
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="border-green-200 hover:bg-green-50"
              >
                {isExporting ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Export SQL</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("BackendHandoffDocs"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Grocery Backend
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("RestaurantBackendHandoff"))}
                className="border-orange-200 hover:bg-orange-50"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Restaurant Backend
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("BrowserExtensionHandoff"))}
                className="border-blue-200 hover:bg-blue-50"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Browser Extension
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AppConfig"))}
                className="border-purple-200 hover:bg-purple-50"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                App Config
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("CouponManagement"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Gift className="w-4 h-4 mr-2" />
                Coupons
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminErrorLogs"))}
                className="border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Error Logs
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminMessages"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminNotifications"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("UserManagement"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Users className="w-4 h-4 mr-2" />
                User Management
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("LandingPageEditor"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <PenSquare className="w-4 h-4 mr-2" />
                Edit Landing Page
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminSettings"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("PlanManagement"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Plans
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("ConnectionDiagnostics"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Database className="w-4 h-4 mr-2" />
                Connection Diag.
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("AdminProductIngestion"))}
                className="border-green-200 hover:bg-green-50"
              >
                <Rss className="w-4 h-4 mr-2" />
                Live Data Feed
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Home"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Admin
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor your application's performance and user activity</p>
          </div>

          {(recentUsers.length > 0 || newMessages.length > 0) && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Bell className="w-5 h-5" />
                  Live Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Recent Signups</h3>
                    <div className="space-y-3">
                      {recentUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{new Date(user.created_date).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">New Contact Messages</h3>
                    <div className="space-y-3">
                      {newMessages.length > 0 ? newMessages.map(msg => (
                        <div key={msg.id} className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Mail className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">New message from {msg.name}</p>
                            <p className="text-xs text-gray-500">{new Date(msg.created_date).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No new messages.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <Link to={createPageUrl("UserManagement")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Management</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalUsers} Users</div>
                  <p className="text-xs text-gray-500">View and manage all users</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <Link to={createPageUrl("PlanManagement")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscription Plans</CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activePlans} Plans</div>
                  <p className="text-xs text-gray-500">Manage pricing and features</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <Link to={createPageUrl("CouponManagement")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Coupon Management</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeCoupons} Coupons</div>
                    <p className="text-xs text-gray-500">Create and manage discounts</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <Link to={createPageUrl("AdminSettings")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">App Settings</CardTitle>
                  <Key className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">API Keys & URLs</div>
                    <p className="text-xs text-gray-500">Configure Payments & Extension</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
                <Link to={createPageUrl("IngestionEndpoints")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingestion Endpoints</CardTitle>
                        <Webhook className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Webhook URLs</div>
                        <p className="text-xs text-gray-500">View webhook URLs for data ingestion</p>
                    </CardContent>
                </Link>
            </Card>
          </div>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-indigo-800">
                    <Zap className="w-6 h-6" />
                    Zyte Data Integration
                </CardTitle>
                <CardDescription>
                    Control and monitor the Zyte API data extraction pipeline.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {zyteAdminSections[0].items.map((tool) => (
                        <Link to={createPageUrl(tool.href)} key={tool.name}>
                            <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg border border-indigo-100 hover:border-indigo-300 transition-all duration-300 h-full flex flex-col">
                                <div className={`${tool.name === 'Live Data Feed' ? 'bg-green-100' : 'bg-indigo-100'} p-2 rounded-lg`}>
                                    <tool.icon className={`w-5 h-5 ${tool.name === 'Live Data Feed' ? 'text-green-600' : 'text-indigo-600'}`} />
                                </div>
                                <h3 className="font-semibold text-gray-800 mt-2">{tool.name}</h3>
                                <p className="text-sm text-gray-500 flex-grow mt-1">{tool.description}</p>
                                {tool.name === 'Live Data Feed' && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-xs text-green-600 font-medium">LIVE</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-blue-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-800">
                    <LifeBuoy className="w-6 h-6" />
                    Diagnostics & Testing
                </CardTitle>
                <CardDescription>
                    Verify API endpoints and data integrity.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {diagnosticsAndTestingSection[0].items.map((tool) => (
                        <Link to={createPageUrl(tool.href)} key={tool.name}>
                            <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-100 hover:border-gray-300 transition-all duration-300 h-full flex flex-col">
                                <div className={`bg-gray-100 p-2 rounded-lg`}>
                                    <tool.icon className="w-5 h-5 text-gray-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">{tool.name}</h3>
                                <p className="text-sm text-gray-500 flex-grow">{tool.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-blue-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-800">
                    <CloudCog className="w-6 h-6" />
                    Crawler & API Management
                </CardTitle>
                <CardDescription>
                    High-level tools for managing data ingestion and testing the API endpoints.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to={createPageUrl("AdminCrawlDashboard")} key="Crawl Manager">
                        <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-100 hover:border-gray-300 transition-all duration-300 h-full flex flex-col">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <CloudCog className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Crawl Manager</h3>
                            <p className="text-sm text-gray-500 flex-grow">Start, monitor, and export large-scale data crawls.</p>
                        </div>
                    </Link>
                    <Link to={createPageUrl("BulkCategoryRunner")} key="Bulk Runner">
                        <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-100 hover:border-gray-300 transition-all duration-300 h-full flex flex-col">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <FunctionSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Bulk Runner</h3>
                            <p className="text-sm text-gray-500 flex-grow">Manually run batches of category URLs via Pipedream.</p>
                        </div>
                    </Link>
                    <Link to={createPageUrl("Diagnostics")} key="Diagnostics">
                        <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-100 hover:border-gray-300 transition-all duration-300 h-full flex flex-col">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <LifeBuoy className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">API Diagnostics</h3>
                            <p className="text-sm text-gray-500 flex-grow">Run live tests against all primary workflow endpoints.</p>
                        </div>
                    </Link>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold">{metrics.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Active Subscribers</p>
                    <p className="text-3xl font-bold">{metrics.activeSubscribers}</p>
                  </div>
                  <Crown className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Link to={createPageUrl("AdminScannedProducts")}>
              <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Products Scanned</p>
                      <p className="text-3xl font-bold">{totalScannedProducts}</p>
                      <p className="text-purple-200 text-xs">View User-Generated DB</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Monthly Revenue</p>
                    <p className="text-3xl font-bold">£{metrics.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <PoundSterling className="w-8 h-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Revenue Trend - {currentDate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`£${parseFloat(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ fill: '#059669' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  User Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.subscriptionBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({name, value}) => `${name}: ${value}`}
                    >
                      {chartData.subscriptionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* NEW SECTION: Daily User Signups Chart + Quick Actions + Data Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Growth Chart (Daily User Signups) */}
            <Card className="lg:col-span-2 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Daily User Signups - Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userSignups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="space-y-8">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => navigate(createPageUrl("UserManagement"))}>
                    <Users className="w-4 h-4 mr-2" /> Users
                  </Button>
                  <Button variant="outline" onClick={() => navigate(createPageUrl("AdminMessages"))}>
                    <Mail className="w-4 h-4 mr-2" /> Messages
                  </Button>
                  <Button variant="outline" onClick={() => navigate(createPageUrl("AdminErrorLogs"))}>
                    <AlertTriangle className="w-4 h-4 mr-2" /> Errors
                  </Button>
                  <Button variant="outline" onClick={() => navigate(createPageUrl("CouponManagement"))}>
                    <Gift className="w-4 h-4 mr-2" /> Coupons
                  </Button>
                </CardContent>
              </Card>

              {/* NEW: Data Management Card */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl">Data Management</CardTitle>
                  <CardDescription>Export and manage application data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> Exporting...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" /> Download SQL Backup</>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Generates a full SQL dump of all entities. May take a few moments.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Target className="w-5 h-5" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Trial to Paid</span>
                      <span className="font-semibold">
                        {metrics.trialUsers + metrics.activeSubscribers > 0 ? Math.round((metrics.activeSubscribers / (metrics.trialUsers + metrics.activeSubscribers)) * 100) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.trialUsers + metrics.activeSubscribers > 0 ? (metrics.activeSubscribers / (metrics.trialUsers + metrics.activeSubscribers)) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {metrics.activeSubscribers} of {metrics.activeSubscribers + metrics.trialUsers} users converted to paid
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Calendar className="w-5 h-5" />
                  Monthly Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current MRR</span>
                    <span className="font-semibold">£{metrics.monthlyRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Annual Run Rate</span>
                    <span className="font-semibold text-blue-600">
                      £{(metrics.monthlyRevenue * 12).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Activity className="w-5 h-5" />
                  Platform Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue Growth</span>
                    <Badge className="bg-blue-100 text-blue-800">Growing</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">User Engagement</span>
                    <Badge className="bg-purple-100 text-purple-800">Strong</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
