// pages/ZyteGrocersFetch.js
import { zyteExtract } from "@/components/server/ZyteClient";
import { parseProductsFromHtml } from "@/components/server/parseProducts";

export default async function ZyteGrocersFetch(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "Endpoint is active. Use POST to fetch data." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { store, listUrl } = req.body || {};
    if (!store || !listUrl) {
      return res.status(400).json({ ok: false, error: "Missing store or listUrl" });
    }

    console.log(`[API ZyteGrocersFetch] Calling Zyte for ${store} at ${listUrl}`);
    const zyteResp = await zyteExtract({ url: listUrl, browserHtml: true });
    const html = zyteResp?.browserHtml || "";

    if (!html) {
        console.error(`[API ZyteGrocersFetch] No HTML in Zyte response for ${store}`);
        return res.status(500).json({ ok: false, error: "Zyte call succeeded but returned no HTML." });
    }
    
    console.log(`[API ZyteGrocersFetch] Received ${html.length} bytes of HTML for ${store}. Parsing...`);
    const products = parseProductsFromHtml(html, listUrl);
    console.log(`[API ZyteGrocersFetch] Parsed ${products.length} products for ${store}.`);

    return res.status(200).json({ 
        ok: true, 
        count: products.length, 
        products,
        htmlLen: html.length,
        htmlPreview: html.substring(0, 200)
    });
  } catch (err) {
    console.error(`[API ZyteGrocersFetch] Server error:`, err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}