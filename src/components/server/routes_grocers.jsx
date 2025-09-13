python
import os, base64, re
from urllib.parse import urljoin, urlparse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx
from bs4 import BeautifulSoup

router = APIRouter(prefix="/api", tags=["grocers"])

# ---- Zyte auth (server-only) ----
def _zyte_auth_header() -> str:
    key = os.getenv("ZYTE_API_KEY") or os.getenv("NEXT_PRIVATE_ZYTE_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ZYTE_API_KEY not set on server")
    token = base64.b64encode(f"{key}:".encode()).decode()
    return f"Basic {token}"

# ---- Minimal parser ----
_price_re = re.compile(r"£\s*\d+(?:\.\d{1,2})?")
_num_re = re.compile(r"\d+(?:\.\d{1,2})?")

def _normalize_price_text(text: str | None):
    if not text: return None
    m = _price_re.search(" ".join(text.split()))
    return m.group(0).replace(" ", "") if m else None

def _price_num(price_text: str | None):
    if not price_text: return None
    m = _num_re.search(price_text)
    return float(m.group(0)) if m else None

def _parse_products(html: str, base_url: str):
    soup = BeautifulSoup(html, "lxml")
    out = []
    for node in soup.find_all(string=_price_re):
        price_text = _normalize_price_text(str(node))
        if not price_text:
            continue
        card = getattr(node, "parent", None)
        for _ in range(4):
            if card and getattr(card, "parent", None):
                card = card.parent
        a = card.find("a", href=True) if card else None
        if not a:
            continue
        url = urljoin(base_url, a["href"])
        title = (a.get("aria-label") or a.get_text(strip=True) or "").strip()
        if not title:
            h = card.find(["h2", "h3"]) if card else None
            title = h.get_text(strip=True) if h else None
        if not title:
            continue
        out.append({
            "title": title,
            "priceText": price_text,
            "price": _price_num(price_text),
            "url": url,
        })
    # de-dupe by URL (prefer numeric price)
    dedup = {}
    for p in out:
        u = p["url"]
        if u not in dedup or (dedup[u]["price"] is None and p["price"] is not None):
            dedup[u] = p
    items = list(dedup.values())
    items.sort(key=lambda x: (x["price"] is None, x["price"] or 0.0, x["title"]))
    return items

async def _zyte_fetch_html(list_url: str) -> str:
    headers = {"Authorization": _zyte_auth_header(), "Content-Type": "application/json"}
    payload = {"url": list_url, "httpResponseBody": True}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post("https://api.zyte.com/v1/extract", headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Zyte {r.status_code}: {r.text[:400]}")
        data = r.json()
    return (data or {}).get("httpResponseBody") or ""

# ---- One handler bound to both paths & all needed methods ----
for path in ("/grocers/zyte", "/grocers/zyte/"):
    @router.api_route(path, methods=["OPTIONS", "GET", "POST"])
    async def grocers_endpoint(request: Request):
        # CORS/preflight
        if request.method == "OPTIONS":
            return JSONResponse(
                {},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
            )

        # Ping
        if request.method == "GET":
            return {"ok": True, "router": "fastapi", "ping": "pong"}

        # POST: real Zyte call
        body = await request.json()
        store = (body.get("store") or "").strip()
        list_url = (body.get("listUrl") or "").strip()
        if not store or not list_url:
            raise HTTPException(status_code=400, detail="Missing store or listUrl")
        host = urlparse(list_url).hostname or ""
        if "." not in host:
            raise HTTPException(status_code=400, detail="Invalid listUrl")

        html = await _zyte_fetch_html(list_url)
        products = _parse_products(html, list_url)
        return {"ok": True, "count": len(products), "products": products}