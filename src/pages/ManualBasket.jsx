import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Check, ExternalLink, ListChecks } from 'lucide-react';

export default function ManualBasket() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [clickedItems, setClickedItems] = useState(new Set());

  useEffect(() => {
    const itemsParam = searchParams.get('items');
    const storeNameParam = searchParams.get('storeName');
    if (itemsParam) {
      try {
        const decodedItems = JSON.parse(decodeURIComponent(itemsParam));
        setItems(decodedItems);
      } catch (error) {
        console.error("Failed to parse items from URL:", error);
      }
    }
    if (storeNameParam) {
      setStoreName(decodeURIComponent(storeNameParam));
    }
  }, [searchParams]);

  const handleItemClick = (index, url) => {
    setClickedItems(prev => new Set(prev.add(index)));
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('Dashboard')} className="inline-block mb-6">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ListChecks className="w-6 h-6 text-teal-600" />
              Manually Add to {storeName} Basket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-blue-50 border-blue-200 mb-6">
              <AlertTitle>How this works</AlertTitle>
              <AlertDescription>
                Click "Add to Basket" for each item below. A new tab will open for you to add the item to your {storeName} cart. Once added, come back here and mark it as complete.
              </AlertDescription>
            </Alert>

            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg flex items-center justify-between transition-all duration-300 ${clickedItems.has(index) ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-16 h-16 object-contain rounded-md bg-white border"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {clickedItems.has(index) && (
                          <p className="text-sm text-green-700 flex items-center gap-1 mt-1">
                            <Check className="w-4 h-4" />
                            Opened in new tab
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleItemClick(index, item.url)}
                      disabled={clickedItems.has(index)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Add to Basket
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No items to display.</p>
            )}

            <div className="mt-8 pt-6 border-t flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">All Done?</h3>
              <p className="text-gray-600 mt-2">Once you've added all items to your basket, you can proceed to checkout on the {storeName} website.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}