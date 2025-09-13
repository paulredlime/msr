// The base endpoint for the entire workflow
const BASE_ENDPOINT = 'https://eov213rrft8rpja.m.pipedream.net';
// The specific path for the Orders API
const ORDERS_ENDPOINT = `${BASE_ENDPOINT}/orders`;

export async function fetchLast10Orders({ provider, alias }) {
  const res = await fetch(ORDERS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Updated body to use 'alias' instead of 'account'
    body: JSON.stringify({ provider, alias })
  });
  
  const text = await res.text().catch(()=> '');
  let data;
  try { 
    data = JSON.parse(text); 
  } catch { 
    throw new Error(`Non-JSON response from server: ${text.slice(0,200)}`); 
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || data?.detail || `HTTP Error: ${res.status}`);
  }

  return data; // { ok, provider, account, orders: [...], audit: {...} }
}