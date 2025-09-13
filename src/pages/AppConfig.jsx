
import React, { useState, useEffect, useCallback } from "react";
import { AppConfig } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Upload, Palette, Video, Image, Settings } from "lucide-react";


export default function AppConfigPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Splash Video Configuration
  const [splashConfig, setSplashConfig] = useState({
    videoUrl: '',
    duration: 3,
    skipEnabled: true,
    isActive: true
  });
  
  // Login/Register Customization
  const [authConfig, setAuthConfig] = useState({
    logoUrl: '',
    backgroundImageUrl: '',
    primaryColor: '#0d9488',
    secondaryColor: '#14b8a6',
    welcomeTitle: 'Welcome to MyShopRun',
    welcomeSubtitle: 'Compare prices and save money on your groceries',
    isActive: true
  });
  
  // App Branding
  const [brandingConfig, setBrandingConfig] = useState({
    appName: 'MyShopRun',
    appIcon: '',
    loadingScreenBg: '#0d9488',
    statusBarStyle: 'light',
    isActive: true
  });

  // FIX: Use useCallback to memoize the function to avoid dependency warnings
  const loadConfigurations = useCallback(async () => {
    setLoading(true);
    try {
      // Load splash video config
      const splashConfigs = await AppConfig.filter({ config_type: 'splash_video' });
      if (splashConfigs.length > 0) {
        const config = JSON.parse(splashConfigs[0].config_value || '{}');
        setSplashConfig(prev => ({ ...prev, ...config, videoUrl: splashConfigs[0].file_url || '' }));
      }

      // Load login customization config
      const authConfigs = await AppConfig.filter({ config_type: 'login_customization' });
      if (authConfigs.length > 0) {
        const config = JSON.parse(authConfigs[0].config_value || '{}');
        setAuthConfig(prev => ({ ...prev, ...config }));
      }

      // Load app branding config
      const brandingConfigs = await AppConfig.filter({ config_type: 'app_branding' });
      if (brandingConfigs.length > 0) {
        const config = JSON.parse(brandingConfigs[0].config_value || '{}');
        setBrandingConfig(prev => ({ ...prev, ...config }));
      }
      
    } catch (error) {
      console.error('Error loading configurations:', error);
      setMessage({ type: 'error', text: 'Failed to load configurations' });
    }
    setLoading(false);
  }, []); // Empty dependency array as setMessage is stable, AppConfig is outside scope. Setters use functional updates.

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const handleFileUpload = async (file, configType, field) => {
    if (!file) return;
    
    setMessage({ type: 'info', text: 'Uploading file...' });
    
    try {
      const { file_url } = await UploadFile({ file });
      
      if (configType === 'splash') {
        setSplashConfig(prev => ({ ...prev, [field]: file_url }));
      } else if (configType === 'auth') {
        setAuthConfig(prev => ({ ...prev, [field]: file_url }));
      } else if (configType === 'branding') {
        setBrandingConfig(prev => ({ ...prev, [field]: file_url }));
      }
      
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Failed to upload file' });
    }
  };

  const saveConfiguration = async (configType, configData, fileUrl = null) => {
    setSaving(true);
    try {
      // Check if config already exists
      const existingConfigs = await AppConfig.filter({ config_type: configType });
      
      const configPayload = {
        config_key: `${configType}_config`,
        config_type: configType,
        config_value: JSON.stringify(configData),
        file_url: fileUrl,
        is_active: configData.isActive,
        description: `${configType} configuration for mobile app`
      };

      if (existingConfigs.length > 0) {
        // Update existing
        await AppConfig.update(existingConfigs[0].id, configPayload);
      } else {
        // Create new
        await AppConfig.create(configPayload);
      }
      
      setMessage({ type: 'success', text: `${configType} configuration saved successfully!` });
    } catch (error) {
      console.error(`Error saving ${configType} configuration:`, error);
      setMessage({ type: 'error', text: `Failed to save ${configType} configuration` });
    }
    setSaving(false);
  };
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-blue-600" />
              Mobile App Configuration
            </h1>
            <p className="text-gray-600 mt-2">Configure your hybrid mobile app settings, branding, and user experience</p>
          </div>
        </div>

        {message.text && (
          <Alert className={`mb-6 ${
            message.type === 'success' ? 'border-green-500 bg-green-50' :
            message.type === 'error' ? 'border-red-500 bg-red-50' : 
            'border-blue-500 bg-blue-50'
          }`}>
            <AlertDescription className={
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="splash" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="splash" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Splash Screen
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Login & Register
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              App Branding
            </TabsTrigger>
          </TabsList>

          {/* Splash Screen Configuration */}
          <TabsContent value="splash">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Splash Screen Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="splash-video">Upload Splash Video (MP4, max 10MB)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="splash-video"
                      accept="video/mp4"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'splash', 'videoUrl')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {splashConfig.videoUrl && (
                      <div className="mt-4">
                        <video controls className="w-64 h-36 rounded-lg">
                          <source src={splashConfig.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="splash-duration">Duration (seconds)</Label>
                    <Input
                      id="splash-duration"
                      type="number"
                      min="1"
                      max="10"
                      value={splashConfig.duration}
                      onChange={(e) => setSplashConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="skip-enabled"
                      checked={splashConfig.skipEnabled}
                      onCheckedChange={(checked) => setSplashConfig(prev => ({ ...prev, skipEnabled: checked }))}
                    />
                    <Label htmlFor="skip-enabled">Allow users to skip</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="splash-active"
                    checked={splashConfig.isActive}
                    onCheckedChange={(checked) => setSplashConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="splash-active">Enable splash screen</Label>
                </div>

                <Button 
                  onClick={() => saveConfiguration('splash_video', splashConfig, splashConfig.videoUrl)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Splash Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login & Register Configuration */}
          <TabsContent value="auth">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Login & Register Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="auth-logo">Logo Image</Label>
                    <input
                      type="file"
                      id="auth-logo"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'auth', 'logoUrl')}
                      className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {authConfig.logoUrl && (
                      <img src={authConfig.logoUrl} alt="Logo" className="mt-2 h-16 w-auto" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="auth-background">Background Image</Label>
                    <input
                      type="file"
                      id="auth-background"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'auth', 'backgroundImageUrl')}
                      className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {authConfig.backgroundImageUrl && (
                      <img src={authConfig.backgroundImageUrl} alt="Background" className="mt-2 h-24 w-auto rounded-lg" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={authConfig.primaryColor}
                      onChange={(e) => setAuthConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <Input
                      id="secondary-color"
                      type="color"
                      value={authConfig.secondaryColor}
                      onChange={(e) => setAuthConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="welcome-title">Welcome Title</Label>
                  <Input
                    id="welcome-title"
                    value={authConfig.welcomeTitle}
                    onChange={(e) => setAuthConfig(prev => ({ ...prev, welcomeTitle: e.target.value }))}
                    placeholder="Welcome to MyShopRun"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome-subtitle">Welcome Subtitle</Label>
                  <Textarea
                    id="welcome-subtitle"
                    value={authConfig.welcomeSubtitle}
                    onChange={(e) => setAuthConfig(prev => ({ ...prev, welcomeSubtitle: e.target.value }))}
                    placeholder="Compare prices and save money on your groceries"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auth-active"
                    checked={authConfig.isActive}
                    onCheckedChange={(checked) => setAuthConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="auth-active">Use custom login/register design</Label>
                </div>

                <Button 
                  onClick={() => saveConfiguration('login_customization', authConfig)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Login Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Branding Configuration */}
          <TabsContent value="branding">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  App Branding & Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="app-name">App Name</Label>
                  <Input
                    id="app-name"
                    value={brandingConfig.appName}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="MyShopRun"
                  />
                </div>

                <div>
                  <Label htmlFor="app-icon">App Icon</Label>
                  <input
                    type="file"
                    id="app-icon"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'branding', 'appIcon')}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {brandingConfig.appIcon && (
                    <img src={brandingConfig.appIcon} alt="App Icon" className="mt-2 h-16 w-16 rounded-xl" />
                  )}
                </div>

                <div>
                  <Label htmlFor="loading-bg">Loading Screen Background Color</Label>
                  <Input
                    id="loading-bg"
                    type="color"
                    value={brandingConfig.loadingScreenBg}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, loadingScreenBg: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="branding-active"
                    checked={brandingConfig.isActive}
                    onCheckedChange={(checked) => setBrandingConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="branding-active">Use custom app branding</Label>
                </div>

                <Button 
                  onClick={() => saveConfiguration('app_branding', brandingConfig)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Branding Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile App Preview */}
        <Card className="mt-8 shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Mobile App Preview
            </CardTitle>
            <a 
              href="/MobileAppPreview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Open Live Preview
            </a>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <div className="w-72 h-[570px] bg-gray-900 rounded-[40px] p-2 shadow-2xl mx-auto mb-6">
                <div className="w-full h-full bg-gray-100 rounded-[32px] flex items-center justify-center">
                  <div className="text-center">
                    <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Click "Open Live Preview" to test your mobile app</p>
                    <p className="text-sm text-gray-500">
                      This will show your splash screen, custom login, then the real dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
