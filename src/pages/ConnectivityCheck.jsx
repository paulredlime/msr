import React from 'react';
import { AppSettings } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

// Target sites for connectivity testing
const TARGET_SITES = [
  { name: "Tesco", url: "https://www.tesco.com/groceries" },
  { name: "ASDA", url: "https://groceries.asda.com" },
  { name: "Sainsbury's", url: "https://www.sainsburys.co.uk" },
  { name: "Morrisons", url: "https://groceries.morrisons.com" },
  { name: "Waitrose", url: "https://www.waitrose.com" },
  { name: "Aldi", url: "https://groceries.aldi.co.uk" },
  { name: "Lidl", url: "https://www.lidl.co.uk" },
  { name: "Iceland", url: "https://www.iceland.co.uk" },
  { name: "Co-op", url: "https://www.coop.co.uk" },
  { name: "Ocado", url: "https://www.ocado.com" },
  { name: "Deliveroo", url: "https://deliveroo.co.uk" },
  { name: "Uber Eats", url: "https://www.ubereats.com" },
  { name: "Just Eat", url: "https://www.just-eat.co.uk" }
];

export default function ConnectivityCheck() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Connectivity Check API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>This endpoint tests connectivity to all target grocery and delivery sites.</p>
        <p className="mt-2">GET request will return JSON with connectivity results.</p>
        <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
{`{
  "results": [...],
  "isMockMode": false,
  "isRealDataRequired": true
}`}
        </pre>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  // This function handles two cases:
  // 1. A user navigating to the /ConnectivityCheck page (renders the component).
  // 2. An API call from the frontend (returns JSON).

  if (req.method === 'GET' && req.headers.accept?.includes('application/json')) {
    try {
      console.log('[ConnectivityCheck] API: Processing request for configuration and connectivity.');

      let settings = {};
      let settingsError = null;
      try {
        const allSettings = await AppSettings.list();
        if (allSettings.length === 0) {
          settingsError = "No settings found. Please configure and save settings in the Admin Panel.";
        } else {
            settings = allSettings.reduce((acc, setting) => {
              acc[setting.setting_key] = setting.setting_value;
              return acc;
            }, {});
        }
      } catch (error) {
        console.error('[ConnectivityCheck] API: Critical error loading settings:', error);
        settingsError = `Permission error or database issue loading settings: ${error.message}. Ensure you are logged in as an admin.`;
      }

      const configErrors = [];
      if (settingsError) {
        configErrors.push(settingsError);
      }
      
      if (!settings.zyte_api_key) {
        configErrors.push("Zyte API Key is not set. Please add it in Admin > Settings.");
      }

      const isMockMode = settings.mock_mode === '1';
      const isRealDataRequired = settings.real_data_required === '1';
      
      const apiResponse = {
        isMockMode,
        isRealDataRequired,
        results: [],
        configErrors,
        timestamp: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(apiResponse);
      
    } catch (error) {
      console.error('[ConnectivityCheck] API: Unhandled exception:', error);
      const errorResponse = {
          isMockMode: true,
          isRealDataRequired: false,
          results: [],
          configErrors: [`Server Error: ${error.message}`],
          timestamp: new Date().toISOString()
      };
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json(errorResponse);
    }
    
    // IMPORTANT: End the response to prevent the page from rendering.
    res.end();
    return { props: {} };
  }

  // If not an API request, render the page component normally.
  return { props: {} };
}