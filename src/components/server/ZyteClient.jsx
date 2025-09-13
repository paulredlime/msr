// components/server/ZyteClient.js
const fetch = global.fetch;
import { AppSettings } from "@/api/entities";

if (typeof window !== "undefined") {
  throw new Error("ZyteClient must only be imported server-side");
}

async function getApiKey() {
  try {
    const allSettings = await AppSettings.list();
    if (allSettings.length === 0) {
      throw new Error("AppSettings table is empty. Please configure Zyte API key in Admin Settings.");
    }

    const zyteSetting = allSettings.find(setting => setting.setting_key === 'zyte_api_key');
    if (zyteSetting && zyteSetting.setting_value) {
      return zyteSetting.setting_value.trim();
    }
    
    throw new Error("Zyte API key not found in AppSettings. Please configure it in Admin Settings.");
  } catch (e) {
    console.error('[ZyteClient] Error fetching API key:', e);
    throw new Error(`Database error while fetching API key: ${e.message}`);
  }
}

export async function zyteExtract(payload) {
  const apiKey = await getApiKey();
  
  const res = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.detail || data?.title || `HTTP ${res.status}`;
    throw new Error(`Zyte API error ${res.status}: ${msg}`);
  }
  return data;
}

module.exports = { zyteExtract };