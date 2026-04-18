// HowTo JSON-LD builder. Call from any tutorial page - most commonly in
// docs/getting-started and step-by-step guides.
//
// Usage in a future app/docs/getting-started/page.tsx:
//
//   const schema = buildHowToSchema({
//     title: 'Install ChurnStop in WooCommerce',
//     description: 'Install the free ChurnStop plugin and activate the default save flow in 5-10 minutes.',
//     slug: 'docs/getting-started',
//     totalTime: 'PT10M',
//     steps: [
//       { name: 'Install the plugin', text: 'From your WordPress admin ...' },
//       { name: 'Enter your license key', text: 'Navigate to ChurnStop > Settings ...' },
//       ...
//     ],
//   });

import { site } from '@/lib/site';

export interface HowToStep {
  name: string;
  text: string;
  url?: string;      // anchor / deep link within the page
  image?: string;    // absolute URL of a step screenshot
}

export interface HowToInput {
  title: string;
  description: string;
  slug: string;                 // without leading slash, e.g. "docs/getting-started"
  totalTime?: string;           // ISO-8601 duration, e.g. "PT10M" for 10 minutes
  tools?: string[];             // list of tools / products needed
  supplies?: string[];          // list of supplies / requirements
  steps: HowToStep[];
  estimatedCost?: { currency: string; value: number };
}

export function buildHowToSchema(input: HowToInput) {
  const url = `${site.url}/${input.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${url}/#howto`,
    name: input.title,
    description: input.description,
    url,
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.tools?.length
      ? { tool: input.tools.map((name) => ({ '@type': 'HowToTool', name })) }
      : {}),
    ...(input.supplies?.length
      ? { supply: input.supplies.map((name) => ({ '@type': 'HowToSupply', name })) }
      : {}),
    ...(input.estimatedCost
      ? {
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: input.estimatedCost.currency,
            value: input.estimatedCost.value,
          },
        }
      : {}),
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url.startsWith('http') ? step.url : `${url}${step.url}` } : {}),
      ...(step.image ? { image: step.image } : {}),
    })),
  };
}
