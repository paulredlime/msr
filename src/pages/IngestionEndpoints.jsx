
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Webhook, DatabaseZap, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";

const CodeBlock = ({ code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };
  
  return (
    <div className="relative mt-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-7 w-7 z-10" 
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function IngestionEndpoints() {
  const navigate = useNavigate();
  
  // Get the current app URL dynamically
  const appBaseUrl = window.location.origin;
  
  const groceryIngestUrl = `${appBaseUrl}/functions/ingestGroceryData`;
  const restaurantIngestUrl = `${appBaseUrl}/functions/ingestRestaurantData`;
  const ordersIngestUrl = `${appBaseUrl}/functions/ingestOrderHistory`;
  
  const groceryPayload = `{
  "store": "tesco",
  "source_url": "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
  "products": [
    {
      "external_id": "254643195",
      "title": "Tesco All Rounder Potatoes 2.5Kg",
      "brand": "Tesco",
      "price": 1.69,
      "promo_price": null,
      "loyalty_price": 1.49,
      "promo_text": "Clubcard Price",
      "gtin": "5052910029323",
      "image_url": "https://digitalcontent.api.tesco.com/v2/media/ghs/1025d752-94b5-412f-9293-84784a3e791b/snapshotimagehandler_1079354016.jpeg?h=540&w=540",
      "product_url": "https://www.tesco.com/groceries/en-GB/products/254643195",
      "category_path": ["Fresh Food", "Fresh Vegetables", "Potatoes & Sweet Potatoes"],
      "availability": "in_stock",
      "quantity_text": "2.5Kg",
      "price_per_unit_text": "£0.68/kg"
    }
  ]
}`;

  const curlExample = `curl -X POST "${groceryIngestUrl}" \\
-H "Authorization: Bearer YOUR_INGESTION_API_KEY" \\
-H "Content-Type: application/json" \\
-d '${groceryPayload.replace(/'/g, "'\\''")}'`;

  const restaurantWebhookPayload = `{
  "datasetId": "your_apify_dataset_id",
  "platform": "ubereats",
  "restaurants": [
    {
      "name": "Pizza Palace",
      "cuisine": "pizza",
      "rating": 4.5,
      "delivery_fee": 2.99,
      "menu_items": [...]
    }
  ]
}`;

  const ordersPayload = `{
  "provider": "tesco",
  "alias": "main",
  "user_id": "user_123",
  "orders": [
    {
      "order_id": "ORD123",
      "date": "2024-01-15",
      "total": 45.67,
      "items": [...]
    }
  ]
}`;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate(createPageUrl("AdminDashboard"))} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
      
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Data Ingestion API Specification</h1>
          <p className="text-lg text-gray-600 mt-2">Official endpoints and payload structures for sending data to MyShopRun.</p>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <DatabaseZap className="w-6 h-6 text-blue-600" />
                Grocery Data Ingestion
              </CardTitle>
              <CardDescription>
                Send scraped grocery product data to this endpoint. Your external services must provide the correct `Authorization` header.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">Endpoint URL</h4>
              <p className="font-mono text-sm bg-gray-100 p-3 rounded border break-words mb-4">
                {groceryIngestUrl}
              </p>
              
              <h4 className="font-semibold mb-2">Complete Product Payload Example</h4>
              <p className="text-sm text-gray-600 mb-2">
                This shows ALL available fields. Required fields are: <code>external_id</code>, <code>title</code>, <code>price</code>, <code>product_url</code>
              </p>
              <CodeBlock code={`{
  "store": "tesco",
  "source_url": "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
  "products": [
    {
      "external_id": "254643195",
      "title": "Tesco All Rounder Potatoes 2.5Kg",
      "brand": "Tesco",
      "price": 1.69,
      "promo_price": 1.50,
      "loyalty_price": 1.49,
      "loyalty_program": "Clubcard",
      "promo_text": "Clubcard Price - Save 20p",
      "gtin": "5052910029323",
      "image_url": "https://digitalcontent.api.tesco.com/v2/media/ghs/1025d752-94b5-412f-9293-84784a3e791b/snapshotimagehandler_1079354016.jpeg?h=540&w=540",
      "product_url": "https://www.tesco.com/groceries/en-GB/products/254643195",
      "category": "Fresh Vegetables",
      "category_path": ["Fresh Food", "Fresh Vegetables", "Potatoes & Sweet Potatoes"],
      "availability": "in_stock",
      "quantity_text": "2.5Kg",
      "unit_price": "£0.68/kg",
      "price_per_unit_text": "£0.68/kg",
      "description": "Perfect for roasting, mashing or chips",
      "nutrition_info": {
        "energy_kj": "321",
        "energy_kcal": "77",
        "fat": "0.1g",
        "carbohydrates": "15.4g"
      },
      "allergens": ["May contain traces of nuts"],
      "ingredients": "Potatoes",
      "country_of_origin": "United Kingdom",
      "storage_instructions": "Store in a cool, dry place",
      "cooking_instructions": "Wash before use. Can be boiled, baked, fried or roasted."
    },
    {
      "external_id": "280872147",
      "title": "Heinz Baked Beans in Tomato Sauce 415g",
      "brand": "Heinz",
      "price": 1.25,
      "promo_price": null,
      "loyalty_price": null,
      "promo_text": null,
      "gtin": "0000000021634",
      "image_url": "https://digitalcontent.api.tesco.com/v2/media/ghs/snapshotimagehandler_280872147.jpeg?h=540&w=540",
      "product_url": "https://www.tesco.com/groceries/en-GB/products/280872147",
      "category": "Tinned Beans & Pulses",
      "category_path": ["Food Cupboard", "Tins Cans & Packets", "Beans Pasta & Noodles", "Tinned Beans & Pulses"],
      "availability": "in_stock",
      "quantity_text": "415g",
      "unit_price": "£3.01/kg",
      "price_per_unit_text": "£3.01/kg",
      "description": "Heinz Baked Beans in a rich tomato sauce",
      "nutrition_info": {
        "energy_kj": "339",
        "energy_kcal": "81",
        "fat": "0.6g",
        "carbohydrates": "13g",
        "protein": "4.9g"
      },
      "allergens": [],
      "ingredients": "Beans (51%), Tomatoes (34%), Water, Sugar, Spirit Vinegar, Modified Corn Flour, Salt, Spice Extracts, Herb Extract",
      "country_of_origin": "United Kingdom", 
      "storage_instructions": "Store in a cool, dry place. Once opened, transfer unused contents to a non-metallic container, refrigerate and use within 2 days.",
      "cooking_instructions": "Hob: Empty contents into a saucepan and heat gently for 4-5 minutes, stirring occasionally. Microwave: Empty contents into a suitable microwaveable container, cover and heat on full power for 1½-2 minutes, stir halfway through heating."
    }
  ]
}`} />

              <h4 className="font-semibold mt-6 mb-2">Field Descriptions</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4 py-2 border-b">
                  <span className="font-medium">Field</span>
                  <span className="font-medium">Required</span>
                  <span className="font-medium">Description</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code className="text-red-600">external_id</code>
                  <span className="text-red-600">✓ Yes</span>
                  <span>Store's unique product ID</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code className="text-red-600">title</code>
                  <span className="text-red-600">✓ Yes</span>
                  <span>Full product name</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code className="text-red-600">price</code>
                  <span className="text-red-600">✓ Yes</span>
                  <span>Regular price as number (e.g., 1.69)</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code className="text-red-600">product_url</code>
                  <span className="text-red-600">✓ Yes</span>
                  <span>Direct URL to product page</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>brand</code>
                  <span className="text-green-600">Optional</span>
                  <span>Product brand name</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>loyalty_price</code>
                  <span className="text-green-600">Optional</span>
                  <span>Price with loyalty card (number)</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>promo_text</code>
                  <span className="text-green-600">Optional</span>
                  <span>Promotional offer text</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>image_url</code>
                  <span className="text-green-600">Optional</span>
                  <span>Product image URL</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>availability</code>
                  <span className="text-green-600">Optional</span>
                  <span>"in_stock", "out_of_stock", "low_stock"</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>unit_price</code>
                  <span className="text-green-600">Optional</span>
                  <span>Price per unit (e.g., "£0.68/kg")</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  <code>category</code>
                  <span className="text-green-600">Optional</span>
                  <span>Product category</span>
                </div>
              </div>

              <h4 className="font-semibold mt-6 mb-2">Test with cURL</h4>
              <CodeBlock code={`curl -X POST "${groceryIngestUrl}" \\
-H "Authorization: Bearer YOUR_INGESTION_API_KEY" \\
-H "Content-Type: application/json" \\
-d '{
  "store": "tesco",
  "source_url": "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
  "products": [
    {
      "external_id": "254643195",
      "title": "Tesco All Rounder Potatoes 2.5Kg",
      "brand": "Tesco",
      "price": 1.69,
      "loyalty_price": 1.49,
      "promo_text": "Clubcard Price - Save 20p",
      "image_url": "https://digitalcontent.api.tesco.com/v2/media/ghs/1025d752-94b5-412f-9293-84784a3e791b/snapshotimagehandler_1079354016.jpeg?h=540&w=540",
      "product_url": "https://www.tesco.com/groceries/en-GB/products/254643195",
      "category": "Fresh Vegetables",
      "availability": "in_stock",
      "unit_price": "£0.68/kg"
    }
  ]
}'`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Utensils className="w-6 h-6 text-orange-600" />
                Restaurant Data Ingestion
              </CardTitle>
              <CardDescription>
                Send restaurant and menu data from delivery platforms to this endpoint. External scrapers should POST restaurant data here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm bg-gray-100 p-3 rounded border break-words">
                {restaurantIngestUrl}
              </p>
              <CodeBlock code={restaurantWebhookPayload} />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Webhook className="w-6 h-6 text-green-600" />
                Order History Ingestion
              </CardTitle>
              <CardDescription>
                Send user order history data from connected supermarket accounts to this endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="font-mono text-sm bg-gray-100 p-3 rounded border break-words">
                {ordersIngestUrl}
               </p>
              <CodeBlock code={ordersPayload} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
