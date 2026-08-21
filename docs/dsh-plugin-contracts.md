# Standalone DSH Plugin Contracts

This reference is shipped with the template so planning, implementation, testing, and distribution use only guidance stored below the repository root.

## Repository boundary

All source, TypeScript configuration, test fixtures, skill instructions, and contributor guidance used by this template live below the repository root. Describe repository files with project-root paths such as `docs/dsh-plugin-contracts.md`; parent-directory navigation is not valid documentation. Paths that leave the repository are not valid template inputs. Ordinary npm dependencies are allowed; a dependency is not a source or configuration file reference.

A DSH host is a runtime consumer of the finished package, not a development input. The host supplies Cordis services and applies the package's bundle patch when the package is installed into a profile.

## Plugin forms

A function plugin exports `name`, `inject`, `Config`, and `apply` as one ESM namespace and has no default export. A service plugin default-exports its service class and follows the host service lifecycle. Do not combine the two loader forms.

Required Cordis services belong in `inject`. Optional services are read through named lookup and must tolerate absence or attach and detach through a scoped injection. Configuration is a serializable Schemastery schema; deployment-varying choices are fields, not hidden constants.

## Scalable repository structure

The package may be host-only, client-only, or split across host and browser faces. Keep Loader metadata, configuration, runtime/service boundaries, browser behavior, shared contracts, tests, snapshots, and optional patch files in explicit owners appropriate to the package; do not force a fixed directory layout onto every plugin.

The sample skeleton separates `src/index.ts`, `src/config.ts`, `src/runtime.ts`, and `src/invariant.ts`, with `tests/plugin.spec.ts` and `tests/harness.ts`. Larger packages may replace or extend those owners with capability-named modules, focused test directories, and a package-specific snapshot owner when the planned behavior warrants it. `patches/` remains optional and carries only documented dependency or DSH-host corrections. A host change that cannot be provided through official plugin registration must use that controlled host-patch process and remain outside the published package. `cordis.patch.yml` is not a host source patch.

## Lifecycle ownership

Every listener, registry entry, timer, watcher, child process, and callback registered by a plugin belongs to its Cordis fiber. Use effects or returned disposers and test removal after fiber disposal. Publish state and emit events only after the owning operation succeeds. A waterfall listener delegates by calling `next()`.

## Invariant companion

Every package may expose `./invariant` as a separate function plugin. Its installer checks an authoritative event or data relationship owned by the package. An empty installer is valid only when the package owns no observable relationship; explain that reason in the source. The companion can use the host's `invariants` service through the narrow local interface in `src/invariant.ts`.

## Bundle composition

`package.json` declares the bundle patch with `dsh.bundle.patch`. `cordis.patch.yml` inserts or overrides plugin rows; it does not change source files, compiler settings, catalogs, or launcher code. An id-targeted override replaces the complete `config`, so retained fields must be restated. The package row name must resolve through the consuming DSH profile.

## Evidence

The minimum package evidence includes a real Loader export-shape test, schema/default behavior, observable plugin behavior, and disposal. Product-visible behavior additionally needs a real assembled composition test and a focused keyless snapshot when output is stable and user-visible. Typechecking, tests, and a development build are separate checks.

## Build and distribution

The development and release build is:

```sh
pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

The template's `verify-self-contained` gate currently enforces the sample layout and manifest faces. If a plugin deliberately replaces those owners or artifact faces, update that gate and this documentation together. The release build produces a ready-made artifact; `pnpm pack --dry-run --json` inspects the complete file list. It emits every runtime and declaration file promised by `main`, `types`, `exports`, and `files` using only this repository's installed dependencies. Profile/plugin installation consumes that packed artifact and does not run an install-time `prepare` hook. A package is ready for packed or GitHub Release distribution only when every manifest-declared runtime and type entry exists after the build.
