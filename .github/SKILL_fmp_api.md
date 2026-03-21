# SKILL: Financial Modeling Prep (FMP) API — Deep Reference

## Summary
FMP is the primary market-data provider for structured financial data in this project.
The user has upgraded to a **paid plan** (as of 2026-03). Use this skill whenever
working on FMP integration, adding new symbols, or expanding data coverage.

---

## 1. Authentication

All endpoints require `apikey`. Two methods:
```
# Header
apikey: YOUR_API_KEY

# Query param (most common, add &apikey= when other params exist)
?apikey=YOUR_API_KEY
?symbol=AAPL&apikey=YOUR_API_KEY
```
Key stored in: `finance-api/.env` → `FMP_API_KEY`
Loaded in provider via `dependencies.py` → passed into `FMPProvider(client, api_key)`.

---

## 2. Base URL & API Versions

| Version | Base | Status |
|---------|------|--------|
| **Stable** | `https://financialmodelingprep.com/stable` | **CURRENT — use this** |
| v3 | `https://financialmodelingprep.com/api/v3` | Legacy/deprecated → 403 for most |
| v4 | `https://financialmodelingprep.com/api/v4` | Some endpoints still active |

**Always use `/stable/`** unless a specific endpoint is only in v3/v4.

---

## 3. Quote Endpoints

### Single Quote (full)
```
GET /stable/quote?symbol=AAPL&apikey=KEY
GET /stable/quote?symbol=^GSPC&apikey=KEY   # index (note: ^ must be URL-encoded as %5E)
GET /stable/quote?symbol=GCUSD&apikey=KEY   # commodity
GET /stable/quote?symbol=EURUSD&apikey=KEY  # forex
GET /stable/quote?symbol=BTCUSD&apikey=KEY  # crypto
```
Returns: `[{symbol, name, price, changesPercentage, change, dayLow, dayHigh, 
           yearHigh, yearLow, marketCap, priceAvg50, priceAvg200, exchange,
           volume, avgVolume, open, previousClose, eps, pe, earningsAnnouncement,
           sharesOutstanding, timestamp}]`

### Short Quote (price+change+volume only)
```
GET /stable/quote-short?symbol=AAPL&apikey=KEY
```

### Batch Quote (multiple symbols, comma-separated)
```
GET /stable/batch-quote?symbols=AAPL,MSFT,GOOG&apikey=KEY
GET /stable/batch-quote-short?symbols=AAPL,MSFT&apikey=KEY
```

### Asset-Type-Specific Batch (all at once)
```
GET /stable/batch-index-quotes?apikey=KEY          # all indices
GET /stable/batch-commodity-quotes?apikey=KEY      # all commodities  
GET /stable/batch-forex-quotes?apikey=KEY          # all forex pairs
GET /stable/batch-crypto-quotes?apikey=KEY         # all crypto
GET /stable/batch-etf-quotes?apikey=KEY            # all ETFs
GET /stable/batch-exchange-quote?exchange=NASDAQ&apikey=KEY  # full exchange
```

### Price Change (multi-timeframe)
```
GET /stable/stock-price-change?symbol=AAPL&apikey=KEY
# Returns: {1D, 5D, 1M, 3M, 6M, ytd, 1Y, 3Y, 5Y, 10Y, max} percent changes
```

### After-Hours
```
GET /stable/aftermarket-trade?symbol=AAPL&apikey=KEY
GET /stable/aftermarket-quote?symbol=AAPL&apikey=KEY
```

---

## 4. Historical Price / Chart Endpoints

### EOD (End-of-Day) Light — date+price+volume only
```
GET /stable/historical-price-eod/light?symbol=AAPL&from=2024-01-01&to=2024-12-31&apikey=KEY
```
Returns: `[{date, price, volume}, ...]` — **newest first → reverse for chronological**

### EOD Full — OHLCV + change%
```
GET /stable/historical-price-eod/full?symbol=AAPL&from=2024-01-01&apikey=KEY
```
Returns: `[{date, open, high, low, close, volume, change, changePercent, vwap, ...}]`

### EOD Unadjusted (no split adjustment)
```
GET /stable/historical-price-eod/non-split-adjusted?symbol=AAPL&apikey=KEY
```

### EOD Dividend-Adjusted
```
GET /stable/historical-price-eod/dividend-adjusted?symbol=AAPL&apikey=KEY
```

### Intraday Charts (PREMIUM — unlocked with paid plan)
```
GET /stable/historical-chart/1min?symbol=AAPL&apikey=KEY
GET /stable/historical-chart/5min?symbol=AAPL&apikey=KEY
GET /stable/historical-chart/15min?symbol=AAPL&apikey=KEY
GET /stable/historical-chart/30min?symbol=AAPL&apikey=KEY
GET /stable/historical-chart/1hour?symbol=AAPL&apikey=KEY
GET /stable/historical-chart/4hour?symbol=AAPL&apikey=KEY
```
Optional params: `from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns: `[{date, open, high, low, close, volume}, ...]` — newest first

**Same intraday endpoints work for indices, forex, commodities, crypto** — just change `symbol`.

### Current FMP history implementation (fmp.py)
Uses: `GET /stable/historical-price-eod/light` with `from=` date param.
**Upgrade opportunity**: For intraday history (1h/5min bars), switch to `/stable/historical-chart/{interval}`.

---

## 5. Symbol Formats by Asset Type

| Asset Class | FMP Symbol Format | Examples |
|-------------|------------------|---------|
| US Stocks | Ticker | `AAPL`, `MSFT`, `TSLA` |
| Indices | `^SYMBOL` | `^GSPC`, `^DJI`, `^NDX`, `^FTSE`, `^GDAXI`, `^N225`, `^VIX` |
| Forex | `XXXYYY` (no slash) | `EURUSD`, `GBPUSD`, `USDTRY`, `EURTRY`, `USDJPY` |
| Commodities | `XXXUSD` (FMP spot) | `GCUSD` (Gold), `SIUSD` (Silver), `BZUSD` (Brent), `CLUSD` (WTI), `NGUSD` (NatGas), `HGUSD` (Copper), `KWUSD` (Wheat) |
| Crypto | `XXXUSD` | `BTCUSD`, `ETHUSD`, `SOLUSD` |
| ETFs | Ticker | `SPY`, `QQQ`, `GLD` |

**Note**: URL-encode `^` as `%5E` in query strings (httpx handles this automatically with `params=`).

### Free Tier vs Paid Plan Coverage (tested 2026-03)
Previously on free plan — these returned 402:
- ❌ `^NDX` (Nasdaq 100), `^GDAXI` (DAX) — now likely ✓ on paid
- ❌ `CLUSD` (WTI), `NGUSD` (NatGas), `HGUSD` (Copper), `KWUSD` (Wheat) — likely ✓
- ❌ `USDTRY`, `EURTRY`, `GBPTRY` — TRY forex — verify with paid plan
- ❌ Intraday charts (1min/5min/1hour) — likely ✓ on paid

**Run `scripts/test_fmp_stable.py` to re-verify all symbols after plan upgrade.**

---

## 6. Financial Statements

### Income Statement
```
GET /stable/income-statement?symbol=AAPL&period=annual&limit=5&apikey=KEY
GET /stable/income-statement?symbol=AAPL&period=quarter&limit=4&apikey=KEY
GET /stable/income-statement-ttm?symbol=AAPL&apikey=KEY   # trailing 12 months
```

### Balance Sheet
```
GET /stable/balance-sheet-statement?symbol=AAPL&period=annual&apikey=KEY
GET /stable/balance-sheet-statement-ttm?symbol=AAPL&apikey=KEY
```

### Cash Flow
```
GET /stable/cash-flow-statement?symbol=AAPL&period=annual&apikey=KEY
GET /stable/cash-flow-statement-ttm?symbol=AAPL&apikey=KEY
```

### Growth Metrics
```
GET /stable/income-statement-growth?symbol=AAPL&apikey=KEY
GET /stable/balance-sheet-statement-growth?symbol=AAPL&apikey=KEY
GET /stable/cash-flow-statement-growth?symbol=AAPL&apikey=KEY
GET /stable/financial-growth?symbol=AAPL&apikey=KEY   # combined
```

### Key Metrics & Ratios
```
GET /stable/key-metrics?symbol=AAPL&period=annual&apikey=KEY
GET /stable/key-metrics-ttm?symbol=AAPL&apikey=KEY
GET /stable/ratios?symbol=AAPL&apikey=KEY
GET /stable/ratios-ttm?symbol=AAPL&apikey=KEY
GET /stable/financial-scores?symbol=AAPL&apikey=KEY   # Altman Z, Piotroski
```

### Bulk Downloads (entire market at once)
```
GET /stable/income-statement-bulk?year=2025&period=Q1&apikey=KEY
GET /stable/balance-sheet-statement-bulk?year=2025&period=Q1&apikey=KEY
GET /stable/cash-flow-statement-bulk?year=2025&period=Q1&apikey=KEY
GET /stable/key-metrics-ttm-bulk?apikey=KEY
GET /stable/ratios-ttm-bulk?apikey=KEY
GET /stable/eod-bulk?date=2024-10-22&apikey=KEY       # EOD prices for all symbols
```

---

## 7. Company Information

```
GET /stable/profile?symbol=AAPL&apikey=KEY            # full company profile
GET /stable/key-executives?symbol=AAPL&apikey=KEY
GET /stable/stock-peers?symbol=AAPL&apikey=KEY
GET /stable/market-capitalization?symbol=AAPL&apikey=KEY
GET /stable/historical-market-capitalization?symbol=AAPL&apikey=KEY
GET /stable/shares-float?symbol=AAPL&apikey=KEY
GET /stable/employee-count?symbol=AAPL&apikey=KEY
GET /stable/enterprise-values?symbol=AAPL&apikey=KEY
```

---

## 8. Search & Directory

```
GET /stable/search-symbol?query=AAPL&apikey=KEY       # by ticker
GET /stable/search-name?query=Apple&apikey=KEY        # by company name
GET /stable/search-cik?cik=320193&apikey=KEY
GET /stable/search-cusip?cusip=037833100&apikey=KEY
GET /stable/company-screener?marketCap=..&sector=..&apikey=KEY  # stock screener
GET /stable/stock-list?apikey=KEY                     # all symbols
GET /stable/etf-list?apikey=KEY
GET /stable/forex-list?apikey=KEY
GET /stable/cryptocurrency-list?apikey=KEY
GET /stable/commodities-list?apikey=KEY
GET /stable/index-list?apikey=KEY
GET /stable/available-exchanges?apikey=KEY
```

---

## 9. Market Data & Calendar

### Market Hours
```
GET /stable/exchange-market-hours?exchange=NASDAQ&apikey=KEY
GET /stable/all-exchange-market-hours?apikey=KEY
GET /stable/holidays-by-exchange?exchange=NASDAQ&apikey=KEY
```

### Market Performance
```
GET /stable/biggest-gainers?apikey=KEY
GET /stable/biggest-losers?apikey=KEY
GET /stable/most-actives?apikey=KEY
GET /stable/sector-performance-snapshot?date=2024-02-01&apikey=KEY
GET /stable/historical-sector-performance?sector=Energy&apikey=KEY
```

### Index Constituents
```
GET /stable/sp500-constituent?apikey=KEY
GET /stable/nasdaq-constituent?apikey=KEY
GET /stable/dowjones-constituent?apikey=KEY
```

---

## 10. News

```
GET /stable/news/stock-latest?page=0&limit=20&apikey=KEY
GET /stable/news/stock?symbols=AAPL&apikey=KEY        # by symbol
GET /stable/news/forex-latest?page=0&limit=20&apikey=KEY
GET /stable/news/crypto-latest?page=0&limit=20&apikey=KEY
GET /stable/news/general-latest?page=0&limit=20&apikey=KEY
GET /stable/news/press-releases-latest?page=0&limit=20&apikey=KEY
GET /stable/news/press-releases?symbols=AAPL&apikey=KEY
```

---

## 11. Technical Indicators

All use `timeframe` (1min, 5min, 15min, 30min, 1hour, 4hour, 1day) and `periodLength`.

```
GET /stable/technical-indicators/sma?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/ema?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/wma?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/dema?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/tema?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/williams?symbol=AAPL&periodLength=14&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/adx?symbol=AAPL&periodLength=14&timeframe=1day&apikey=KEY
GET /stable/technical-indicators/standarddeviation?symbol=AAPL&periodLength=20&timeframe=1day&apikey=KEY
```

---

## 12. Earnings, Dividends, Events

```
GET /stable/earnings?symbol=AAPL&apikey=KEY           # EPS history + estimates
GET /stable/earnings-calendar?apikey=KEY              # upcoming earnings (date range optional)
GET /stable/dividends?symbol=AAPL&apikey=KEY
GET /stable/dividends-calendar?apikey=KEY
GET /stable/splits?symbol=AAPL&apikey=KEY
GET /stable/splits-calendar?apikey=KEY
GET /stable/ipos-calendar?apikey=KEY
GET /stable/economic-calendar?apikey=KEY
```

---

## 13. Analyst, Ratings, Valuation

```
GET /stable/analyst-estimates?symbol=AAPL&period=annual&apikey=KEY
GET /stable/ratings-snapshot?symbol=AAPL&apikey=KEY
GET /stable/ratings-historical?symbol=AAPL&apikey=KEY
GET /stable/grades?symbol=AAPL&apikey=KEY
GET /stable/grades-historical?symbol=AAPL&apikey=KEY
GET /stable/grades-consensus?symbol=AAPL&apikey=KEY   # summary: buy/hold/sell counts
GET /stable/price-target-summary?symbol=AAPL&apikey=KEY
GET /stable/price-target-consensus?symbol=AAPL&apikey=KEY
GET /stable/discounted-cash-flow?symbol=AAPL&apikey=KEY
GET /stable/levered-discounted-cash-flow?symbol=AAPL&apikey=KEY
```

---

## 14. Institutional Ownership / 13F

```
GET /stable/institutional-ownership/latest?page=0&limit=100&apikey=KEY
GET /stable/institutional-ownership/extract?cik=0001388838&year=2023&quarter=3&apikey=KEY
GET /stable/institutional-ownership/symbol-positions-summary?symbol=AAPL&year=2023&quarter=3&apikey=KEY
GET /stable/institutional-ownership/holder-performance-summary?cik=0001067983&apikey=KEY
```

---

## 15. ETF / Mutual Funds

```
GET /stable/etf/holdings?symbol=SPY&apikey=KEY
GET /stable/etf/info?symbol=SPY&apikey=KEY
GET /stable/etf/sector-weightings?symbol=SPY&apikey=KEY
GET /stable/etf/country-weightings?symbol=SPY&apikey=KEY
GET /stable/etf/asset-exposure?symbol=AAPL&apikey=KEY   # which ETFs hold AAPL
GET /stable/funds/disclosure?symbol=VWO&year=2023&quarter=4&apikey=KEY
```

---

## 16. SEC Filings

```
GET /stable/sec-filings-8k?from=2024-01-01&to=2024-03-01&page=0&limit=100&apikey=KEY
GET /stable/sec-filings-search/symbol?symbol=AAPL&apikey=KEY
GET /stable/sec-filings-search/form-type?formType=10-K&apikey=KEY
GET /stable/sec-profile?symbol=AAPL&apikey=KEY
```

---

## 17. Economic Indicators

```
GET /stable/treasury-rates?apikey=KEY
GET /stable/economic-indicators?name=GDP&apikey=KEY
# name options: GDP, realGDP, nominalPotentialGDP, realGDPPerCapita, 
#   federalFunds, CPI, inflationRate, inflation, retailSales, 
#   consumerSentiment, durableGoods, unemploymentRate, totalNonfarmPayroll,
#   initialClaims, industrialProductionTotalIndex, newPrivatelyOwnedHousingUnitsStartedTotalUnits,
#   totalVehicleSales, retailMoneyFunds, smoothedUSRecessionProbabilities,
#   3MonthOr90DayRatesAndYieldsCertificatesOfDeposit, commercialBankCreditAllBanks,
#   realEstateLoans, M2, velocityOfM2MoneyStock, manufacturingPMI
GET /stable/economic-calendar?apikey=KEY
GET /stable/market-risk-premium?apikey=KEY
```

---

## 18. Insider Trades & Senate/House

```
GET /stable/insider-trading/latest?page=0&limit=100&apikey=KEY
GET /stable/insider-trading/search?symbol=AAPL&apikey=KEY
GET /stable/insider-trading/statistics?symbol=AAPL&apikey=KEY
GET /stable/senate-trades?symbol=AAPL&apikey=KEY
GET /stable/house-trades?symbol=AAPL&apikey=KEY
```

---

## 19. ESG & COT Reports

```
GET /stable/esg-ratings?symbol=AAPL&apikey=KEY
GET /stable/commitment-of-traders-report?apikey=KEY
GET /stable/commitment-of-traders-list?apikey=KEY
```

---

## 20. Earnings Transcripts

```
GET /stable/earning-call-transcript?symbol=AAPL&year=2024&quarter=1&apikey=KEY
GET /stable/earning-call-transcript-latest?apikey=KEY
GET /stable/earning-call-transcript-dates?symbol=AAPL&apikey=KEY
```

---

## 21. Common Response Patterns & Error Handling

### Quote response key fields (from `RawQuote` mapping in fmp.py):
- `price` → current price (None = bad data, raise ProviderError)
- `changesPercentage` → daily % change (use `or 0.0` for None)
- `open`, `dayHigh`, `dayLow` → OHLC
- `previousClose` → yesterday's close

### EOD History response:
- Returns list newest-first → **always reverse()** for chronological order
- `/light` returns `{date, price, volume}` — price = close
- `/full` returns `{date, open, high, low, close, volume, change, changePercent, vwap}`

### Intraday History response:
- Returns `{date, open, high, low, close, volume}` — date is datetime string e.g. `"2024-01-15 09:30:00"`
- Also newest-first → reverse if needed

### Common error patterns:
- `402` = feature requires paid plan
- `403` = wrong API version (using deprecated v3/v4 endpoint)
- `401` = invalid API key
- Empty list `[]` = symbol not found / no data for that period
- `{"Error Message": "..."}` = occasionally returned instead of list — check with `isinstance(d, list)`

---

## 22. Upgrade Impact: Symbols Previously Blocked (Free → Paid)

When testing after upgrade, re-run `scripts/test_fmp_stable.py` and also test:
```python
# Symbols that returned 402 on free plan — likely now available:
newly_available = [
    "^NDX",    # Nasdaq 100  
    "^GDAXI",  # DAX (Germany)
    "CLUSD",   # WTI Crude Oil
    "NGUSD",   # Natural Gas
    "HGUSD",   # Copper
    "KWUSD",   # Wheat
    "USDTRY",  # USD/TRY  (verify — may still require special FX subscription)
    "EURTRY",  # EUR/TRY
]
# Test intraday:
# GET /stable/historical-chart/1hour?symbol=^GSPC&apikey=KEY
# GET /stable/historical-chart/5min?symbol=GCUSD&apikey=KEY
```

---

## 23. How to Add a New FMP Symbol to This Project

1. Verify symbol works: `GET /stable/quote?symbol=NEW_SYM&apikey=KEY` → non-empty list with price
2. Add to `app/symbols/registry.py` SYMBOL_REGISTRY:
   - Set `primary_provider="fmp"` or as fallback
   - Set `external_primary="NEW_SYM"` (FMP format)
   - Choose appropriate TTL (1800s for delayed indices, 60s for intraday)
3. If FMP is now the primary for a symbol previously Yahoo-only (e.g. after TRY unlock):
   - Update `primary_provider` and set `external_primary` to FMP symbol format
4. No changes needed to fmp.py for standard quote/history — it's generic

---

## 24. FMP Provider Code Location

- Provider: [`finance-api/app/providers/fmp.py`](../finance-api/app/providers/fmp.py)
- Registered in: [`finance-api/app/providers/registry.py`](../finance-api/app/providers/registry.py)
- All symbols: [`finance-api/app/symbols/registry.py`](../finance-api/app/symbols/registry.py)
- Test scripts: `finance-api/scripts/test_fmp.py`, `test_fmp_stable.py`, `test_fmp_plan.py`
- Config (key load): [`finance-api/app/config.py`](../finance-api/app/config.py) → `FMP_API_KEY`

---

## 25. Upgrade Action Checklist (After Plan Promotion)

- [ ] Run `scripts/test_fmp_stable.py` — note all ✓ vs ✗
- [ ] Test intraday endpoint: `GET /stable/historical-chart/1hour?symbol=^GSPC&apikey=KEY`
- [ ] Test previously-blocked symbols (`^NDX`, `^GDAXI`, `CLUSD`, `NGUSD`, `USDTRY`)
- [ ] If intraday works: update `fetch_history()` in `fmp.py` to use intraday endpoint when `hours <= 48`
- [ ] If TRY forex works: update `USD/TRY` in symbol registry from Yahoo-only → FMP primary
- [ ] If `^NDX`/`^GDAXI` work: update their symbol registry entries to use FMP as primary
- [ ] Consider adding batch quote calls to reduce total request count for warmup
