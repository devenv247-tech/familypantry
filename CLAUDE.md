# CLAUDE.md — Nooka Web Frontend (familypantry)

## What this is
Nooka (nooka.ca) — AI meal planning, pantry tracking & nutrition app for Canadian families. This repo is the **web frontend**: React + Vite + Tailwind, deployed on **Vercel**. Backend lives in a separate repo (`~/Desktop/familypantry-backend`, deployed at api.nooka.ca). Live product with paying users — be careful, no experiments on main.

## Workflow rules (always follow)
- **Read before writing.** Always read the relevant source files before proposing any change.
- **Plan → approval → code.** For anything beyond trivial copy changes, show a plan or diff and wait for explicit approval before applying.
- **One change at a time** unless asked for multiple.
- **Extend, don't rebuild.** If something already exists, reuse or extend it. Never duplicate logic that exists elsewhere.
- **Confirm before large refactors.**
- After each completed step, remind me to test locally and git commit.

## Git flow (exact, individual commands — never chained, no inline comments)
```
git add .
git commit -m "..."
git push origin dev
git checkout main
git merge dev
git push origin main
git checkout dev
```
Pushing `main` triggers the Vercel production deploy. Day-to-day work happens on `dev`.
Never commit `.env`, `.env.production`, or `.claude/`.

## Architecture conventions
- **API calls live in `src/api/*.js`** — never call axios/fetch directly in components. Base URL comes from `import.meta.env.VITE_API_URL`.
- Pages in `src/pages/`, shared UI in `src/components/ui/`, state in `src/store/` (zustand), hooks in `src/hooks/`, helpers in `src/utils/`.
- Feature gating is driven by backend responses + the Supabase `FeatureFlag` table (lookup key is `name`). Never hardcode plan checks that contradict the backend. Plan tiers: Free, Family, Premium.
- No new libraries unless truly necessary — propose first.

## Design system
- Warm light mode: background `#fafaf9`, primary `#3B5BDB` (indigo blue), warm off-white tones — never cold white.
- Reuse existing classes: `.card`, `.btn-primary`, `.btn-secondary`, pill badges, existing toast/skeleton patterns.
- **Icons: never raw emoji in UI chrome.** Use the SVG component `src/components/ui/Icon.jsx` (`<Icon name="..." />`). Unicode 14+ emoji break on older Windows. (Emoji inside AI-generated recipe content from the backend is fine.)
- AI-related UI elements use the 🫧 bubble concept, never 🤖 — but rendered via Icon component, not raw emoji.

## Responsive rules (non-negotiable)
- Minimum supported width: **320px**. No horizontal overflow at any width.
- Touch targets: **min 44px** height on mobile.
- Long text: use `line-clamp-*` / `truncate` rather than letting cards grow or overflow.
- **Modals:** bottom sheet on mobile, centered on desktop. Overlay gets `sm:justify-center`; the box gets `sm:w-auto sm:min-w-[480px]` (never full-width stretch on desktop). Use the `.modal-sheet` safe-area pattern, `.modal-body` for the scrollable region, `.modal-header`/`.modal-footer` non-shrinking. A global `* { max-width: 100% }` rule and Safari flex quirks mean modals sometimes need **inline styles with `dvh` units** — follow existing modal implementations.

## Color system

Named palettes available in `tailwind.config.js` (all under `theme.extend.colors`):

| Token family | Shades | Purpose |
|---|---|---|
| `indigo-*` (default Tailwind) | full scale | App structure, navigation, primary CTAs, links, billing, AI/trust features |
| `food-*` | 50 100 200 500 600 700 | Anything food-related: tonight's dinner card, Start Cooking buttons, meal-type chips, kcal indicators, cooking-time highlights |
| `fresh-*` | 50 100 600 700 | Health and freshness: in-stock states, health goal tags, fresh pantry items, nutrition wins |
| `red-600` (default Tailwind) | single shade | Health Canada recalls **only** — nothing else |
| `amber-*` (default Tailwind) | full scale | Expiring / expired items and warnings |
| `stone-*` (default Tailwind) | full scale | All neutral grays — **always warm stone-\*, never gray-\*/slate-\*/zinc-\*** |

**Usage rules:**
- Text on a tinted background must use the `700` shade of the same family (e.g. `text-food-700` on `bg-food-50`, `text-fresh-700` on `bg-fresh-50`).
- `stone-*` for all UI neutrals; never reach for `gray-*`, `slate-*`, or `zinc-*`.
- `indigo-*` is reserved for app chrome and trust/AI surfaces — do not use it for food or health content.
- `red-600` is a reserved semantic: Health Canada recall badges only. For errors and destructive actions use the existing `danger` token.

**Responsive requirements for all new/modified UI:**
- Test at 375 px, 768 px, and 1280 px widths.
- Cards and grids must stack on mobile: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Buttons that span the full available width on desktop must be `w-full` on mobile.
- Zero horizontal overflow at 375 px — verify in DevTools device mode.

## Tailwind gotchas (learned the hard way)
- **JIT dynamic classes are unreliable.** Never build class names from template literals (e.g. `translate-x-[${x}px]`). Use static class pairs (`left-0.5` ↔ `left-5`) or inline styles. Toggle switches in this codebase use inline styles for knob position — keep that pattern.
- Test at 320px and at `sm:` (640px) breakpoints when touching layout.

## Testing a change
1. `npm run dev`
2. Check Chrome DevTools device mode at 320px and desktop width
3. For auth'd pages, verify on nooka.ca after deploy if local login is unavailable
