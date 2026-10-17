---
name: dsh-plugin-plan
description: Plan a standalone DSH plugin: form, dependencies, configuration, compatibility, display, composition, evidence, and distribution before code is written.
---

# Plan a Standalone DSH Plugin

This skill turns a requested capability into explicit package decisions. It is guidance, not a request to create files: write code only when the user also requested implementation.

## Sources of truth

Read the project-root files `README.md`, `AGENTS.md`, and `docs/dsh-plugin-contracts.md`. Inspect only package declarations installed below this repository root. If a required host contract is not represented there, stop until an approved registry dependency or local contract file is added to the repository; never traverse to another checkout.

## Confirm the request

Require an objective, observable outcome, target or planned repository location, package name, plugin id, intended consumer/profile, supported DSH range, and distribution assumption. The package name must be an explicit valid npm name; it may be scoped or unscoped, and no `@scope/dsh-` prefix is implicit. Ask once for missing decisions. Do not infer a public scope, default behavior, credential source, security policy, or repository destination.

## Choose the plugin form

Select exactly one runtime form:

- **Function plugin:** use named exports `name`, `inject`, `Config`, and `apply`; never add a default export because Loader unwrapping would discard the namespace metadata.
- **Service plugin:** default-export the `Service` subclass and put service registration/lifecycle on that class; do not also expose function-plugin metadata as a competing runtime entry.

Record whether the package is a service definition, provider, consumer, bundle, UI adapter, tool, command, or a justified combination. A new capability needs service-definition, provider, and consumer roles across the package graph; do not let one consumer's transport or UI concerns define a generic service API.

## Build the dependency matrix

For every imported DSH service or package, record:

| Fact | Decision |
|---|---|
| Package/API | Exact current package and export path |
| Availability | Required or optional |
| Cordis access | `inject` + `ctx.<service>`, or optional `ctx.get(name)`/scoped `ctx.inject` |
| Manifest | Runtime source (dependency, required or optional peer, or legitimate bundled provider); development source |
| TypeScript | Local compiler configuration and installed package declarations |
| Composition | Existing base row or inserted bundle row |
| Provider install | Package or profile layer that must provide each required peer before activation |
| Test support | Real provider, focused fake, or composition fixture |

Required services belong in `inject`. Use `ctx.get(name)` for optional service reads; never use undeclared `ctx.<name>` access. Add only dependencies with a current production use.

Use the dependency classification in `docs/dsh-plugin-contracts.md#dependencies` and record every planned package against it. The template's concrete split is maintained there; do not restate it in this skill.

## Design configuration

List each field with its type, validation, default or required status, evidence for that choice, and earliest failure point. Deployment-varying choices are validated `Config` fields rather than hidden constants. A default needs current-consumer evidence or relevant prior art; otherwise require an explicit value. Credential values stay outside committed configuration and flow through the owning credential service or environment-variable indirection.

Plan fail-loud behavior for self-contained misconfiguration at plugin load, and for environment-dependent failures at the earliest point where the environment can be judged.

## Choose the repository structure

Keep the current package boundaries focused instead of assuming a fixed skeleton. Record the files and directories that own Loader metadata, configuration, runtime/service boundaries, browser behavior, display metadata, shared contracts, tests, snapshots, and patches. For a larger plugin, record whether complexity justifies capability-named modules, additional shared harness support, visible fixtures under `tests/snapshots/`, or dependency or DSH-host patches under `patches/`. If no patch is planned, record that `patches/` and patch-only scripts are omitted. Do not pre-create directories copied from another plugin's product domains.

## Define ownership and lifecycle

Name every registration, listener, process, timer, watcher, callback, or asynchronous operation the plugin owns. Specify how the plugin fiber disposes it and what quiescent disposal means. Apply the lifecycle and cancellation rules in the project-root file `docs/dsh-plugin-contracts.md` before approving the design.

If the plugin adds model-visible input, plan the durable session event that makes it reconstructable. If it adds a tool, decide its UI render intent and locations before implementation and record the host-facing render contract in the package README.

## Decide DSH compatibility

Record the supported DSH range for `engines.dsh`. Prefer an explicit range that includes the release line the package actually supports, for example `>=0.2.1-rc.2 <0.3.0` for this template line. Remember that when `engines.dsh` is present it alone decides installation and startup compatibility; DSH peer ranges are ignored. Plan the exact-version exemption guidance for users when the package intentionally spans a range.

## Decide display and browser resources

Every installable bundle has a visible Plugin Manager entry even when its Host effect is small. Follow `docs/dsh-plugin-contracts.md#display-metadata-and-icon` for the locale, icon, and `files` rules.

Record the display title, description, icon source and license; for a browser face also record `dsh.client.platform === 'web'`, the `./client` export, package-name `inject` edges, `immediately` only when the boot barrier needs it, and exact `external` requests. Plan how the client artifact is built and checked through the host's ModuleLoader contract.

## Design profile composition

Record the target base profile and every row the bundle inserts or overrides. For each override, copy the complete intended `config` because id-targeted patches replace that value rather than deep-merging it. Keep secrets out of the patch. When the package needs no bundle, record that decision instead of inventing a patch.

## Select evidence

Choose the smallest tiers that can prove the behavior:

- Loader export-shape test for every function plugin;
- configuration and behavior unit tests;
- activation plus disposal/HMR-safety tests for registrations;
- real Loader/profile composition test for product-visible behavior;
- client artifact/ModuleLoader check for a browser face;
- keyless snapshot for model-, CLI-, terminal-, editor-, or browser-visible output;
- built-artifact and Git/npm/tarball smoke for distributed packages;
- real-provider e2e only when behavior requires credentials or external infrastructure.

## Planning output

Return an updated handoff compatible with `dsh-plugin-development` at `.agents/skills/dsh-plugin-development/SKILL.md`, plus a short list of rejected alternatives only when they affect implementation. Planning is complete only when `pluginForm`, roles, dependency matrix, configuration, lifecycle ownership, DSH compatibility, display metadata, browser face, bundle rows, test tiers, and distribution assumption contain no unresolved decision that blocks scaffolding.
