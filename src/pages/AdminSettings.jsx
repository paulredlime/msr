
import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Loader2, Save, CheckCircle, Key, ArrowLeft, Eye, EyeOff, Trash2, Volume2, Clock, Link as LinkIcon,
  Facebook, Instagram, Linkedin, Twitter,
  // NEW IMPORTS FOR ICONS
  Database, ShoppingCart, UtensilsCrossed
} from 'lucide-react';
import { User } from '@/api/entities';

// ONLY the original keys that have your data
const SETTING_KEYS = {
  STRIPE_PUBLIC_KEY: 'stripe_public_key',
  STRIPE_SECRET_KEY: 'stripe_secret_key',
  STRIPE_WEBHOOK_SECRET: 'stripe_webhook_secret',
  TRIAL_DURATION_DAYS: 'trial_duration_days', // New key
  // Add new social media keys
  SOCIAL_FACEBOOK_URL: 'facebook_url',
  SOCIAL_INSTAGRAM_URL: 'instagram_url',
  SOCIAL_LINKEDIN_URL: 'linkedin_url',
  SOCIAL_X_URL: 'twitter_url',
  // NEW KEYS FROM THE OUTLINE
  MARKETBRIDGE_STORE_AUTOMATION_URL: 'marketbridge_store_automation_url',
  MARKETBRIDGE_HEALTH_URL: 'marketbridge_health_url',
  MARKETBRIDGE_API_KEY: 'marketbridge_api_key',
  MARKETBRIDGE_HMAC_SECRET: 'marketbridge_hmac_secret',
  GROCERY_BACKEND_BASE_URL: 'grocery_backend_base_url',
  GROCERY_BACKEND_API_KEY: 'grocery_backend_api_key',
  FOOD_BACKEND_BASE_URL: 'food_backend_base_url',
  FOOD_BACKEND_API_KEY: 'food_backend_api_key',
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSecrets, setShowSecrets] = useState({});
  const [cleaningDb, setCleaningDb] = useState(false);
  const [defaultVoice, setDefaultVoice] = useState('en-US-Journey-F');

  // Voice options for admin (same as Profile page)
  const googleVoiceOptions = [
    { id: 'en-US-Journey-F', name: 'Emma (US)', languageCode: 'en-US' },
    { id: 'en-US-Journey-D', name: 'Ryan (US)', languageCode: 'en-US' },
    { id: 'en-GB-Journey-F', name: 'Aria (UK)', languageCode: 'en-GB' },
    { id: 'en-GB-Journey-D', name: 'Andrew (UK)', languageCode: 'en-GB' },
    { id: 'en-US-Studio-O', name: 'Olivia (US)', languageCode: 'en-US' },
    { id: 'en-US-Studio-Q', name: 'Quinn (US)', languageCode: 'en-US' }
  ];

  const settingsSections = [
    {
      title: "MarketBridge Integration",
      icon: Database,
      description: "External automation system for store interactions and order fetching",
      settings: [
        {
          key: SETTING_KEYS.MARKETBRIDGE_STORE_AUTOMATION_URL,
          label: "Store Automation Endpoint",
          type: "url",
          description: "URL for store automation (login, basket fill, registration)",
          placeholder: "https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-automation"
        },
        {
          key: SETTING_KEYS.MARKETBRIDGE_HEALTH_URL,
          label: "Health Monitoring Endpoint",
          type: "url",
          description: "URL for checking store connection health status",
          placeholder: "https://sdzgyllxpcytpiusxfhd.supabase.co/functions/v1/store-health"
        },
        {
          key: SETTING_KEYS.MARKETBRIDGE_API_KEY,
          label: "MarketBridge API Key",
          type: "password",
          description: "Authentication token for MarketBridge requests",
          placeholder: "Enter your MarketBridge API key"
        },
        {
          key: SETTING_KEYS.MARKETBRIDGE_HMAC_SECRET,
          label: "HMAC Signature Secret",
          type: "password",
          description: "Secret key for HMAC-SHA256 request signing",
          placeholder: "Enter HMAC secret for request verification"
        }
      ]
    },
    {
      title: "Grocery Backend Integration",
      icon: ShoppingCart,
      description: "Configure endpoints for grocery price comparison and product search",
      settings: [
        {
          key: SETTING_KEYS.GROCERY_BACKEND_BASE_URL,
          label: "Grocery Backend Base URL",
          type: "url",
          description: "Base URL for your grocery comparison backend API",
          placeholder: "https://your-grocery-api.com"
        },
        {
          key: SETTING_KEYS.GROCERY_BACKEND_API_KEY,
          label: "Grocery Backend API Key",
          type: "password",
          description: "API key for grocery backend authentication",
          placeholder: "Enter grocery backend API key"
        }
      ]
    },
    {
      title: "Food Delivery Integration",
      icon: UtensilsCrossed,
      description: "Configure endpoints for restaurant and takeaway comparisons",
      settings: [
        {
          key: SETTING_KEYS.FOOD_BACKEND_BASE_URL,
          label: "Food Backend Base URL",
          type: "url",
          description: "Base URL for your food delivery comparison backend",
          placeholder: "https://your-food-api.com"
        },
        {
          key: SETTING_KEYS.FOOD_BACKEND_API_KEY,
          label: "Food Backend API Key",
          type: "password",
          description: "API key for food backend authentication",
          placeholder: "Enter food backend API key"
        }
      ]
    },
  ];

  useEffect(() => {
    const loadUserAndSettings = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        setUser(currentUser);

        setLoading(true);
        const allSettings = await AppSettings.list();
        const newSettings = {};
        allSettings.forEach(s => {
          newSettings[s.setting_key] = s.setting_value;
        });

        setSettings(newSettings);
        setDefaultVoice(newSettings.default_voice || 'en-US-Journey-F');

      } catch (error) {
        console.error("Failed to load settings or user:", error);
        // If user is not admin or there's an error, redirect to Dashboard
        navigate(createPageUrl("Dashboard"));
      }
      setLoading(false);
    };
    loadUserAndSettings();
  }, [navigate]);

  const cleanDatabase = async () => {
    setCleaningDb(true);
    try {
      const allSettings = await AppSettings.list();

      console.log("=== CLEANING DATABASE ===");

      // Collect all keys from SETTING_KEYS and settingsSections
      const relevantKeys = new Set(Object.values(SETTING_KEYS));
      // Add keys from dynamic settingsSections
      settingsSections.forEach(section => {
        section.settings.forEach(setting => {
          relevantKeys.add(setting.key);
        });
      });
      // Also add 'default_voice' as it's a special setting
      relevantKeys.add('default_voice');

      const emptyRecords = allSettings.filter(s =>
        relevantKeys.has(s.setting_key) &&
        (!s.setting_value || s.setting_value.trim() === '')
      );

      console.log(`Found ${emptyRecords.length} empty records to delete:`, emptyRecords);

      for (const emptyRecord of emptyRecords) {
        await AppSettings.delete(emptyRecord.id);
        console.log(`✓ Deleted empty: ${emptyRecord.setting_key} (ID: ${emptyRecord.id})`);
      }

      setSuccessMessage(`Cleaned database: deleted ${emptyRecords.length} empty records`);
      // Reload settings after cleaning
      const refreshedSettings = await AppSettings.list();
      const newSettings = {};
      refreshedSettings.forEach(s => {
        newSettings[s.setting_key] = s.setting_value;
      });
      setSettings(newSettings);
      setDefaultVoice(newSettings.default_voice || 'en-US-Journey-F'); // Re-set voice after reload

    } catch (error) {
      console.error("Error cleaning database:", error);
      setSuccessMessage("Error cleaning database");
    }
    setCleaningDb(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      // 1. Save default voice setting
      const existingVoiceSetting = await AppSettings.filter({ setting_key: 'default_voice' });
      if (existingVoiceSetting.length > 0) {
        await AppSettings.update(existingVoiceSetting[0].id, {
          setting_value: defaultVoice,
          description: 'Default AI voice for new users'
        });
      } else {
        await AppSettings.create({
          setting_key: 'default_voice',
          setting_value: defaultVoice,
          description: 'Default AI voice for new users'
        });
      }

      // 2. Save other settings (including Stripe keys, trial days, social media links, and new integrations)
      // Collect all possible setting keys that could be saved/updated
      const allKeysToProcess = new Set(Object.values(SETTING_KEYS));
      // Add keys from dynamic settingsSections
      settingsSections.forEach(section => {
        section.settings.forEach(setting => {
          allKeysToProcess.add(setting.key);
        });
      });

      const promises = Array.from(allKeysToProcess).map(async (key) => {
        if (key === 'default_voice') return; // Already handled above

        const value = settings[key]; // Get current value from state

        const existingSetting = await AppSettings.filter({ setting_key: key });

        let description = `Application Setting: ${key}`; // Default generic description

        // Try to find a more specific description from settingsSections
        for (const section of settingsSections) {
          const foundSetting = section.settings.find(s => s.key === key);
          if (foundSetting) {
            description = foundSetting.description;
            break;
          }
        }
        // Add descriptions for old hardcoded keys if not already defined (or if generic)
        if (description === `Application Setting: ${key}`) {
          if (key === SETTING_KEYS.STRIPE_PUBLIC_KEY) description = "Stripe Public API Key";
          if (key === SETTING_KEYS.STRIPE_SECRET_KEY) description = "Stripe Secret API Key";
          if (key === SETTING_KEYS.STRIPE_WEBHOOK_SECRET) description = "Stripe Webhook Signing Secret";
          if (key === SETTING_KEYS.TRIAL_DURATION_DAYS) description = "Free trial duration in days";
          if (key === SETTING_KEYS.SOCIAL_FACEBOOK_URL) description = "Social media Facebook URL";
          if (key === SETTING_KEYS.SOCIAL_INSTAGRAM_URL) description = "Social media Instagram URL";
          if (key === SETTING_KEYS.SOCIAL_LINKEDIN_URL) description = "Social media LinkedIn URL";
          if (key === SETTING_KEYS.SOCIAL_X_URL) description = "Social media X (Twitter) URL";
        }


        if (existingSetting.length > 0) {
          // Update existing setting only if its value has changed or its description needs updating
          if (existingSetting[0].setting_value !== (value || '') || existingSetting[0].description !== description) {
            await AppSettings.update(existingSetting[0].id, {
              setting_value: value || '', // Save empty string if value is null/undefined
              description: description // Also update description if it changed or needs to be set
            });
          }
        } else if (value) { // Only create new setting if there's a non-empty value
          await AppSettings.create({
            setting_key: key,
            setting_value: value,
            description: description
          });
        }
      });

      await Promise.all(promises);
      setSuccessMessage("Settings saved successfully!");

      // Reload all settings to ensure state is fresh
      const refreshedSettings = await AppSettings.list();
      const newSettings = {};
      refreshedSettings.forEach(s => {
        newSettings[s.setting_key] = s.setting_value;
      });
      setSettings(newSettings);
      setDefaultVoice(newSettings.default_voice || 'en-US-Journey-F');

    } catch (error) {
      console.error("Failed to save settings:", error);
      setSuccessMessage("Error saving settings");
    }
    setSaving(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate(createPageUrl('AdminDashboard'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <Button
            variant="destructive"
            onClick={cleanDatabase}
            disabled={cleaningDb}
          >
            {cleaningDb ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cleaning...</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> Clean Empty Records</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Default Voice Setting Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Default Voice Assistant
              </CardTitle>
              <CardDescription>
                Set the default AI voice that new users will hear. Users can change this in their profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="default-voice">Default Voice</Label>
              <select
                id="default-voice"
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              >
                {googleVoiceOptions.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Trial Duration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Free Trial Settings
              </CardTitle>
              <CardDescription>
                Configure the duration of the free trial for new users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="trial-duration">Trial Duration (in days)</Label>
              <Input
                id="trial-duration"
                type="number"
                placeholder="e.g., 7"
                value={settings[SETTING_KEYS.TRIAL_DURATION_DAYS] || ''}
                onChange={(e) => handleInputChange(SETTING_KEYS.TRIAL_DURATION_DAYS, e.target.value)}
              />
            </CardContent>
          </Card>


          {/* Payment Settings Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key /> Payment Settings</CardTitle>
              <CardDescription>
                Your live payment keys. Stripe will automatically show payment options (like PayPal, Apple Pay) that you've enabled in your Stripe Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">

                {/* Stripe Configuration */}
                <div className="p-6 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                  <h3 className="font-semibold mb-4 text-lg text-yellow-800">Stripe Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stripe-public-key">Public Key {settings[SETTING_KEYS.STRIPE_PUBLIC_KEY] && <span className="text-green-600">✓ Loaded</span>}</Label>
                      <Input
                        id="stripe-public-key"
                        type="text"
                        placeholder={settings[SETTING_KEYS.STRIPE_PUBLIC_KEY] ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'pk_live_...'}
                        value={settings[SETTING_KEYS.STRIPE_PUBLIC_KEY] || ''}
                        onChange={(e) => handleInputChange(SETTING_KEYS.STRIPE_PUBLIC_KEY, e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe-secret-key">Secret Key {settings[SETTING_KEYS.STRIPE_SECRET_KEY] && <span className="text-green-600">✓ Loaded</span>}</Label>
                      <div className="relative">
                        <Input
                          id="stripe-secret-key"
                          type={showSecrets[SETTING_KEYS.STRIPE_SECRET_KEY] ? 'text' : 'password'}
                          placeholder={settings[SETTING_KEYS.STRIPE_SECRET_KEY] ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'sk_live_...'}
                          value={settings[SETTING_KEYS.STRIPE_SECRET_KEY] || ''}
                          onChange={(e) => handleInputChange(SETTING_KEYS.STRIPE_SECRET_KEY, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => toggleShowSecret(SETTING_KEYS.STRIPE_SECRET_KEY)}
                        >
                          {showSecrets[SETTING_KEYS.STRIPE_SECRET_KEY] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="stripe-webhook-secret">Webhook Secret {settings[SETTING_KEYS.STRIPE_WEBHOOK_SECRET] && <span className="text-green-600">✓ Loaded</span>}</Label>
                      <div className="relative">
                        <Input
                          id="stripe-webhook-secret"
                          type={showSecrets[SETTING_KEYS.STRIPE_WEBHOOK_SECRET] ? 'text' : 'password'}
                          placeholder={settings[SETTING_KEYS.STRIPE_WEBHOOK_SECRET] ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'whsec_...'}
                          value={settings[SETTING_KEYS.STRIPE_WEBHOOK_SECRET] || ''}
                          onChange={(e) => handleInputChange(SETTING_KEYS.STRIPE_WEBHOOK_SECRET, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => toggleShowSecret(SETTING_KEYS.STRIPE_WEBHOOK_SECRET)}
                        >
                          {showSecrets[SETTING_KEYS.STRIPE_WEBHOOK_SECRET] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LinkIcon /> Social Media Links</CardTitle>
              <CardDescription>
                Enter the full URLs for your social media profiles. Icons will appear in the footer if a URL is provided.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="facebook-url" className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook URL</Label>
                  <Input
                    id="facebook-url"
                    type="url"
                    placeholder="https://facebook.com/yourpage"
                    value={settings[SETTING_KEYS.SOCIAL_FACEBOOK_URL] || ''}
                    onChange={(e) => handleInputChange(SETTING_KEYS.SOCIAL_FACEBOOK_URL, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="instagram-url" className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" /> Instagram URL</Label>
                  <Input
                    id="instagram-url"
                    type="url"
                    placeholder="https://instagram.com/yourprofile"
                    value={settings[SETTING_KEYS.SOCIAL_INSTAGRAM_URL] || ''}
                    onChange={(e) => handleInputChange(SETTING_KEYS.SOCIAL_INSTAGRAM_URL, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin-url" className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-sky-700" /> LinkedIn URL</Label>
                  <Input
                    id="linkedin-url"
                    type="url"
                    placeholder="https://linkedin.com/company/yourcompany"
                    value={settings[SETTING_KEYS.SOCIAL_LINKEDIN_URL] || ''}
                    onChange={(e) => handleInputChange(SETTING_KEYS.SOCIAL_LINKEDIN_URL, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="x-url" className="flex items-center gap-2"><Twitter className="w-4 h-4 text-black" /> X / Twitter URL</Label>
                  <Input
                    id="x-url"
                    type="url"
                    placeholder="https://x.com/yourhandle"
                    value={settings[SETTING_KEYS.SOCIAL_X_URL] || ''}
                    onChange={(e) => handleInputChange(SETTING_KEYS.SOCIAL_X_URL, e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamically rendered API Integration sections */}
          {settingsSections.map((section) => (
            <Card key={section.title} className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5" /> {section.title}
                </CardTitle>
                <CardDescription>
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.settings.map((setting) => (
                    <div key={setting.key}>
                      <Label htmlFor={setting.key} className="flex items-center gap-2">
                        {setting.label}
                        {settings[setting.key] && (setting.type === 'url' || setting.type === 'text') && <span className="text-green-600">✓ Loaded</span>}
                        {settings[setting.key] && setting.type === 'password' && <span className="text-green-600">✓ Set</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id={setting.key}
                          type={setting.type === 'password' ? (showSecrets[setting.key] ? 'text' : 'password') : setting.type}
                          placeholder={setting.type === 'password' && settings[setting.key] ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : setting.placeholder}
                          value={settings[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          className="mt-2"
                        />
                        {setting.type === 'password' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => toggleShowSecret(setting.key)}
                          >
                            {showSecrets[setting.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end items-center gap-4 pt-4 border-t mt-6">
          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-slate-800 hover:bg-slate-900">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
