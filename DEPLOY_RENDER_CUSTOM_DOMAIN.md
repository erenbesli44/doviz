# Render + WordPress DNS Cutover (`dovizveri.com`)

## 1) Render changes

### UI static site service (`doviz-ui`)
1. `Settings -> Custom Domains`:
   - Add `dovizveri.com`
   - Add `www.dovizveri.com`
2. `Settings -> Redirects/Rewrites`:
   - Add rewrite: `Source = /*`, `Destination = /index.html`, `Action = Rewrite`
   - This fixes refresh/deep-link `404` on routes like `/doviz`, `/altin`, `/endeksler`.
3. Choose canonical host:
   - Either apex (`dovizveri.com`) canonical, redirect `www -> apex`
   - Or `www` canonical, redirect apex -> `www`
4. `Environment`:
   - Set `VITE_API_BASE_URL=https://api.dovizveri.com/v1`
   - Redeploy UI after API custom domain is active.

### API web service (`doviz-api-bndp`)
1. `Settings -> Custom Domains`:
   - Add `api.dovizveri.com`
2. `Environment`:
   - Set `CORS_ALLOW_ORIGINS=https://dovizveri.com,https://www.dovizveri.com,https://doviz-ui.onrender.com`
   - Keep `https://doviz-ui.onrender.com` during migration, remove later if not needed.
3. Redeploy API and verify:
   - `https://api.dovizveri.com/v1/health`

## 2) WordPress DNS changes (domain provider side)

Current records still point to WordPress (`192.0.78.24/25`), so replace them.

1. Remove conflicting records:
   - Remove apex `A` records to `192.0.78.24` and `192.0.78.25`.
2. Add apex record:
   - `Type: A`
   - `Host/Name: @`
   - `Value: 216.24.57.1` (Render static-site apex target)
3. Add `www` record:
   - `Type: CNAME`
   - `Host/Name: www`
   - `Value: doviz-ui.onrender.com`
4. Add API subdomain:
   - `Type: CNAME`
   - `Host/Name: api`
   - `Value: doviz-api-bndp.onrender.com`
5. TTL:
   - Use `300` seconds during cutover, then increase later.

Important: if Render shows different DNS target values in your dashboard for any domain, use the Render-provided value (dashboard is source of truth).

## 3) Verification checklist

1. `dig +short A dovizveri.com` -> should return `216.24.57.1`
2. `dig +short CNAME www.dovizveri.com` -> should return `doviz-ui.onrender.com.`
3. `dig +short CNAME api.dovizveri.com` -> should return `doviz-api-bndp.onrender.com.`
4. Browser checks:
   - `https://dovizveri.com/` loads app
   - `https://dovizveri.com/doviz` refresh works (no `404`)
   - `https://api.dovizveri.com/v1/health` returns `200`

## 4) Cutover order (safe)

1. Configure domains in Render first.
2. Apply DNS changes in WordPress.
3. Wait for DNS propagation + Render certificate issuance.
4. Switch UI env (`VITE_API_BASE_URL`) to `https://api.dovizveri.com/v1` and redeploy.
