---
name: dsh-plugin-client
description: Add or refactor a DSH browser client face: dsh.client manifest, ModuleLoader bundle, slots, settings forms, JSX, and artifact checks. Use with dsh-plugin-i18n for visible copy.
---

# Build a DSH Plugin Client

Use this skill for a plugin that contributes one or a few browser slots. Keep the architecture proportional to the UI: one settings page does not need a component per field or a hook for every operation.

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

## Coordinate with dsh-plugin-i18n

This skill owns the browser/client architecture; `dsh-plugin-i18n` at `.agents/skills/dsh-plugin-i18n/SKILL.md` owns localization details. When the client has product-visible copy, use both skills together:

1. use this skill to choose the minimal client files, JSX transform, settings boundary, and loader checks;
2. load dsh-plugin-i18n for dictionary ownership, namespace registration, typed keys, locale props, fallback behavior, and locale lifecycle tests;
3. keep the feature dictionary in the client locale owner selected by this skill, normally `src/client/locale.ts`;
4. let the client entry perform the fiber-owned registration required by dsh-plugin-i18n, rather than registering copy at module evaluation time.

Do not duplicate locale policy here or create a second namespace per UI component. If the feature has no product-visible copy, do not load dsh-plugin-i18n.

## Declare the client manifest

A browser-facing package declares `dsh.client` and exports its built bundle at `./client`:

```json
{
  "exports": {
    ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./locale/*.json": "./src/assets/locale/*.json",
    "./icon": "./src/assets/icon.svg"
  },
  "files": [
    "lib/index.js",
    "lib/client.js",
    "lib/types/**/*.d.ts",
    "src/assets/locale/*.json",
    "src/assets/icon.svg"
  ],
  "icon": "./src/assets/icon.svg",
  "dsh": {
    "manifestVersion": 1,
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings"]
    }
  }
}
```

Merge these fields into the package's existing `dsh` object; a client package that also installs as a bundle keeps `manifestVersion` and `bundle.patch`.

- `platform` is the client platform identifier; the Web consumer selects `web`.
- `inject` names package rows whose factories must arrive before this row materializes. It is not Cordis service injection.
- `immediately: true` only for a stage-one registration barrier; omit it for the shared application batch.
- `external` lists exact non-baseline module-table requests beyond the host baseline. Type-only imports are erased and create no request.
- The package's build must emit `lib/client.js`; a source launch still consumes the built client export.

The host scans live Loader entries and serves each bundle under `/plugins`. Executing a bundle registers a lazy factory whose ID equals the package name; module-body side effects run only at materialization. Keep factories side-effect free and register resources inside `apply` with `ctx.effect`/`ctx.on`.

## Minimal file boundary

For one settings page, prefer:

~~~text
src/client/
├── index.ts
├── locale.ts
└── SettingsSection.tsx
~~~

Responsibilities:

- index.ts: plugin metadata, injection, locale registration, settings form binding, and slot registration only.
- locale.ts: feature-owned dictionaries and locale key types.
- SettingsSection.tsx: one JSX page containing its state, save behavior, and field layout.

Do not split every input into a component merely to make the tree modular. Extract a component or hook only when it is reused, independently tested, or materially reduces complexity.

## Keep the entry registration-only

The entry should make the plugin lifecycle obvious:

~~~ts
import { SettingsSection } from './SettingsSection.tsx'
import { LOCALE_NAMESPACE, locales } from './locale.ts'

export const name = 'feature'
export const inject = ['locale', 'slots', 'configForms']

export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(LOCALE_NAMESPACE)
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, locales),
    'feature: settings dictionaries',
  )
  // The Host entry that owns this settings namespace; often the bundle row id.
  const form = ctx.configForms.get('feature')
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'feature',
        order: 20,
        label: () => t('nav'),
        inject: () => ({ form, t }),
      },
      SettingsSection,
    ),
  )
}
~~~

Every registration must be owned by the plugin fiber. Do not register dictionaries, slots, or subscriptions at module evaluation time. Do not let the component access ctx directly.

## Prefer JSX for readable React structure

Use a `.tsx` page and JSX. A large nested `createElement` expression hides the DOM tree and makes labels, controls, and conditional fields difficult to review.

Enable JSX in `tsconfig.json`. First determine how the host ModuleLoader supplies React:

- If the host provides `react/jsx-runtime`, `react-jsx` may be used.
- If the host provides only `react`, use the classic transform and a namespace import:

~~~tsx
import * as React from 'react'
import { useEffect, useState } from 'react'
~~~

The namespace import is intentional. With the classic transform, generated calls use `react.createElement`, matching the CJS value returned by the DSH loader. A default import can generate `react.default.createElement`, which may be undefined and can make the page blank.

Keep React external in the client bundle. Do not blindly externalize or bundle `react/jsx-runtime`; verify the generated artifact against the actual host loader.

## Locale ownership

Localization policy belongs to `dsh-plugin-i18n` at `.agents/skills/dsh-plugin-i18n/SKILL.md`: dictionary shape, namespace, fallback, locale props, and disposal. Use that skill whenever the client owns product-visible copy. Plugin display metadata in the exported `./locale/*.json` resources is a separate Host-facing channel, not the client UI dictionary.

## Settings state

DSH exposes settings through the `configForms` client service. Do not assume a removed `settingsScope` service.

- `ctx.configForms.get(entryId)` returns the accepted values and write queue for one Host entry. The same `ConfigForm` instance is shared by every editor.
- `ctx.configForms.whileServed(namespaces, register)` follows namespaces another plugin owns and removes the registration when none is served.
- `ctx.configForms.describe()` reads the shared settings mirror for cross-namespace surfaces.
- `ctx.settingsSchema` rehydrates schemas and validates drafts.

Keep these concepts distinct:

1. the `ConfigFormSnapshot` from DSH (`status`, `value`, `base`, `user`, `revision`, `writable`);
2. the local form draft;
3. the normalized mutation sent back through `set`, `unset`, or `mutate`.

Normalize missing or legacy values at the boundary. Browser number inputs expose strings and may be temporarily empty or invalid. Store the raw value as a string when validation matters, then parse it during save. Never allow `NaN` to reach `form.set()`.

When synchronizing the external snapshot into local state, do not overwrite dirty user input on every notification. Define behavior for initial load, clean external updates, dirty drafts, save success, and reset. Pass the revision read before editing to `mutate` when a staged editor must fence a conflict.

## Receiver-safe observables

DSH services expose instance methods, not bound callbacks: `ConfigForm.getSnapshot()` and `ConfigForm.subscribe()` read their own state through `this`. React calls the callbacks it receives as bare functions, so `useSyncExternalStore(form.subscribe, form.getSnapshot)` throws during render (`Cannot read properties of undefined`). A section entry that crashes while rendering abdicates, so its nav row disappears instead of showing an error.

Wrap the form once and hand React the wrapper:

~~~ts
export function configFormSource<T>(form: ConfigForm<T>) {
  return {
    getSnapshot: () => form.getSnapshot(),
    subscribe: (listener: () => void) => form.subscribe(listener),
  }
}
~~~

~~~tsx
const source = useMemo(() => configFormSource(form), [form])
const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot)
~~~

Model compatibility contracts with method syntax, and test the binding with a class-shaped form (methods on the prototype): an object of arrow properties keeps its receiver by construction and cannot catch this bug.

## Client contracts

Prefer official DSH client and slot types when exported. If a compatibility contract is necessary, keep it in a dedicated contract owner and model only methods actually used. Do not duplicate a broad DSH API surface in the page file.

The page receives data and callbacks as props. It should not call `ctx.get()`, instantiate a DSH service, access ModuleLoader internals, or contain host-only model/storage logic.

## Loader and artifact verification

A successful build is not enough. Verify:

1. the package declares `dsh.client` and exports `./client`;
2. the expected client subpath exists;
3. the artifact has the DSH ModuleLoader wrapper;
4. the artifact exports `name`, `inject`, and `apply` when its factory runs;
5. external imports match packages supplied by the host and the `dsh.client.external` list;
6. a small loader smoke test can execute the factory with a CJS require shim.

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

- `dsh.client` and the `./client` export are declared;
- the client entry is registration-only;
- visible copy is locale-owned;
- the page is readable JSX, not a large createElement tree;
- React is externalized as the host expects;
- settings state and form draft behavior are explicit;
- invalid numeric input cannot persist as NaN;
- host form methods are bound before React receives them;
- the artifact loads through ModuleLoader;
- focused tests and package checks pass;
- changed files and any unverified GUI/profile step are reported separately.
