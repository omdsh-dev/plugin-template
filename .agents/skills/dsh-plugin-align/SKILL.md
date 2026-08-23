---
name: dsh-plugin-align
description: Use when an existing non-template DeepSeek Harness or Cordis plugin must be migrated to this template's repository-local package, TypeScript, Oxlint, Vitest, tsdown, pnpm, and release toolchain without replacing its product behavior. Do not use for a new empty repository, host-source changes, or a product refactor.
---

# Align an Existing Plugin with the Template Toolchain

This skill is an audit-and-migration procedure for a non-empty plugin repository
that was not created from this template. It aligns repository mechanics with the
current template contract while preserving the existing plugin's product
behavior, public identity, host integration, and deliberate source layout.

It is not a scaffold command and it is not a blind file copy. Never replace a
non-empty repository with the sample skeleton. Never copy `node_modules/`,
`lib/`, package-manager stores, or product-specific template files into the
existing project.

## Operating boundary

Run this skill from the target repository root. The target repository must carry
the contract files needed to make the migration reproducible:

- `AGENTS.md`
- `README.md`
- `docs/dsh-plugin-contracts.md`
- `.agents/skills/`
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `.oxlintrc.json`

If the target does not have a reviewed template contract, copy the portable
contract and skill files into the target first or stop and ask for an approved
migration source. Do not read a sibling checkout, parent directory, absolute
path, or external source file as an implicit build or documentation input.

All commands below run from the target repository root. Replace no product
identity until the audit has recorded the existing package name, plugin id,
public exports, consumers, and distribution assumptions.

## Hard safety rules

1. Confirm the repository root and current branch before editing:

   ```sh
   git rev-parse --show-toplevel
   git branch --show-current
   git status --short --branch
   ```

2. Do not discard a dirty worktree, reset a branch, overwrite an existing file,
   rewrite history, create a remote, push, publish, or tag without direct user
   authority. If unrelated changes are present, isolate the migration in a
   branch or ask for a clean checkpoint.
3. Preserve product source and behavior. Toolchain alignment may move compiler
   ownership or adapt exports, but it must not silently change runtime policy,
   event semantics, host patch targets, public defaults, or user-visible output.
4. Never commit a real `node_modules/` tree. A fake host target used by a test
   belongs under a neutral package-shaped fixture directory with its own nearest
   `package.json`, not under a tracked `node_modules/` directory.
5. Never add `link:` or `file:` dependencies, parent-directory project
   references, absolute paths, or install-time `prepare` workarounds.
6. Keep host-provided runtime APIs in `peerDependencies` and provide reachable
   registry development dependencies for local typechecking and tests. Do not
   rename a real DSH-scoped package to a generic template placeholder merely to
   match the sample manifest.

## Phase 1: Inventory before editing

Read the target's `AGENTS.md`, `README.md`,
`docs/dsh-plugin-contracts.md`, and the current package/toolchain files. Record
an alignment inventory before changing anything:

| Area | Record |
|---|---|
| Identity | package name, version, plugin id, exports, private/public state |
| Plugin form | named function plugin or default-exported service |
| Runtime owners | Loader metadata, config/schema, runtime, browser face, invariant |
| Services | required/optional peers, `inject`, provider and install order |
| Composition | `dsh.bundle.patch`, row ids, config, host/profile assumptions |
| Toolchain | package manager, Node, TypeScript, Oxlint, Vitest, tsdown versions |
| Artifacts | `main`, `types`, `exports`, `files`, generated output directory |
| Tests | test glob, environment, pool, Loader/disposal/composition evidence |
| Distribution | local, Git, npm, private/public, pack and release requirements |
| Baseline | commands run, exact failures, generated files, dirty files |

Inspect the existing layout rather than assuming it is the sample layout. A
package may be host-only, client-only, split across faces, or have
capability-named modules. Record deliberate replacements for `src/index.ts`,
`src/config.ts`, `src/runtime.ts`, `src/invariant.ts`, `tests/harness.ts`, or
`tests/plugin.spec.ts` instead of creating duplicate owners.

## Phase 2: Align the repository mechanics

Use the current template `package.json`, `pnpm-workspace.yaml`,
`.oxlintrc.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`, and
`.gitignore` as the local contract. Preserve the target's legitimate product
fields and adapt only what the audit justifies.

### Package manifest

Align the following mechanics with the current template:

- `type: "module"`;
- `packageManager: "pnpm@11.7.0"`;
- the template's supported Node engine;
- scripts for `build`, `lint`, and `test` using the repository's configured
  entry points;
- no `prepare` or install-time build hook;
- `main`, `types`, `exports`, and `files` that agree with the actual build;
- `dsh.bundle.patch` when the package contributes a profile composition;
- `private` and publishing metadata matching the recorded distribution decision.

The current template does not require `typecheck` or an aggregate `check`
script. Do not add either merely because an older repository had one. Run
additional direct compiler commands while migrating only when they diagnose a
real issue, and do not advertise them as template scripts unless the current
contract changes.

For each runtime import, classify the manifest entry:

- consumer-supplied host API: required or optional peer, plus a registry dev
  dependency when source, lint, or tests import it;
- plugin-owned runtime library: `dependencies`;
- test/build-only tool: `devDependencies`;
- provider package: a deliberate package/profile input, never a hidden bundled
  copy.

Keep the target's actual package scope and host package names. The template's
`cordis`, `schemastery`, and loader names are examples for this repository; a
DSH package using `@deepseek-ai/*` names must keep the names required by its
installed host contract.

### pnpm and lockfile

The workspace file should keep the package self-contained:

```yaml
packages:
  - .

autoInstallPeers: false
```

Retain the current build approval policy when the package uses native tooling.
After identity and dependency edits, refresh `pnpm-lock.yaml` from the target
root and verify that every declared dependency has a lockfile entry. Do not
hand-edit the lockfile or retain competing npm/yarn lockfiles without a
recorded repository policy.

### Generated artifacts

The template builds directly from `src/` into `lib/`. Keep generated output
out of version control:

```gitignore
lib/
node_modules/
*.tsbuildinfo
*.tgz
coverage/
.pnpm-store/
```

If `lib/` is already tracked, first verify that the local build can recreate it,
then remove it from the Git index without deleting the local files:

```sh
git rm -r --cached lib
```

The package's `files` list may still include `lib`; Git ignore rules do not
prevent `pnpm pack` from including explicitly selected build artifacts.

### TypeScript, Oxlint, Vitest, and tsdown

Align toolchain owners rather than scattering flags through scripts:

- TypeScript uses the template's strict ESM/bundler settings, declaration and
  source-map settings, `rewriteRelativeImportExtensions`, exact optional
  properties, no-unused checks, and repository-local `include` paths;
- `.oxlintrc.json` enables type-aware analysis for `src/**/*.ts` and
  `tests/**/*.ts`, denies warnings, and does not hide errors with broad ignores;
- Vitest runs repository-local tests in the Node environment with the template's
  configured pool; keep existing `.test.ts` or `.spec.ts` names by adapting the
  `include` glob instead of renaming product tests without need;
- tsdown owns runtime and declaration output directly from the actual source
  entry points, emits ESM to `lib/`, and cleans generated output before build;
- compiler, linter, test, and bundle config paths resolve below the target root.

Do not make a type error disappear by weakening `strict`, adding `any`,
excluding the affected source, or suppressing the rule globally. Fix the
migration boundary or add a narrow, documented exception for an existing
third-party contract.

## Phase 3: Align plugin boundaries without refactoring behavior

### Loader namespace

For a function plugin, retain one named ESM namespace with:

```ts
export const name
export const inject
export const Config
export const apply
```

There must be no default export. Keep Loader metadata in the package's actual
Loader owner; use `src/index.ts` when it fits the template and document a
  deliberate replacement when the package has separate host/browser entries.
Required services belong in `inject`; optional services must tolerate absence or
use the documented scoped lookup.

For a service plugin, retain the service class's default export and do not mix
function-plugin metadata into that entry. Do not convert plugin form just to
match the sample.

### Configuration and lifecycle

Keep serializable schema/default ownership in the actual configuration owner,
and keep host activation in the actual runtime owner. Preserve the existing
public configuration semantics unless the audit identifies a real schema/runtime
mismatch; toolchain alignment alone is not permission to change business
fields, defaults, or rejection behavior.

Every registration, listener, timer, watcher, child process, callback, and
async operation must be owned by the plugin fiber. Preserve or add disposal
assertions. Do not add a second registry, global singleton, manual lifecycle
workaround, or inert fallback for a missing required host service.

An invariant companion is semantic, not a toolchain marker. Keep a real
package-owned invariant when one exists; if the package owns no authoritative
relationship, do not invent an invariant merely because the sample has one.
Document the deliberate empty decision in the package's contract when required.

### Bundle and host composition

Keep profile composition in `cordis.patch.yml` and package metadata. It may
insert/override plugin rows and serializable configuration, but it must not
modify DSH host source, TypeScript projects, catalogs, launchers, or build
configuration. Preserve complete override config when an id-targeted row
replaces a value. Review package names, row ids, required services, and provider
installation order together.

## Phase 4: Migrate tests and documentation

Update tests only where the toolchain boundary requires it, then add the
smallest missing evidence:

1. real Loader unwrap test for every function plugin;
2. schema/default and rejection tests at the real configuration boundary;
3. observable behavior tests rather than private-field snapshots;
4. registration and fiber-disposal tests;
5. invariant tests only for a non-empty semantic installer;
6. real composition tests for product-visible profile behavior;
7. built entry and pack checks for public distribution.

Keep fixtures under `tests/` and keep fake package fixtures in neutral
package-shaped directories with a local `package.json`. Do not put fixtures in
tracked `node_modules/`.

Update `README.md`, `AGENTS.md`, package comments, and `cordis.patch.yml` in the
same change when the migration changes a documented owner, command, export, or
composition behavior. Do not copy generic template identity into product
source, and do not globally replace markers inside `.agents/skills/`.

Search identity owners for unresolved template markers after migration:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors' \
  --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=.agents \
  package.json src tests scripts cordis.patch.yml README.md AGENTS.md tsconfig*.json
```

Review every match. Generic examples inside `.agents/skills/` are reusable and
must not be rewritten as product identity.

## Verification sequence

Run each command from the target root. Use the package's actual scripts; do not
claim a separate typecheck or aggregate check that the template manifest does
not expose.

```sh
pnpm install
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
git diff --check
git status --short --branch
```

When the agent shell exports a harness tsconfig pin, clear it per command for
Tsx-driven tests or fixtures:

```sh
TSX_TSCONFIG_PATH= pnpm test
```

Inspect pack output for every file named by `main`, `types`, `exports`, and
`files`. After build, import each public `lib/` entry under plain Node when the
package exposes runtime entries. A passing unit test does not prove a profile
composition; run the real consumer/profile test when the behavior is
product-visible.

## Exit report

Alignment is complete only when all of these are true:

- the target identity and deliberate source owners are recorded;
- package, peer, dev, lockfile, workspace, compiler, linter, test, and build
  mechanics agree with the current template contract;
- no `link:`, `file:`, parent path, absolute source input, tracked
  `node_modules/`, or tracked generated `lib/` remains;
- Loader exports, configuration, lifecycle disposal, bundle rows, and invariant
  decisions preserve the target's actual behavior;
- placeholders are gone from identity owners;
- lint, tests, build, pack, and diff checks have exact recorded results.

Return a concise handoff:

```text
mode: existing-repository-alignment
target:
packageName:
pluginId:
pluginForm:
sourceOwners:
toolchainChanges:
manifestChanges:
composition:
invariant:
behaviorPreserved:
commands:
remainingGaps:
gitState:
```

Do not commit, push, publish, or rewrite history as part of alignment unless the
user explicitly requests that separate action.
