# Rich Results Test submission checklist

Google's [Rich Results Test](https://search.google.com/test/rich-results) validates that a page's structured data will produce rich results in Google Search (FAQ accordion, product card, breadcrumb, how-to steps, article headline image, etc.). There is no public API; submission has to be manual.

Local validator covers the same ground: `pnpm --filter @churnstop/portal validate-schemas` reads every live page, parses every JSON-LD block, checks required + recommended fields per schema.org spec, and warns on Google-specific heuristics (logo dimensions, Article image presence, HowTo step positions, FAQ minimum count, AggregateOffer price types). If that passes, Google's Rich Results Test will almost always pass too.

Run the local validator before touching the Rich Results Test:

```bash
pnpm --filter @churnstop/portal validate-schemas
# or: node apps/portal/scripts/validate-schemas.mjs
```

Latest local run: **49 blocks, 0 errors, 2 intentional warnings** (see bottom).

## Manual submission checklist

Submit each of these URLs to https://search.google.com/test/rich-results and record the result. Expect:

- All URLs: `Organization` and `WebSite` detected, rendered in the "Detected structured data" section. No errors.
- Pages with a BreadcrumbList: breadcrumb preview visible.
- `/pricing`: "Product" (or "Software App") rich result eligible with AggregateOffer details. FAQPage rich result eligible with all 10 Q&A pairs.
- `/features`: FAQPage rich result eligible with 8 Q&A pairs.
- `/click-to-cancel`: Article + FAQPage both rich-results-eligible.
- `/docs/getting-started`: HowTo rich-result-eligible with all 7 steps extracted.
- `/docs/offer-types`, `/docs/api`: Article rich-result-eligible.
- `/blog/woocommerce-churn-benchmarks`: Article rich-result-eligible.

| URL | RR Test status | Warnings accepted |
|---|---|---|
| https://churnstop.org/ | [ ] | |
| https://churnstop.org/pricing | [ ] | SoftwareApplication aggregateRating intentionally absent (no real ratings yet) |
| https://churnstop.org/features | [ ] | |
| https://churnstop.org/click-to-cancel | [ ] | |
| https://churnstop.org/docs | [ ] | |
| https://churnstop.org/docs/getting-started | [ ] | HowTo image intentionally absent (no screenshots yet) |
| https://churnstop.org/docs/offer-types | [ ] | |
| https://churnstop.org/docs/api | [ ] | |
| https://churnstop.org/blog | [ ] | |
| https://churnstop.org/blog/woocommerce-churn-benchmarks | [ ] | |
| https://churnstop.org/blog/click-to-cancel-rule-explained | [ ] | |
| https://churnstop.org/blog/pause-vs-discount | [ ] | |
| https://churnstop.org/blog/one-question-rule | [ ] | |
| https://churnstop.org/blog/winback-email-sequences | [ ] | |
| https://churnstop.org/about | [ ] | |

(Legal stubs `/terms`, `/privacy`, `/account` are intentionally excluded; Google does not surface legal pages in rich results and `/account` is `noindex`.)

## How to interpret Rich Results Test output

The tool reports per URL:

1. **Page available to Google** - yes/no. If no, Googlebot can't reach the URL; fix before anything else.
2. **Page is mobile-usable** - should be yes; Next.js with our current layout passes.
3. **Detected structured data** - list of types found. Should match the expected types for that URL (see table above).
4. **Errors** - block rich results entirely. Our local validator catches all of these; if local passes and Rich Results Test errors, escalate.
5. **Warnings** - do NOT block rich results but reduce display quality. The two accepted warnings above are on the "intentionally absent" list and can be left until the underlying data exists.

## After submission

Once all URLs pass:

1. Submit the sitemap at https://search.google.com/search-console - add `churnstop.org` as a property, verify ownership via DNS TXT record or HTML tag, then submit `https://churnstop.org/sitemap.xml`.
2. Request indexing for the top 3 priority pages (`/`, `/pricing`, `/click-to-cancel`) via Search Console's URL inspection tool.
3. Wait 7-14 days for Google to crawl and index. Rich results take another 1-3 weeks to start appearing in SERPs even after indexing.
4. Track first rich-result appearances in Search Console's "Performance" report filtered by "Search appearance: Rich results".

## Re-running the local validator in CI

Add this as a CI check (GitHub Actions example):

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm --filter @churnstop/portal validate-schemas
  env:
    BASE_URL: https://churnstop.org
```

Failing the CI on schema regression prevents a bad deploy from landing live and quietly breaking rich results.

## Accepted warnings (do not fix until underlying data exists)

| Warning | Why it's accepted |
|---|---|
| `SoftwareApplication: aggregateRating or review recommended` | Fabricating ratings violates the ai-search-optimizer skill's "never invent stats" rule. Add when real wordpress.org rating data exists. |
| `HowTo: missing recommended field "image"` | The getting-started doc has no screenshots yet. Add when the plugin admin UI is ready to be screenshotted cleanly. |

Any other warning should be investigated, not ignored.
