---
name: dsh-plugin-compose
description: Install a DSH plugin bundle into a profile, verify engines.dsh compatibility, inspect effective rows, and prove activation without patching host source.
---

# Compose a Plugin into a DSH Profile

This skill owns profile wiring and activation evidence. It is guidance, not permission to modify a user's live profile: prefer an isolated `DSH_HOME` or an explicitly approved development profile, and distinguish “the bundle is present” from “the plugin behavior works.”

## Sources of truth

Read the project-root files `README.md`, `AGENTS.md`, and `docs/dsh-plugin-contracts.md`, plus the target package manifest. Use the locally documented profile commands against the installed DSH host; if the host rejects them, report a compatibility blocker rather than reading host source outside the repository.

## Verify the bundle declaration

The package manifest must point at a shipped patch:

```json
{
  "engines": {
    "dsh": ">=0.2.1-rc.2 <0.3.0"
  },
  "dsh": {
    "manifestVersion": 1,
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

`dsh.bundle.patch` may be one path or an ordered list of paths applied as one layer. Each path is relative to the package root. Ensure every patch file is present in the manifest `files` list. Every bare package named in a patch row must be a runtime-resolvable package of the profile or DSH installation; TypeScript path aliases do not affect Loader resolution.

The package should also ship display metadata so Plugin Manager and Settings can show it without activating the plugin; see `docs/dsh-plugin-contracts.md#display-metadata-and-icon`.

## Review patch semantics

Review the patch against `docs/dsh-plugin-contracts.md#bundle-composition`: confirm layer order, stable ids, complete `config` overrides, unmatched-id warnings, literal metadata, and credentials. `cordis.patch.yml` cannot edit DSH source files, compiler settings, build scripts, generated catalogs, CLI routing, or runtime boot code. If behavior requires those changes, stop and classify it as a DSH host change; use the repository's documented, controlled host-patch process when one is required rather than hiding the change in plugin installation instructions.

## Check compatibility first

Follow `docs/dsh-plugin-contracts.md#manifest-and-compatibility` for the compatibility decision. A mismatch returns an `incompatible-version` refusal naming the requirement and range. Do not bypass it by editing `package.json` or removing the range. If the exact package version and runtime version are intentionally being tested, use the documented exact-version exemption:

```sh
dsh plugin --profile <profile> allow-version <package@version> --dsh-version <runtime> --accept-risk
```

Warn the user about crashes and data loss before granting it. Revoke it with `revoke-version`. An exemption never authorizes dependency build scripts.

## Choose an isolated profile

For repeatable composition work, use a temporary or dedicated development `DSH_HOME`; record its path for every command and remove it only when no later test needs it. Do not overwrite `$DSH_HOME/cordis.patch.yml` or an existing named profile without user approval.

Select the base profile that supplies the required services. A custom profile initializes from `@deepseek-ai/dsh-base`; a Web, headless, or TUI-facing plugin may need the matching bundle stack. Do not insert duplicate providers merely because a required row is not visible in the plugin patch itself.

## Install the package

Confirm `pnpm` is on `PATH`; `dsh plugin` forwards package-manager operations to it and fails before installation when it is unavailable. Place `--profile` before every forwarded pnpm argument:

```sh
pnpm pack
dsh plugin --profile <profile> add ./<package>-<version>.tgz
```

Install through DSH's profile package manager rather than editing the profile manifest by hand. Do not use a repository-relative `link:` or `file:` spec; the package must first prove that its own artifact is complete. Before installation, enumerate every required peer in the package manifest and verify that the target profile already provides each one; install provider bundles or packages first rather than copying host peers into the consumer.

A successful package-manager command should add a manifest-declared bundle to `dsh.profile.bundles`. A dependency without `dsh.bundle.patch` remains installed but inactive as a bundle; treat the warning as a manifest defect when activation was intended.

With HMR enabled, installing a package that is already installed is refused with `already-installed`. Remove the existing bundle first, then install the replacement:

```sh
dsh plugin --profile <profile> remove <package>
dsh plugin --profile <profile> add <new-spec>
```

## Inspect the effective composition

Use config dumps before starting a long-lived application:

```sh
dsh --profile <profile> --dump-default-config
dsh --profile <profile> --dump-config
```

Confirm the expected bundle source comment, inserted rows, overridden full configuration, ordering, and absence of unmatched-target warnings. Confirm the compatibility decision was accepted, and that a bundle skipped for an incompatible or unreadable manifest is reported in the launcher's skipped-bundle output. Inspect the profile `package.json` only as supporting evidence; the effective dump owns the assembled result.

## Prove activation and display

Boot through the actual intended runner or application entry. Observe an effect specific to plugin activation, not only package resolution or a generic log from another row. For a long-lived TUI/Web process, use a managed background task or the environment's designated terminal/tmux workflow, collect its output, and dispose it cleanly after the smoke.

Verify the plugin's display title, description, and icon in Plugin Manager and Settings, in English and the user's locale when supplied. Installation and row presence alone do not prove rendered metadata.

Composition proves that the layer resolves, mounts, and disposes. Behavioral correctness belongs to `dsh-plugin-test` at `.agents/skills/dsh-plugin-test/SKILL.md`, including real-composition assertions for product-visible plugins.

## Composition exit condition

Return the profile name and isolated home, install spec, bundle order, expected effective rows, compatibility result, display verification, warnings, activation observation, cleanup status, and exact commands run. Do not report successful composition when only `pnpm add` passed, when an override target was absent, when the compatibility check was bypassed, or when the plugin never reached its real entry path.
