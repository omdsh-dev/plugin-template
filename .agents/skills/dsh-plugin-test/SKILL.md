---
name: dsh-plugin-test
description: Select and run evidence for a DSH plugin: Loader exports, behavior, disposal, profile composition, client artifact, visible snapshots, and built paths.
---

# Test a Standalone DSH Plugin

This skill selects evidence for the plugin's actual entry paths. It is guidance, not a mandate to run every repository test: each behavior needs the narrowest test that proves it, and product-visible behavior also needs a real assembled-application test.

## Read the test owners

Read the project-root files `AGENTS.md`, `README.md`, and `docs/dsh-plugin-contracts.md`, plus the source, configuration, contract, and focused test owners named by the current package layout. Tests live under `tests/`, not `src/__tests__/`. A consuming DSH host may add composition-specific tests, but the package's own evidence must run from this repository alone.

## Required evidence map

Create a short mapping from each promised behavior or failure to the test file and assertion that observes it. Include configuration defaults and rejections, lifecycle/disposal, event or durable state, composition, client artifact, and distribution path as applicable. Do not count static analysis, coverage percentage, or an agent report as behavioral evidence.

## 1. Verify Loader exports

Every function plugin needs a test through the real `Loader.prototype.unwrapExports` path:

```ts
import { Context } from '@deepseek-ai/cordis'
import { Loader } from '@deepseek-ai/cordis-plugin-loader'

expect('default' in plugin).toBe(false)
const loader = new Loader(new Context())
const unwrapped = loader.unwrapExports(plugin) as Record<string, unknown>
expect(unwrapped).toBe(plugin)
expect(unwrapped.name).toBe('<plugin-id>')
expect(unwrapped.inject).toEqual([/* required services */])
expect(unwrapped.Config).toBeDefined()
expect(typeof unwrapped.apply).toBe('function')
```

A service plugin instead verifies that Loader unwraps the default-exported service class with its intended metadata. Do not use one assertion pattern for both forms.

## 2. Verify configuration and behavior

Test schema defaults, each supported explicit value, cross-field or environment-dependent rejection at its promised failure point, and the observable operation result. Avoid tests for hostile values that cannot cross the typed same-process API; test untrusted parser, config, model/tool, file, worker, process, and wire inputs at their real entry.

Prefer authoritative state, events, registered descriptors, process results, or returned values over internal fields and log text. A log assertion is appropriate only when logging is the plugin's documented behavior.

## 3. Prove registration disposal

Mount the real required services, then the plugin through `ctx.plugin()`. Observe every contribution while the fiber is live, dispose that fiber, and observe its removal through the registry or service API. Do not infer cleanup from `fiber.dispose()` resolving.

Exercise attach/detach when optional services are handled through scoped injection. For asynchronous owners, test cancellation/disposal during an await and verify no callback, process, timer, watcher, or pending operation outlives the promised quiescent point.

## 4. Add a real composition test

A product-visible plugin requires a non-unit test that boots a test Cordis composition through the real Loader and application/process path. Mock only external services, credentials, time, randomness, or infrastructure that cannot be deterministic. Assert model-visible, durable, CLI-, terminal-, editor-, or browser-visible output.

A hand-built sequence of `ctx.plugin(...)` calls is useful unit coverage but does not substitute for this test. The fixture must include the package through its real export and composition metadata so a wrong package name, missing peer, invalid row, Loader export error, or boot-order defect fails.

## 5. Verify a client face

When the package declares `dsh.client`:

- build it and confirm `exports['./client']` points at an existing bundle;
- execute the factory through the ModuleLoader shim and observe `name`, `inject`, and `apply`;
- verify external imports match the host module table and `dsh.client.external`;
- test slot registration and disposal through the real client runtime or the narrowest supported shim;
- test locale dictionary registration, fallback, and removal;
- inspect the packed archive for the client bundle, types, locale files, and icon.

## 6. Snapshot visible behavior

Stable user- or model-visible text is behavior. Add focused keyless fixtures under the package's actual snapshot owner only when the package has a stable textual, visual, browser, or model-visible output contract. Keep fixtures portable across Linux and macOS; fix nondeterministic scenarios rather than normalizing away meaningful differences. Follow the inventory and refresh rules documented by the package.

Follow `AGENTS.md` in a UI plugin repository for its required demonstration channel. In particular, a TUI may require tmux presentation rather than transcript rendering.

## 7. Verify source and artifact paths

Run the target package commands:

```sh
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

After build, import each public runtime entry from `lib/` under plain Node and verify the expected ESM exports. Use `pnpm pack --dry-run --json` to verify the ready-made release artifact contains the runtime entries, declarations, patch, locale files, and icon; packaging is an artifact check and does not replace the development static-analysis check.

For every required peer, verify the package's declared development/workspace provider path and, when the selected consumer enforces peer constraints, test installation without the provider and with the provider. Treat a DSH profile as a separate consumer; its rejection behavior is unproven unless that profile's policy is independently configured and observed.

Use the pack output to inspect files whenever exports, files, generated artifacts, or distribution behavior changes. A packed-consumer or Git-install smoke belongs to `dsh-plugin-release` at `.agents/skills/dsh-plugin-release/SKILL.md`.

## Clear the harness tsconfig pin

The DSH agent shell exports `TSX_TSCONFIG_PATH` pointing at the harness's own `tsconfig.json`. That pin leaks into tsx-driven scripts (tests and config loaders) and overrides the repository's entry-tsconfig discovery, which mis-resolves const enums and path aliases. Clear it per command when running tests under the agent shell:

```sh
TSX_TSCONFIG_PATH= pnpm test
```

Do not unset it globally in the session environment and never commit the pin into repository configs; an empty per-command override is the whole fix. The baseline uses the Vitest `forks` pool; a restricted host that rejects child-process spawn can run `vitest run --pool=threads` as a local diagnostic and report the environment constraint rather than changing the repository's configured test contract.

## Select commands narrowly

Run exact test files or names while iterating, then the package's complete test script before claiming package-level success. Add focused coverage only when it provides evidence for changed source; do not lower thresholds, use `--passWithNoTests`, or exclude affected modules to force green output. Real-provider e2e runs only when required credentials are available, and secrets never appear in output.

On failure, stop and determine whether the implementation, test expectation, fixture, composition, or proven environment constraint is wrong. Never bypass a genuine failure or repeat a passing command solely for ceremony.

## Test exit condition

Report the behavior-to-test mapping, exact commands and results, snapshots changed, artifact imports, skipped environment-dependent tests, and remaining gaps. A plugin is tested only when its Loader form, behavior, disposal, composition requirement, visible output, client artifact when present, and built entry paths have the evidence selected in planning.
