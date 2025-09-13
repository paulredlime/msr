
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InvokeLLM } from '@/api/integrations';
import {
  Camera,
  Loader2,
  X,
  AlertCircle,
  Package,
  ExternalLink,
  Heart,
  ShoppingCart,
  CheckCircle,
  Edit,
  RotateCcw,
  Flashlight
} from 'lucide-react';
import { FavoriteItem } from '@/api/entities';
import { ScannedProduct } from '@/api/entities';
import { ScannedPrice } from '@/api/entities';

const supermarkets = [
  { id: 'tesco', name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png' },
  { id: 'asda', name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png' },
  { id: 'sainsburys', name: "Sainsbury's", logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png' },
  { id: 'morrisons', name: 'Morrisons', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png' },
  { id: 'aldi', name: 'Aldi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png' },
  { id: 'lidl', name: 'Lidl', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png' },
  { id: 'waitrose', name: 'Waitrose', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png' },
  { id: 'iceland', name: 'Iceland', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png' },
  { id: 'coop', name: 'Co-op', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png' },
  { id: 'bm', name: 'B&M', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/60b1472c0_image.png' },
  { id: 'homebargains', name: 'Home Bargains', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/241014374_image.png' },
];

export default function BarcodeScanner({
  isOpen,
  onClose,
  onProductFound,
  mode = 'compare',
  title = 'Barcode Scanner'
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('Initializing scanner...');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProductData, setManualProductData] = useState({ name: '', brand: '', size: '' });
  const [isQuaggaReady, setIsQuaggaReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const scannerRef = useRef(null);
  const quaggaInitialized = useRef(false);

  // Load QuaggaJS library and initialize scanner
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen || scannedProduct || showManualEntry) {
      stopScanner();
      return;
    }

    const initializeQuagga = () => {
      if (!scannerRef.current || quaggaInitialized.current) return;

      setScanningStatus('Starting camera...');

      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: facingMode
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      };

      window.Quagga.init(config, (err) => {
        if (err) {
          console.error('QuaggaJS init error:', err);
          setError('Camera access denied or not available. Please allow camera permissions.');
          setScanningStatus('Camera error');
          return;
        }

        console.log('QuaggaJS initialized successfully');
        quaggaInitialized.current = true;
        setIsQuaggaReady(true);
        setScanningStatus('Point camera at barcode');

        // Start scanning
        window.Quagga.start();
      });

      // Set up detection callback
      window.Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        console.log('Barcode detected:', code);

        // Stop scanning immediately to prevent multiple detections
        window.Quagga.stop();
        quaggaInitialized.current = false;
        setIsQuaggaReady(false);

        setScanningStatus(`Barcode detected: ${code}`);

        // Look up the product
        setTimeout(() => {
          lookupProduct(code);
        }, 500);
      });

      // Add drawing for boxes and lines
      window.Quagga.onProcessed((result) => {
        const drawingCtx = window.Quagga.canvas.ctx.overlay;
        const drawingCanvas = window.Quagga.canvas.dom.overlay;

        if (result) {
          drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
          if (result.boxes) {
            result.boxes.filter((box) => box !== result.box).forEach((box) => {
              window.Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
            });
          }

          if (result.box) {
            window.Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            window.Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
          }
        }
      });
    };

    const loadQuagga = async () => {
      // Check if QuaggaJS is already loaded
      if (window.Quagga) {
        initializeQuagga();
        return;
      }

      setScanningStatus('Loading scanner library...');

      // Load QuaggaJS from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js';
      script.async = true;
      script.onload = () => {
        console.log('QuaggaJS loaded successfully');
        initializeQuagga();
      };
      script.onerror = () => {
        setError('Failed to load barcode scanner. Please refresh the page and try again.');
        setScanningStatus('Scanner load failed');
      };
      document.head.appendChild(script);
    };

    loadQuagga();

    return () => stopScanner();
  }, [isOpen, scannedProduct, showManualEntry, facingMode]);

  const stopScanner = () => {
    if (window.Quagga && quaggaInitialized.current) {
      try {
        // Remove listeners to prevent memory leaks and redundant triggers
        window.Quagga.offDetected();
        window.Quagga.offProcessed();

        // This is the call that can fail if the DOM is not as expected.
        // We wrap it in a try-catch to prevent it from crashing the app.
        window.Quagga.stop();
      } catch (error) {
        console.warn("Quagga.stop() failed, but we caught it:", error);
        // This is not a critical error, the scanner will be stopped anyway.
      } finally {
        // Ensure we always mark the scanner as stopped
        quaggaInitialized.current = false;
        setIsQuaggaReady(false);
      }
    }
    
    // Forcefully clean the container to prevent any stale DOM elements
    // left by QuaggaJS, which can cause issues on re-initialization.
    if (scannerRef.current) {
      try {
        scannerRef.current.innerHTML = '';
      } catch (error) {
        console.warn("Could not clear scanner container:", error);
      }
    }
  };

  const lookupProduct = async (barcode) => {
    setIsProcessing(true);
    setError(null);
    setScanningStatus('Checking database for existing product...');

    // 1. Check for an existing product in our database first
    try {
      const existingProducts = await ScannedProduct.filter({ barcode: barcode }, '-created_date', 1);
      if (existingProducts.length > 0) {
        const existingProduct = existingProducts[0];
        console.log("Found existing product in DB:", existingProduct);
        setScanningStatus('Product found in database! Loading prices...');
        
        // Fetch its associated prices
        const existingPrices = await ScannedPrice.filter({ scanned_product_id: existingProduct.id });
        
        const priceDataObject = {};
        existingPrices.forEach(p => {
          priceDataObject[p.store_id] = {
            price: p.price,
            available: p.available,
            url: `https://www.${p.store_id}.com/search?q=${encodeURIComponent(existingProduct.product_name)}`,
            note: p.promotion_text || "Price may vary in-store"
          };
        });

        setScannedProduct({
          barcode: existingProduct.barcode,
          name: existingProduct.product_name,
          brand: existingProduct.brand,
          size: existingProduct.size,
          image: existingProduct.image_url,
          category: existingProduct.category,
        });
        setPriceData(priceDataObject);
        setIsProcessing(false);
        setLoadingPrices(false);
        return; // Stop execution, we found what we needed
      }
    } catch (dbError) {
      console.error("DB check failed, proceeding to live lookup:", dbError);
    }

    // 2. If not in DB, proceed with the live lookup
    setScanningStatus('Looking up product (fast search)...');

    // Tier 1: Try Open Food Facts API (fast, structured)
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (!response.ok) {
            throw new Error('API response not OK');
        }
        const data = await response.json();

        if (data.status === 1 && data.product && data.product.product_name) {
            console.log("Found product via Open Food Facts API");
            const product = data.product;
            const productInfo = {
                barcode,
                name: product.product_name || product.product_name_en || 'Unknown Product',
                brand: product.brands || 'Unknown Brand',
                size: product.quantity || '',
                image: product.image_url || product.image_front_url || `https://images.openfoodfacts.org/images/products/${barcode}/front_en.3.400.jpg`,
                category: product.categories_tags?.[0]?.replace('en:', '') || 'food',
                ingredients: product.ingredients_text || '',
                nutrition: {
                    calories: product.nutriments?.['energy-kcal_100g'] ? `${product.nutriments['energy-kcal_100g']} kcal per 100g` : '',
                    fat: product.nutriments?.fat_100g ? `${product.nutriments.fat_100g}g fat per 100g` : '',
                    protein: product.nutriments?.proteins_100g ? `${product.nutriments.proteins_100g}g protein per 100g` : ''
                }
            };

            setScannedProduct(productInfo);
            setScanningStatus('Product found!');
            setError(null);
            await generatePriceComparison(productInfo);
            setIsProcessing(false);
            return; // Exit successfully
        } else {
             console.log("Product not in Open Food Facts DB. Trying smart search...");
             throw new Error("Product not in DB");
        }
    } catch (err) {
        console.error('Tier 1 lookup failed:', err);
        // Fall through to Tier 2 (LLM)
        await lookupWithLLM(barcode);
    }
  };

  const lookupWithLLM = async (barcode) => {
    setScanningStatus('Product not found. Trying smart search...');

    try {
        const llmPrompt = `
            Based on the EAN-13 barcode "${barcode}", find the associated product sold in the UK.
            Use your knowledge and search the web to identify the product.
            Return a JSON object with the following fields: "productName", "brand", "size", "category".
            If you cannot find a definitive product, return an object with an "error" field.
        `;

        const productSchema = {
            type: "object",
            properties: {
                productName: { type: "string" },
                brand: { type: "string" },
                size: { type: "string", description: "e.g., '500g', '4 pack', '1L'" },
                category: { type: "string" },
                error: { type: "string", description: "Only include this field if the product cannot be found." }
            },
        };

        const result = await InvokeLLM({
            prompt: llmPrompt,
            response_json_schema: productSchema,
            add_context_from_internet: true
        });

        if (result && !result.error && result.productName) {
             console.log("Found product via LLM Smart Search");
            const productInfo = {
                barcode,
                name: result.productName,
                brand: result.brand || 'Unknown',
                size: result.size || '',
                image: `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=${encodeURIComponent(result.productName)}`,
                category: result.category || 'other',
            };
            setScannedProduct(productInfo);
            setScanningStatus('Product found!');
            setError(null);
            await generatePriceComparison(productInfo);
        } else {
            console.log("LLM Smart Search also failed. Falling back to manual entry.");
            initiateManualEntry(barcode);
        }

    } catch (llmError) {
        console.error('Tier 2 (LLM) lookup failed:', llmError);
        initiateManualEntry(barcode);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePriceComparison = async (product) => {
    setLoadingPrices(true);
    setPriceData(null);

    // CRITICAL FIX: Do not proceed if we don't have a valid product name.
    if (!product || !product.name || product.name === 'Unknown Product') {
        console.warn("Price comparison cancelled; product name is invalid.");
        setLoadingPrices(false);
        // Go straight to manual entry if we have a garbage name
        initiateManualEntry(product.barcode);
        return;
    }

    try {
        const supermarketNames = supermarkets.map(s => s.name).join(', ');
        // UPDATED, STRICTER PROMPT
        const pricePrompt = `
            Find the current online price for the product "${product.brand} ${product.name}" with the *exact size or quantity* of "${product.size}".
            Search these UK supermarkets: ${supermarketNames}.
            If you cannot find the exact size, do not guess. Set "available" to false for that store.
            Return a JSON object where each key is the supermarket's ID (e.g., 'tesco') and the value is an object with:
            - "price" (a number, or null if unavailable)
            - "available" (boolean)
            - "url" (string, the direct product URL)
            - "matched_size" (string, the size you found, to confirm it matches)
        `;

        // UPDATED, STRICTER SCHEMA
        const priceSchema = {
            type: "object",
            properties: supermarkets.reduce((acc, s) => {
                acc[s.id] = {
                    type: "object",
                    properties: {
                        price: { type: ["number", "null"] },
                        available: { type: "boolean" },
                        url: { type: "string" },
                        matched_size: { type: "string" }
                    },
                    required: ["available"]
                };
                return acc;
            }, {})
        };

        console.log("Fetching real prices from the web with strict matching...");
        const llmPriceResult = await InvokeLLM({
            prompt: pricePrompt,
            response_json_schema: priceSchema,
            add_context_from_internet: true
        });

        if (!llmPriceResult) throw new Error("AI price check returned no result.");

        // Post-filter results to ensure size matches, even if the AI didn't follow instructions
        const validatedPriceData = {};
        for (const storeId in llmPriceResult) {
            const result = llmPriceResult[storeId];
            if (result && result.available) {
                // Simple size check: if the product size is known, the matched size must be similar
                // (This is a basic check; a more advanced version would parse and compare units)
                if (product.size && result.matched_size && result.matched_size.toLowerCase().includes(product.size.toLowerCase())) {
                    result.note = `Online price for ${result.matched_size}`;
                    validatedPriceData[storeId] = result;
                } else if (!product.size) { // If original size is unknown, trust the AI
                    result.note = `Online price for ${result.matched_size || 'unknown size'}`;
                    validatedPriceData[storeId] = result;
                } else {
                    console.log(`Size mismatch for ${storeId}: expected '${product.size}', found '${result.matched_size}'. Discarding.`);
                }
            }
        }


        console.log("Validated prices:", validatedPriceData);
        setPriceData(validatedPriceData);

        // Save scanned product and prices to database
        console.log("Saving new product to database...");
        const scannedProductData = {
          barcode: product.barcode,
          product_name: product.name,
          brand: product.brand || 'Unknown',
          size: product.size || '',
          category: product.category || 'other',
          image_url: product.image || '',
          scan_location: mode === 'compare' ? 'in-store' : 'home',
          scan_mode: mode,
          data_source: product.ingredients ? 'open_food_facts' : (product.category === 'other' ? 'llm_search' : 'manual')
        };

        const savedProduct = await ScannedProduct.create(scannedProductData);
        console.log("Saved product:", savedProduct);

        const pricePromises = Object.entries(validatedPriceData).map(([storeId, storeData]) => {
            if (!storeData || typeof storeData.price !== 'number') return null; // Only save valid prices
            const storeName = supermarkets.find(s => s.id === storeId)?.name || storeId;
            return ScannedPrice.create({
              scanned_product_id: savedProduct.id,
              store_name: storeName,
              store_id: storeId,
              price: storeData.price,
              available: storeData.available,
              promotion_text: storeData.note || '',
              scan_date: new Date().toISOString().split('T')[0]
            });
        }).filter(Boolean); // Filter out null promises

        await Promise.all(pricePromises);
        console.log("Saved real price comparisons to DB");

    } catch (error) {
        console.error('Error fetching or saving real prices:', error);
        // Fallback to showing product info without prices
        setPriceData({});
    }

    setLoadingPrices(false);
  };

  const initiateManualEntry = (barcode) => {
    stopScanner();
    setScannedProduct({ barcode });
    setManualProductData({ name: '', brand: '', size: '' });
    setScanningStatus('Product not found in database.');
    setShowManualEntry(true);
    setError(null);
  };

  const handleManualDataChange = (field, value) => {
    setManualProductData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveManualProduct = () => {
    if (!manualProductData.name.trim()) {
      setError("Please enter at least a product name.");
      return;
    }
    setError(null);

    const finalProduct = {
      barcode: scannedProduct?.barcode || 'MANUAL',
      name: manualProductData.name,
      brand: manualProductData.brand || 'Generic',
      size: manualProductData.size || '',
      image: "https://via.placeholder.com/200x200/e5e7eb/6b7280?text=Manual+Entry",
      category: 'other',
      target_price: 2.00
    };

    if (onProductFound) {
      onProductFound(finalProduct);
    }
    handleClose();
  };

  const handleAddToFavorites = () => {
    if (scannedProduct && onProductFound) {
      // Find best price and supermarket from priceData
      let bestPrice = Infinity;
      let bestSupermarketInfo = null;

      if (priceData) {
        Object.entries(priceData).forEach(([storeId, storeData]) => {
          if (storeData.available) {
            const currentPrice = parseFloat(storeData.price);
            if (currentPrice < bestPrice) {
              bestPrice = currentPrice;
              const supermarketDetails = supermarkets.find(s => s.id === storeId);
              bestSupermarketInfo = {
                price: bestPrice,
                name: supermarketDetails ? supermarketDetails.name : storeId,
              };
            }
          }
        });
      }

      // Prepare data for FavoriteItem creation
      const favoriteData = {
        ...scannedProduct,
        target_price: bestSupermarketInfo ? bestSupermarketInfo.price : 2.00, // Use best price as target
        current_best_price: bestSupermarketInfo ? bestSupermarketInfo.price : null,
        current_best_supermarket: bestSupermarketInfo ? bestSupermarketInfo.name : null,
      };

      onProductFound(favoriteData);
    }
    handleClose();
  };

  const handleCompareNow = () => {
    if (scannedProduct && onProductFound) {
      onProductFound({
        ...scannedProduct,
        prices: priceData
      });
    }
    handleClose();
  };

  const switchCamera = () => {
    stopScanner();
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
    setScanningStatus('Switching camera...');
  };

  const handleClose = () => {
    stopScanner();
    setScannedProduct(null);
    setPriceData(null);
    setError(null);
    setIsProcessing(false);
    setScanningStatus('Initializing scanner...');
    setShowManualEntry(false);
    setManualProductData({ name: '', brand: '', size: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {title}
            <Badge variant="outline" className="ml-2">
              {mode === 'favorite' ? 'Add to Favorites' : 'Price Compare'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {showManualEntry ? (
          <div className="p-2 sm:p-6 space-y-6">
            {/* Manual Entry Header with Back Button */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowManualEntry(false);
                  setScannedProduct(null); // Ensure scanner restarts when going back
                  setError(null);
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Back to Scanner
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertTitle className="text-amber-800">Product Not Found</AlertTitle>
              <AlertDescription className="text-amber-700">
                Barcode <strong className="font-mono">{scannedProduct?.barcode}</strong> not found in our database. Please enter details manually.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5"/>
                  Manual Product Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Heinz Baked Beans"
                    value={manualProductData.name}
                    onChange={(e) => handleManualDataChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Heinz (optional)"
                    value={manualProductData.brand}
                    onChange={(e) => handleManualDataChange('brand', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size / Quantity</Label>
                  <Input
                    id="size"
                    placeholder="e.g., 415g (optional)"
                    value={manualProductData.size}
                    onChange={(e) => handleManualDataChange('size', e.target.value)}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSaveManualProduct} className="bg-teal-600 hover:bg-teal-700">
                {mode === 'favorite' ? 'Add to Favorites' : 'Compare Prices'}
              </Button>
            </div>
          </div>
        ) : !scannedProduct ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Scanner Container with Overlay */}
            <div className="relative">
              <div
                ref={scannerRef}
                className="w-full bg-black rounded-lg overflow-hidden relative h-72 md:h-96"
              >
                {/* Scanning Overlay - Only show when camera is ready */}
                {isQuaggaReady && (
                  <>
                    {/* Corner brackets */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Top-left corner */}
                      <div className="absolute top-16 left-16 w-8 h-8 border-l-4 border-t-4 border-red-500"></div>
                      {/* Top-right corner */}
                      <div className="absolute top-16 right-16 w-8 h-8 border-r-4 border-t-4 border-red-500"></div>
                      {/* Bottom-left corner */}
                      <div className="absolute bottom-16 left-16 w-8 h-8 border-l-4 border-b-4 border-red-500"></div>
                      {/* Bottom-right corner */}
                      <div className="absolute bottom-16 right-16 w-8 h-8 border-r-4 border-b-4 border-red-500"></div>
                    </div>

                    {/* Scanning line animation */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-64 h-40 border-2 border-dashed border-white/50 rounded">
                        {/* Animated red scanning line */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500/50"
                          style={{
                            animation: 'scan 2s ease-in-out infinite',
                            top: '0%'
                          }}
                        ></div>

                        {/* Center text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                            Point camera at barcode
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Status overlay */}
                {!isQuaggaReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                    <div className="text-center text-white">
                      {error ? (
                        <>
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                          <p className="text-lg font-semibold">Scanner Error</p>
                          <p className="text-sm">{error}</p>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                          <p className="text-lg font-semibold">{scanningStatus}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera controls */}
                {isQuaggaReady && (
                  <>
                    <div className="absolute top-4 right-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={switchCamera}
                        className="bg-black/50 border-white/20 text-white"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Ready indicator */}
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Scanning...
                    </div>
                  </>
                )}
              </div>

              {/* CSS Animation for scanning line */}
              <style>
                {`
                  @keyframes scan {
                    0% {
                      top: 0%;
                      opacity: 1;
                    }
                    50% {
                      opacity: 1;
                    }
                    100% {
                      top: 100%;
                      opacity: 0;
                    }
                  }
                `}
              </style>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {mode === 'favorite'
                  ? 'Scan a product to add to your price alerts'
                  : 'Scan a product to compare prices across stores'
                }
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualEntry(true)}
                className="text-gray-500"
              >
                Can't scan? Enter manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Results Header with Back and Close Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScannedProduct(null);
                  setPriceData(null);
                  setError(null);
                  setScanningStatus('Point camera at barcode');
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Another
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>

            {/* Product Info */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <img src={scannedProduct.image} alt={scannedProduct.name} className="w-16 h-16 rounded object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">{scannedProduct.brand} {scannedProduct.name}</h3>
                    <p className="text-green-600">{scannedProduct.size} • {scannedProduct.category}</p>
                    <p className="text-xs text-green-500">✓ Barcode: {scannedProduct.barcode}</p>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Price Comparison */}
            {loadingPrices ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Comparing prices across stores...</p>
                </CardContent>
              </Card>
            ) : priceData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price Comparison Results</h3>
                <div className="grid gap-3">
                  {supermarkets.map(retailer => {
                    const price = priceData[retailer.id];
                    // Render if price data for this retailer exists or explicitly marked as unavailable
                    if (!price) return null;

                    return (
                      <Card key={retailer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={retailer.logo} alt={retailer.name} className="w-8 h-8" />
                              <div>
                                <p className="font-medium">{retailer.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {price.available ? (
                                <>
                                  <p className="text-xl font-bold">£{price.price?.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">{price.note}</p>
                                </>
                              ) : (
                                <Badge variant="secondary">Not Available</Badge>
                              )}
                            </div>
                            {price.available && price.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(price.url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setScannedProduct(null);
                  setPriceData(null);
                  setError(null);
                  setScanningStatus('Point camera at barcode');
                }}
                className="flex-1"
              >
                Scan Another
              </Button>
              {mode === 'favorite' ? (
                <Button onClick={handleAddToFavorites} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
              ) : (
                <Button onClick={handleCompareNow} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Use These Prices
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
