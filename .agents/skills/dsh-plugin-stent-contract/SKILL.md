---
name: dsh-plugin-stent-contract
description: Use when a DSH plugin needs controlled host or browser hooks through Stent, or when deciding whether it must hard-depend on Stent. Covers the Stent packages, peer contract, plain-dsh versus stent-dsh launch forms, Stent-required rows, static patch stubs, required bindings, and profile installation.
---

# DSH Stent Plugin Contracts

This skill owns the Stent model for standalone DSH plugins. It is guidance, not permission to change a deployment: read the project-root `docs/dsh-plugin-stent.md` first — it is the authoritative contract this skill summarizes — then apply only the pieces the plugin's plan requires.

## Decide whether the plugin needs Stent

Use Stent only when the plugin must change behavior in code it does not own: a host gateway decision, a client bundle, or a third-party module. If the behavior can be a Cordis service, a composition row, or an injected provider, stop and use `dsh-plugin-plan` — a Stent patch is controlled function rewriting, not a replacement for a service.

A Stent patch is a static stub (`id`, `target`, `operation`) plus a trusted runtime handler. Executable handlers are never deserialized from YAML, JSON, model input, or a profile overlay. Static metadata may be composed before target modules load; the handler is registered by the plugin at runtime.

## Know the Stent packages

- `@oh-my-dsh/stent` — the pure service and transformation runtime. It exports `StentService`, `getStent`, `StentCall`, `StentInvoke`, `StentPatchStub`, browser transforms, and the required-binding checks.
- `@oh-my-dsh/stent-api` — the compat facade. Use it only when the plugin needs `StentCompatService`, observation, or the runtime browser-serving facade.
- `@oh-my-dsh/stent-dsh` — the DSH host facades, profile bootstrap, preload, and post-boot required-patch gate.
- `@oh-my-dsh/stent-pack` — the profile carrier that supplies the published Stent trio and the `stent-dsh` launcher.

A plugin that imports Stent declares `@oh-my-dsh/stent` as a required `peerDependency` and mirrors it in `devDependencies`. Add `@oh-my-dsh/stent-api` to both places only when the plugin imports it. Do not put either package in runtime `dependencies` or `bundledDependencies`; install `@oh-my-dsh/stent-pack` in the consuming profile first. The plugin repository's peer settings do not configure the profile package manager.

## Model the two launch forms

- **Plain `dsh`** runs without the Stent preload. Stent-required rows remain disabled and are skipped. Explicitly enabling one on plain `dsh` must fail loudly instead of silently running without hooks.
- **`stent-dsh`** writes the composed descriptors to `STENT_CONFIG`, installs the load-time hooks before the CLI entry imports target modules, enables Stent-required rows, and runs the post-boot binding gate. Its stderr includes the `stent: hooks summary` when descriptors are present.

Run the profile binary, for example:

```sh
$DSH_HOME/profiles/web/node_modules/.bin/stent-dsh --harness <official-checkout> web --port 8000
```

## Declare a Stent-required row

The row that owns transforms carries them under its own `config.stent.patches` and ships `disabled: true`:

```yaml
- insert:
    - id: my-plugin
      name: '@my-scope/dsh-my-plugin'
      disabled: true
      config:
        stent:
          patches:
            - id: my-plugin/exposed-thing
              required: true
              target:
                module: '@scope/target'
                versionRange: '>=0.0.1-0'
                filePaths: ['src/index.js', 'lib/index.js']
                functionQuery: { functionName: decide, kind: Sync }
              operation: after
```

The Stent profile provider separately owns the disabled `stent` descriptor-carrier row and enabled `stent-dsh` integration row. Never enable the pure `stent` package as a Loader plugin: its root is a service library without a plugin `apply`.

A Stent-required row has a deliberate three-state contract:

1. plain `dsh` skips the disabled row;
2. `stent-dsh` enables it and installs the hooks before target imports;
3. plain `dsh` with an explicit enable fails loudly because the hooks are absent.

A `required: true` patch that records no binding fails the `stent-dsh` post-boot check rather than shipping an inert transform.

## Keep the configuration contract honest

The `stent` descriptor block is profile metadata, but the Loader may validate the row against the plugin's `Config` schema. If the plugin uses a strict schema, include a serializable `stent` field (often `z.any()`) so the descriptor block is retained and not rejected or dropped. Keep handlers out of that schema.

## Continue with the companion skills

Use `dsh-plugin-stent-patch` to write target descriptors and register trusted handlers. Use `dsh-plugin-stent-verify` to prove load-time bindings, profile launch states, and the peer/install contract. General Loader, lifecycle, disposal, and product behavior remain under `dsh-plugin-test`.
