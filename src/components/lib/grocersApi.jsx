
const API_ENDPOINT = 'https://eov213rrft8rpja.m.pipedream.net';

export async function scrapeGrocerProducts({ store, listUrl }) {
  if (!API_ENDPOINT) throw new Error('API_ENDPOINT not set');
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Updated body to match new spec: { url: "..." }
    body: JSON.stringify({ url: listUrl }) 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  
  return data; // { ok, count, products, audit }
}

export async function batchScrapeProducts(jobs) {
  // Similar to scrapeGrocerProducts, the API_ENDPOINT is now hardcoded.
  // The `if (!API_ENDPOINT)` check and throw is redundant and can be removed.
  // Following the "clean up project" instruction, removing unreachable code is a good practice.

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs: jobs.slice(0, 20) }) // Safety limit
  });

  const data = await response.json();
  return data; // { ok, batchCount, jobs: [...] }
}

export async function pingAPI() {
  // Same logic applies here as for the other functions.
  // The `if (!API_ENDPOINT)` check and throw is no longer needed.

  const response = await fetch(API_ENDPOINT);
  return response.json(); // { ok: true, router: "pipedream", ping: "pong" }
}
