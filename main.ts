// washout-bounce: long-only CBBTC mean-reversion bot for make.fun BTC race.
// Buy the full cash balance when the close has washed out (down > DIP_BPS over
// the last DIP_BARS bars) AND is already bouncing (up > UP_BPS over the last
// UP_BARS bars). Exit the whole position on take-profit, stop-loss, or time stop.
// All comparisons are pure integer cross-multiplication in basis points.
// No wall clock, no environment, no randomness: deterministic on the same window.
import { BPS, runBars } from './vendor/makefun-bars.ts';
import type { BarsState, Batch, BuyInput, SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const MIN_NOTIONAL = 1_000_000n;

// Tunable parameters (basis points / bars).
const DIP_BARS = 30;
const DIP_BPS = 80n;
const UP_BARS = 3;
const UP_BPS = 5n;
const TAKE_PROFIT = 150n;
const STOP_LOSS = 100n;
const MAX_HOLD = 45; // was 30: let a bounce run longer before the time stop exits it

// Close history (bigint prices), newest last. Kept bounded to DIP_BARS + 1.
const closes: bigint[] = [];
// Entry price and entry bar index (seq) of the open position, if any.
let entryPrice: bigint | null = null;
let entrySeq = -1;

function downMoreThan(now: bigint, past: bigint, bps: bigint): boolean {
  // now < past * (10000 - bps) / 10000  <=>  now * 10000 < past * (10000 - bps)
  return now * BPS < past * (BPS - bps);
}

function upMoreThan(now: bigint, past: bigint, bps: bigint): boolean {
  // now > past * (10000 + bps) / 10000  <=>  now * 10000 > past * (10000 + bps)
  return now * BPS > past * (BPS + bps);
}

await runBars({
  onBatch(state: BarsState, _batch: Batch): (BuyInput | SellInput)[] {
    if (state.warmingUp) return [];
    const bar = state.latest.get(SYMBOL);
    if (bar === undefined) return [];
    const close = BigInt(bar.c);
    closes.push(close);
    if (closes.length > DIP_BARS + 1) closes.shift();

    const held = state.positions.get(SYMBOL);

    if (held !== undefined && held.qty > 0n) {
      // Track entry from the position's cost when we do not know it yet
      // (e.g. after a restart mid-window); cost is per-unit approx via value.
      if (entryPrice === null) {
        const v = state.value(SYMBOL, held.qty, close);
        if (v > 0n) entryPrice = close;
      }
      const entry = entryPrice;
      if (entry !== null) {
        const tp = upMoreThan(close, entry, TAKE_PROFIT);
        const sl = downMoreThan(close, entry, STOP_LOSS);
        const timedOut = entrySeq >= 0 && state.seq - entrySeq >= MAX_HOLD;
        if (tp || sl || timedOut) {
          entryPrice = null;
          entrySeq = -1;
          return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: 150 }];
        }
      }
      return [];
    }

    // Flat: no open position.
    entryPrice = null;
    entrySeq = -1;
    if (closes.length < DIP_BARS + 1) return [];
    const dipPast = closes[closes.length - 1 - DIP_BARS];
    const upPast = closes.length > UP_BARS ? closes[closes.length - 1 - UP_BARS] : closes[0];
    if (closes.length <= UP_BARS) return [];
    if (!downMoreThan(close, dipPast, DIP_BPS)) return [];
    if (!upMoreThan(close, upPast, UP_BPS)) return [];
    const cash = state.cash;
    if (cash < MIN_NOTIONAL) return [];
    entryPrice = close;
    entrySeq = state.seq;
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: 150 }];
  },
});
