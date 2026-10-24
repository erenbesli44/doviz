import { useState, useEffect, useRef } from 'react';
import type { QuoteResponse } from '../data/api-types';

const SSE_BASE = '/api/v1/stream/quotes';
const RETRY_DELAYS_MS = [3_000, 10_000, 30_000];

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
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = () => {
      es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('init', (e: MessageEvent) => {
        const data: QuoteResponse[] = JSON.parse(e.data);
        const map: QuoteMap = {};
        for (const q of data) map[q.data.symbol] = q;
        setQuotes(map);
        setSseAvailable(true);
        attempt = 0;
      });

      es.addEventListener('quote', (e: MessageEvent) => {
        const q: QuoteResponse = JSON.parse(e.data);
        setQuotes((prev) => ({ ...prev, [q.data.symbol]: q }));
      });

      // nginx answers 429 when this IP already has 3 connections open (API
      // requests count too) and EventSource does not retry an HTTP error, so
      // try again a few times, spaced to stay under the 6/min stream limit.
      es.onerror = () => {
        setSseAvailable(false);
        es?.close();
        if (attempt < RETRY_DELAYS_MS.length) retry = setTimeout(connect, RETRY_DELAYS_MS[attempt++]);
      };
    };
    connect();

    return () => {
      clearTimeout(retry);
      es?.close();
      esRef.current = null;
    };
  }, [symbols.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, sseAvailable };
}
