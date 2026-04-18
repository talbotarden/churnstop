#!/usr/bin/env node
/**
 * Local structured-data validator for churnstop.org.
 *
 * Google's Rich Results Test has no public API, so this script does the
 * closest equivalent locally: parses every <script type="application/ld+json">
 * on each live page, validates required fields per schema.org spec, and
 * also applies the Google-specific "recommended" field checks that the Rich
 * Results Test would surface as warnings.
 *
 * Exits nonzero on any failure. Use in CI before pushing marketing changes.
 *
 * Usage:
 *   node apps/portal/scripts/validate-schemas.mjs            # runs against prod
 *   BASE_URL=http://localhost:3040 node ...validate-schemas.mjs  # dev
 */

const BASE = process.env.BASE_URL ?? 'https://churnstop.org';

const pages = [
  { path: '/',                                      expected: ['Organization', 'WebSite'] },
  { path: '/pricing',                               expected: ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage'] },
  { path: '/features',                              expected: ['Organization', 'WebSite', 'BreadcrumbList', 'FAQPage'] },
  { path: '/click-to-cancel',                       expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article', 'FAQPage'] },
  { path: '/docs',                                  expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
  { path: '/docs/getting-started',                  expected: ['Organization', 'WebSite', 'BreadcrumbList', 'HowTo'] },
  { path: '/docs/offer-types',                      expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/docs/api',                              expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/blog',                                  expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
  { path: '/blog/woocommerce-churn-benchmarks',     expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/blog/click-to-cancel-rule-explained',   expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/blog/pause-vs-discount',                expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/blog/one-question-rule',                expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/blog/winback-email-sequences',          expected: ['Organization', 'WebSite', 'BreadcrumbList', 'Article'] },
  { path: '/about',                                 expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
  { path: '/terms',                                 expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
  { path: '/privacy',                               expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
  { path: '/account',                               expected: ['Organization', 'WebSite', 'BreadcrumbList'] },
];

// Required and recommended fields per type. "required" produces an ERROR
// if missing (schema.org spec says the type is invalid without it).
// "recommended" produces a WARNING (Google Rich Results Test flags these
// as "Invalid missing field" warnings but still allows the rich result).
const rules = {
  Organization: {
    required: ['name', 'url', 'logo'],
    recommended: ['sameAs', 'contactPoint', 'description'],
  },
  WebSite: {
    required: ['name', 'url', 'publisher'],
    recommended: ['inLanguage', 'description'],
  },
  SoftwareApplication: {
    required: ['name', 'applicationCategory', 'operatingSystem', 'offers'],
    recommended: ['author', 'publisher', 'description', 'featureList', 'image'],
  },
  FAQPage: {
    required: ['mainEntity'],
    recommended: [],
  },
  Article: {
    required: ['headline', 'author', 'datePublished'],
    recommended: ['dateModified', 'image', 'publisher', 'description', 'mainEntityOfPage'],
  },
  HowTo: {
    required: ['name', 'step'],
    recommended: ['description', 'totalTime', 'image', 'tool'],
  },
  BreadcrumbList: {
    required: ['itemListElement'],
    recommended: [],
  },
};

// Google Rich Results Test specific checks that are not in the basic
// schema.org spec but are surfaced as warnings in the tool.
const googleChecks = {
  Organization: (payload) => {
    const warnings = [];
    if (payload.logo) {
      const logo = typeof payload.logo === 'string' ? { url: payload.logo } : payload.logo;
      if (!logo.width || !logo.height) warnings.push('Organization.logo: recommend specifying width and height on ImageObject');
      if (logo.width && logo.height && (logo.width < 112 || logo.height < 112)) warnings.push('Organization.logo: Google recommends 112x112 minimum; larger is better');
    }
    return warnings;
  },
  SoftwareApplication: (payload) => {
    const warnings = [];
    if (!payload.aggregateRating && !payload.review) warnings.push('SoftwareApplication: Rich Results Test will suggest aggregateRating or review; leaving empty is intentional here until real ratings exist');
    if (payload.offers) {
      const offers = payload.offers;
      if (offers['@type'] === 'AggregateOffer') {
        if (typeof offers.lowPrice !== 'string' && typeof offers.lowPrice !== 'number') warnings.push('AggregateOffer.lowPrice should be a number or numeric string');
        if (typeof offers.highPrice !== 'string' && typeof offers.highPrice !== 'number') warnings.push('AggregateOffer.highPrice should be a number or numeric string');
      }
    }
    return warnings;
  },
  Article: (payload) => {
    const warnings = [];
    if (!payload.image) warnings.push('Article.image recommended for Rich Results eligibility');
    if (payload.author && typeof payload.author === 'object' && !payload.author['@type']) warnings.push('Article.author should carry @type (Person or Organization)');
    return warnings;
  },
  HowTo: (payload) => {
    const warnings = [];
    if (Array.isArray(payload.step)) {
      payload.step.forEach((s, i) => {
        if (!s.position) warnings.push(`HowTo.step[${i}]: position recommended`);
      });
    }
    return warnings;
  },
  FAQPage: (payload) => {
    const warnings = [];
    if (Array.isArray(payload.mainEntity)) {
      if (payload.mainEntity.length < 2) warnings.push('FAQPage: Google recommends at least 2 Question/Answer pairs');
      payload.mainEntity.forEach((q, i) => {
        if (q.acceptedAnswer?.text && q.acceptedAnswer.text.length < 20) warnings.push(`FAQPage.mainEntity[${i}]: answer is under 20 chars; Rich Results may not display`);
      });
    }
    return warnings;
  },
};

function extractJsonLd(html) {
  const rx = /<script\s+[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = rx.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch (err) {
      out.push({ __parseError: err.message, raw: m[1].slice(0, 120) });
    }
  }
  return out;
}

function validate(payload) {
  const errors = [];
  const warnings = [];
  if (payload.__parseError) return { errors: [`JSON parse error: ${payload.__parseError}`], warnings: [] };
  const type = payload['@type'];
  if (!type) { errors.push('missing @type'); return { errors, warnings }; }
  if (!payload['@context']) errors.push('missing @context');

  const rule = rules[type];
  if (!rule) {
    warnings.push(`${type}: no validation rules registered for this type`);
    return { errors, warnings };
  }

  for (const field of rule.required) {
    const v = payload[field];
    if (v === undefined || v === null || v === '') {
      errors.push(`${type}: missing required field "${field}"`);
    }
  }

  for (const field of rule.recommended) {
    const v = payload[field];
    if (v === undefined || v === null || v === '') {
      warnings.push(`${type}: missing recommended field "${field}"`);
    }
  }

  // Type-specific structural checks.
  if (type === 'FAQPage' && Array.isArray(payload.mainEntity)) {
    payload.mainEntity.forEach((q, i) => {
      if (q['@type'] !== 'Question') errors.push(`FAQPage.mainEntity[${i}]: @type must be Question`);
      if (!q.name) errors.push(`FAQPage.mainEntity[${i}]: missing name`);
      if (!q.acceptedAnswer) errors.push(`FAQPage.mainEntity[${i}]: missing acceptedAnswer`);
      else if (q.acceptedAnswer['@type'] !== 'Answer') errors.push(`FAQPage.mainEntity[${i}].acceptedAnswer: @type must be Answer`);
      else if (!q.acceptedAnswer.text) errors.push(`FAQPage.mainEntity[${i}].acceptedAnswer: missing text`);
    });
  }

  if (type === 'BreadcrumbList' && Array.isArray(payload.itemListElement)) {
    payload.itemListElement.forEach((it, i) => {
      if (it['@type'] !== 'ListItem') errors.push(`BreadcrumbList.itemListElement[${i}]: @type must be ListItem`);
      if (typeof it.position !== 'number') errors.push(`BreadcrumbList.itemListElement[${i}]: position must be a number`);
      if (!it.name) errors.push(`BreadcrumbList.itemListElement[${i}]: missing name`);
      if (!it.item) errors.push(`BreadcrumbList.itemListElement[${i}]: missing item (url)`);
    });
  }

  if (type === 'HowTo' && Array.isArray(payload.step)) {
    payload.step.forEach((s, i) => {
      if (s['@type'] !== 'HowToStep') errors.push(`HowTo.step[${i}]: @type must be HowToStep`);
      if (!s.text) errors.push(`HowTo.step[${i}]: missing text`);
    });
  }

  if (type === 'SoftwareApplication' && payload.offers) {
    const offers = payload.offers;
    if (offers['@type'] === 'AggregateOffer') {
      if (offers.lowPrice === undefined) errors.push('AggregateOffer: missing lowPrice');
      if (offers.highPrice === undefined) errors.push('AggregateOffer: missing highPrice');
      if (!offers.priceCurrency) errors.push('AggregateOffer: missing priceCurrency');
    }
  }

  // Google Rich Results Test extra warnings.
  const gcheck = googleChecks[type];
  if (gcheck) {
    warnings.push(...gcheck(payload));
  }

  return { errors, warnings };
}

async function run() {
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedBlocks = 0;
  let checkedBlocks = 0;

  for (const page of pages) {
    const url = `${BASE}${page.path}`;
    console.log(`\n=== ${url} ===`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  FETCH FAIL: HTTP ${res.status}`);
      totalErrors++;
      continue;
    }
    const html = await res.text();
    const payloads = extractJsonLd(html);
    const types = payloads.map((p) => p['@type']).filter(Boolean);
    console.log(`  ${payloads.length} block(s): ${types.join(', ') || '(none)'}`);

    for (const expected of page.expected) {
      if (!types.includes(expected)) {
        console.error(`  ERROR: expected ${expected} schema, not found`);
        totalErrors++;
      }
    }

    payloads.forEach((p, i) => {
      checkedBlocks++;
      const { errors, warnings } = validate(p);
      if (errors.length === 0) passedBlocks++;
      if (errors.length === 0 && warnings.length === 0) {
        console.log(`  OK    [${i}] ${p['@type']}`);
      } else {
        if (errors.length) {
          console.error(`  FAIL  [${i}] ${p['@type'] || 'unknown'}:`);
          errors.forEach((e) => console.error(`    ERROR   ${e}`));
          totalErrors += errors.length;
        }
        if (warnings.length) {
          if (errors.length === 0) console.log(`  OK*   [${i}] ${p['@type']} (with warnings)`);
          warnings.forEach((w) => console.log(`    WARN    ${w}`));
          totalWarnings += warnings.length;
        }
      }
    });
  }

  console.log('\n============================================');
  console.log(`Blocks checked:  ${checkedBlocks}`);
  console.log(`Blocks passed:   ${passedBlocks}`);
  console.log(`Errors:          ${totalErrors}`);
  console.log(`Warnings:        ${totalWarnings}`);
  console.log('============================================');

  if (totalErrors === 0) console.log('PASS (warnings do not block Rich Results eligibility)');
  else console.error('FAIL');

  process.exit(totalErrors === 0 ? 0 : 1);
}

run();
