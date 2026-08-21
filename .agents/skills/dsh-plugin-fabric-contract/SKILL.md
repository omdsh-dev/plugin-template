---
name: dsh-plugin-fabric-contract
description: Use when a DSH plugin needs to rewrite host or browser code through the Fabric layer, or when deciding whether a plugin must hard-depend on Fabric. Covers the trio packages, the plain-dsh vs fabric-dsh launch forms, Fabric-required rows, patch stub anatomy, the required flag, the post-boot gate, and the install flow.
---

# DSH Fabric Plugin Contracts

This skill owns the Fabric ecosystem model for standalone DSH plugins. It is guidance, not permission to change a deployment: read the project-root `docs/dsh-plugin-fabric.md` first — it is the authoritative contract this skill summarizes — then apply only the pieces the plugin's plan requires.

## Decide whether the plugin needs Fabric

Use the Fabric layer only when the plugin must change behavior that lives in code the plugin does not own: a host gateway decision, a client bundle, a third-party module. If the behavior can be a Cordis service, a composition row, or an injected provider instead, stop and use `dsh-plugin-plan` — a Fabric patch is load-time rewriting, not a service.

A Fabric patch is a declarative stub (id/target/operation) plus a trusted runtime handler. Executable handlers are never deserialized from YAML or model input; descriptors are configuration metadata.

## Know the three packages

- `@oh-my-dsh/cordis-fabric` — the pure transformation service. A library: its profile row must never be enabled (no plugin `apply`; an enabled row fails every boot). Its row is only the canonical carrier for central `config.fabric.patches` descriptors.
- `@oh-my-dsh/cordis-fabric-api` — the compat facade. In Fabric `0.1.1`, `FabricCompatService` is a named root export; public compat subpaths are `compat/service`, `compat/instrumentation`, and `compat/types`. `FabricCall` and `FabricTarget` come from `@oh-my-dsh/cordis-fabric`.
- `cordis-fabric-dsh` — the Host plugin with the post-boot gate; its row is the one that installs enable.

The trio arrives as one ready-made release bundle (`@oh-my-dsh/cordis-fabric-pack`, repo `omdsh-dev/fabric`) through the official plugin channel; the bundle also ships the compiled `fabric-dsh` launcher. A plugin that consumes Fabric declares `@oh-my-dsh/cordis-fabric` and `@oh-my-dsh/cordis-fabric-api` as required `peerDependencies`, mirrors them in `devDependencies` from a reachable registry or pinned release source, and does not place them in runtime `dependencies` or `bundledDependencies`. The consumer repository may enable strict peer checking beside `autoInstallPeers: false` for local checks, but that workspace setting is not transferred to a consuming DSH profile; install the provider bundle in the profile first. Both peers are required when the plugin imports `FabricCompatService` at runtime: `@oh-my-dsh/cordis-fabric-api` itself consumes the `@oh-my-dsh/cordis-fabric` runtime, so type-only use of Fabric does not make the API peer optional. Mark a peer optional only when the plugin can load and operate without that package.

## Model the two launch forms

- **Plain `dsh`** runs official code only: Fabric-required rows stay disabled and are skipped; the app runs without the dependent plugins.
- **`fabric-dsh`** injects the load-time hooks through a preload before the CLI entry loads, aggregates every row's `config.fabric.patches` into `$DSH_FABRIC_CONFIG`, and enables Fabric-required rows through a generated `--patch` overlay. Run it from the profile: `$DSH_HOME/profiles/web/node_modules/.bin/fabric-dsh --harness <official-checkout> web --port 8000`. The harness must be an official source checkout; an npm-installed `dsh` cannot run fabric-dsh (prebuilt CLI).

## Declare a Fabric-required row

The row that owns the transforms declares them under its own `config` and ships disabled:

```yaml
- insert:
    - id: my-plugin
      name: '@my-scope/dsh-my-plugin'
      disabled: true
      config:
        fabric:
          patches:
            - id: my-plugin/exposed-thing
              required: true
              target: { module: '@scope/target', versionRange: '>=0.0.1-0', filePaths: ['src/x.ts', 'lib/index.js'], functionQuery: { functionName: 'decide', kind: 'Sync' } }
              operation: after
```

Why the stub rides the declaring row: an id-targeted override in another bundle's layer only reaches a row inserted by an earlier layer, so cross-bundle overrides break when install order differs. Self-carried stubs have no layer-order dependency.

Consequences, all enforced at boot:

- plain `dsh` skips the row entirely — the plugin does not load, it does not degrade;
- `fabric-dsh` enables it and installs the transforms;
- explicitly enabling it on plain `dsh` fails loud (hooks absent, the transforms can never run);
- `required: true` plus a missing binding fails `fabric-dsh` loud instead of shipping an inert transform.

## Keep the gate honest

- `filePaths` must cover the launch form that actually loads: source launch loads `src/...`, built deployments load `lib/...`; a mismatch reads as "bound nothing".
- A target that only exists in the browser bundle cannot be `required` — the server-side binding check never sees it; use `serveBundle` for browser rewrites.
- The bridge is a `globalThis` singleton; with no registered handler the original body runs untouched.

## Install and update

One-time: install the ready-made bundle — `dsh plugin --profile web add https://github.com/omdsh-dev/fabric/releases/latest/download/pkg.tgz` — plus the idempotent `cordis-fabric-dsh` row enable. The release artifact avoids nested Git/URL resolution, `prepare`, and `blockExoticSubdeps: false`; launch through the profile's `fabric-dsh` binary.
