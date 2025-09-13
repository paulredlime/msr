// pages/ZyteApiEndpoint.js
import { zyteExtract } from "@/components/server/ZyteClient";
import { parseProductsFromHtml } from "@/components/server/parseProducts";

export default async function handler(req, res) {
  // Handle GET requests for ping/health check
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, router: "base44-flat", ping: "pong" });
  }
  
  // Only allow POST for actual ingestion
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { store, listUrl } = req.body || {};
    if (!store || !listUrl) {
      return res.status(400).json({ ok: false, error: "Missing store or listUrl" });
    }

    console.log(`[ZyteApiEndpoint] Calling Zyte for ${store} at ${listUrl}`);
    
    const zyteResp = await zyteExtract({ 
      url: listUrl, 
      browserHtml: true,
      geolocation: "GB"
    });
    
    const html = zyteResp?.browserHtml || zyteResp?.httpResponseBody || "";
    
    if (!html) {
      console.error(`[ZyteApiEndpoint] No HTML received from Zyte for ${store}`);
      return res.status(500).json({ ok: false, error: "No HTML received from Zyte" });
    }
    
    console.log(`[ZyteApiEndpoint] HTML received for ${store}. Length: ${html.length}`);
    
    const products = parseProductsFromHtml(html, listUrl);
    console.log(`[ZyteApiEndpoint] Parsed ${products.length} products for ${store}`);

    return res.status(200).json({ 
      ok: true, 
      count: products.length, 
      products,
      htmlLen: html.length,
      htmlPreview: html.substring(0, 200)
    });

  } catch (err) {
    console.error(`[ZyteApiEndpoint] Server error:`, err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}