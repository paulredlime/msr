
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Code, ExternalLink, Package, UploadCloud, MessageSquare, List } from 'lucide-react';

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm my-4">
    <code>{children}</code>
  </pre>
);

export default function BrowserExtensionHandoff() {
  const manifestJson = `{
  "manifest_version": 3,
  "name": "MyShopRun Companion",
  "version": "1.0",
  "description": "Supercharge your savings with MyShopRun. Automatically compare prices and add items to your basket.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*.tesco.com/*",
    "https://*.asda.com/*",
    "https://*.sainsburys.co.uk/*",
    "https://*.morrisons.com/*",
    "https://*.waitrose.com/*",
    "https://*.aldi.co.uk/*",
    "https://*.lidl.co.uk/*",
    "https://*.coop.co.uk/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  },
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"]
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["images/*.png"],
      "matches": ["<all_urls>"]
    }
  ]
}`;

  const backgroundJs = `// background.js - Listens for messages from the web app
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "MYSHOPRUN_ADD_TO_BASKET") {
      // Forward the message to the active content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
          sendResponse({status: "Message forwarded", response: response});
        });
      });
      return true; // Indicates you wish to send a response asynchronously
    }
  }
);`;

  const contentScriptJs = `// content_script.js - Interacts with the supermarket website

// Announce presence to the web app
window.postMessage({ type: "SHOP_EXTENSION_HELLO" }, "*");

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.type === "MYSHOPRUN_ADD_TO_BASKET") {
      console.log("Received basket data:", request.payload);
      
      // Basic example for adding one item.
      // A robust solution needs a state machine and error handling.
      const item = request.payload.items[0];

      try {
        // 1. Navigate to search page
        const searchUrl = \`https://www.tesco.com/groceries/en-GB/search?query=\${encodeURIComponent(item.name)}\`;
        window.location.href = searchUrl;

        // 2. Wait for page to load, find product, click add
        // This is complex and needs to handle page load timing.
        // A real implementation would use intervals or MutationObserver.
        
        // Example (will likely need delays and checks):
        setTimeout(() => {
          const firstProductAddButton = document.querySelector('.button-primary.button-small');
          if (firstProductAddButton) {
            firstProductAddButton.click();
            sendResponse({ status: "success", item: item.name });
          } else {
            sendResponse({ status: "error", message: "Could not find add button" });
          }
        }, 5000); // Wait 5s for page load
        
      } catch (error) {
        sendResponse({ status: "error", message: error.message });
      }

      return true; // Keep message channel open for async response
    }
  }
);`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Browser Extension Developer Handoff</h1>
          <p className="text-lg text-gray-600 mt-2">
            Technical specifications for the "MyShopRun Companion" browser extension.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package /> Core Functionality</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>1. **Announce Presence:** The extension should notify the web app of its installation via `window.postMessage`.</li>
                <li>2. **Listen for Commands:** It must listen for a `MYSHOPRUN_ADD_TO_BASKET` command from the web app.</li>
                <li>3. **Automate Basket Filling:** Upon receiving the command, it will programmatically search for products on the active supermarket tab and add them to the user's basket.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>manifest.json</CardTitle>
              <CardDescription>
                The core configuration file for the extension.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{manifestJson}</CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>background.js</CardTitle>
              <CardDescription>
                The service worker that runs in the background to manage communication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{backgroundJs}</CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>content_script.js</CardTitle>
              <CardDescription>
                This script is injected into supermarket websites to perform actions. This is a simplified example; a robust version will need careful handling of page loads and selectors for each store.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{contentScriptJs}</CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UploadCloud /> Submission Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The extension files (manifest.json, background.js, content_script.js, popup.html, icons) should be zipped and submitted to the respective browser stores.</p>
              <div className="flex gap-4">
                <a href="https://developer.chrome.com/docs/webstore/publish/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Chrome Web Store</Button>
                </a>
                <a href="https://extensionworkshop.com/documentation/publish/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Firefox Add-on Store</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
