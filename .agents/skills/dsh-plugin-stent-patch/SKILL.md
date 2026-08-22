---
name: dsh-plugin-stent-patch
description: Use when writing a Stent patch stub and its trusted runtime handler for a DSH plugin: cordis.patch.yml row config, target selection across launch forms, operation semantics, service or compat registration, browser transforms, and the pitfalls that make patches bind nothing or fail boots.
---

# Write a Stent Patch and Handler

This skill owns the patch-writing work: static descriptors and trusted runtime handlers. Read the project-root `docs/dsh-plugin-stent.md` and `docs/dsh-plugin-contracts.md` first, and apply `dsh-plugin-stent-contract` to decide the dependency before writing code.

## Keep the consumer artifact peer-only

A Stent-dependent plugin declares `@oh-my-dsh/stent` as a required peer and mirrors it in `devDependencies`. Add `@oh-my-dsh/stent-api` in both places only if the plugin imports `StentCompatService` or another compat entry. Do not copy the Stent packages into the consumer's `dependencies` or `bundledDependencies`; the separate `@oh-my-dsh/stent-pack` release bundle owns the profile installation. The local workspace peer policy does not configure the consuming profile.

## Put the stub on the declaring row

Put the static descriptors under the row's own `config.stent.patches` and ship the row `disabled: true`; `stent-dsh` enables Stent-required rows at launch. The pure `stent` row is a descriptor carrier and remains disabled; the `stent-dsh` integration row is the host plugin that installs the preload.

```yaml
- insert:
    - id: my-plugin
      name: '@my-scope/dsh-my-plugin'
      disabled: true
      config:
        stent:
          patches:
            - id: my-plugin/widen-gateway
              required: true
              target:
                module: '@scope/host-gateway'
                versionRange: '>=0.0.1-0'
                filePaths: ['src/gateway.js', 'lib/index.js']
                functionQuery: { functionName: exposedSet, kind: Sync }
              operation: after
```

The patch id is stable and namespaced (`owner/feature`). Keep the same id in the static stub and runtime registration. The plugin's exported `Config` schema must preserve the `stent` metadata field when the Loader validates the row; add a serializable `z.any()` field when required by the schema policy.

## Match the launch form

`filePaths` covers every package-relative file that the target may load: source launches can load `src/...`, while built or packed deployments load `lib/...`. `versionRange` must accept the installed package. The module identity is the npm package name resolved from the target file's nearest package manifest; do not use a repository-relative path in a published descriptor.

A descriptor with no binding is not evidence of success. Use `required: true` for a Node-side target that must be transformed at boot, then inspect the post-boot check and `ctx.stent.bindings(id?)`. A browser-only target must use browser transform/serving evidence instead of the Node required gate.

## Choose the operation

- `before` — mutate `call.arguments` before the original body runs.
- `after` — observe or replace the successful `call.result`; async results settle before the after handler sees them.
- `around` — decide whether the original body runs; call `invoke()` to delegate, possibly with mutated arguments.
- `replace` — own the call entirely; call `invoke()` only when delegation is intentional.

Use `priority` when several trusted handlers target one function. Keep the target selector narrow: a name-based `functionQuery` is preferable to a raw `astQuery` when the function name is stable, and use `index` only when rewriting one match from a multi-match selector.

## Register the trusted handler

Prefer the declared service when the plugin requires Stent:

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { StentCall, StentService } from '@oh-my-dsh/stent'

export const inject = ['stent']

export function apply(ctx: Context & { stent: StentService }): void {
  ctx.stent.register({
    id: 'my-plugin/widen-gateway',
    target: {
      module: '@scope/host-gateway',
      versionRange: '>=0.0.1-0',
      filePath: 'lib/index.js',
      functionQuery: { functionName: 'exposedSet', kind: 'Sync' },
    },
    operation: 'after',
    handler(call: StentCall) {
      // Mutate or return a replacement for call.result.
      call.result = call.result
    },
  })
}
```

For a plugin that cannot declare the optional service, use the mount-aware fallback:

```ts
import { getStent } from '@oh-my-dsh/stent'

const stent = getStent(ctx)
stent.register({ /* id, target, operation, trusted handler */ })
```

`getStent(ctx)` reuses the existing service or mounts a scoped one; never construct a second global registry. Stent registration is owned by the registering Cordis fiber: disposal disables and removes the patch. Test the disposal path, duplicate-id failure, and repeated registration during HMR when those cases apply.

The compat route is separate and should not be added merely to avoid the direct service:

```ts
import { StentCompatService } from '@oh-my-dsh/stent-api'

await ctx.plugin(StentCompatService)
const compat = ctx.get('stentCompat')
compat.registerPatch({ /* static target, operation, and trusted handler */ })
```

## Handle browser rewrites separately

Node load-time hooks only see Node module evaluation. For a browser bundle owned by the host build, use Stent's transform:

```ts
import { createWatchedBrowserTransform, repoSourceResolver } from '@oh-my-dsh/stent'

const transform = createWatchedBrowserTransform(
  new URL('./stent.patches.json', import.meta.url).pathname,
  repoSourceResolver('@my-scope/dsh-my-plugin', new URL('..', import.meta.url).pathname, '0.0.1'),
)
```

When another package owns the target bundle, use `serveBrowserTransform` or the compat `serveBundle` route with the host webserver capability and `ctx.baseUrl` guarded. Give the route an explicit plugin-owned mount point. Use `fallback: 'raw'` only when degraded output is acceptable, and assert both rewritten and fallback behavior. Browser descriptors use the same static shape as `config.stent.patches`; handlers remain trusted runtime code.

## Avoid the traps that cost boots

- Never enable the pure `stent` row as a Loader plugin; it is a service library without `apply`. Enable the `stent-dsh` integration row through the Stent profile bundle.
- A row's `config.stent.patches` metadata must be carried by the declaring row; cross-bundle id overrides are order-sensitive and can miss a row inserted later.
- A descriptor with `required: true` must target the actual source and built file forms. Wrong `filePath`, version range, module identity, or selector produces no binding and fails the Stent gate.
- Do not put handler functions in YAML or model-controlled configuration. Bind trusted handlers in `apply` through `ctx.stent` or the explicitly selected compat facade.
- Hooks must be installed before the target's first evaluation. A late registration cannot retroactively transform a cached module; use a fresh child process for fixture cases.
- Keep handlers free of module state that breaks reload, and keep all registrations scoped to the plugin fiber.
- Preserve every existing row config field when replacing an id-targeted patch; profile patch replacement is not a deep merge.
