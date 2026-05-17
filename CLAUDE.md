# siddhant.blog

This is the canonical home for siddhant.blog after the unification of two earlier setups.

## What this repo is
Astro 5 static site (from the `astro-air` template), deployed to **GitHub Pages** at https://siddhant.blog. Domain registered at **GoDaddy**.

Stack: Astro, MDX, React islands, Tailwind v4, expressive-code (with line numbers + collapsible sections), astro-og-canvas (auto-generated OG images), RSS, sitemap, robots.txt, GA, twikoo comments. i18n scaffolded for `en` and `zh`.

## Unification history (2026-05-17)
Two parallel setups existed before this; we consolidated everything here.

| | Before | After |
|---|---|---|
| Domain | siddhant.blog at GoDaddy → Render | siddhant.blog at GoDaddy → GitHub Pages |
| Hosting | Render static site (`srv-d2fdqn8gjchc73fgvet0`) | GitHub Pages via Actions |
| Content repos | `siddhantsomani.github.io` (Jekyll) + `siddhant.blog` (Astro) | Just this repo |
| Default branch | `master` had code, `main` had only README | `main` |

The Jekyll repo (`siddhantsomani.github.io`) had one real post ("HTTP Servers and Related Concepts") which was ported into `src/content/posts/en/http-servers-and-related-concepts.md`. That repo is being archived.

## Render (retiring)
- Workspace: `Siddhant Somani's Workspace` (id `tea-csp64tbtq21c73eaju5g`).
- Project: `Blog` (`prj-d2fdkr6mcj7s73empu60`), env `BlogProd` (`evm-d2fdkr6mcj7s73empu70`).
- Service to delete: `siddhant.blog` (`srv-d2fdqn8gjchc73fgvet0`), type `static_site`, Starter plan.
- Render's apparent Cloudflare CDN (216.24.57.x) is Render's own internal CDN, not a user-managed Cloudflare account — nothing to manage there.

## DNS
Registrar: GoDaddy. Nameservers: `ns53/54.domaincontrol.com`.

Current records (set via API on 2026-05-17):
- `@` A → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (TTL 600).
- `www` CNAME → `siddhantsomani.github.io.` (TTL 600).

⚠ The previous apex A record had TTL 604800 (7 days). Resolvers that cached the old Render IP (216.24.57.1) before the change may serve stale results for up to a week. The authoritative nameservers themselves can lag a few minutes behind GoDaddy API edits.

## GitHub Pages config
- Repo Settings → Pages: source = GitHub Actions, custom domain = `siddhant.blog`, HTTPS enforcement gated on cert provisioning (auto once DNS resolves).
- `public/CNAME` contains `siddhant.blog` so every deploy preserves the custom domain.
- `astro.config.mjs` has `site: "https://siddhant.blog"`.
- Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds with `bun run build` on push to `main` and publishes `dist/` via `actions/deploy-pages`.

## Tooling notes
- `render` CLI: `brew install render`; auth via `render login`. Workspace already set for siddhantsomani@gmail.com.
- `bun`: `brew install oven-sh/bun/bun`. Repo has `bun.lock`; CI uses `--frozen-lockfile`.
- GoDaddy: no official CLI. REST API at `api.godaddy.com`, auth header `Authorization: sso-key <KEY>:<SECRET>`. Key/secret in `~/.zshrc` as `GODADDY_KEY`/`GODADDY_SECRET`. **Non-interactive bash sessions don't auto-source `.zshrc`** — prefix commands with `source ~/.zshrc;` or migrate exports to `~/.zshenv`.

## Useful commands
```bash
# DNS sanity-check (authoritative)
dig +short @ns53.domaincontrol.com siddhant.blog A

# View / edit DNS via API
source ~/.zshrc
curl -s -H "Authorization: sso-key ${GODADDY_KEY}:${GODADDY_SECRET}" \
  https://api.godaddy.com/v1/domains/siddhant.blog/records | jq .

# Pages config
gh api repos/siddhantsomani/siddhant.blog/pages | jq .

# Render service info
render services --output json
```

## User preferences
- No `Co-Authored-By: Claude` trailers on commits.
- Small, crisp, independent commits — one logical change per commit.
