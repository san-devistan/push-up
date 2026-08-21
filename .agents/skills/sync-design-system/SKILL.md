---
name: sync-design-system
description: Apply or finish a shadcn preset workflow in this monorepo and sync shared design tokens into web and mobile generated theme files. Use after shadcn apply preset, pnpm sync:design-system, design-token refreshes, or web-to-mobile design-system reviews.
---

# Sync Design System

## Overview

Use this workflow when a shadcn preset changes the shared web design system and
mobile must follow. Token sync is deterministic; mobile consumes generic UI
directly from PanelUI and does not maintain native copies of web components.

## Workflow

1. Inspect the current state:

   ```sh
   git status --short
   ```

   Work with existing user changes. Do not revert unrelated files.

2. Apply the preset from the framework workspace unless the user already did:

   ```sh
   pnpm dlx shadcn@latest apply --preset <preset> --cwd apps/web
   ```

   `shadcn apply` does not support `--overwrite` in this repo's CLI version.
   If it creates `apps/web/src/lib/utils.ts` or
   `apps/web/src/hooks/use-mobile.ts`, remove those files when nothing imports
   them; the shared UI package owns those utilities.

3. Sync the design system:

   ```sh
   pnpm sync:design-system
   ```

   This imports applied CSS variables from
   `packages/ui/src/styles/globals.css` into
   `packages/ui/src/tokens/design-tokens.json` when the CSS changed and the
   token file is clean, then regenerates:

   - `packages/ui/src/styles/globals.css`
   - `apps/mobile/global.css`
   - `apps/mobile/lib/theme.ts`

   If both CSS and tokens are already dirty and the applied CSS must win, run:

   ```sh
   pnpm sync:design-system -- --import-applied-css
   ```

4. Run the sync a second time after imports or manual changes. A clean second
   run confirms the generated files are stable.

5. Inspect affected mobile workflows only when the changed tokens or product
   behavior should alter them:

   ```sh
   git diff --name-only -- packages/ui/src/components
   rg -n "from \"panelui-native\"" apps/mobile
   ```

   A changed web component does not require a mobile copy. If the same product
   behavior is needed on mobile, compose the nearest PanelUI component directly
   in the owning mobile feature.

## Native Implementation Rules

Import generic native UI directly from `panelui-native`. Style it through the
semantic tokens generated into `apps/mobile/global.css`, and use
`apps/mobile/lib/theme.ts` values when JavaScript theme objects are needed.
Resolve dynamic token colors with Uniwind's `useCSSVariable`.

Keep mobile updates focused on real mobile workflows. Do not add a
`components/ui` compatibility layer or blindly port web-only components.

## Verification

Run focused checks for touched workspaces, then the repo gate:

```sh
pnpm sync:design-system
pnpm fix
```

If `pnpm fix` still fails on shadcn-generated `packages/ui/src/components/*`
diagnostics, report representative errors and whether web/mobile checks are
clean. Do not expand into broad shadcn component lint refactors unless the user
asks for that cleanup.
