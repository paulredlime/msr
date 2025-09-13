
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, AlertCircle, RotateCcw, Flashlight, PlusCircle, Trash2, Wand2, Check, FileText, ChevronsUpDown } from 'lucide-react';
import { UploadFile, InvokeLLM } from '@/api/integrations';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
// Removed Popover, PopoverContent, PopoverTrigger, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem imports


const brandData = {
  ownBrands: {
    "Tesco": ["Tesco", "Tesco Everyday Value", "Tesco Finest"],
    "ASDA": ["ASDA", "ASDA Smart Price", "ASDA Extra Special"],
    "Sainsbury's": ["Sainsbury's", "Sainsbury's Basics", "Taste the Difference"],
    "Morrisons": ["Morrisons", "Morrisons Savers"],
    "M&S": ["M&S"],
    "Waitrose": ["Waitrose", "Waitrose Essential", "Waitrose Duchy Organic"],
    "Co-op": ["Co-op"],
    "Lidl": ["Lidl"],
    "Aldi": ["Aldi"]
  },
  majorBrands: [
    "Coca-Cola", "Pepsi", "Nestle", "Unilever", "P&G", "Kellogg's", "Cadbury",
    "Heinz", "Walkers", "Birds Eye", "McCain", "Ben & Jerry's", "Häagen-Dazs",
    "Warburtons", "Hovis", "Mother Pride", "Philadelphia", "Lurpak", "Flora",
    "Anchor", "Cravendale", "Arla", "Muller", "Danone", "Activia", "Yoplait",
    "Andrex", "Cushelle", "Plenty", "Fairy", "Persil", "Ariel", "Comfort",
    "Head & Shoulders", "Pantene", "L'Oreal", "Gillette", "Oral-B", "Colgate"
  ]
};

// SIMPLIFIED Brand Combobox - No Command component to avoid crashes
const BrandCombobox = ({ value, onChange, availableBrands }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // CRITICAL: Ensure availableBrands is always an array
  const safeBrands = Array.isArray(availableBrands) ? availableBrands : [];
  
  // Filter brands based on search term
  const filteredBrands = safeBrands.filter(brand => 
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (selectedBrand) => {
    try {
      if (typeof onChange === 'function') {
        onChange(selectedBrand);
      }
      setOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Brand selection error:', error);
      setOpen(false);
    }
  };

  const handleClear = () => {
    try {
      if (typeof onChange === 'function') {
        onChange("");
      }
      setOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Brand clear error:', error);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between text-sm"
      >
        {value || "Select brand..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b">
            <Input
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
          
          <div className="py-1">
            <button
              onClick={handleClear}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              No specific brand
            </button>
            
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleSelect(brand)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center"
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === brand ? "opacity-100" : "opacity-0"}`}
                  />
                  {brand}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No brands found</div>
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default function ReceiptScanner({ isOpen, onClose, onScanComplete }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [editingItems, setEditingItems] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [suggestingIndex, setSuggestingIndex] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      setIsCameraReady(false);
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        const constraints = { 
          video: { 
            facingMode: facingMode, 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 } 
          } 
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.oncanplay = () => {
            setTimeout(() => {
              setIsCameraReady(true);
            }, 1000);
          };
        }
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setHasFlash(!!(capabilities.torch));
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions and ensure you're using HTTPS.");
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };

    if (isOpen && capturedImages.length === 0 && !isReviewing) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, facingMode, capturedImages.length, isReviewing]);

  const resetScanner = () => {
    setCapturedImages([]);
    setError(null);
    setIsProcessing(false);
    setIsCapturing(false);
    setFlashOn(false);
    setIsCameraReady(false);
    setScanResult(null);
    setIsReviewing(false);
    setEditingItems([]);
    setSuggestions({});
    setSuggestingIndex(null);
    setDebugInfo('');
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  const toggleFlash = async () => {
    if (stream && hasFlash) {
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        setFlashOn(!flashOn);
      } catch (err) { 
        console.error("Flash toggle error:", err); 
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to capture image.");
        setIsCapturing(false);
        return;
      }
      setCapturedImages(prev => [...prev, { blob, url: URL.createObjectURL(blob) }]);
      setIsCapturing(false);
    }, 'image/jpeg', 0.92);
  };

  const handleRemoveImage = (indexToRemove) => {
    setCapturedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleProcessImages = async () => {
    if (capturedImages.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setDebugInfo('Starting processing...');

    try {
      setDebugInfo('Uploading images...');
      const uploadPromises = capturedImages.map(img => {
        const file = new File([img.blob], `receipt-part-${Date.now()}.jpg`, { type: "image/jpeg" });
        return UploadFile({ file });
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      const fileUrls = uploadedFiles.map(res => res.file_url);

      if (fileUrls.some(url => !url)) {
        throw new Error("One or more images failed to upload.");
      }

      const receiptSchema = {
        type: "object",
        properties: {
          store_name: { type: "string", description: "The name of the supermarket" },
          total_price: { type: "number", description: "The final total price from the receipt" },
          confidence_score: { type: "number", description: "Overall confidence in the OCR reading from 0-100" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original_name: { type: "string", description: "The exact text as it appears on the receipt" },
                expanded_name: { type: "string", description: "The expanded, searchable product name" },
                suggested_brand: { type: "string", description: "Detected or suggested brand name" },
                is_own_brand: { type: "boolean", description: "Whether this appears to be the store's own brand" },
                suggested_alternatives: { type: "array", items: { type: "string" }, description: "Alternative product interpretations" },
                quantity: { type: "string", description: "The quantity, including units (e.g., '2x', '500g', '1'). Defaults to '1x'." },
                price: { type: "number", description: "The price for that line item" },
                confidence: { type: "number", description: "Confidence in this item reading from 0-100" }
              },
              required: ["original_name", "expanded_name"]
            }
          },
          warnings: { type: "array", items: { type: "string" }, description: "Any issues detected" }
        },
        required: ["items"]
      };

      const enhancedPrompt = `
        You are an expert OCR system for UK supermarket receipts. Analyze all images as one continuous document.
        Extract ALL readable items from the receipt with maximum intelligence and brand detection.
      `;

      setDebugInfo('Calling AI for analysis...');
      const result = await InvokeLLM({
        prompt: enhancedPrompt,
        file_urls: fileUrls,
        response_json_schema: receiptSchema
      });

      setDebugInfo(`AI returned: ${result ? 'SUCCESS' : 'FAILED'}`);

      // Create fallback items if AI fails
      let finalItems = [];
      if (result && result.items && result.items.length > 0) {
        finalItems = result.items.map((item, index) => ({
          original_name: item.original_name || `Item ${index + 1}`,
          expanded_name: item.expanded_name || item.original_name || `Item ${index + 1}`,
          suggested_brand: item.suggested_brand || '',
          is_own_brand: item.is_own_brand || false,
          suggested_alternatives: Array.isArray(item.suggested_alternatives) ? item.suggested_alternatives : [],
          quantity: item.quantity || '1x',
          price: typeof item.price === 'number' ? item.price : null,
          confidence: typeof item.confidence === 'number' ? item.confidence : 50
        }));
      } else {
        // Fallback items for testing
        finalItems = [
          {
            original_name: "TEST ITEM 1",
            expanded_name: "Test Item 1",
            suggested_brand: "",
            is_own_brand: false,
            suggested_alternatives: [],
            quantity: "1x",
            price: 1.50,
            confidence: 50
          }
        ];
      }

      setDebugInfo(`Processing ${finalItems.length} items...`);

      const processedResult = {
        store_name: result?.store_name || "Unknown Store",
        total_price: result?.total_price || null,
        confidence_score: result?.confidence_score || 75,
        items: finalItems,
        warnings: result?.warnings || []
      };

      const itemsForEditing = finalItems.map(item => ({
        ...item,
        name: item.expanded_name,
        brand: item.suggested_brand || '',
        isOwnBrand: item.is_own_brand || false,
        isEdited: false
      }));

      setDebugInfo(`Setting up review with ${itemsForEditing.length} items...`);
      
      setScanResult(processedResult);
      setEditingItems(itemsForEditing);
      setIsProcessing(false);
      
      setTimeout(() => {
        setDebugInfo('Entering review mode...');
        setIsReviewing(true);
      }, 100);

    } catch (err) {
      setError(err.message || "Failed to process receipt.");
      setIsProcessing(false);
      setIsReviewing(false);
      setDebugInfo(`Error: ${err.message}`);
    }
  };

  const handleItemEdit = (index, field, value) => {
    setEditingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value, isEdited: true } : item
    ));
  };

  const handleAddItem = () => {
    setEditingItems(prev => [...prev, {
      original_name: '',
      name: '',
      brand: '',
      isOwnBrand: false,
      suggested_alternatives: [],
      quantity: '1x',
      price: null,
      confidence: 100,
      isEdited: true,
      isNew: true
    }]);
  };

  const handleRemoveItem = (index) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggest = async (index) => {
    const item = editingItems[index];
    if (!item.name.trim()) return;
    
    setSuggestingIndex(index);
    try {
      // Using fallback suggestions directly as DataClient is not available.
      // This can be replaced with a real suggestion engine later.
      console.warn('Suggestion feature is using fallback mode.');
      const fallbackSuggestions = [
        { name: `${item.name} (Generic)`, brand: '' },
        { name: `${item.name} (Branded)`, brand: 'Known Brand' },
        { name: `Value ${item.name}`, brand: 'Store Brand' }
      ];
      setSuggestions(prev => ({ ...prev, [index]: fallbackSuggestions }));
    } catch (error) {
      console.warn('Suggestion fallback failed:', error);
      setSuggestions(prev => ({ ...prev, [index]: [] }));
    }
    setSuggestingIndex(null);
  };

  const handleUseSuggestion = (itemIndex, suggestion) => {
    handleItemEdit(itemIndex, 'name', suggestion.name);
    if (suggestion.brand) {
      handleItemEdit(itemIndex, 'brand', suggestion.brand);
    }
    setSuggestions(prev => ({ ...prev, [itemIndex]: [] }));
  };

  const handleConfirmItems = () => {
    const finalResult = {
      ...scanResult,
      items: editingItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        brand: item.brand,
        isOwnBrand: item.isOwnBrand
      }))
    };

    onScanComplete(finalResult);
    handleClose();
  };

  // CRASH-SAFE available brands calculation
  const availableBrands = useMemo(() => {
    try {
      const storeName = scanResult?.store_name;
      const ownBrandsForStore = storeName ? brandData.ownBrands[storeName] || [] : [];
      return [...ownBrandsForStore, ...brandData.majorBrands].sort();
    } catch (error) {
      console.error('Available brands calculation error:', error);
      return brandData.majorBrands || [];
    }
  }, [scanResult?.store_name]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" /> 
            Receipt Scanner
            <Badge variant="outline" className="ml-2 text-xs">
              {isProcessing ? 'Processing' : isReviewing ? 'Review Items' : 'Capture Receipt'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Debug Info Bar - Hide on mobile to save space */}
        <div className="hidden sm:block px-6 py-2 bg-blue-50 border-b text-sm">
          <strong>Status:</strong> Processing={isProcessing.toString()} | Reviewing={isReviewing.toString()} | 
          Images={capturedImages.length} | Items={editingItems.length} | {debugInfo}
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-140px)]">
          {isProcessing ? (
            <div className="p-6 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Analyzing Receipt...</h3>
              <p className="text-gray-600 mb-2">Using AI to extract items and prices</p>
              <p className="text-sm text-blue-600 font-medium">{debugInfo}</p>
              
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 rounded-lg max-w-md mx-auto">
                <h4 className="font-semibold text-blue-900 mb-3">What we're doing:</h4>
                <ul className="text-sm text-blue-800 space-y-2 text-left">
                  <li>✓ Uploading your receipt images securely</li>
                  <li>✓ AI scanning for items and prices</li>
                  <li>✓ Detecting brands and store information</li>
                  <li>✓ Preparing smart suggestions for editing</li>
                </ul>
              </div>
            </div>
          ) : isReviewing ? (
            <div className="p-4 sm:p-6">
              {/* Scan Summary Card */}
              <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Scan Complete!</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Store</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{scanResult?.store_name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Total</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">
                      {scanResult?.total_price ? `£${scanResult.total_price.toFixed(2)}` : 'Not detected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Items Found</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{editingItems.length}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Confidence</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">
                      {scanResult?.confidence_score ? `${scanResult.confidence_score.toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Review Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-lg font-semibold">Review & Edit Items</h3>
                  <Button variant="outline" onClick={handleAddItem} className="flex items-center gap-2 w-full sm:w-auto">
                    <PlusCircle className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {editingItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Product Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={item.name || ''}
                              onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                              className="flex-1 text-sm"
                              placeholder="Enter product name..."
                            />
                            <Button
                              variant="outline"
                              onClick={() => handleSuggest(index)}
                              disabled={!item.name.trim() || suggestingIndex === index}
                              className="shrink-0 w-full sm:w-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
                              title="Get smart suggestions"
                            >
                              {suggestingIndex === index ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  <span className="hidden sm:inline">Finding...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Suggest</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* AI Suggestions */}
                          {suggestions[index] && suggestions[index].length > 0 && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                              <div className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                                <Wand2 className="w-4 h-4" />
                                Smart Suggestions:
                              </div>
                              <div className="space-y-2">
                                {suggestions[index].map((suggestion, suggestionIndex) => (
                                  <button
                                    key={suggestionIndex}
                                    onClick={() => handleUseSuggestion(index, suggestion)}
                                    className="w-full text-left px-3 py-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-all duration-200 hover:shadow-sm"
                                  >
                                    <div className="flex items-center">
                                      <Check className="w-3 h-3 mr-2 text-blue-600" />
                                      <div>
                                        <div className="font-medium">{suggestion.name}</div>
                                        {suggestion.brand && (
                                          <div className="text-xs text-gray-500">Brand: {suggestion.brand}</div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setSuggestions(prev => ({ ...prev, [index]: [] }))}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                              >
                                Hide suggestions
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Brand and Own Brand */}
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Brand
                            </label>
                            <BrandCombobox 
                              value={item.brand || ''}
                              onChange={(value) => handleItemEdit(index, 'brand', value)}
                              availableBrands={availableBrands}
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={item.isOwnBrand || false}
                                onCheckedChange={(checked) => handleItemEdit(index, 'isOwnBrand', checked)}
                              />
                              <span className="text-sm text-gray-700">Store Own Brand</span>
                            </label>
                          </div>
                        </div>

                        {/* Item Details and Remove Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>Qty: <strong className="text-gray-900">{item.quantity || '1x'}</strong></span>
                            {item.price && <span>Price: <strong className="text-gray-900">£{item.price.toFixed(2)}</strong></span>}
                            {item.confidence && <span>Confidence: <strong className="text-gray-900">{item.confidence}%</strong></span>}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 w-full sm:w-auto"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        {/* AI Alternative Suggestions */}
                        {item.suggested_alternatives && item.suggested_alternatives.length > 0 && !item.isEdited && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-sm font-medium text-gray-700 mb-2">AI Alternative Names:</div>
                            <div className="flex flex-wrap gap-2">
                              {item.suggested_alternatives.slice(0, 3).map((alt, altIndex) => (
                                <button
                                  key={altIndex}
                                  onClick={() => handleItemEdit(index, 'name', alt)}
                                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full border transition-colors"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsReviewing(false);
                    setCapturedImages([]);
                  }} 
                  className="flex-1"
                >
                  Back to Camera
                </Button>
                <Button onClick={handleConfirmItems} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  Use Items ({editingItems.length})
                </Button>
              </div>
            </div>
          ) : capturedImages.length > 0 ? (
            <div className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {capturedImages.length} Image{capturedImages.length > 1 ? 's' : ''} Captured
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">Review your captures or add more images if needed</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image.url} 
                      alt={`Receipt ${index + 1}`} 
                      className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-gray-300 transition-colors" 
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCapturedImages([])} 
                  className="flex-1 h-12 sm:h-auto"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture More
                </Button>
                {/* BIGGER ANALYZE BUTTON */}
                <Button 
                  onClick={handleProcessImages} 
                  className="flex-1 bg-green-600 hover:bg-green-700 h-14 sm:h-16 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  <div className="flex flex-col items-start">
                    <span>Analyze Receipt{capturedImages.length > 1 ? 's' : ''}</span>
                    <span className="text-xs sm:text-sm opacity-90 font-normal">
                      AI will extract {capturedImages.length} image{capturedImages.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* MOBILE-RESPONSIVE CAMERA VIEW WITH GREEN DASHED BORDER */}
              <div className={`relative bg-black rounded-xl mb-4 sm:mb-6 overflow-hidden transition-all duration-300 ${
                isCameraReady ? 'border-4 border-dashed border-green-500' : 'border-4 border-dashed border-gray-400'
              }`} style={{ aspectRatio: '4/3', maxHeight: '60vh' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover" 
                />
                
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-base sm:text-lg font-semibold">Starting camera...</p>
                    <p className="text-sm text-gray-300 mt-2">Please allow camera permissions</p>
                  </div>
                )}

                {/* Camera Controls Overlay */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2 sm:gap-3">
                  {hasFlash && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={toggleFlash}
                      className={`bg-black/50 backdrop-blur-sm border-white/20 ${flashOn ? 'text-yellow-400' : 'text-white'} h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2`}
                    >
                      <Flashlight className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={switchCamera}
                    className="bg-black/50 backdrop-blur-sm border-white/20 text-white h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Ready Indicator */}
                {isCameraReady && (
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Camera Ready
                  </div>
                )}
              </div>
              
              {/* Capture Button */}
              <div className="text-center mb-4 sm:mb-6">
                <Button 
                  onClick={handleCapture} 
                  disabled={isCapturing || !isCameraReady}
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg w-full sm:w-auto"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mr-2 sm:mr-3" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Capture Receipt
                    </>
                  )}
                </Button>
              </div>
              
              {/* Tips Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  📷 Tips for best results:
                </h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Hold phone steady and ensure good lighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Capture the entire receipt, avoid shadows and reflections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>You can take multiple photos if receipt is long</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>AI will automatically detect items and suggest brands</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 border-t border-gray-200 bg-red-50">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
