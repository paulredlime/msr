import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Smartphone, 
  Monitor,
  Wifi,
  Lock,
  Trash2
} from 'lucide-react';
import SecureVault from '../services/SecureVault';
import ExtensionBridge from '../services/ExtensionBridge';
import { User } from "@/api/entities";

export default function SecureAccountConnect({ store, onConnect, onDisconnect }) {
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [historyProgress, setHistoryProgress] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [lastImport, setLastImport] = useState(null);

  useEffect(() => {
    loadUserAndDetectExtension();
    
    // Listen for history fetch progress
    const handleProgress = (event) => {
      setHistoryProgress(event.detail);
    };
    
    window.addEventListener('historyFetchProgress', handleProgress);
    return () => window.removeEventListener('historyFetchProgress', handleProgress);
  }, []);

  const loadUserAndDetectExtension = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      if (!isMobileDevice) {
        const extAvailable = await ExtensionBridge.detectExtension();
        setExtensionAvailable(extAvailable);
      }
      
      // Check if already connected
      setIsConnected((currentUser.connected_supermarkets || []).includes(store.name));
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleConnect = async () => {
    if (!credentials.username || !credentials.password) {
      alert('Please enter both username and password');
      return;
    }

    setIsConnecting(true);
    try {
      // Store encrypted credentials
      await SecureVault.storeCredentials(user.id, store.slug, credentials);
      
      // Update user's connected stores
      const newConnectedList = [...(user.connected_supermarkets || []), store.name];
      await User.updateMyUserData({ connected_supermarkets: newConnectedList });
      
      setIsConnected(true);
      setCredentials({ username: '', password: '' });
      
      if (onConnect) {
        onConnect(store.name);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Failed to connect to ${store.name}: ${error.message}`);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${store.name}? This will delete your stored credentials and stop automatic features.`)) {
      return;
    }

    try {
      // Delete encrypted credentials
      await SecureVault.deleteCredentials(user.id, store.slug);
      
      // Update user's connected stores
      const newConnectedList = (user.connected_supermarkets || []).filter(name => name !== store.name);
      await User.updateMyUserData({ connected_supermarkets: newConnectedList });
      
      setIsConnected(false);
      
      if (onDisconnect) {
        onDisconnect(store.name);
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert(`Failed to disconnect ${store.name}: ${error.message}`);
    }
  };

  const handleTestLogin = async () => {
    setShowTestLogin(true);
    setTestStatus('starting');
    
    try {
      const result = await ExtensionBridge.testLogin(store.slug);
      setTestStatus(result.success ? 'logged_in' : 'failed');
    } catch (error) {
      console.error('Test login failed:', error);
      setTestStatus('failed');
    }
  };

  const handleFetchHistory = async () => {
    setShowHistoryModal(true);
    setHistoryProgress({ ordersFound: 0, ordersImported: 0, itemsParsed: 0 });
    
    try {
      const result = await ExtensionBridge.fetchOrderHistory(store.slug, 365);
      
      if (result.success) {
        setLastImport({
          timestamp: result.lastImportTimestamp,
          ordersImported: result.ordersImported,
          itemsParsed: result.itemsParsed
        });
      }
    } catch (error) {
      console.error('History fetch failed:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <img src={store.logo} alt={store.name} className="h-8 w-auto object-contain" />
          <span>{store.name}</span>
          {isConnected && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Security Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Zero-Knowledge Security:</strong> Your credentials are encrypted on your device. 
            We never see your password in plaintext.
          </AlertDescription>
        </Alert>

        {/* Extension Status */}
        {!isMobile && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Monitor className="w-4 h-4" />
            <span className="text-sm">
              Browser Extension: {extensionAvailable ? (
                <Badge className="bg-green-100 text-green-800">Detected</Badge>
              ) : (
                <Badge variant="destructive">Required for auto-features</Badge>
              )}
            </span>
            {!extensionAvailable && (
              <Button variant="outline" size="sm">
                Install Extension
              </Button>
            )}
          </div>
        )}

        {/* Mobile Notice */}
        {isMobile && (
          <Alert className="bg-amber-50 border-amber-200">
            <Smartphone className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Auto-shopping features require desktop. You can still connect your account for price comparisons.
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Form */}
        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Email / Username</Label>
              <Input
                id="username"
                type="email"
                placeholder={`Your ${store.name} login email`}
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your account password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isConnecting || !credentials.username || !credentials.password}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-spin" />
                  Encrypting & Storing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Securely Connect Account
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Connected Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestLogin}
                disabled={!extensionAvailable}
                className="flex-1"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Test Login
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleFetchHistory}
                disabled={!extensionAvailable}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Fetch History
              </Button>
            </div>

            {lastImport && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Last import: {lastImport.ordersImported} orders, {lastImport.itemsParsed} items
                <br />
                {new Date(lastImport.timestamp).toLocaleString()}
              </div>
            )}

            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              size="sm"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect & Delete Credentials
            </Button>
          </div>
        )}

        {/* Test Login Status */}
        {showTestLogin && (
          <Alert className={testStatus === 'logged_in' ? 'bg-green-50 border-green-200' : 
                          testStatus === 'failed' ? 'bg-red-50 border-red-200' : 
                          'bg-blue-50 border-blue-200'}>
            <AlertDescription>
              Test Login Status: <strong className="capitalize">{testStatus.replace('_', ' ')}</strong>
              {testStatus === 'starting' && <span className="ml-2">🔄</span>}
              {testStatus === 'logged_in' && <span className="ml-2">✅</span>}
              {testStatus === 'failed' && <span className="ml-2">❌</span>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* History Fetch Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importing Order History</DialogTitle>
            <DialogDescription>
              Securely fetching your past orders from {store.name}...
            </DialogDescription>
          </DialogHeader>
          
          {historyProgress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Orders Found</span>
                  <span>{historyProgress.ordersFound}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Orders Imported</span>
                  <span>{historyProgress.ordersImported}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Items Parsed</span>
                  <span>{historyProgress.itemsParsed}</span>
                </div>
              </div>
              
              {historyProgress.ordersFound > 0 && (
                <Progress 
                  value={(historyProgress.ordersImported / historyProgress.ordersFound) * 100} 
                  className="w-full"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}