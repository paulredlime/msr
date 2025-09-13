// Fallback to hardcoded URLs since environment variables aren't available in browser context
const GROCER_EP = 'https://eov213rrft8rpja.m.pipedream.net';
const ORDERS_EP = 'https://eov213rrft8rpja.m.pipedream.net/orders';

export async function fetchGrocerProducts({ store, listUrl }) {
  const res = await fetch(GROCER_EP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Fixed: Send 'url' parameter as expected by Pipedream workflow
    body: JSON.stringify({ url: listUrl })
  });
  const text = await res.text().catch(()=> '');
  let data; try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text.slice(0,200)}`); }
  if (!res.ok || !data?.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  return data; // { ok, count, products, audit }
}

export async function fetchLast10Orders({ provider, alias }) {
  const res = await fetch(ORDERS_EP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, alias })
  });
  const text = await res.text().catch(()=> '');
  let data; try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text.slice(0,200)}`); }
  if (!res.ok || !data?.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  return data; // { ok, provider, alias, orders:[...], audit:{...} }
}