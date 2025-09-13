import { useState } from 'react';
import { scrapeGrocerProducts, batchScrapeProducts } from '../lib/grocersApi';

export function useGrocerScraper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const scrape = async ({ store, listUrl }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scrapeGrocerProducts({ store, listUrl });
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchScrape = async (jobs) => {
    setLoading(true);
    setError(null);
    try {
      const result = await batchScrapeProducts(jobs);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { scrape, batchScrape, loading, error, data };
}