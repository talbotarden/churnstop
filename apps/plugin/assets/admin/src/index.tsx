/**
 * React admin entry. Router maps wp-admin page slugs to React screens.
 */
import { createElement as h, render } from '@wordpress/element';
import './index.css';
import { Dashboard } from './screens/Dashboard';
import { SettingsScreen } from './screens/Settings';
import { Placeholder } from './screens/Placeholder';
import { Logs } from './screens/Logs';
import { License } from './screens/License';

declare const ChurnStopAdmin: {
  apiUrl: string;
  nonce: string;
  page: string;
  entitlements: Record<string, unknown>;
};

function App() {
  switch (ChurnStopAdmin.page) {
    case 'churnstop':
      return h(Dashboard, null);
    case 'churnstop-settings':
      return h(SettingsScreen, null);
    case 'churnstop-flows':
      return h(Placeholder, { title: 'Flows', body: 'Drag-and-drop flow builder is part of the paid tier (Starter+). Upgrade to define multi-step flows, conditional offer branches, and A/B test variants.' });
    case 'churnstop-offers':
      return h(Placeholder, { title: 'Offers', body: 'Offer library lets you configure discount, pause, skip-renewal, tier-down, extend-trial, and product-swap offers. Paid tier feature.' });
    case 'churnstop-analytics':
      return h(Placeholder, { title: 'Analytics', body: 'Save rate by reason, cohort LTV comparisons, and winback attribution. Paid tier feature.' });
    case 'churnstop-ab':
      return h(Placeholder, { title: 'A/B Tests', body: 'Test offer amounts, copy, and flow variants with statistical significance tracking. Paid tier feature.' });
    case 'churnstop-winback':
      return h(Placeholder, { title: 'Winback', body: 'Email sequences for customers who declined all offers. Paid tier feature.' });
    case 'churnstop-logs':
      return h(Logs, null);
    case 'churnstop-license':
      return h(License, null);
    default:
      return h(Dashboard, null);
  }
}

const mount = document.getElementById('churnstop-app');

if (mount) {
  render(h(App, null), mount);
}
