
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from 'lucide-react';

import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';

const getBaseUrl = () => {
  if (window.location.hostname === 'myshoprun.app') {
    return 'https://myshoprun.app';
  }
  return window.location.origin;
};

export default function HeadlessLoginModal({
  isOpen,
  onClose,
  returnPath
}) {
  const [loading, setLoading] = useState(false);

  // All previous state variables related to headless login (status, sessionId, message, etc.) have been removed.

  // All previous useEffects for polling have been removed.

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Here we need to redirect back to the page that opened the modal
      const returnUrl = `${getBaseUrl()}${returnPath || createPageUrl('Dashboard')}`;
      await User.loginWithRedirect(returnUrl);
    } catch (error) {
      console.error('Failed to redirect to login:', error);
      setLoading(false);
      // Optionally, add a user-facing error message here if the redirect fails before leaving the page
    }
  };

  // All previous helper functions like getStatusIcon, getStatusColor have been removed.

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            Connect Your Account
            {/* Removed storeName and storeLogoUrl as they are no longer passed as props */}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main content card for initiating redirect login */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              {loading ? (
                // Display loading state while redirecting
                <>
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Redirecting to login... Please wait.
                  </p>
                </>
              ) : (
                // Display prompt to initiate login
                <>
                  <p className="text-gray-700">
                    Click the button below to connect your account. You will be securely redirected to the login page to complete the process.
                  </p>
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    Connect Account
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Removed previous Security Notice as it was specific to credential collection */}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              Close
            </Button>
            {/* Removed "Try Again" button as it's not applicable for redirect flow */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
