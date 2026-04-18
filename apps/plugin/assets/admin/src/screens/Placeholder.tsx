import { createElement as h } from '@wordpress/element';

export function Placeholder({ title, body }: { title: string; body?: string }) {
  return h('div', null,
    h('h1', null, title),
    h('p', { className: 'cs-subtitle' }, body ?? 'Coming soon.'),
  );
}
