# DSH Fabric Plugin Contracts

Shared reference for the Fabric plugin skills (`dsh-plugin-fabric-*`). The Fabric layer lets a standalone DSH plugin rewrite host or browser code at load/build time through declarative patch stubs plus trusted runtime handlers, with the plugin row itself carrying the hard dependency — no host source change.

## The three packages

- `cordis-fabric` — the pure transformation service (loader hooks, bridge, runtime, `bootstrapFabric`, `checkRequiredPatches`, `testing/testkit`). A library: its profile row must never be enabled (no plugin `apply`; an enabled row fails every boot).
- `cordis-fabric-api` — the compat facade. Fabric `0.1.0` exports `FabricCompatService` as a named export from the package root; the public compat subpaths are `compat/service`, `compat/instrumentation`, and `compat/types`. `FabricCall` and `FabricTarget` come from `cordis-fabric`.
- `cordis-fabric-dsh` — the Host plugin: DSH-facing facades plus the post-boot gate. Its row is the one installs enable.

The trio installs through the official plugin channel as one ready-made release bundle (`cordis-fabric-bundle`, repo `omdsh-dev/fabric`); the bundle also ships the compiled `fabric-dsh` launcher binary. Nothing is patched in DSH host source.

## Launch forms

- **Plain `dsh`** — official code only. Fabric-required rows stay disabled and are skipped; the app runs without the dependent plugins.
- **`fabric-dsh`** — the launcher injects the load-time hooks through a preload (`--import`) before the CLI entry loads, aggregates every row's `config.fabric.patches` descriptors, writes them to `$DSH_FABRIC_CONFIG`, and enables Fabric-required rows through a generated `--patch` overlay. Invocation: `$DSH_HOME/profiles/web/node_modules/.bin/fabric-dsh --harness <official-checkout> web --port 8000` (home and profile derive from the install path; a checkout form `node <bundle-repo>/scripts/fabric-dsh.mjs --harness <checkout> --profile web ...` exists for development). The harness must be an official source checkout; an npm-installed `dsh` cannot run fabric-dsh (prebuilt CLI, no source entry to preload). The preload prints a `fabric-dsh:` marker on stderr once the hooks install, so the boot output distinguishes a fabric-enabled launch from plain `dsh`.

## Fabric-required rows

A row whose own `config` declares `config.fabric.patches` hard-depends on the Fabric layer. Contract:

- the row ships `disabled: true` in its bundle layer;
- `fabric-dsh` enables it (and any other declaring row) at launch;
- a plain-`dsh` boot therefore skips it entirely — the plugin does not load, it does not degrade;
- explicitly enabling such a row on a plain-`dsh` boot fails the boot loud (the `cordis-fabric-dsh` post-boot gate), because the hooks are absent and the transforms can never run;
- the `cordis-fabric` row is the canonical carrier for descriptors a deployment keeps central; declaring rows carry their own stubs so composition never depends on bundle-layer order.

Carrying the stub on the row itself is the robust pattern: an id-targeted override in another bundle's layer only reaches a row inserted by an EARLIER layer, so cross-bundle overrides break when install order differs.

## Patch stub anatomy

One entry of `config.fabric.patches`:

```yaml
- id: owner-scope/feature-name          # stable, unique, namespaced
  required: true                        # hard dependency (see below)
  target:
    module: '@scope/pkg-name'           # npm package name, matched via package identity
    versionRange: '>=0.0.1-0'           # semver range of the installed package
    filePaths: ['src/file.ts', 'lib/index.js']   # both launch forms under one id
    # or a single: filePath: 'lib/index.js'
    functionQuery:                      # name-based selector (or astQuery for an explicit AST query)
      functionName: 'exposedNamespaces'
      kind: 'Sync'                      # Sync or Async (declared async functions)
  operation: after                      # before | after | around | replace
  priority: 0                           # optional handler ordering, higher first
```

Rules that cost real debugging when violated:

- `filePaths` must cover the launch form that actually loads: a source launch (tsx + tsconfig paths) loads `src/...`, a built deployment loads `lib/...`. A mismatch means the patch bound nothing.
- Load-time transformation happens at module import on the NODE host; browser bundles are rewritten by `serveBundle` at request/build time instead. A patch whose target only exists in the browser cannot be `required` — the server-side binding check would never see it.
- Fabric `0.1.0` browser serving resolves the target through `ctx.baseUrl`; guard the serving seam on both the webserver capability and `ctx.baseUrl` before calling `serveBundle`.
- Handlers are trusted code bound at runtime (`ctx.fabric.register` or the compat `registerPatch`); descriptors are configuration metadata — never deserialize executable handlers from YAML or model input.
- The bridge is a `globalThis` singleton; transformed code publishes to it and the runtime dispatches. With no handler registered the original body runs untouched.

## The required flag and the gate

- Under `fabric-dsh`, a `required: true` patch that bound nothing fails the boot loud (`checkRequiredPatches` naming the patch id) instead of shipping an inert transform.
- Under plain `dsh`, a Fabric-required row that was explicitly enabled fails the boot loud (hooks absent). A Fabric-required row that stays disabled is simply skipped — that is the normal plain-`dsh` behavior, not an error.

## Install flow

1. One-time machine setup: install the ready-made Fabric bundle through the official channel:
   `dsh plugin --profile web add https://github.com/omdsh-dev/fabric/releases/latest/download/pkg.tgz`, then enable the idempotent `cordis-fabric-dsh` row as documented by the profile.
2. The release artifact carries the prebuilt Fabric trio, so profile installation does not resolve nested Git/URL packages, run `prepare`, or require `blockExoticSubdeps: false`.
3. Launch through the profile's `.bin/fabric-dsh`; plain `dsh` keeps the dependent rows unloaded.

## Testing surface

- `cordis-fabric/testing/testkit` (`runPatchFixture`) runs one transformed target with a handler in a child process and reports bindings — assert the binding exists and the rewritten call result.
- Composition tests: boot a real profile tree (child process, `node --import tsx/esm --import <preload>`) and assert the three-state matrix — plain `dsh` skips the row, `fabric-dsh` loads it with the binding recorded, plain `dsh` with an explicit enable fails.
- Keep registrations scoped to the plugin fiber and test disposal; the load-time hooks cannot be unregistered within a process, so each case runs in a fresh child.
