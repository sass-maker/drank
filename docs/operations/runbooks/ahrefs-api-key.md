# Runbook — AHREFS_API_KEY for drank

Ahrefs free `domain-rating-free` stays unit-free but requires an API key from
**2026-08-10**. drank needs the key in two places:

1. **GitHub Actions** weekly DR update (`AHREFS_API_KEY` repo secret — already set)
2. **Cloudflare Pages Function** `/api/dr` (Pages secret on project `drank`)

## Set the Pages secret

Token requirements: Cloudflare API token with **Account → Cloudflare Pages → Edit**
for the Fleet account (deploy-only tokens often cannot write secrets).

```bash
# From Infisical or your password manager — do not commit the value.
export CLOUDFLARE_API_TOKEN=...   # Pages Edit
export CLOUDFLARE_ACCOUNT_ID=...

printf '%s' "$AHREFS_API_KEY" | \
  npx wrangler pages secret put AHREFS_API_KEY --project-name=drank
```

Or Cloudflare dashboard → Pages → `drank` → Settings → Environment variables
→ Production secret `AHREFS_API_KEY`.

## Verify without printing the key

```bash
# Expect 200 + numeric domain_rating, not 401
curl -sS "https://domains.sassmaker.com/api/dr?target=codevetter.com" | head -c 200
echo
```

Before 2026-08-10 unauthenticated calls may still work; after that date 401 means
the Pages secret is missing or invalid.

## Related

- Weekly history: `.github/workflows/update-global-dr.yml`
- Function: `functions/api/dr.ts`
- Script: `scripts/update-global-dr.mjs`
