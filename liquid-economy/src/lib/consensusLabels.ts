/**
 * Turkish-display mapping for the consensus + fresh-signal label sets.
 * Mirrors the band names produced by finance-api `consensus_service.py`.
 */

import type { ConsensusDirection, FreshSignalDirection } from '../data/consensus-types';

export const CONSENSUS_LABEL_TR: Record<ConsensusDirection, string> = {
  strong_bullish: 'Güçlü pozitif',
  mild_bullish: 'Hafif pozitif',
  neutral: 'Karışık / nötr',
  mild_bearish: 'Hafif negatif',
  strong_bearish: 'Güçlü negatif',
  uncertain: 'Belirsiz',
};

export const FRESH_SIGNAL_LABEL_TR: Record<FreshSignalDirection, string> = {
  bullish_shift: 'Pozitife dönüyor',
  bearish_shift: 'Negatife dönüyor',
  stable: 'Stabil',
  mixed: 'Karışık',
  high_volatility: 'Yüksek volatilite',
  no_fresh_data: 'Yeni veri yok',
};

/** Sentiment color band for both consensus and fresh-signal indicators. */
export function tone(direction: ConsensusDirection | FreshSignalDirection): 'bull' | 'bear' | 'neutral' {
  if (direction === 'strong_bullish' || direction === 'mild_bullish' || direction === 'bullish_shift') {
    return 'bull';
  }
  if (direction === 'strong_bearish' || direction === 'mild_bearish' || direction === 'bearish_shift') {
    return 'bear';
  }
  return 'neutral';
}
