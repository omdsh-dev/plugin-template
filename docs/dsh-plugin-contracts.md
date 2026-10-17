# Standalone DSH Plugin Contracts

This reference ships with the template so planning, implementation, testing, and distribution use only guidance stored below the repository root. It targets the DeepSeek Harness 0.2.1-rc.2 plugin contract.

## Repository boundary

All source, TypeScript configuration, test fixtures, skill instructions, and contributor guidance used by this template live below the repository root. Describe repository files with project-root paths such as `docs/dsh-plugin-contracts.md`; parent-directory navigation is not valid documentation. Paths that leave the repository are not valid template inputs. Ordinary npm dependencies are allowed; a dependency is not a source or configuration file reference.

A DSH host is a runtime consumer of the finished package, not a development input. The host supplies Cordis services and applies the package's bundle patch when the package is installed into a profile.

## Plugin forms

A function plugin exports `name`, `inject`, `Config`, and `apply` as one ESM namespace and has no default export. A service plugin default-exports its service class and follows the host service lifecycle. Do not combine the two loader forms.

Required Cordis services belong in `inject`. Optional services are read through `ctx.get(name)` and must tolerate absence or attach and detach through a scoped injection. Configuration is a serializable Schemastery schema from `@deepseek-ai/schemastery`; deployment-varying choices are fields, not hidden constants. The schema value is named `Config`; the public shape type is `PluginConfig`, keeping the value and type declarations distinct.

Package identity is explicit: an npm package name may be scoped or unscoped, and the template does not require an `@scope/dsh-` prefix. Keep the selected package name exact in `package.json`, bundle rows, exports, tests, display metadata, and documentation; the package name and Cordis plugin ID remain separate concepts.

## Manifest and compatibility

The public manifest fields this template uses are:

- `engines.node`: supported Node.js versions.
- `engines.dsh`: supported DSH versions as a SemVer range, including prerelease versions. When present it decides compatibility alone and `peerDependencies` on `@deepseek-ai/dsh` or `@deepseek-ai/dsh-*` are ignored.
- `dsh.manifestVersion`: the public manifest format, currently `1`.
- `dsh.bundle.patch`: one patch file path or an ordered list applied as one bundle layer.
- `dsh.client`: browser module declaration with `platform: 'web'`, optional `inject` package-name edges, optional `immediately`, and optional `external` exact module requests.

Installation and profile startup evaluate the requirement before importing the plugin. A mismatch is refused unless the profile stores an exact-version exemption for that package version and runtime version. Prereleases participate in range matching, so use an explicit prerelease range such as `>=0.2.1-rc.2 <0.3.0` when the package targets this release line.

## Dependencies

Classify every package by who supplies it:

- **Peer dependency:** a host-supplied runtime API. Cordis, Schemastery, and any consumed `@deepseek-ai/dsh-*` package belong here; add the same package to `devDependencies` when source, lint, tests, or the build import it locally.
- **Dependency:** a library the plugin owns and ships with.
- **Development dependency:** tooling used only for lint, tests, or builds.

This template uses `@deepseek-ai/cordis` and `@deepseek-ai/schemastery` as peers and development dependencies, and `@deepseek-ai/cordis-plugin-loader` as a development dependency. Keep every consumed `@deepseek-ai/dsh-*` service as a peer with a reachable development copy. Do not use unscoped `cordis`, `schemastery`, or `@cordisjs/plugin-loader` in a 0.2.1 plugin. Do not use `link:` or `file:` specs, and do not bundle a host runtime.

## Display metadata and icon

Plugin Manager and Settings read display metadata without activating the package:

- `./locale/en.json` is the discovery subpath and owns `meta.title` and `meta.description`; other language files use the same fields. The physical files may live elsewhere (this template maps the subpaths to `src/assets/locale/`), but every locale file must share the directory of the resolved English file.
- Export `./locale/*.json` and list the physical files in `files`.
- Set a top-level `icon` in `package.json` or export `./icon`. The image may live at any contained path (this template uses `src/assets/icon.svg`), must be SVG, PNG, JPEG, or WebP, at most 256 KiB, contained in the package after realpath resolution, and must not be an absolute path, URL, or escaping symlink.
- Missing locale fields fall back to `package.json` name and description; missing images use the panel default artwork.
- A subpath plugin is not a package and never reads `package.json`; it exports `<subpath>/locale/*.json` and `<subpath>/icon`.

Malformed metadata produces a diagnostic while retaining valid text. Installation and slot registration alone do not prove the rendered result; verify the intended title, description, and icon in the consuming profile.

## Scalable repository structure

The package may be host-only, client-only, or split across host and browser faces. Keep Loader metadata, configuration, runtime/service boundaries, browser behavior, shared contracts, tests, snapshots, and optional patch files in explicit owners appropriate to the package; do not force a fixed directory layout onto every plugin.

The sample skeleton separates `src/index.ts`, `src/config.ts`, and `src/runtime.ts`, with `tests/plugin.test.ts` and `tests/harness.ts`. Larger packages may replace or extend those owners with capability-named modules, focused test directories, and a package-specific snapshot owner when the planned behavior warrants it. `patches/` remains optional and carries only documented dependency or DSH-host corrections. A host change that cannot be provided through official plugin registration must use that controlled host-patch process and remain outside the published package. `cordis.patch.yml` is not a host source patch.

## Lifecycle ownership

Every listener, registry entry, timer, watcher, child process, and callback registered by a plugin belongs to its Cordis fiber. Use `ctx.effect()`, `ctx.on()`, or the registry's returned disposer and test removal after fiber disposal. Publish state and emit events only after the owning operation succeeds. A waterfall listener delegates by calling `next()`.

## Bundle composition

`package.json` declares the bundle patch with `dsh.bundle.patch`. The value may be one path or an ordered list; each path is relative to the package root, and the launcher applies the list in order as one bundle layer. `cordis.patch.yml` inserts or overrides plugin rows; it does not change source files, compiler settings, catalogs, or launcher code. An id-targeted override replaces the complete `config`, so retained fields must be restated. The package row name must resolve through the consuming DSH profile.

Rows in a bundle patch use `insert` or id-targeted overrides. Layers apply in `dsh.profile.bundles` order; profile, home, command-line, and launcher patches may override them later. An id-targeted override replaces the row's complete `config` value, so retained fields must be restated. A patch targeting an absent id warns on stderr; inspect the effective tree and treat the warning as failed composition unless absence is intentional. The Loader dialect supports `!!js` expressions only in plugin `config`; metadata such as `id`, `name`, and `disabled` stays literal. Keep credentials out of patches; use credential references or environment-variable names. An empty or comments-only patch parses to no list and is invalid; use `[]` for an intentionally empty layer.

## Version compatibility and exemptions

A plugin or bundle whose requirement does not match the running DSH is refused at installation and skipped or denied at profile startup. The refusal names the requirement key (`engines.dsh` or a DSH peer package) and the unmet range. Users can grant an exact `package-name@version` to exact runtime-version exemption through `dsh plugin allow-version`, `dsh plugin revoke-version`, or the plugin manager; the grant is stored in the profile's `compatibility.json`. An exemption never authorizes package build scripts.

## Browser client contract

A browser-facing package declares `dsh.client` and exports its built bundle at `./client`. The host scans live Loader entries, composes the Web boot graph, and serves each bundle; executing a bundle only registers a lazy factory whose ID equals the package name. Keep factories side-effect free, register resources inside `apply` with `ctx.effect`/`ctx.on`, and externalize only modules the host supplies through the module table. Declare non-baseline runtime requests in `dsh.client.external`. A source `import()` split by the client build becomes `require.async(...)` and loads its package-local chunk lazily.

Client UI copy belongs to typed locale dictionaries registered through `ctx.locale.register()` and the framework translation seat; plugin display metadata in the exported `./locale/*.json` resources (here `src/assets/locale/*.json`) is a separate host-facing channel. Route settings through the current `ctx.configForms` API after inspecting the installed settings contract; do not assume a removed settings-scope service.

## Evidence

The minimum package evidence includes a real Loader export-shape test, schema/default behavior, observable plugin behavior, and disposal. Product-visible behavior additionally needs a real assembled composition test in the consuming DSH application and a focused keyless snapshot when output is stable and user-visible. Type-aware static analysis, tests, and a development build are separate checks.

## Build and distribution

The development and release build is:

```sh
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

The Oxlint configuration is the repository's static-analysis gate. It performs type-aware analysis and denies warnings. The release build produces a ready-made artifact; `pnpm pack --dry-run --json` inspects the complete file list. It emits every runtime and declaration file promised by `main`, `types`, `exports`, and `files` using only this repository's installed dependencies. Profile/plugin installation consumes that packed artifact and does not run an install-time `prepare` hook. A package is ready for packed or GitHub Release distribution only when every manifest-declared runtime and type entry exists after the build.

Git installs fetch sources instead of built artifacts. Only choose that channel with a self-contained `prepare` build and the consumer's explicit package-manager build-script approval; npm and tarball installs consume prebuilt output without lifecycle build permission.
