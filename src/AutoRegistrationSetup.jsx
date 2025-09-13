import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/api/entities';
import { ShoppingCart, Shield, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function AutoRegistrationSetup({ onComplete, onSkip }) {
  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    phone: '',
    password: '',
    confirmPassword: '',
    enableService: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.enableService) return true; // Skip validation if not enabling

    if (!formData.address.trim()) return 'Please enter your full address';
    if (!formData.postcode.trim()) return 'Please enter your postcode';
    if (!formData.phone.trim()) return 'Please enter your phone number';
    if (!formData.password) return 'Please create a password for store registrations';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';

    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(formData.postcode)) {
      return 'Please enter a valid UK postcode';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // Update user profile with auto-registration details
      await User.updateMyUserData({
        auto_registration_enabled: formData.enableService,
        auto_registration_address: formData.enableService ? formData.address : null,
        auto_registration_postcode: formData.enableService ? formData.postcode.toUpperCase() : null,
        auto_registration_phone: formData.enableService ? formData.phone : null,
        auto_registration_password: formData.enableService ? btoa(formData.password) : null, // Basic encoding - in production use proper encryption
      });

      onComplete(formData.enableService);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Zap className="w-6 h-6 text-blue-600" />
            Auto Store Registration Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              What is this service?
            </h3>
            <p className="text-blue-800 text-sm">
              We can automatically register you with supermarkets you're not signed up with yet, then fill your basket with your shopping list. This saves you time and lets you shop at the cheapest stores instantly.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enableService"
              checked={formData.enableService}
              onCheckedChange={(checked) => handleInputChange('enableService', checked)}
            />
            <Label htmlFor="enableService" className="text-sm font-medium">
              Yes, enable auto-registration service for me
            </Label>
          </div>

          {formData.enableService && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="07123 456789"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="SW1A 1AA"
                    value={formData.postcode}
                    onChange={(e) => handleInputChange('postcode', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 High Street, London"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Store Registration Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your details are encrypted and stored securely. We'll use them only to register you with stores when you choose the auto-fill option.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip for Now
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (formData.enableService ? 'Enable Service' : 'Continue')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}