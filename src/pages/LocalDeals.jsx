
import React, { useState, useEffect, useRef } from 'react';
import { LocalDeal } from '@/api/entities';
import { User } from '@/api/entities'; // Added User import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScanLine, Camera, Upload, MapPin, Clock, CheckCircle, AlertTriangle, Eye, Trash2, Plus } from 'lucide-react';
import { InvokeLLM, UploadFile } from '@/api/integrations';
import { toast } from 'sonner';

export default function LocalDeals() {
  const [deals, setDeals] = useState([]);
  const [user, setUser] = useState(null); // Added user state
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    loadDealsAndUser(); // Changed to loadDealsAndUser
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadDealsAndUser = async () => { // Renamed and refactored loadDeals
    try {
      const [allDeals, currentUser] = await Promise.all([
        LocalDeal.list('-created_date'),
        User.me().catch(() => null) // Handle case where user is not logged in
      ]);
      setDeals(allDeals);
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading deals and user:', error);
    }
    setLoading(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      setCapturedImage({
        blob,
        url: URL.createObjectURL(blob)
      });
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setCapturedImage({
        blob: file,
        url: URL.createObjectURL(file)
      });
    }
  };

  const processImage = async () => {
    if (!capturedImage || !storeName.trim()) {
      toast.error('Please provide store name and capture/upload an image.');
      return;
    }

    setProcessingImage(true);
    
    try {
      // Upload image
      const file = new File([capturedImage.blob], `deal-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file });

      // Extract deal text using AI
      const prompt = `Extract all deal information from this store flyer/window display image. Focus on: product names, prices, discount percentages, special offers, dates. Return JSON with extracted_deals array containing: product_name, original_price, sale_price, discount_info, valid_dates.`;
      
      const result = await InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            extracted_deals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  original_price: { type: "string" },
                  sale_price: { type: "string" },
                  discount_info: { type: "string" },
                  valid_dates: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Format extracted deals for display
      const dealText = result.extracted_deals?.map(deal => 
        `${deal.product_name}: ${deal.sale_price} (was ${deal.original_price}) - ${deal.discount_info} ${deal.valid_dates ? `Valid: ${deal.valid_dates}` : ''}`
      ).join('\n') || 'Deal information extracted from uploaded image';

      // Save to database
      await LocalDeal.create({
        store_name: storeName,
        deal_text: dealText,
        image_url: file_url,
        valid_until: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending_review'
      });

      toast.success('Deal uploaded successfully! It will be reviewed and approved soon.');
      
      // Reset form
      setCapturedImage(null);
      setStoreName('');
      setValidUntil('');
      setShowScanner(false);
      
      // Reload deals
      loadDealsAndUser(); // Changed to loadDealsAndUser

    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setProcessingImage(false);
    }
  };

  const deleteMyDeal = async (dealId) => {
    try {
      await LocalDeal.delete(dealId);
      toast.success('Deal deleted successfully.');
      loadDealsAndUser(); // Changed to loadDealsAndUser
    } catch (error) {
      toast.error('Failed to delete deal.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-red-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <ScanLine className="w-16 h-16 mx-auto text-orange-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Deals Scanner</h1>
          <p className="text-lg text-gray-600">Crowdsource local deals by scanning store windows and flyers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur mb-6">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Camera className="w-6 h-6" />
                  Scan or Upload Deal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="camera" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Camera Scan
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="camera" className="mt-6">
                    {!stream && !capturedImage && (
                      <div className="text-center py-8">
                        <div className="bg-gray-100 rounded-lg p-8 mb-4">
                          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-4">Use your camera to scan store windows, flyers, or promotional materials</p>
                          <Button onClick={startCamera} className="bg-orange-600 hover:bg-orange-700">
                            <Camera className="w-4 h-4 mr-2" />
                            Start Camera
                          </Button>
                        </div>
                      </div>
                    )}

                    {stream && !capturedImage && (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg"
                          style={{ maxHeight: '400px' }}
                        />
                        <div className="absolute inset-0 border-4 border-dashed border-white rounded-lg pointer-events-none">
                          <div className="absolute inset-4 border border-white/50 rounded-lg">
                            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-orange-500"></div>
                            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-orange-500"></div>
                            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-orange-500"></div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-orange-500"></div>
                          </div>
                        </div>
                        <div className="flex justify-center gap-3 mt-4">
                          <Button onClick={stopCamera} variant="outline">
                            Cancel
                          </Button>
                          <Button onClick={capturePhoto} className="bg-orange-600 hover:bg-orange-700">
                            <Camera className="w-4 h-4 mr-2" />
                            Capture Photo
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6">
                    <div className="text-center py-8">
                      <div className="bg-gray-100 rounded-lg p-8 mb-4">
                        <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">Upload a photo of a store flyer or promotional display</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="deal-upload"
                        />
                        <label htmlFor="deal-upload">
                          <Button asChild className="bg-orange-600 hover:bg-orange-700">
                            <span className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Image
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {capturedImage && (
                  <div className="mt-6">
                    <img 
                      src={capturedImage.url} 
                      alt="Captured deal" 
                      className="w-full max-h-64 object-contain rounded-lg mb-4"
                    />
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="storeName">Store Name *</Label>
                        <Input
                          id="storeName"
                          placeholder="e.g., Local Tesco, Corner Shop, etc."
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => setCapturedImage(null)}
                          variant="outline"
                          className="flex-1"
                        >
                          Retake/Upload Another
                        </Button>
                        <Button 
                          onClick={processImage}
                          disabled={processingImage}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          {processingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ScanLine className="w-4 h-4 mr-2" />
                              Extract Deals
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Deals Sidebar */}
          <div>
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="w-6 h-6" />
                  Community Deals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {deals.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {deals.slice(0, 10).map(deal => (
                      <div key={deal.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{deal.store_name}</h4>
                          <Badge className={
                            deal.status === 'approved' ? 'bg-green-100 text-green-800' :
                            deal.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {deal.status === 'pending_review' ? 'Pending' : 
                             deal.status === 'approved' ? 'Live' : 'Rejected'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-3">{deal.deal_text}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(deal.created_date).toLocaleDateString()}
                          </span>
                          {user && deal.created_by === user.email && ( // Ensured user check
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMyDeal(deal.id)}
                              className="text-red-600 hover:text-red-800 h-6 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No community deals yet.</p>
                    <p className="text-gray-400 text-xs">Be the first to share a local deal!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <Card className="mt-8 shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-6 h-6" />
              How Local Deals Scanner Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Scan or Upload</h3>
                <p className="text-sm text-gray-600">Take a photo of store windows, flyers, or promotional displays using your camera or upload existing images.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">2. AI Extraction</h3>
                <p className="text-sm text-gray-600">Our AI automatically extracts product names, prices, discounts, and validity dates from your images.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Community Sharing</h3>
                <p className="text-sm text-gray-600">Approved deals are shared with the community, helping everyone save money on local shopping.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
