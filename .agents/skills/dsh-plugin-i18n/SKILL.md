---
name: dsh-plugin-i18n
description: Use when a standalone DSH plugin adds or changes browser UI copy and needs typed locale dictionaries, namespace registration, translated component props, or optional language-pack contributions. Do not use for host-only plugins or user, model, protocol, and other non-UI data.
---

# Localize a DSH Plugin

This skill adds localization to a plugin that owns browser UI. It covers the ordinary plugin that ships its own `zh`/`en` copy and the separate language-pack plugin that contributes an external language. It is guidance, not permission to add a language, copy, dependency, or public UI contract that the product does not need.

## Read the owners first

Run this skill from the plugin repository root. Read `AGENTS.md`, `README.md`, `docs/dsh-plugin-contracts.md`, `package.json`, the actual browser entry, its slot contracts, the focused component tests, and the applicable `cordis.patch.yml`. If the package has no browser face or no product-visible copy, stop: do not add a locale dependency for host, model, user, wire, or internal data.

Keep every source and documentation input below the repository root. Do not read a DSH checkout or another plugin as an implicit source. Use installed package declarations and this repository's manifest to inspect host APIs. Preserve the plugin's function or service Loader form.

Record these facts before editing:

| Area | Record |
|---|---|
| Browser owner | client entry, components, slots, and whether the package is static or dynamic |
| Copy inventory | visible text, labels, aria names, titles, placeholders, status text, and formatters |
| Namespace | stable package-owned namespace and its key owner |
| Services | Cordis `locale` service and other actual dependencies |
| Languages | built-in `zh`/`en`, plus any separately supplied external language |
| Tests | component, lifecycle, composition, and snapshot owners |

## Keep data and copy separate

Localize product-visible UI copy, including:

- text rendered to users;
- button and link labels;
- `aria-label`, `title`, placeholder, empty-state, loading, and error copy;
- visible units or status formatters that the plugin owns;
- labels passed to a zero-Cordis primitive.

Do not translate user input, model output, provider names, protocol fields, tool names, stable ids, error codes, CSS tokens, or values used for matching and branching. Internal behavior switches on discriminants and stable ids, never on translated strings. A failure code may remain a code while a separately owned UI message translates its presentation.

Every visible string has one owner. Do not hide English or Chinese fallback text in a component, primitive, hook, store, injected callback, or slot registration. A Cordis-free primitive receives complete localized label props; a feature plugin owns the dictionary and supplies those props.

## Choose one namespace per feature

Give the plugin a stable namespace such as `vendor.feature` or `settings.vendor-feature`. The namespace is the key passed to `ctx.locale.register()`, `ctx.locale.bind()`, and a slot registration's `locale` field.

Keep feature copy out of `common`. Use `common` only for vocabulary deliberately shared by several features. Do not create a namespace per component when the copy belongs to one feature owner. Do not let two plugins own the same `(namespace, locale)` pair; registration rejects the duplicate instead of silently overwriting it.

## Define typed dictionaries

Put the ordinary plugin dictionaries in the browser source owner, commonly `src/client/locales.ts`:

```ts
/** Feature namespace dictionaries. */
export const zh = {
  'panel.title': '功能面板',
  'panel.save': '保存',
  'panel.count': '{count} 个项目',
} satisfies Record<string, string>

export type FeatureKey = keyof typeof zh

export const en = {
  'panel.title': 'Feature Panel',
  'panel.save': 'Save',
  'panel.count': '{count} items',
} satisfies Record<FeatureKey, string>
```

The `zh` object supplies the key union. The `en` constraint makes a missing or extra key a compile-time error. Keep dictionaries flat and use stable semantic keys, not English sentences as keys. Values may contain `{name}` placeholders; the component supplies their values to `t(key, params)`.

Declare the namespace in the module that owns the browser plugin's public client contract:

```ts
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { en, zh, type FeatureKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'vendor.feature': FeatureKey
  }
}
```

The type-only locale import supplies the `ctx.locale` Context augmentation. The `LocaleNamespaceMap` augmentation supplies the typed `register`, `bind`, and component locale prop. Do not add a runtime import merely to obtain those types.

## Register ordinary plugin copy

Register the built-in dictionaries in the plugin's `apply` function and make the returned disposer fiber-owned:

```ts
const NS = 'vendor.feature' as const

export const inject = ['locale', 'slots']

export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    'vendor.feature: dictionaries',
  )

  // Register the plugin's actual slot contribution here, with `locale: NS`.
}
```

`ctx.locale.register(NS, { zh, en })` is the typed built-in form. It registers one complete dictionary for every built-in language and checks its keys against the namespace's `LocaleNamespaceMap` entry. The call returns an idempotent disposer; use `ctx.effect()` rather than a module-level registration.

The `locale` in the exported Cordis `inject` list is a service name. If this is a dynamic browser package, also declare the locale package in the package's client dependency metadata and in the peer/development dependency sections required by the repository's client-package contract. `dsh.client.inject` package-name edges and Cordis `inject` service names are different declarations; keep both accurate when both are required.

## Pass translation through slots

Registering a dictionary does not make `t` appear in every component. A slot contribution opts into the framework translation seat:

```ts
ctx.slots.register({
  name: 'vendor.feature.panel',
  locale: NS,
}, FeaturePanel)
```

Derive component props from the slot framework instead of hand-writing the locale member:

```tsx
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

export type FeaturePanelProps =
  PropsRuntime<'vendor.feature.panel'> & PropsLocale<'vendor.feature'>

export function FeaturePanel({ t }: FeaturePanelProps) {
  return (
    <section aria-label={t('panel.title')}>
      <h2>{t('panel.title')}</h2>
      <button type="button">{t('panel.save')}</button>
      <p>{t('panel.count', { count: 3 })}</p>
    </section>
  )
}
```

Use the four prop shares required by the client contract: owner/runtime data, render slots, declared store state/actions, and injected values. Add `PropsLocale<N>` as the locale share when the registration declares `locale: N`. Components do not call `ctx`, access a service class, create a subscription, or receive a bare locale observable. The framework hook updates `t` when the active locale or dictionary revision changes.

If a child component is not itself a slot registrant, pass localized strings or a localized callback as ordinary props from its owner. Do not create a second translation hook or a fallback dictionary inside the child.

## Register an external language separately

A normal feature plugin usually supplies only `zh` and `en`. A language-pack plugin may add a language definition and the feature's dictionary as separate effects:

```ts
export const inject = ['locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.addLanguage({
      id: 'ja',
      label: '日本語',
      fallback: 'en',
    }),
    'ja: language',
  )

  ctx.effect(
    () => ctx.locale.register('vendor.feature', 'ja', {
      'panel.title': '機能パネル',
      'panel.save': '保存',
      'panel.count': '{count} 件',
    }),
    'ja: vendor.feature dictionary',
  )
}
```

`addLanguage()` registers only the selectable language definition (`id`, `label`, and `fallback`); it does not register translations. `register(ns, locale, dict)` registers one language dictionary. The external id must be an ASCII BCP 47-style tag such as `ja`, `pt-BR`, or `zh-Hant`. The fallback chain must terminate at `en`; malformed ids, duplicate language definitions, unknown fallback targets, and cycles fail when the language is registered.

The language definition and dictionary may register in either order. A dictionary can exist before its language definition or before the feature plugin that consumes it. If the feature plugin is absent, the dictionary is dormant. If it later registers its `zh`/`en` dictionaries, those entries coexist. If both plugins register the same `(namespace, locale)`, the second registration fails; agree on one owner rather than relying on order.

Do not use `addLanguage()` to predeclare a feature's translations. If the plugin does not own a new selectable language, do not call it at all. A language pack that only calls `addLanguage()` adds a language selector entry but provides no feature copy.

## Fallback and missing keys

Lookup first walks the active language's fallback chain in the requested namespace, then repeats that chain in `common`, and finally returns the key itself. Therefore an external language may provide only the keys it translates:

```ts
ctx.locale.register('vendor.feature', 'ja', {
  'panel.title': '機能パネル',
})
```

If `panel.save` is missing in Japanese, the lookup continues to the declared fallback dictionaries. Do not add component-side `?? 'Save'` or `if (locale === 'ja')` branches; those bypass the registry's fallback and make disposal or late registration inconsistent.

Locale registration and dictionary registration are independent from feature activation. A late dictionary registration changes the locale revision so mounted slots can render it without a remount. Registering a dictionary does not itself change the active locale or emit the active-locale change event.

## Lifecycle, ownership, and disposal

Every locale definition and dictionary registration must be owned by the plugin fiber through `ctx.effect()`. Test the observable cleanup after disposing the plugin fiber:

- the language pack is removed from the selectable locale list;
- dictionaries owned by the plugin no longer resolve;
- an active removed language returns to the available browser/default locale;
- a saved unavailable preference remains pending until its definition returns;
- a later registration can claim a `(namespace, locale)` pair after the prior owner is disposed.

Do not manually call another plugin's disposer, mutate the locale registry's internal maps, or register dictionaries at module evaluation time.

## Dependency and package rules

For a browser plugin, inspect the current client package contract before changing the manifest:

1. Add the locale package as a runtime peer when the host supplies the locale service, and as a development dependency when source typechecking or tests import it.
2. Add a dynamic client package-name edge only when the bundle's module graph requires it; do not use client metadata to replace Cordis service injection.
3. Keep the browser entry and locale dictionary in the package's published `files` list and ensure the built client entry exports/types remain complete.
4. Keep host-only dependencies and browser-only dependencies on their actual build faces; never pull a browser locale runtime into a host entry just to share types.
5. Update the profile patch only when the client package must be composed into a profile. A locale dictionary does not by itself require a new host patch row.

If a language-pack plugin needs a target feature's key type, prefer a type-only import from the target's public client contract and a declared development dependency. If that dependency is unavailable, use a deliberately untyped `register(ns, locale, dict)` call only after recording the loss of compile-time key checking; do not add a runtime dependency or a host-source path solely for translation metadata.

## Tests and evidence

Map each changed copy path to an assertion before editing. At minimum, select the applicable evidence:

| Behavior | Evidence |
|---|---|
| Dictionary key parity | `zh` key source plus `en satisfies Record<FeatureKey, string>`; add a schema/dictionary test when the package has one |
| Typed `t` calls | Component test renders the feature and exercises a namespace key and placeholder |
| Locale switching | Test the component or real client composition under `zh` and `en`, asserting visible text and accessibility labels |
| Registration | Mount through the real client/Loader path and observe the dictionary or slot contribution |
| Disposal | Dispose the plugin fiber and observe the dictionary/registration disappears |
| External language | Test language definition, fallback, late dictionary registration, duplicate ownership, and removal when the plugin owns these paths |
| Product-visible output | Use the package's real assembled composition and update a keyless snapshot when stable user-visible output changes |
| Distribution | Build the client face, import the built entry, and inspect the packed file list |

Do not test localization by inspecting private maps, render counts, or the translation function's identity. Assert rendered text, labels, locale snapshots, registry entries, and real removal. Do not add snapshots merely because dictionaries exist; add or update them when the assembled product output changes.

## Documentation and verification

Update the plugin's `README.md` and any bilingual counterpart when localization changes the public setup, supported languages, or user-visible behavior. Document the namespace and registration owner once; do not paste the entire dictionary into a README. Keep configuration JSDoc and profile composition metadata synchronized if a locale-related config field exists. Follow the repository's local documentation and translation-pairing rules; do not invoke an automated translation tool unless the user requested it.

Run the narrowest checks for the changed face, then the package baseline:

```sh
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

For a browser-facing plugin, also run the repository's configured GUI, real-composition, built-artifact, and snapshot checks when those surfaces exist. Report exact commands, passed tests, changed snapshots, skipped credential-dependent cases, and any pre-existing failure separately. Never claim an i18n change is complete because the dictionary compiles alone: the slot receives the `locale` declaration, the visible copy renders through `t`, and the registration disposes correctly.

## Exit condition

The localization work is complete only when:

- the namespace and dictionary owner are explicit;
- every product-visible string in the changed feature uses the locale seat or localized props;
- `zh`/`en` keys are type-checked and external language ownership is unambiguous;
- `addLanguage()` is used only for a new selectable language, never as a dictionary shortcut;
- registrations are fiber-owned and disposal is observed;
- absent consumer plugins, late installation, fallback, and duplicate ownership behave as documented;
- the manifest, client bundle metadata, README, tests, and snapshots are synchronized where applicable;
- the exact selected checks pass, with unrelated failures reported rather than hidden.

Return a handoff naming the namespace, dictionary files, locale/service dependencies, slot registrations, external languages, disposal evidence, visible output or snapshots, package metadata, and exact commands run.
