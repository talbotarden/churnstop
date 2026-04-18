const tiers = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'On wordpress.org',
    features: [
      'Single-path save flow',
      'Discount + pause offers',
      'Save count dashboard',
      'Click-to-cancel compliance',
      'GDPR data hooks',
    ],
    cta: 'Install from wordpress.org',
    href: 'https://wordpress.org/plugins/churnstop/',
  },
  {
    name: 'Starter',
    price: '$79/mo',
    tagline: 'Up to $10k MRR preserved / month',
    features: [
      'Everything in Free',
      'Conditional branching flows',
      '6 offer types',
      'Save-rate dashboard',
      'A/B testing',
      'Email support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=starter',
  },
  {
    name: 'Growth',
    price: '$199/mo',
    tagline: 'Up to $50k MRR preserved / month',
    features: [
      'Everything in Starter',
      'Cohort LTV analytics',
      'Winback automation',
      'Customer segmentation',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=growth',
  },
  {
    name: 'Agency',
    price: '$399/mo',
    tagline: 'Unlimited MRR preserved',
    features: [
      'Everything in Growth',
      'White-label admin',
      'Multi-site central management',
      'Cross-store benchmarks',
      'SLA support',
    ],
    cta: 'Start free trial',
    href: '/checkout?tier=agency',
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <p className="mt-3 text-gray-600">Every tier above Free includes a 14-day trial. Cancel any time.</p>

      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="flex flex-col rounded-lg border p-6">
            <h2 className="text-xl font-semibold">{tier.name}</h2>
            <div className="mt-2 text-3xl font-bold">{tier.price}</div>
            <p className="text-sm text-gray-500">{tier.tagline}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <a
              href={tier.href}
              className="mt-6 rounded-md bg-black px-4 py-2 text-center text-white hover:bg-gray-800"
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
