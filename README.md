# DeepSeek Harness Plugin Template

English | [中文](README.zh.md)

A self-contained standalone repository template for an ESM Cordis plugin. Every source file, compiler setting, test fixture, contributor instruction, skill, and build helper used by the repository is inside this directory; every development input resolves below this repository root.

Normal npm dependencies are resolved from the package registry. A DSH host is a runtime consumer of the finished package, not a source or build input.

## Repository layout

```text
.
├── .oxlintrc.json                 # Type-aware Oxlint configuration
├── .agents/skills/               # Repository-local plugin development workflow
│   ├── dsh-plugin-development/   # End-to-end coordinator
│   └── dsh-plugin-*/             # Plan, scaffold, implement, compose, test, release
├── docs/
│   └── dsh-plugin-contracts.md   # Shared local contract for all plugin skills
├── patches/
│   └── README.md                 # Dependency and DSH-host patch contract
├── scripts/
│   ├── extract-patch.mjs         # Config-driven host patch regeneration (see patches/README.md)
│   └── patch.sh                  # Idempotent host patch application
├── src/
│   ├── README.md                 # Growth rules for services and feature modules
│   ├── config.ts                 # Serializable schema and resolved defaults
│   ├── index.ts                  # Loader-facing function-plugin namespace
│   ├── invariant.ts              # Package-owned invariant companion
│   └── runtime.ts                # Fakeable host boundary and Cordis activation
├── tests/
│   ├── README.md                 # Harness, feature-test, and snapshot conventions
│   ├── harness.ts                # Shared real-Cordis test mount
│   ├── plugin.spec.ts            # Loader export and activation tests
│   └── snapshots/
│       └── README.md             # Optional product-visible fixture contract
├── .gitignore                    # Generated artifact exclusions
├── AGENTS.md                     # Repository-local contributor rules
├── LICENSE                       # Template license
├── README.md                     # Repository and usage contract
├── cordis.patch.yml              # Profile bundle contribution
├── package.json                  # Exports, peers, dsh.bundle.patch
├── pnpm-lock.yaml                # Reproducible registry dependency graph
├── pnpm-workspace.yaml           # Package-manager and optional patch policy
├── tsconfig.json                 # Compiler and type-aware lint project
├── tsdown.config.ts              # Direct source-to-runtime/declaration build
└── vitest.config.ts              # Test runner configuration
```

## Scalable source and test structure

A package may be host-only, client-only, or split across host and browser faces. Keep Loader metadata, configuration, runtime/service boundaries, browser behavior, shared contracts, and tests in the owners appropriate to the package; the template does not require every plugin to copy one fixed directory layout.

The template's sample skeleton still uses `src/index.ts`, `src/config.ts`, `src/runtime.ts`, `src/invariant.ts`, `tests/harness.ts`, and `tests/plugin.spec.ts`; retain those owners when they fit the package, and document any deliberate replacement. Stable product-visible expected output belongs under the package's actual snapshot owner. Dependency and DSH-host patches use the optional `patches/` contract when needed.

## Create your plugin

1. Replace package identity in `package.json`, the Loader owner, configuration/runtime/invariant owners, focused test owners, bundle metadata, TypeScript metadata, `README.md`, and `AGENTS.md` as applicable. The sample skeleton names these owners explicitly; a deliberate replacement must update the package's local documentation and static-analysis configuration too.
2. Replace the template package name `@your-scope/dsh-plugin-template` and plugin ids only in those identity owners. Do not perform a global replacement inside `.agents/skills/`; its generic examples and marker checks must remain reusable.
3. Update `description`, `LICENSE`, and `cordis.patch.yml`.
4. Add only the DSH host services used by the implementation to the package contract and composition patch. Keep source and build dependencies resolvable from this repository's `node_modules`; host-provided runtime APIs remain consumer-supplied peers.
5. Replace the empty invariant installer when the package owns an authoritative event or mutable data relationship.
6. Implement activation and host-boundary behavior in the actual runtime/service owners, moving cohesive capabilities into project-specific modules as needed. Keep `src/index.ts` limited to Loader metadata and public re-exports when that matches the package, and scope registrations through `ctx.effect()`, `ctx.on()`, or registry disposers.
7. Keep every source, compiler, documentation, and project-reference path inside this repository. Describe files from the project root, for example `docs/dsh-plugin-contracts.md`. Do not add local-path `link:` or `file:` dependencies.
8. Set `private` to `false` only when the package's public dependencies and distribution artifacts are ready.

Do not add a default export to a function plugin. Cordis Loader unwraps `exports.default ?? exports`; a stray default export discards namespace exports such as `inject`, `Config`, and `apply`.

## Bundled development skills

DSH discovers the repository-local workflow under `.agents/skills/`. Start with [`dsh-plugin-development`](.agents/skills/dsh-plugin-development/SKILL.md) for the complete sequence, or invoke one stage directly:

| Skill | Purpose |
|---|---|
| [`dsh-plugin-plan`](.agents/skills/dsh-plugin-plan/SKILL.md) | Decide plugin form, dependencies, configuration, invariant, composition, and evidence. |
| [`dsh-plugin-scaffold`](.agents/skills/dsh-plugin-scaffold/SKILL.md) | Instantiate and baseline-verify a new repository from this template. |
| [`dsh-plugin-align`](.agents/skills/dsh-plugin-align/SKILL.md) | Migrate an existing non-template repository to this toolchain without replacing product behavior. |
| [`dsh-plugin-implement`](.agents/skills/dsh-plugin-implement/SKILL.md) | Implement lifecycle-safe Cordis behavior, metadata, docs, and invariants. |
| [`dsh-plugin-i18n`](.agents/skills/dsh-plugin-i18n/SKILL.md) | Localize browser UI with typed dictionaries, locale seats, fallback, and disposal evidence. |
| [`dsh-plugin-compose`](.agents/skills/dsh-plugin-compose/SKILL.md) | Install the bundle into an isolated profile and prove effective activation. |
| [`dsh-plugin-test`](.agents/skills/dsh-plugin-test/SKILL.md) | Verify Loader exports, behavior, disposal, composition, snapshots, and artifacts. |
| [`dsh-plugin-release`](.agents/skills/dsh-plugin-release/SKILL.md) | Check local, Git, or npm distribution readiness without publishing implicitly. |

Keep these directories when copying the template so future sessions rooted in the plugin repository retain the same workflow.

## Independent development

Run every command from this directory:

```sh
pnpm install
pnpm run lint
pnpm test
pnpm run build
```

`lint` runs Oxlint with type-aware analysis and denies warnings for the configured source and test projects. `build` runs the configured source-to-artifact pipeline, including any declaration assembly or final artifact verifier owned by the package, and emits ready-to-pack output; it does not run an install-time lifecycle build.

The release artifact is built from the configured source owners before packing. Profile or consumer installation uses the ready-made `lib/` output and does not run `prepare`; `pnpm pack --dry-run --json` verifies the final archive contents.

## CI

Two GitHub Actions workflows ship with the template:

- `.github/workflows/ci.yml` — every push to `main` and every pull request: install with the frozen lockfile, Oxlint static analysis, tests, and build.
- `.github/workflows/release.yml` — every push to `main`: runs Oxlint, tests, builds, packs the ready-made tarball (`pnpm pack`), and follows the repository's configured GitHub Release policy.

## Profile activation

The package manifest declares the bundle patch:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

A DSH host may install this package into a profile and apply `cordis.patch.yml` over its own runtime composition. That host integration is intentionally outside this repository's build and test inputs. The patch composes plugins; it does not alter host source, compiler settings, build scripts, or catalogs.

The invariant companion uses a narrow local interface for the host's `invariants` service. This keeps the package build independent of the host's private source package while preserving the runtime registration used by a DSH profile.

## Plugin forms

This template demonstrates a function plugin and therefore named exports:

```ts
// src/index.ts
export const name = 'plugin-template'
export const inject: string[] = []
export { Config } from './config.ts'
export { apply } from './runtime.ts'

// src/config.ts
export interface Config { /* serializable fields */ }
export const Config: z<Config> = z.object({ /* validation and defaults */ })

// src/runtime.ts
export function apply(ctx: Context, config: Config): void { /* effects */ }
```

A service provider instead normally default-exports its `Service` subclass. Do not mix the two forms.

## Distribution checks

Before considering packed or GitHub Release distribution, build and inspect the final archive:

```sh
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

The final package must contain every runtime and declaration file named by `main`, `types`, `exports`, and `files`. Keep `private: true` until the package's DSH host peers are available through the selected distribution channel.

## Testing guidance

The included test proves Loader-safe ESM exports and schema-resolved activation. Replace the activation assertions with observable behavior and disposal assertions for every registry contribution. Product-visible plugins should add a real Loader/profile composition test in the consuming DSH application rather than relying only on hand-mounted unit tests.
