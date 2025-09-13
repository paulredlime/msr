import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { AdminNotification } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  Edit, 
  Trash2,
  Crown,
  Settings,
  AlertCircle,
  Info,
  AlertTriangle,
  Megaphone
} from "lucide-react";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    target_users: 'all',
    is_active: true,
    expires_at: ''
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
      await loadNotifications();
    } catch (error) {
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  };

  const loadNotifications = async () => {
    try {
      const allNotifications = await AdminNotification.list('-created_date');
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      await AdminNotification.create(newNotification);
      setSuccessMessage('Notification created successfully!');
      setShowCreateDialog(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        target_users: 'all',
        is_active: true,
        expires_at: ''
      });
      await loadNotifications();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await AdminNotification.delete(notificationId);
        setSuccessMessage('Notification deleted successfully!');
        await loadNotifications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'promotion': return <Megaphone className="w-4 h-4" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'info': return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'promotion': return <Badge className="bg-green-100 text-green-800">Promotion</Badge>;
      case 'maintenance': return <Badge className="bg-red-100 text-red-800">Maintenance</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Notifications...</span>
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
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Notifications</h1>
                  <p className="text-sm text-gray-500">Manage user notifications and announcements</p>
                </div>
              </div>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Notification title"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Notification message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      className="min-h-24"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target">Target Users</Label>
                      <Select value={newNotification.target_users} onValueChange={(value) => setNewNotification({...newNotification, target_users: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="active_subscribers">Active Subscribers</SelectItem>
                          <SelectItem value="free_trial">Free Trial Users</SelectItem>
                          <SelectItem value="expired">Expired Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expires_at">Expires At (Optional)</Label>
                      <Input
                        id="expires_at"
                        type="date"
                        value={newNotification.expires_at}
                        onChange={(e) => setNewNotification({...newNotification, expires_at: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNotification} disabled={!newNotification.title.trim() || !newNotification.message.trim()}>
                      Create Notification
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Notifications List */}
          <div className="space-y-6">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card key={notification.id} className="shadow-lg border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(notification.type)}
                        <div>
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getTypeBadge(notification.type)}
                            <Badge variant="outline">
                              {notification.target_users === 'all' ? 'All Users' :
                               notification.target_users === 'active_subscribers' ? 'Active Subscribers' :
                               notification.target_users === 'free_trial' ? 'Free Trial' : 'Expired Users'}
                            </Badge>
                            {notification.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="hover:bg-red-50 hover:border-red-200"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{notification.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created: {new Date(notification.created_date).toLocaleDateString()}</span>
                      {notification.expires_at && (
                        <span>Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-500 mb-6">Create your first notification to communicate with users</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notification
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}