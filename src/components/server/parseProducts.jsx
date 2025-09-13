// components/server/parseProducts.js
// Server-only HTML → [{ title, price, url, priceText }] for UK grocers.
// Includes retailer-specific selectors + a generic fallback.
import * as cheerio from "cheerio";

/* ---------------------------- helpers ---------------------------- */
function absolutizeUrl(href, base) {
  try {
    if (!href) return null;
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function normalizePriceText(text) {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  const m = cleaned.match(/£\s*\d+(?:\.\d{1,2})?/);
  return m ? m[0].replace(/\s+/g, "") : null; // e.g. "£1.25"
}

function parsePriceNumber(priceText) {
  if (!priceText) return null;
  const m = priceText.match(/\d+(?:\.\d{1,2})?/);
  return m ? Number(m[0]) : null;
}

function pushIfValid(out, { title, priceText, link, baseUrl }) {
  const url = absolutizeUrl(link, baseUrl);
  if (!title || !url) return;
  const price = parsePriceNumber(priceText || "");
  out.push({ title: title.trim(), price, url, priceText: priceText || null });
}

/* ----------------------- retailer: tesco.com ---------------------- */
function parseTesco($, baseUrl) {
  const out = [];

  // Modern Tesco PLP uses data-auto props.
  $('[data-auto="product-tile"], article.product-tile, .product-tile').each((_, el) => {
    const root = $(el);

    const link =
      root.find('a[data-auto="product-tile-link"]').attr("href") ||
      root.find("a").first().attr("href");

    const title =
      root.find('[data-auto="product-tile-title"]').text().trim() ||
      root.find(".product-tile__title, .product-details__name, h3, h2").first().text().trim();

    const priceText =
      normalizePriceText(
        root.find('[data-auto="price-value"], .price__value, .value, .price').first().text()
      ) || normalizePriceText(root.text());

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  // Fallback: grid items with aria labels
  if (out.length === 0) {
    $('a[aria-label*="Add"], a[aria-label*="product"]').each((_, a) => {
      const link = $(a).attr("href");
      const title = ($(a).attr("aria-label") || "").replace(/^Add\s+/i, "").trim();
      if (!title || !link) return;
      const priceText = normalizePriceText($(a).closest("article,li,div").text());
      pushIfValid(out, { title, priceText, link, baseUrl });
    });
  }

  return out;
}

/* ------------------- retailer: iceland.co.uk ---------------------- */
function parseIceland($, baseUrl) {
  const out = [];

  // Product cards / tiles
  $('.product-card, .product-tile, li.product, .product-list__item, article.product').each((_, el) => {
    const root = $(el);
    const link = root.find("a").first().attr("href");

    const title =
      root.find(".product-card__title, .product-title, .product-card__name, h3, h2")
        .first()
        .text()
        .trim();

    const priceText =
      normalizePriceText(
        root
          .find(".product-card__price, .product-price, .price, .value, [data-test='product-price']")
          .first()
          .text()
      ) || normalizePriceText(root.text());

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  return out;
}

/* ---------------- retailer: sainsburys.co.uk ---------------------- */
function parseSainsburys($, baseUrl) {
  const out = [];

  // Data-test driven product cards
  $('[data-test-id="product-card"], [data-test="product-tile"], article').each((_, el) => {
    const root = $(el);

    // Prefer internal PDP link
    const link =
      root.find('a[href*="/buy/"], a[href*="/product/"], a[href^="/"]').first().attr("href") ||
      root.find("a").first().attr("href");

    const title =
      root.find('[data-test-id="product-card-title"], h3, h2, .title, .pd__title')
        .first()
        .text()
        .trim();

    const priceText =
      normalizePriceText(
        root
          .find(
            '[data-test-id="price"], [data-test="product-card-price"], .price, .value, .pd__cost'
          )
          .first()
          .text()
      ) || normalizePriceText(root.text());

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  return out;
}

/* --------------------- retailer: asda.com ------------------------- */
function parseAsda($, baseUrl) {
  const out = [];

  // Legacy classes often include "co-" prefixes
  $('.co-product, .co-item, [data-auto-id="product-card"], article, li').each((_, el) => {
    const root = $(el);

    const link =
      root.find('a[href*="/groceries/product/"], a[href^="/"], a[href^="http"]').first().attr("href");

    const title =
      root.find(".co-product__title, .co-product__anchor, h3, h2, .title").first().text().trim() ||
      (root.find("a").first().attr("aria-label") || "").trim();

    const priceText =
      normalizePriceText(
        root.find(".co-product__price, .price, .value, [data-test-id='price']").first().text()
      ) || normalizePriceText(root.text());

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  return out;
}

/* ------------------ retailer: morrisons.com ----------------------- */
function parseMorrisons($, baseUrl) {
  const out = [];

  // Product grid items
  $('.productGridItem, [data-testid="product-tile"], article, li').each((_, el) => {
    const root = $(el);
    const link =
      root.find('a[href*="/products/"], a[href^="/"], a[href^="http"]').first().attr("href");

    const title =
      root.find("h3, h2, .title, [data-testid='product-title']").first().text().trim() ||
      (root.find("a").first().attr("aria-label") || "").trim();

    const priceText =
      normalizePriceText(
        root.find("[data-testid='price'], .price, .value").first().text()
      ) || normalizePriceText(root.text());

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  return out;
}

/* --------------------- generic fallback --------------------------- */
function parseGeneric($, baseUrl) {
  const out = [];
  const priceNodes = $('*:contains("£")').filter((_, el) => {
    const t = $(el).text();
    return /£\s*\d+(?:\.\d{1,2})?/.test(t) && $(el).children().length === 0;
  });

  priceNodes.each((_, priceEl) => {
    const priceText = normalizePriceText($(priceEl).text());
    if (!priceText) return;

    // climb up to a likely "card"
    let card = $(priceEl);
    for (let i = 0; i < 4; i++) card = card.parent();

    const linkEl = card.find('a[href^="/"], a[href^="http"]').first();
    if (!linkEl.length) return;

    const link = linkEl.attr("href");
    const title =
      (linkEl.attr("aria-label") || "").trim() ||
      linkEl.text().trim() ||
      card.find("h3, h2, .title").first().text().trim();

    if (title && link) pushIfValid(out, { title, priceText, link, baseUrl });
  });

  return out;
}

/* ------------------------- dispatcher ----------------------------- */
function detectRetailer(listUrl) {
  try {
    const u = new URL(listUrl);
    const h = u.hostname.replace(/^www\./, "");
    if (h.endsWith("tesco.com")) return "tesco";
    if (h.endsWith("iceland.co.uk")) return "iceland";
    if (h.endsWith("sainsburys.co.uk")) return "sainsburys";
    if (h.endsWith("asda.com")) return "asda";
    if (h.endsWith("morrisons.com")) return "morrisons";
    return "generic";
  } catch {
    return "generic";
  }
}

/* --------------------------- export ------------------------------- */
export function parseProductsFromHtml(html, listUrl) {
  const $ = cheerio.load(html);
  const retailer = detectRetailer(listUrl);

  let items = [];
  switch (retailer) {
    case "tesco":
      items = parseTesco($, listUrl);
      break;
    case "iceland":
      items = parseIceland($, listUrl);
      break;
    case "sainsburys":
      items = parseSainsburys($, listUrl);
      break;
    case "asda":
      items = parseAsda($, listUrl);
      break;
    case "morrisons":
      items = parseMorrisons($, listUrl);
      break;
    default:
      items = [];
  }

  // Always add generic fallback to catch stragglers / layout shifts
  const generic = parseGeneric($, listUrl);

  // Merge + dedupe by URL (or title|priceText)
  const map = new Map();
  [...items, ...generic].forEach((p) => {
    const key = p.url || `${p.title}|${p.priceText || ""}`;
    const existing = map.get(key);
    if (!existing) map.set(key, p);
    else if (existing.price == null && p.price != null) map.set(key, p); // prefer numeric price
  });

  // Clean + sort
  const products = [...map.values()].filter((p) => p.title && p.url);
  products.sort((a, b) => {
    if (a.price == null && b.price == null) return a.title.localeCompare(b.title);
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });

  return products;
}