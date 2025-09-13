import { useState } from 'react';
import { fetchLast10Orders, fetchOrdersBatch } from '../lib/ordersApi';

export function useOrdersFetcher() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchOrders = async ({ provider, account }) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchLast10Orders({ provider, account });
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchFetch = async (jobs) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchOrdersBatch(jobs);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { fetchOrders, batchFetch, loading, error, data };
}