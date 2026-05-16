import { useEffect, useState } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import type { InferenceLatestResponse } from '../data/inference-types';

type Status = 'loading' | 'success' | 'error';

export function useInference() {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<InferenceLatestResponse | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const res = await inferenceApi.latest(ctl.signal);
        if (cancelled) return;
        setData(res);
        setStatus('success');
      } catch {
        if (cancelled) return;
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      ctl.abort();
    };
  }, []);

  return { status, data };
}
