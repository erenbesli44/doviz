# X (Twitter) account kit — dovizveri.com

Status: draft (2026-10-24). The account is opened by the owner (phone/SMS + CAPTCHA required).
**Never write credentials into this repo — it is public.** Keep them in a password manager
(1Password / Bitwarden / iCloud Keychain) under the entry "dovizveri — X" and "dovizveri — Gmail".

## 1. Accounts to open (in order)

1. **Gmail**: preferred `dovizveri.official@gmail.com`; alternatives `dovizvericom@gmail.com`, `dovizveri.tr@gmail.com`.
   - Better long-term option: an `x@dovizveri.com` / `social@dovizveri.com` address on your own domain (does not depend on a personal Gmail).
   - Password: generate with the password manager (≥ 20 characters, random). Turn on 2FA (authenticator app) right away.
2. **X**: handle candidates (≤ 15 characters):
   1. `@dovizveri` (first choice)
   2. `@dovizvericom`
   3. `@dovizveri_tr`
   - Turn on 2FA (authenticator app, not SMS). Fill in birth date with the company/owner info.
   - Settings → "Your account" → Account type: **Professional → Category: "Media & News" / "Financial Services"**.

## 2. Profile

| Field | Value |
|---|---|
| Display name | `Döviz Veri` |
| Bio (≤160) | `Piyasa beklentileri, kaynağıyla. Hangi yorumcu ne bekliyor, görüşü nasıl değişti — dolar, euro, altın, BIST. Yatırım tavsiyesi değildir.` |
| Location | `İstanbul, Türkiye` |
| Website | `https://dovizveri.com` |
| Avatar | site logo, 400×400, plain background (also readable at small sizes) |
| Banner | 1500×500: "Kim ne bekliyor?" + dovizveri.com, neutral dark background |

## 3. Example accounts and what we take from them

| Account | What we take |
|---|---|
| Reuters Business (@ReutersBiz) | Short, factual headline + link; no emojis |
| Bloomberg Markets (@markets) | Number first: "USD/TRY 34.52 (+0.4%)" |
| Financial Times (@FT) | Calm tone, no clickbait |
| The Kobeissi Letter | Short threads + a single chart per thread |
| Lisa Abramowicz (@lisaabramowicz1) | One-sentence insight + chart |

Principle: **number → claim → source → link.** Evidence over hype; no "BOMBA", "SON DAKİKA!!!" style.

## 4. Content formats

1. **Daily outlook (09:30)**: "USD/TRY için bugün: 5 yorumcudan 3'ü yükseliş, 1'i yatay, 1'i düşüş bekliyor. Kim ne dedi 👉 dovizveri.com/..."
2. **View change**: "{Yorumcu} altında görüşünü 'yükseliş'ten 'yatay'a çekti (önceki: 12 Ekim). Kanıt: video ⏱ 14:32 → link"
3. **Weekly thread (Friday)**: the week's consensus per instrument + 1 chart.
4. **News → insight**: one sentence from the headline + which commentators the news supports/contradicts.

Rules:
- Every tweet has a source (video/news link). Do not post a commentator's view as if it were our own.
- Pinned tweet: "Döviz Veri nedir?" thread + the line "Yatırım tavsiyesi değildir".
- Frequency at the start: 2–4 posts/day; no copy-paste repeats.

## 5. Automation (later, separate item)

- Post from the site data via the X API (Free tier: write-only, low limit; check current limits/pricing — paid service, owner decision).
- Store API keys only in `finance-api/.env` / Coolify secrets.
