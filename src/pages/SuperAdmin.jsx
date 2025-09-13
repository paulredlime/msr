import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // **FIX**: Use useCallback to memoize the function to avoid dependency warnings
  const checkAndSetAdminStatus = useCallback(async () => {
    try {
      const currentUser = await User.me();

      // Check if an admin already exists
      const admins = await User.filter({ role: 'admin' });

      if (admins.length > 0) {
        // Admin exists, check if it's the current user
        if (admins[0].email === currentUser.email) {
          navigate(createPageUrl("AdminDashboard"));
        } else {
          setError("Access denied. An administrator is already configured for this application.");
          setLoading(false);
        }
      } else {
        // No admin exists, make the current user the admin
        // This is the first-time setup
        await User.updateMyUserData({ role: 'admin' });
        navigate(createPageUrl("AdminDashboard"));
      }
    } catch (err) {
      // User is not logged in
      setError("Please sign in to configure the admin account.");
      setLoading(false);
    }
  }, [navigate, setError, setLoading]); // Include all dependencies

  useEffect(() => {
    checkAndSetAdminStatus();
  }, [checkAndSetAdminStatus]); // Now include the memoized function

  const handleAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Redirect to login, then back here to run the admin check
      await User.loginWithRedirect(window.location.href);
    } catch (err) {
      setError("Login failed. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/72bdf7b58_MSRLogo.png" 
              alt="MyShopRun Logo" 
              className="w-12 h-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription>Secure administrative access portal</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
              <div className="flex">
                <div className="py-1"><ShieldAlert className="h-5 w-5 text-red-500 mr-3"/></div>
                <div>
                  <p className="font-bold">Access Control</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          <Button 
            onClick={handleAdminLogin} 
            className="w-full bg-amber-500 hover:bg-amber-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Verifying...
              </>
            ) : "Sign In & Configure Admin"}
          </Button>
          <p className="text-xs text-center text-gray-500 mt-4">
            The first user to sign in here will become the super administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}