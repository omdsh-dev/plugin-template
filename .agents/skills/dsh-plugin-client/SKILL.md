---
name: dsh-plugin-client
description: Use when implementing or refactoring the browser client of a standalone DeepSeek Harness plugin, especially a settings form. Covers minimal client boundaries, JSX compatibility with ModuleLoader, locale ownership, settings scope handling, and artifact validation.
---

# Build a DSH Plugin Client

Use this skill for a plugin that contributes one or a few browser slots. Keep the architecture proportional to the UI: one settings form does not need a component per field or a hook for every operation.

## Read local owners first

Run from the plugin repository root and read:

- AGENTS.md
- README.md
- package.json
- the current client entry
- the client build configuration
- focused client tests
- repository-local DSH client contract documentation, when present

Use the installed package declarations and this repository's dependencies when the DSH API is unclear. Do not use another checkout as an implicit source.

## Coordinate with [dsh-plugin-i18n](.agents/skills/dsh-plugin-i18n/SKILL.md)

This skill owns the browser/client architecture; [dsh-plugin-i18n](.agents/skills/dsh-plugin-i18n/SKILL.md) owns localization details. When the client has product-visible copy, use both skills together:

1. use this skill to choose the minimal client files, JSX transform, settings boundary, and loader checks;
2. load dsh-plugin-i18n for dictionary ownership, namespace registration, typed keys, locale props, fallback behavior, and locale lifecycle tests;
3. keep the feature dictionary in the client locale owner selected by this skill, normally src/client/locale.ts;
4. let the client entry perform the fiber-owned registration required by dsh-plugin-i18n, rather than registering copy at module evaluation time.

Do not duplicate locale policy here or create a second namespace per UI component. If the feature has no product-visible copy, do not load dsh-plugin-i18n.

## Minimal file boundary

For one settings form, prefer:

~~~text
src/client/
├── index.ts
├── locale.ts
├── settings.ts
└── SettingsPage.tsx
~~~

Responsibilities:

- index.ts: plugin metadata, injection, locale registration, settings scope binding, and slot registration only.
- locale.ts: feature-owned dictionaries and locale key types.
- settings.ts: form/settings types, defaults, normalization, and the minimum client contract types needed by the repository.
- SettingsPage.tsx: one JSX form containing its state, save behavior, and field layout.

Do not split every input into a component merely to make the tree modular. Extract a component or hook only when it is reused, independently tested, or materially reduces complexity.

## Keep the entry registration-only

The entry should make the plugin lifecycle obvious:

~~~ts
import { SettingsPage } from './SettingsPage.tsx'
import { LOCALE_NAMESPACE, locales } from './locale.ts'

export const name = 'feature'
export const inject = ['locale', 'settingsScope', 'slots']

export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(LOCALE_NAMESPACE)
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, locales),
    'feature: settings dictionaries',
  )
  const scope = ctx.settingsScope.bind({ namespace: 'feature' })
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'feature',
        order: 20,
        label: () => t('nav'),
        inject: () => ({ scope, t }),
      },
      SettingsPage,
    ),
  )
}
~~~

Every registration must be owned by the plugin fiber. Do not register dictionaries, slots, or subscriptions at module evaluation time. Do not let the component access ctx directly.

## Prefer JSX for readable React structure

Use a .tsx page and JSX. A large nested createElement expression hides the DOM tree and makes labels, controls, and conditional fields difficult to review.

Enable JSX in tsconfig.json. First determine how the host ModuleLoader supplies React:

- If the host provides react/jsx-runtime, react-jsx may be used.
- If the host provides only react, use the classic transform and a namespace import:

~~~tsx
import * as React from 'react'
import { useEffect, useState } from 'react'
~~~

The namespace import is intentional. With the classic transform, generated calls use react.createElement, matching the CJS value returned by the DSH loader. A default import can generate react.default.createElement, which may be undefined and can make the settings page blank.

Keep React external in the client bundle. Do not blindly externalize or bundle react/jsx-runtime; verify the generated artifact against the actual host loader.

## Locale ownership

Put every product-visible string in the feature dictionary:

- headings, descriptions, labels, and option text;
- placeholders;
- loading, saved, unavailable, and error text;
- accessibility text.

Keep dictionaries flat with semantic keys. Constrain the second language dictionary to the first language's key set. Use one namespace for the feature. Branch on stable values such as session and configured, never on translated strings. Pass t through slot props; do not create fallback copy inside the component.

## Settings form state

Keep these concepts distinct:

1. the persisted settings snapshot from DSH;
2. the local form draft;
3. the normalized mutation sent back to DSH.

Normalize missing or legacy values at the boundary. Browser number inputs expose strings and may be temporarily empty or invalid. Store the raw value as a string when validation matters, then parse it during save. Never allow NaN to reach settingsScope.mutate().

For a model-source form, make the fallback target explicit. If session mode retries the current session model and then switches to a custom model, say that in the UI and show or disable fields according to their meaning.

When synchronizing the external snapshot into local state, do not overwrite dirty user input on every notification. Define behavior for initial load, clean external updates, dirty drafts, save success, and reset.

## Receiver-safe observables

DSH host services expose instance methods, not bound callbacks: the settings scope's `getSnapshot()` and `subscribe()` read their own state through `this`. React calls the callbacks it receives as bare functions, so `useSyncExternalStore(scope.subscribe, scope.getSnapshot)` throws during render (`Cannot read properties of undefined`). A section entry that crashes while rendering abdicates, so its nav row disappears instead of showing an error.

Wrap the scope once and hand React the wrapper:

~~~ts
export function settingsScopeSource<T>(scope: SettingsScope<T>) {
  return {
    getSnapshot: () => scope.getSnapshot(),
    subscribe: (listener: () => void) => scope.subscribe(listener),
  }
}
~~~

~~~tsx
const source = useMemo(() => settingsScopeSource(scope), [scope])
const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot)
~~~

Model compatibility contracts with method syntax, and test the binding with a class-shaped scope (methods on the prototype): an object of arrow properties keeps its receiver by construction and cannot catch this bug.

## Client contracts

Prefer official DSH client and slot types when exported. If a compatibility contract is necessary, keep it in settings.ts or a dedicated contract owner and model only methods actually used. Do not duplicate a broad DSH API surface in the page file.

The page receives data and callbacks as props. It should not call ctx.get(), instantiate a DSH service, access ModuleLoader internals, or contain host-only model/storage logic.

## Loader and artifact verification

A successful build is not enough. Verify:

1. the expected package client subpath exists;
2. the artifact has the DSH ModuleLoader wrapper;
3. the artifact exports name, inject, and apply;
4. external imports match packages supplied by the host;
5. a small loader smoke test can execute the factory with a CJS require shim.

A smoke test can use this shape:

~~~js
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      const exports = definition.factory(require)
      console.log(definition.id, Object.keys(exports).sort())
    },
  },
}
await import('./lib/client.js')
~~~

Do not claim the GUI is updated merely because the local package built. The running Web profile may still load a published or cached package. GUI verification requires installing/composing the exact artifact and refreshing the existing URL.

## Required evidence

Run the repository's exact commands where available:

~~~text
pnpm run fmt
pnpm run lint
pnpm test
pnpm run build
pnpm run fmt:check
pnpm pack --dry-run --json
git diff --check
~~~

If package-manager commands are blocked or hang, run repository-local binaries when appropriate and report which exact commands passed and which remained unverified.

Client tests should cover settings section registration/disposal, locale lifecycle when applicable, default and legacy normalization, mutation payloads, conditional form states, and loader compatibility when the build transform changes.

## Completion checklist

- index.ts is registration-only;
- visible copy is locale-owned;
- the page is readable JSX, not a large createElement tree;
- React is externalized as the host expects;
- settings state and form draft behavior are explicit;
- invalid numeric input cannot persist as NaN;
- host scope methods are bound before React receives them;
- the artifact loads through ModuleLoader;
- focused tests and package checks pass;
- changed files and any unverified GUI/profile step are reported separately.