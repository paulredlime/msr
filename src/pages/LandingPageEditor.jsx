
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { LandingPageContent } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload,
  Image as ImageIcon,
  Video,
  Palette,
  Type,
  Layout,
  Star,
  Sparkles
} from "lucide-react";

const sections = [
  { id: 'hero', name: 'Hero Section', icon: Sparkles },
  { id: 'features', name: 'Features', icon: Star },
  { id: 'pricing', name: 'Pricing', icon: Layout },
  { id: 'testimonials', name: 'Testimonials', icon: Type },
  { id: 'cta', name: 'Call to Action', icon: Palette }
];

export default function LandingPageEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({});
  const [activeSection, setActiveSection] = useState('hero');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

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
      await loadContent();
    } catch (error) {
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  };

  const loadContent = async () => {
    try {
      const allContent = await LandingPageContent.list();
      const contentBySection = {};
      allContent.forEach(item => {
        contentBySection[item.section] = item;
      });
      setContent(contentBySection);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleSaveSection = async () => {
    setSaving(true);
    try {
      const sectionData = content[activeSection];
      if (sectionData && sectionData.id) {
        await LandingPageContent.update(sectionData.id, sectionData);
      } else {
        const newContent = await LandingPageContent.create({
          ...sectionData,
          section: activeSection
        });
        setContent(prev => ({
          ...prev,
          [activeSection]: { ...sectionData, id: newContent.id }
        }));
      }
      setSuccessMessage(`${sections.find(s => s.id === activeSection)?.name} saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
    }
    setSaving(false);
  };

  const handleFileUpload = async (file, field) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await UploadFile({ file });
      const sectionData = content[activeSection] || {};
      
      if (field === 'background') {
        sectionData.background_type = file.type.startsWith('video/') ? 'video' : 'image';
        sectionData.background_value = result.file_url;
      } else { // field === 'image'
        sectionData.image_url = result.file_url;
      }
      
      setContent(prev => ({
        ...prev,
        [activeSection]: { ...prev[activeSection], ...sectionData }
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      // The platform will display the error to the user
    }
    setUploadingFile(false);
  };

  const updateSectionData = (field, value) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Editor...</span>
        </div>
      </div>
    );
  }

  const currentSectionData = content[activeSection] || {};

  return (
    <div className="min-h-screen">
      {/* Header */}
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
                Back to Admin
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Layout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Landing Page Editor</h1>
                  <p className="text-sm text-gray-500">Customize your homepage content</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.open(createPageUrl("Landing"), '_blank')}
                className="border-amber-200 hover:bg-amber-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveSection}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Section
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {successMessage && (
            <Alert className="mb-8 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Section Navigation */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Page Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          activeSection === section.id 
                            ? 'bg-amber-600 hover:bg-amber-700' 
                            : 'hover:bg-amber-50'
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <section.icon className="w-4 h-4 mr-3" />
                        {section.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Editor */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {sections.find(s => s.id === activeSection)?.icon && 
                        React.createElement(sections.find(s => s.id === activeSection).icon, { className: "w-5 h-5" })
                      }
                      Edit {sections.find(s => s.id === activeSection)?.name}
                    </CardTitle>
                    <Badge variant="outline">
                      {currentSectionData.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="design">Design</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-6 mt-6">
                      <div>
                        <Label htmlFor="subtitle">Badge Text</Label>
                        <Input
                          id="subtitle"
                          value={currentSectionData.subtitle || ''}
                          onChange={(e) => updateSectionData('subtitle', e.target.value)}
                          placeholder="e.g., 🎉 Save £200+ Monthly"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={currentSectionData.title || ''}
                          onChange={(e) => updateSectionData('title', e.target.value)}
                          placeholder="Enter section title"
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={currentSectionData.content_data || ''}
                          onChange={(e) => updateSectionData('content_data', e.target.value)}
                          placeholder="Enter main description for the section"
                          className="mt-2 min-h-24"
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="button_text">Button Text</Label>
                          <Input
                            id="button_text"
                            value={currentSectionData.button_text || ''}
                            onChange={(e) => updateSectionData('button_text', e.target.value)}
                            placeholder="e.g., Get Started Free"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="button_url">Button URL</Label>
                          <Input
                            id="button_url"
                            value={currentSectionData.button_url || ''}
                            onChange={(e) => updateSectionData('button_url', e.target.value)}
                            placeholder="e.g., /Dashboard"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="design" className="space-y-6 mt-6">
                      <div>
                        <Label htmlFor="background_type">Background Type</Label>
                        <Select 
                          value={currentSectionData.background_type || 'gradient'} 
                          onValueChange={(value) => updateSectionData('background_type', value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select background type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="color">Solid Color</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="background_value">Background Value</Label>
                        <Input
                          id="background_value"
                          value={currentSectionData.background_value || ''}
                          onChange={(e) => updateSectionData('background_value', e.target.value)}
                          placeholder={
                            currentSectionData.background_type === 'gradient' ? 'e.g., from-teal-50 to-amber-100' :
                            currentSectionData.background_type === 'color' ? 'e.g., #f3f4f6' :
                            'Upload file or enter URL'
                          }
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="media" className="space-y-6 mt-6">
                      <div>
                        <Label>Background Media</Label>
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {currentSectionData.background_value && 
                           (currentSectionData.background_type === 'image' || currentSectionData.background_type === 'video') ? (
                            <div className="mb-4">
                              {currentSectionData.background_type === 'video' ? (
                                <video 
                                  src={currentSectionData.background_value}
                                  className="max-w-full h-32 mx-auto rounded"
                                  controls
                                />
                              ) : (
                                <img 
                                  src={currentSectionData.background_value}
                                  alt="Background"
                                  className="max-w-full h-32 mx-auto rounded object-cover"
                                />
                              )}
                            </div>
                          ) : null}
                          
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileUpload(file, 'background');
                            }}
                            disabled={uploadingFile}
                            className="mb-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                          />
                          
                          {uploadingFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                             <>
                              <p className="text-gray-500">Upload background image or video</p>
                              <p className="text-xs text-red-500 mt-2">Note: Max file size is 20MB. For larger videos, please upload to a service like YouTube and use the 'Design' tab to paste the URL.</p>
                             </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Section Image</Label>
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {currentSectionData.image_url && (
                            <div className="mb-4">
                              <img 
                                src={currentSectionData.image_url}
                                alt="Section"
                                className="max-w-full h-32 mx-auto rounded object-cover"
                              />
                            </div>
                          )}
                          
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileUpload(file, 'image');
                            }}
                            disabled={uploadingFile}
                            className="mb-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                          />
                          
                          <p className="text-gray-500">Upload section image</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
