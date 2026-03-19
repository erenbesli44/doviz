import { useState, useEffect, useRef } from 'react';
import type { QuoteResponse } from '../data/api-types';

const SSE_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/v1') + '/stream/quotes';

type QuoteMap = Record<string, QuoteResponse>;

interface SSEQuotesResult {
  quotes: QuoteMap;
  sseAvailable: boolean;
}

export function useSSEQuotes(symbols: string[]): SSEQuotesResult {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [sseAvailable, setSseAvailable] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    const url = `${SSE_BASE}?symbols=${encodeURIComponent(symbols.join(','))}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('init', (e: MessageEvent) => {
      const data: QuoteResponse[] = JSON.parse(e.data);
      const map: QuoteMap = {};
      for (const q of data) map[q.data.symbol] = q;
      setQuotes(map);
      setSseAvailable(true);
    });

    es.addEventListener('quote', (e: MessageEvent) => {
      const q: QuoteResponse = JSON.parse(e.data);
      setQuotes((prev) => ({ ...prev, [q.data.symbol]: q }));
    });

    es.onerror = () => {
      setSseAvailable(false);
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [symbols.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, sseAvailable };
}
