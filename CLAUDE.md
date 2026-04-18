# ChurnStop - Claude Code Instructions

## Style conventions (strict)

- Never use em-dashes (—). Use a hyphen with spaces around it: " - ".
- Never use en-dashes (–). Use hyphens.
- Use straight quotes (" and '), not curly/smart quotes.
- No special Unicode dashes, ellipses, or typographic symbols in generated content or file edits.

Apply to all output: chat responses, file edits, commit messages, PR descriptions, readme changes, code comments.

## Project context

ChurnStop is a cancellation save flow for WooCommerce Subscriptions. Monorepo with:

- `apps/plugin` - the WordPress plugin (PHP 7.4+, namespaced OOP)
- `apps/api` - Hono / Node SaaS backend (TypeScript, Drizzle + Postgres)
- `apps/portal` - Next.js marketing site + customer portal

## Hard rules

1. **Click-to-cancel compliance is non-negotiable.** Any UI or flow change must keep "No thanks, cancel my subscription" visible on every screen and one click from completing cancellation. Never regress this.
2. **Free tier runs locally.** The free core plugin must never make outbound HTTP calls to api.churnstop.org. Only paid-tier license activation contacts the backend.
3. **Custom tables, not post meta** for cancellation events, ab assignments, and offers. Post meta doesn't scale past a few thousand events.
4. **PHP 7.4 minimum** in the plugin. No PHP 8 syntax (union types, readonly, enums, match) until we bump the minimum.
5. **WordPress coding standards** via phpcs. Run `composer run lint` before commits.

## Conventions

- Commit messages: short imperative, lowercase first word. Example: `add discount offer persistence`
- Branch names: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`
- Always prefer editing existing files over creating new ones.
- Do not create documentation files (README/docs) unless explicitly asked.
