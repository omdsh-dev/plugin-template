# DeepSeek Harness Plugin Template

English | [中文](README.zh.md)

A self-contained standalone repository template for an ESM Cordis plugin targeting DeepSeek Harness 0.2.1-rc.2. Every source file, compiler setting, test fixture, contributor instruction, skill, and build helper used by the repository lives below this root. A DSH host is a runtime consumer of the finished package, not a development input.

## Documentation map

| Need | Read |
| --- | --- |
| Contract rules: plugin forms, manifest, dependencies, display, lifecycle, composition, client, distribution | [docs/dsh-plugin-contracts.md](docs/dsh-plugin-contracts.md) |
| End-to-end workflow and stage routing | [.agents/skills/dsh-plugin-development/SKILL.md](.agents/skills/dsh-plugin-development/SKILL.md) |
| Source, test, and patch layout | [src/LAYOUT.md](src/LAYOUT.md), [tests/LAYOUT.md](tests/LAYOUT.md), [patches/LAYOUT.md](patches/LAYOUT.md) |
| Commands, CI, and release flow | this README and [.github/workflows](.github/workflows) |

## Repository layout

```text
.
├── .agents/skills/               # Repository-local plugin development workflow
│   ├── dsh-plugin-development/   # End-to-end coordinator
│   └── dsh-plugin-*/             # Stage skills
├── docs/
│   └── dsh-plugin-contracts.md   # Authoritative package and integration contract
├── patches/
│   └── LAYOUT.md                 # Dependency and DSH-host patch contract
├── scripts/
│   ├── extract-patch.mjs         # Host patch regeneration
│   └── patch.sh                  # Idempotent host patch application
├── src/
│   ├── assets/
│   │   ├── icon.svg              # Plugin icon exported through `./icon`
│   │   └── locale/
│   │       ├── en.json           # Display metadata
│   │       └── zh.json
│   ├── LAYOUT.md                 # Growth rules for source modules
│   ├── config.ts                 # Schemastery schema and defaults
│   ├── index.ts                  # Loader-facing function-plugin namespace
│   └── runtime.ts                # Host boundary and activation
├── tests/
│   ├── LAYOUT.md                 # Test conventions
│   ├── harness.ts                # Shared real-Cordis mount
│   ├── plugin.test.ts            # Loader and activation tests
│   └── snapshots/
│       └── LAYOUT.md             # Optional visible-output fixtures
├── .oxlintrc.json                # Type-aware Oxlint configuration
├── AGENTS.md                     # Contributor standing orders and navigation
├── cordis.patch.yml              # Profile bundle contribution
├── package.json                  # Exports, peers, engines, bundle metadata
├── pnpm-lock.yaml                # Reproducible dependency graph
├── pnpm-workspace.yaml           # Package-manager policy
├── tsconfig.json                 # Compiler and type-aware lint project
├── tsdown.config.ts              # Source-to-runtime/declaration build
└── vitest.config.ts              # Test runner configuration
```

## Package contract

[docs/dsh-plugin-contracts.md](docs/dsh-plugin-contracts.md) owns the full contract. The orientation points are:

- A function plugin exports `name`, `inject`, `Config`, and `apply` as one ESM namespace and has no default export.
- `engines.node` is `>=24.0.0`; `engines.dsh` declares the supported DSH range; `dsh.manifestVersion` and `dsh.bundle.patch` describe the public bundle layer.
- Display metadata reaches Plugin Manager through the exported `./locale/*.json` and `./icon` resources. This template stores their physical files under `src/assets/` and lists them in `files`.
- `@deepseek-ai/cordis` and `@deepseek-ai/schemastery` are host-supplied peers, duplicated in `devDependencies` for local checks. See [dependencies](docs/dsh-plugin-contracts.md#dependencies).
- A browser face declares `dsh.client` and exports its built bundle at `./client`.

## Create your plugin

1. Replace package identity in `package.json`, the Loader owner, configuration/runtime owners, focused tests, bundle metadata, TypeScript metadata, both READMEs, `AGENTS.md`, and `src/assets/`.
2. Choose the exact npm package name. It may be scoped or unscoped; do not assume the template's `@your-scope/dsh-` prefix. Replace it only in identity owners, never globally inside `.agents/skills/`.
3. Set `engines.dsh` to the range you support. Keep `engines.node` at Node 24 LTS or newer unless a different host contract is deliberate.
4. Update `keywords`, `LICENSE`, `cordis.patch.yml`, and the display title, description, and icon.
5. Add only the DSH host services the implementation uses. Apply [dependencies](docs/dsh-plugin-contracts.md#dependencies) when placing each package.
6. Implement activation and host-boundary behavior in the runtime/service owners, keeping registrations fiber-owned and disposing them in tests.
7. Keep every source, compiler, documentation, and project-reference path inside this repository. Do not add `link:` or `file:` dependencies.
8. Set `private` to `false` only when the package's public dependencies and distribution artifacts are ready.

Do not add a default export to a function plugin. Cordis Loader unwraps `exports.default ?? exports`; a stray default export discards `inject`, `Config`, and `apply`.

## Bundled development skills

Start with [`dsh-plugin-development`](.agents/skills/dsh-plugin-development/SKILL.md) for the complete sequence, or invoke one stage directly:

| Skill | Purpose |
| --- | --- |
| [plan](.agents/skills/dsh-plugin-plan/SKILL.md) | Decide form, dependencies, configuration, compatibility, display, composition, evidence, and distribution. |
| [scaffold](.agents/skills/dsh-plugin-scaffold/SKILL.md) | Instantiate and baseline-verify a new repository from this template. |
| [align](.agents/skills/dsh-plugin-align/SKILL.md) | Migrate an existing repository to this toolchain without changing behavior. |
| [implement](.agents/skills/dsh-plugin-implement/SKILL.md) | Implement lifecycle-safe behavior, configuration, metadata, docs, and tests. |
| [client](.agents/skills/dsh-plugin-client/SKILL.md) | Add a `dsh.client` browser face, slots, settings forms, and ModuleLoader checks. |
| [i18n](.agents/skills/dsh-plugin-i18n/SKILL.md) | Localize browser UI with typed dictionaries and disposal evidence. |
| [compose](.agents/skills/dsh-plugin-compose/SKILL.md) | Install the bundle into a profile and prove activation and compatibility. |
| [test](.agents/skills/dsh-plugin-test/SKILL.md) | Select the smallest evidence for Loader, behavior, disposal, composition, and artifacts. |
| [release](.agents/skills/dsh-plugin-release/SKILL.md) | Check packed, Git, or npm release readiness without publishing. |

Keep these directories when copying the template.

## Independent development

Run from this repository root:

```sh
pnpm install
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

`lint` is the type-aware static-analysis gate. `test` uses the Vitest `forks` pool; a restricted host that rejects child-process forks can run `vitest run --pool=threads` locally. `build` emits the ready-to-pack `lib/` runtime and declarations without an install-time build.

## CI

- [ci.yml](.github/workflows/ci.yml): frozen install, lint, tests, and build on pushes to `main` and pull requests.
- [release.yml](.github/workflows/release.yml): the same checks, then packs the tarball and publishes it to the version's GitHub Release.

## Profile activation

Install through the plugin channel:

```sh
dsh plugin --profile <profile> add <package-or-tarball>
```

Profile startup checks `engines.dsh`, applies `dsh.bundle.patch` in bundle order, and reads display metadata without activating the plugin. See [manifest and compatibility](docs/dsh-plugin-contracts.md#manifest-and-compatibility) and [bundle composition](docs/dsh-plugin-contracts.md#bundle-composition).

## Plugin forms

```ts
export const name = 'plugin-template'
export const inject: string[] = []
export { Config } from './config.ts'
export { apply } from './runtime.ts'

// src/config.ts
import Schema from '@deepseek-ai/schemastery'
export interface PluginConfig { /* serializable fields */ }
export const Config: Schema<PluginConfig> = Schema.object({ /* validation and defaults */ })

// src/runtime.ts
export function apply(ctx: Context, config: PluginConfig): void { /* effects */ }
```

`Config` is the schema value Cordis Loader validates; `PluginConfig` is the public TypeScript shape. Keeping the names distinct avoids the declaration-merge false positive in `no-redeclare`. A service provider instead default-exports its `Service` subclass; do not mix the two forms.

## Distribution

Build before packing and inspect the archive:

```sh
pnpm run build
pnpm pack --dry-run --json
```

The archive must contain every file promised by `main`, `types`, `exports`, and `files`, plus the bundle patch and the physical display assets. See [build and distribution](docs/dsh-plugin-contracts.md#build-and-distribution). Git installs fetch sources; only add a self-contained `prepare` build when you deliberately distribute that way and document the consumer's build-script approval.

## Testing

The baseline tests prove Loader-safe ESM exports and schema-resolved activation. Replace the activation assertions with observable behavior and disposal assertions for every registry contribution. Product-visible plugins also need a real Loader/profile composition test in the consuming DSH application; see [tests/LAYOUT.md](tests/LAYOUT.md) and [evidence](docs/dsh-plugin-contracts.md#evidence).
