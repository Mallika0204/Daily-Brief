import { useCallback, useEffect, useState } from 'react';

export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  publishedAt: string | null;
  source: string;
  topic: string;
  region: string;
}
export interface SourceStatus {
  name: string;
  topic: string;
  region: string;
  url: string;
  status: 'ok' | 'error';
  count: number;
}
export interface NewsResponse {
  articles: Article[];
  sources: SourceStatus[];
  updatedAt: string;
  stale: boolean;
}
export function useNews() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/news`);
      if (!response.ok) throw new Error('News sources are temporarily unavailable. Please try again shortly.');
      setData(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load news.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(refresh, 300000); return () => clearInterval(timer); }, [refresh]);
  return { data, loading, error, refresh };
}
