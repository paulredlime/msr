
import { AppSettings } from "@/api/entities";

// SIMPLE MOCK GUARD
const isMocky = (s = "") => /\b(test|sample|dummy|lorem|ipsum|placeholder|mock|example)\b/i.test(s);

// Robust JSON extractor helpers
function safeJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function extractScriptJSON(html, id) {
  const m = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i").exec(html);
  return m ? safeJSON(m[1]) : null;
}

function extractPreloadedState(html) {
  // window.__PRELOADED_STATE__ = {...};
  const m = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
  return m ? safeJSON(m[1]) : null;
}

function extractAnyAppJson(html) {
  // Fallback: the biggest <script type="application/json"> blob
  const all = [...html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\\S]*?)<\/script>/gi)];
  let largest = null, max = 0;
  for (const m of all) {
    if ((m[1] || "").length > max) { max = (m[1] || "").length; largest = m[1]; }
  }
  return largest ? safeJSON(largest) : null;
}

function asPounds(x) {
  if (x == null) return null;
  // Accept numeric or strings like "£4.99"
  if (typeof x === "string") {
    const m = x.replace(',', '.').match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    return m ? parseFloat(m[1]) : null;
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function normalizeItems(rawItems) {
  const out = [];
  for (const it of rawItems || []) {
    const name = it?.name || it?.title || it?.label || "";
    const price =
      asPounds(it?.price) ??
      asPounds(it?.price_amount) ??
      asPounds(it?.priceValue) ??
      asPounds(it?.price_text);
    if (!name || isMocky(name)) continue;
    if (price == null || price <= 0) continue;
    out.push({
      name,
      price,
      description: it?.description || it?.desc || null,
      image: it?.image || it?.img || it?.imageUrl || null,
      id: it?.id || it?.uuid || null,
    });
  }
  return out;
}

function normalizeCategories(rawCats) {
  const out = [];
  for (const c of rawCats || []) {
    const name = c?.name || c?.title || c?.label || "";
    if (!name || isMocky(name)) continue;
    const items = normalizeItems(c?.items || c?.products || c?.menu_items || c?.entities);
    if (!items.length) continue;
    out.push({ name, items });
  }
  return out;
}

// Site-specific extractors (prefer app state over scraping DOM)
function extractDeliveroo(html, url) {
  // Try Next.js __NEXT_DATA__
  const next = extractScriptJSON(html, "__NEXT_DATA__");
  // Common shapes seen on Deliveroo restaurant pages:
  // next.props.pageProps.initialState.menu or .entities.sections/.entities.items etc.
  let name, address, categories = [];

  const pp = next?.props?.pageProps;
  const init = pp?.initialState || pp;

  // Heuristic: many DR pages carry sections -> items
  const guessCats =
    init?.menu?.sections ||
    init?.entities?.sections ||
    init?.menu?.menu?.sections ||
    init?.restaurantMenu?.sections;

  const guessItemsField = (s) => s?.items || s?.entities || s?.products || s?.menuItems;

  if (guessCats && Array.isArray(guessCats)) {
    const cats = [];
    for (const sec of guessCats) {
      const cname = sec?.name || sec?.title;
      const rawItems = guessItemsField(sec);
      const items = normalizeItems(rawItems);
      if (cname && items.length) cats.push({ name: cname, items });
    }
    categories = cats;
  }

  // Restaurant info
  name =
    init?.restaurant?.name ||
    init?.venue?.name ||
    init?.store?.name ||
    pp?.seo?.title || null;

  address =
    init?.restaurant?.address ||
    init?.venue?.address ||
    init?.store?.address ||
    null;

  // Fallback generic
  if (!categories.length) {
    const generic = extractAnyAppJson(html);
    const gcats = normalizeCategories(generic?.menu?.sections || generic?.sections);
    if (gcats.length) categories = gcats;
    name = name || generic?.restaurant?.name || generic?.venue?.name || null;
  }

  return { platform: "deliveroo", url, restaurant: { name, address }, categories };
}

function extractUberEats(html, url) {
  // Uber often has __PRELOADED_STATE__ with merchants & menus
  const preload = extractPreloadedState(html);
  let name, address, categories = [];

  // Heuristics:
  const merchant = preload?.merchant || preload?.store || preload?.restaurant ||
                   preload?.entities?.merchants?.[0] ||
                   preload?.data?.merchant;

  name = merchant?.title || merchant?.name || null;
  address = merchant?.address?.address1 || merchant?.address || null;

  const menuCats =
    preload?.menu?.categories ||
    preload?.entities?.categories ||
    preload?.data?.menu?.categories;

  if (menuCats && Array.isArray(menuCats)) {
    const cats = [];
    for (const c of menuCats) {
      const cname = c?.title || c?.name;
      const rawItems = c?.items || c?.entities || c?.products;
      const items = normalizeItems(rawItems);
      if (cname && items.length) cats.push({ name: cname, items });
    }
    categories = cats;
  }

  if (!categories.length) {
    const generic = extractAnyAppJson(html);
    const gcats = normalizeCategories(
      generic?.menu?.categories ||
      generic?.menu?.sections ||
      generic?.entities?.categories
    );
    if (gcats.length) categories = gcats;
    name = name || generic?.restaurant?.name || generic?.merchant?.name || null;
  }

  return { platform: "ubereats", url, restaurant: { name, address }, categories };
}

function extractJustEat(html, url) {
  const next = extractScriptJSON(html, "__NEXT_DATA__");
  let name, address, categories = [];
  const pp = next?.props?.pageProps;
  const init = pp?.initialState || pp;

  // Just Eat often has menu -> categories -> products
  const cats =
    init?.menu?.categories ||
    init?.entities?.categories ||
    init?.restaurant?.menu?.categories;

  if (cats && Array.isArray(cats)) {
    const out = [];
    for (const c of cats) {
      const cname = c?.name || c?.title;
      const items = normalizeItems(c?.products || c?.items);
      if (cname && items.length) out.push({ name: cname, items });
    }
    categories = out;
  }

  name =
    init?.restaurant?.name ||
    init?.venue?.name ||
    init?.store?.name ||
    pp?.seo?.title ||
    null;

  address =
    init?.restaurant?.address ||
    init?.venue?.address ||
    null;

  if (!categories.length) {
    const generic = extractAnyAppJson(html);
    const gcats = normalizeCategories(
      generic?.menu?.categories ||
      generic?.menu?.sections
    );
    if (gcats.length) categories = gcats;
    name = name || generic?.restaurant?.name || null;
  }

  return { platform: "justeat", url, restaurant: { name, address }, categories };
}

function pickExtractor(platform) {
  switch ((platform || "").toLowerCase()) {
    case "deliveroo": return extractDeliveroo;
    case "ubereats":  return extractUberEats;
    case "justeat":   return extractJustEat;
    default: return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { platform, restaurantUrl } = req.body || {};
  if (!platform || !restaurantUrl) {
    return res.status(400).json({ error: "platform, restaurantUrl required" });
  }

  const extractFn = pickExtractor(platform);
  if (!extractFn) {
    return res.status(400).json({ error: "unsupported platform" });
  }

  try {
    // Get Zyte API key from settings
    const settings = await AppSettings.filter({ setting_key: 'zyte_api_key' });
    if (settings.length === 0) {
      return res.status(500).json({ error: "Zyte API key not configured" });
    }

    const zyteApiKey = settings[0].setting_value;
    const ZYTE_AUTH = "Basic " + btoa(zyteApiKey + ":");

    console.log(`[ZyteRestaurantsFetch] Making REAL Zyte API call for ${platform}: ${restaurantUrl}`);

    // 1) Get fully rendered HTML via Zyte (browser mode)
    const zyteReq = {
      url: restaurantUrl,
      browserHtml: true,
      httpResponseBody: true,
      // help with geo/locale
      geolocation: { countryCode: "GB" },
      requestHeaders: {
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      // Basic retry
      turbo: true
    };

    const response = await fetch("https://api.zyte.com/v1/extract", {
      method: "POST",
      headers: {
        Authorization: ZYTE_AUTH,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(zyteReq)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[ZyteRestaurantsFetch] Zyte API error ${response.status}: ${errorText}`);
      return res.status(502).json({ 
        ok: false, 
        source: "zyte", 
        status: response.status, 
        error: errorText.slice(0, 500) 
      });
    }

    const data = await response.json();
    const html = data?.httpResponseBody || data?.browserHtml || data?.html || "";

    console.log(`[ZyteRestaurantsFetch] Received HTML (${html.length} chars) from Zyte for ${platform}`);

    // 2) Parse menus using our extractors
    const normalized = extractFn(html, restaurantUrl);

    // 3) Real-only guards
    if (!normalized?.restaurant?.name || isMocky(normalized?.restaurant?.name)) {
      console.warn(`[ZyteRestaurantsFetch] No valid restaurant name found for ${restaurantUrl}`);
      return res.status(422).json({ 
        ok: false, 
        code: "NO_RESTAURANT_NAME", 
        platform, 
        url: restaurantUrl 
      });
    }

    if (!normalized?.categories?.length) {
      console.warn(`[ZyteRestaurantsFetch] No menu categories found for ${restaurantUrl}`);
      return res.status(424).json({ 
        ok: false, 
        code: "NO_MENU_FOUND", 
        platform, 
        url: restaurantUrl 
      });
    }

    const totalItems = normalized.categories.reduce((a, c) => a + (c.items?.length || 0), 0);
    if (totalItems === 0) {
      console.warn(`[ZyteRestaurantsFetch] No menu items found for ${restaurantUrl}`);
      return res.status(424).json({ 
        ok: false, 
        code: "NO_ITEMS_FOUND", 
        platform, 
        url: restaurantUrl 
      });
    }

    console.log(`[ZyteRestaurantsFetch] Successfully extracted ${totalItems} items from ${normalized.restaurant.name}`);

    return res.status(200).json({ 
      ok: true, 
      ...normalized, 
      totalItems,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[ZyteRestaurantsFetch] Error processing ${platform} ${restaurantUrl}:`, error);
    return res.status(500).json({ 
      ok: false, 
      error: String(error?.message || error) 
    });
  }
}
