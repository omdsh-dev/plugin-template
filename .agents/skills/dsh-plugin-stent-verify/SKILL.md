---
name: dsh-plugin-stent-verify
description: Use when proving a Stent-dependent DSH plugin works end to end: fresh-process fixture transforms with binding assertions, profile composition, the three-state boot matrix, peer installation, and the evidence needed before release.
---

# Verify a Stent Plugin End to End

This skill owns Stent-specific evidence: load-time bindings, the boot matrix, the profile launcher, and the peer/install contract. Read the project-root `docs/dsh-plugin-stent.md` first. General Loader export, disposal, schema, and product behavior checks stay in `dsh-plugin-test`; this skill adds what Stent changes.

## Prove the transform in a fixture process

Use `@oh-my-dsh/stent/testing/testkit` (`runPatchFixture`) for a target fixture plus static descriptor:

- the target fixture lives under a `node_modules`-shaped path or has a nearest package manifest so module identity matches production;
- each case runs in a fresh child process because installed hooks and transformed modules are not safely reset in one process;
- bootstrap the static patches before importing the entry module;
- assert the recorded binding (`module`, `file`, and `nodes`) and the rewritten result; a descriptor with zero bindings is inert even if the call still returns the original value;
- test the failure path for a `required: true` patch whose target file, version, or selector does not bind.

A minimal evidence shape is:

```ts
const outcome = runPatchFixture({
  patches: [descriptor],
  entry: fixtureEntry,
  args: { input: 'value' },
})
expect(outcome.bindings['owner/feature']).toEqual([
  expect.objectContaining({ module: '@scope/target', nodes: expect.any(Number) }),
])
expect(outcome.result).toEqual('rewritten')
```

## Run the three-state boot matrix

Compose an isolated profile (`DSH_HOME`, bundle layers, package archive, and peers) and assert all three states:

1. **Plain `dsh` skips the row** — the app boots, but the Stent-required plugin is absent from the mounted roster because its row remains disabled. This is normal non-Stent behavior, not an error.
2. **`stent-dsh` loads it** — the boot succeeds, the plugin appears in the effective roster, the required patch records a binding, and stderr carries the `stent: hooks summary`. The summary must name the patch, target file, and node count; `not hooked` is a failed required binding.
3. **Plain `dsh` with explicit enable fails** — enabling a row that declares `config.stent.patches` without the Stent preload fails loudly because hooks are not installed. Never accept silent fallback to the original function.

Boot the intended CLI through the profile's `.bin/stent-dsh`, and clear stale hook/config variables (`STENT_CONFIG`, `TSX_TSCONFIG_PATH`) before each independent case unless the launcher sets them. Record the exact profile and package artifact used.

## Verify the launch and profile forms

- Profile launcher: `$DSH_HOME/profiles/web/node_modules/.bin/stent-dsh --harness <official-checkout> web --port 8000`.
- Provider install: `dsh plugin --profile web add @oh-my-dsh/stent-pack` before installing the Stent-dependent consumer.
- Consumer rows: the declaring row carries `config.stent.patches` and is disabled by default; the provider supplies the disabled `stent` carrier and enabled `stent-dsh` integration row.
- Browser-only changes: assert the client transform or `serveBrowserTransform` output separately; Node's required-binding gate does not prove a browser rewrite.

## Keep installs honest

- In a temporary consumer, omit `@oh-my-dsh/stent` from the available peer set and prove the package's own configured peer check fails; restore the provider before build and tests.
- If the plugin imports `@oh-my-dsh/stent-api`, repeat the check for that peer. Do not add a second Stent copy to the consumer archive.
- Install the ready-made `@oh-my-dsh/stent-pack` provider through the official channel before the plugin. The provider carries the profile launcher; the consumer only declares peers.
- A package manager succeeding at `pnpm add` proves neither hook installation nor a required binding. Inspect the effective rows and the actual launch output.

## Record the evidence

Report per state: isolated home, package/provider spec, command, exit behavior, effective roster, warnings, hook marker/summary, binding records, transformed result, and cleanup status. A plugin whose Stent evidence covers only the enabled state has not proven the dependency contract.
