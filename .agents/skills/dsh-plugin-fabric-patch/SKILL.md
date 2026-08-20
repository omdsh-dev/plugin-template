---
name: dsh-plugin-fabric-patch
description: Use when writing the Fabric patch stub and its runtime handler for a DSH plugin: cordis.patch.yml row config, target selection across launch forms, operation semantics, handler registration through ctx.fabric or the compat facade, browser serveBundle rewrites, and the pitfalls that make patches bind nothing or fail boots.
---

# Write a Fabric Patch and Handler

This skill owns the patch-writing work: the declarative stub and the trusted runtime handler. Read the project-root `docs/dsh-plugin-fabric.md` and `docs/dsh-plugin-contracts.md` first, and apply `dsh-plugin-fabric-contract` to decide the dependency before writing code.

## Place the stub on the declaring row

Put the stub under the row's own `config.fabric.patches` and ship the row `disabled: true` (the `fabric-dsh` launcher enables Fabric-required rows at launch). Keep the `cordis-fabric` row disabled always — it is a library carrier, not a plugin.

```yaml
- insert:
    - id: my-plugin
      name: '@my-scope/dsh-my-plugin'
      disabled: true
      config:
        fabric:
          patches:
            - id: my-plugin/widen-gateway
              required: true
              target:
                module: '@scope/host-gateway'
                versionRange: '>=0.0.1-0'
                filePaths: ['src/gateway.ts', 'lib/index.js']
                functionQuery: { functionName: 'exposedSet', kind: 'Sync' }
              operation: after
```

Patch id is stable and namespaced (`owner/feature`); keep the same id in the stub and in the runtime registration.

## Match the launch form

`filePaths` lists every file the target can load as, under one id: source launches (tsx + tsconfig paths) load `src/...`, built deployments load `lib/...`. Check the target package's actual entry before fixing paths; a wrong list yields "bound nothing" on the required check. `versionRange` must accept the installed version. The module identity is the npm package name resolved from the target file's nearest package.json — a bare specifier import and a file-URL import both match.

## Choose the operation

- `before` — rewrite `call.arguments` before the original body runs.
- `after` — rewrite or replace the result; mutate `call.result` (sync or async after settlement).
- `around` — decide: return a value to veto the body, or run the body (possibly multiple times) through `call.traced()`.
- `replace` — the handler owns the call entirely.

`functionQuery.kind` is `Sync` or `Async` per the target's declared form. With multiple handlers on one function, `priority` orders them (higher first).

## Register the handler at runtime

Handlers are trusted code bound when the plugin mounts. Through the compat facade:

```ts
import { FabricCompatService } from 'cordis-fabric-api'
import type { FabricCall } from 'cordis-fabric'
// in apply:
await ctx.plugin(FabricCompatService)
const compat = ctx.get('fabricCompat')
compat.registerPatch({
  id: 'my-plugin/widen-gateway',
  target: { module: '@scope/host-gateway', versionRange: '>=0.0.1-0', filePaths: ['src/gateway.ts', 'lib/index.js'], functionQuery: { functionName: 'exposedSet', kind: 'Sync' } },
  operation: 'after',
  handler: (call) => { /* mutate call.result */ },
})
```

Or with the pure service when mounted: `ctx.fabric.register({ id, target, operation, priority, enabled }, handler)`. Keep the registration scoped to the plugin fiber; dispose it with the plugin.

## Serve browser rewrites separately

Load-time hooks only see Node imports. For a browser bundle, serve a rewritten copy. Fabric `0.1.0` resolves the target through `ctx.baseUrl`, so guard the serving seam on both the webserver capability and `ctx.baseUrl` before calling `serveBundle`:

```ts
compat.serveBundle({
  route: <web-absolute route the server mounts>, // the plugin's own mount point
  patch: { id: 'my-plugin/nav', target: { module: '@scope/ui', versionRange: '>=0.0.1-0', filePath: 'index.js', functionQuery: { functionName: 'Root', kind: 'Sync' } }, operation: 'before' },
  fallback: 'raw', // degraded copy when the transform cannot run
})
```

Browser-only targets cannot carry `required: true` — the server-side binding check would never see them and every boot would fail.

## Avoid the traps that cost boots

- Never enable the `cordis-fabric` row: the pure package has no plugin `apply` and the boot fails with "invalid plugin".
- An id-targeted patch replaces the whole row (config included); restate every field the plugin needs. `insert` rows must have unique ids — duplicate ids fail the boot.
- The row's own config is validated against the plugin's `Config` schema; the `fabric` key is metadata read by the launcher and the gate, and an unknown key must not break the schema validation.
- Keep handlers free of module state that breaks reload: the same handler registration must be repeatable across HMR/dispose cycles.
