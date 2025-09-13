import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ShoppingCart,
  ExternalLink,
  X,
  Smartphone
} from 'lucide-react';
import ExtensionBridge from '@/components/services/ExtensionBridge';

const AutoShopProgress = ({ 
  storeSlug, 
  listId, 
  onComplete, 
  onError, 
  onClose 
}) => {
  const [status, setStatus] = useState('STARTING');
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [itemsAdded, setItemsAdded] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [storeTabUrl, setStoreTabUrl] = useState(null);

  useEffect(() => {
    // Connect WebSocket when component mounts
    if (listId && storeSlug) {
      startAutoShop();
    }

    return () => {
      // Cleanup WebSocket on unmount
      if (websocket) {
        websocket.close();
      }
    };
  }, [listId, storeSlug]);

  const startAutoShop = async () => {
    try {
      // This would call your DataClient.startBasketSession
      const { taskId, wsUrl } = await window.DataClient.startBasketSession(storeSlug, listId);
      
      const ws = ExtensionBridge.connectWebSocket(wsUrl, taskId, {
        onSiteOpened: (data) => {
          setStatus('SITE_OPENED');
          setStoreTabUrl(data.url);
          setProgress(10);
        },
        onLoggedIn: (data) => {
          setStatus('LOGGED_IN');
          setProgress(20);
        },
        onNeedsTwoFA: (data) => {
          setStatus('NEEDS_2FA');
          setShowTwoFA(true);
        },
        onItemAdded: (data) => {
          setStatus('ADDING_ITEMS');
          setCurrentItem(data.itemName || '');
          setItemsAdded(prev => prev + 1);
          setTotalItems(data.totalItems || 0);
          const progressPercent = Math.min(90, 20 + ((itemsAdded / (data.totalItems || 1)) * 70));
          setProgress(progressPercent);
        },
        onOutOfStock: (data) => {
          // Handle out of stock items
          console.log('Item out of stock:', data);
        },
        onSubstituted: (data) => {
          // Handle substituted items
          console.log('Item substituted:', data);
        },
        onDone: (data) => {
          setStatus('DONE');
          setProgress(100);
          setStoreTabUrl(data.checkoutUrl || data.storeUrl);
          window.DataClient.emitBasketDone(storeSlug, listId);
          onComplete?.(data);
        },
        onError: (data) => {
          setStatus('ERROR');
          setError(data.message || 'An error occurred during auto-shop');
          window.DataClient.emitBasketError(storeSlug, listId, data.message);
          onError?.(data);
        }
      });

      setWebsocket(ws);
    } catch (err) {
      setStatus('ERROR');
      setError(err.message);
      onError?.(err);
    }
  };

  const submitTwoFA = () => {
    if (websocket && twoFACode.trim()) {
      // Send 2FA code via WebSocket
      websocket.send(JSON.stringify({
        type: 'SUBMIT_2FA',
        code: twoFACode.trim()
      }));
      setShowTwoFA(false);
      setTwoFACode('');
      setStatus('VERIFYING_2FA');
    }
  };

  const openStoreTab = () => {
    if (storeTabUrl) {
      window.open(storeTabUrl, '_blank');
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'STARTING': return { icon: Clock, text: 'Starting auto-shop...', color: 'text-blue-600' };
      case 'SITE_OPENED': return { icon: CheckCircle, text: 'Opened store website', color: 'text-green-600' };
      case 'LOGGED_IN': return { icon: CheckCircle, text: 'Logged into your account', color: 'text-green-600' };
      case 'NEEDS_2FA': return { icon: Smartphone, text: 'Two-factor authentication required', color: 'text-orange-600' };
      case 'VERIFYING_2FA': return { icon: Clock, text: 'Verifying 2FA code...', color: 'text-blue-600' };
      case 'ADDING_ITEMS': return { icon: ShoppingCart, text: `Adding items to basket...`, color: 'text-blue-600' };
      case 'DONE': return { icon: CheckCircle, text: 'Auto-shop complete!', color: 'text-green-600' };
      case 'ERROR': return { icon: AlertCircle, text: 'Error occurred', color: 'text-red-600' };
      default: return { icon: Clock, text: 'Processing...', color: 'text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
            Auto-Shop Progress
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className={statusDisplay.color}>{statusDisplay.text}</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Item */}
          {status === 'ADDING_ITEMS' && currentItem && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">Adding to basket:</p>
              <p className="text-blue-700">{currentItem}</p>
              {totalItems > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {itemsAdded} of {totalItems} items added
                </p>
              )}
            </div>
          )}

          {/* 2FA Input */}
          {showTwoFA && (
            <div className="bg-orange-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-900">Two-Factor Authentication</span>
              </div>
              <p className="text-sm text-orange-700">
                Please enter the verification code from your authenticator app or SMS.
              </p>
              <div className="space-y-2">
                <Label htmlFor="twofa">Verification Code</Label>
                <Input
                  id="twofa"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <Button onClick={submitTwoFA} disabled={!twoFACode.trim()} className="w-full">
                Submit Code
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm font-medium text-red-900">Error:</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Actions */}
          {status === 'DONE' && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-green-900 font-medium">Basket filled successfully!</p>
                <p className="text-green-700 text-sm">All items have been added to your basket.</p>
              </div>
              
              <Button onClick={openStoreTab} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Checkout
              </Button>
            </div>
          )}

          {/* Progress Summary */}
          {status === 'ADDING_ITEMS' && totalItems > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Items processed:</span>
              <Badge variant="outline">{itemsAdded}/{totalItems}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoShopProgress;