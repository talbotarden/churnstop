// Click-to-cancel-specific FAQs. Separate from the pricing FAQ because the
// questions are different - merchants evaluating compliance ask different
// things than merchants evaluating price. Both UI and schema read from the
// same faqItems array.

import type { FaqItem } from './faq';

export const clickToCancelFaqItems: FaqItem[] = [
  {
    question: 'What is the FTC click-to-cancel rule?',
    answer:
      'The FTC click-to-cancel rule, formally an update to the Negative Option Rule under ROSCA (the Restore Online Shoppers\' Confidence Act), requires that online subscription services make cancellation at least as easy as sign-up. For a subscription signed up online, cancellation must be available online through a direct mechanism that takes no more steps than the sign-up flow. The rule went into effect May 2025 and applies to any US-based subscription merchant regardless of size.',
  },
  {
    question: 'Does ChurnStop comply with the click-to-cancel rule?',
    answer:
      'Yes. ChurnStop enforces click-to-cancel compliance at the code level, not through documentation or policy. Every save-flow screen keeps a visible "No thanks, cancel my subscription" link that is exactly one click from completing cancellation. The plugin\'s compliance validator refuses to save any flow configuration that would remove the decline link, add extra steps, or hide the cancellation path. Non-compliant settings are blocked before save.',
  },
  {
    question: 'What can the FTC fine me for a click-to-cancel violation?',
    answer:
      'Civil penalties under the amended rule are up to $50,120 per violation per consumer. State ROSCA analogues (California, New York, Florida) carry separate penalties. A non-compliant cancellation flow applied to 10,000 subscribers is a theoretical federal liability over $500M before state penalties. Enforcement has included both the FTC and state attorneys general since 2024.',
  },
  {
    question: 'Are save offers still allowed under the rule?',
    answer:
      'Yes. Save offers are allowed, but only after the customer has clearly indicated intent to cancel, and only if the offer screen does not hide or disguise the cancellation path. A single-screen offer with a visible "cancel anyway" link is compliant. A multi-step offer chain that moves the cancel button or requires clicking through retention content is not. ChurnStop\'s save flow fits within the allowed pattern by design.',
  },
  {
    question: 'Does the rule apply to WooCommerce Subscriptions stores?',
    answer:
      'Yes - the rule applies to any US-based merchant selling a recurring subscription online, regardless of the platform. WooCommerce Subscriptions stores are not exempt. Foreign merchants selling to US consumers are subject to the rule as well. The default WooCommerce Subscriptions cancellation page is click-to-cancel compliant on its own, but adding a save flow without proper safeguards can make the store non-compliant. ChurnStop is built to prevent that regression.',
  },
  {
    question: 'What if my save flow screens redirect customers to support first?',
    answer:
      'That is a rule violation. Forcing a customer to contact support, fill out a form, or wait for a response before being allowed to cancel is prohibited. Support routing as an optional path shown alongside a one-click cancel link is fine. Support routing as the only path is not. ChurnStop lets you offer a "Get technical help" choice for the "technical issues" cancel reason, but that path is always shown next to the direct cancel link, never instead of it.',
  },
  {
    question: 'How does ChurnStop\'s compliance guard work technically?',
    answer:
      'The plugin ships a ClickToCancel validator class (src/Compliance/ClickToCancel.php) that inspects every flow configuration before it is saved. It checks that the decline-and-cancel link is present on every step, that the link completes cancellation in a single click, that no step can be bypassed, and that the cancellation event is recorded atomically (no intermediate "pending cancellation" state that appears cancelled but is still billing). The validator runs at settings-save time and at runtime; non-compliant flows are rejected with a specific violation message.',
  },
  {
    question: 'Do I need a lawyer to configure ChurnStop?',
    answer:
      'No. The entire point of ChurnStop is that compliance is enforced at the code level so you cannot accidentally configure a non-compliant flow. That said, if your store is subject to state laws that impose stricter requirements than the federal rule, or if you run bundled services that raise different disclosure questions, consult counsel before launch. ChurnStop covers the federal click-to-cancel rule and common state ROSCA analogues; it does not cover every possible subscription-law edge case.',
  },
];

// Build the FAQPage JSON-LD for this page.
export const clickToCancelFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://churnstop.org/click-to-cancel/#faq',
  mainEntity: clickToCancelFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
