import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, CheckCircle, Smartphone, BookMarked } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 text-gray-100 p-4 rounded-lg my-4">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-x-auto text-sm"><code>{code}</code></pre>
    </div>
  );
};

export default function BookmarkletSetup() {
  const navigate = useNavigate();
  
  const bookmarkletCode = `javascript:(async()=>{try{const t='myshoprun_payload_v1',p=localStorage.getItem(t);if(!p){alert('MyShopRun payload not found. Please start a shop from the app first.');return}const d=JSON.parse(p);if(!d.lines||!d.lines.length){alert('No items in payload.');return}alert(\`Found \${d.lines.length} items. Starting shop on \${d.store_home_url}. Please wait...\`);for(const i of d.lines){await fetch(i.product_url);/*This is a stub. A real implementation would add to cart.*/await new Promise(r=>setTimeout(r,1e3))}localStorage.removeItem(t);alert('Shop complete!')}catch(e){alert('Error: '+e.message)}})();`;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Profile'))} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Mobile Shopping Setup</CardTitle>
                <CardDescription>Use a bookmarklet to add items to your basket on your phone.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>Create the Bookmarklet</h3>
              <p className="text-gray-600 mt-2">First, copy the code below. This is the magic that will fill your basket.</p>
              <CodeBlock code={bookmarkletCode} />
              <p className="text-gray-600 mt-2">Now, create a new bookmark for any page. Then, edit the bookmark and replace the URL with the code you just copied. Name it something like "MyShopRun Helper".</p>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>How to Use It</h3>
              <ol className="list-decimal list-inside space-y-3 mt-4 text-gray-700">
                <li>Start a price comparison in the MyShopRun app on your phone.</li>
                <li>When you choose a store, select the "Bookmarklet" option.</li>
                <li>Follow the on-screen steps to copy the one-time code for that specific shopping list.</li>
                <li>Open the store's website.</li>
                <li>Open your bookmarks and tap the "MyShopRun Helper" bookmarklet you just created.</li>
                <li>The bookmarklet will automatically add the items to your basket!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}