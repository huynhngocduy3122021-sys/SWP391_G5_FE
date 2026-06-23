import { useState, useEffect } from 'react';

// Placeholder cho hook fetching data bãi đỗ
export function useParkingData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Implement fetch logic here
  }, []);

  return { data, loading, error };
}
