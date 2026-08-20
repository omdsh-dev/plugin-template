---
name: dsh-plugin-scaffold
description: Use after dsh-plugin-plan to create a new standalone DSH plugin repository from this self-contained template. Copy only source-controlled template files, replace package and Cordis identifiers, align registry dependencies and local TypeScript settings, generate the lockfile, and prove the unchanged skeleton before behavior is added.
---

# Scaffold a Plugin Repository

This skill creates a clean standalone repository from the project-root `README.md` contract. It is guidance, not a blind copy script: inspect the source and target first, preserve the template's direct source-to-artifact build, and stop rather than overwriting an existing non-empty directory.

## Required handoff

Require `target`, `packageName`, `pluginId`, description, plugin form, dependency matrix, target profile, invariant decision, distribution assumption, and the template source directory. Default the source to the active repository root only when its `package.json` and `README.md` match this template. If the target exists and is non-empty, ask whether this is an audit/merge task; never replace it as scaffolding.

Validate names before copying:

- npm package name follows the selected scope policy and contains no unresolved placeholder;
- Cordis plugin and row ids are stable lowercase kebab-case;
- the package name and plugin id are distinct concepts and need not be identical;
- the target is outside the template and DSH checkout.

## Copy the source skeleton

Copy source-controlled template files while excluding `.git/`, `node_modules/`, `lib/`, temporary files, and package-manager stores. Do not use an unguarded recursive delete. Preserve one build path:

- development/CI and release: `tsdown.config.ts` compiles the host entries directly from `src/`, while `tsc --noEmit` performs the source and test typechecks.

The build resolves only files and dependencies declared inside the repository; it does not use a repository-external project reference or install-time lifecycle build.

Preserve the scalable skeleton: `src/config.ts`, `src/runtime.ts`, `src/README.md`, `tests/harness.ts`, `tests/README.md`, `tests/snapshots/README.md`, and `patches/README.md`. These are the baseline separation and local contracts for feature modules, shared test composition, visible-output fixtures, and dependency or DSH-host patches; do not copy Turtle UI product-specific directories unless the planned plugin owns those capabilities.

Preserve the pinned Node, pnpm, Cordis, TypeScript, Vitest, and tsdown ranges from the current template unless an explicitly recorded host compatibility decision requires a coordinated update. Do not replace them with `latest`.

## Replace template identity

Update identity deliberately in these owners:

- `package.json`: `name`, `description`, optional repository metadata, exports/files, and `private` according to the distribution plan;
- `src/index.ts`: module name, exported `name`, and Loader-facing exports;
- `src/config.ts` and `src/runtime.ts`: module paths, configuration description, defaults, and placeholder behavior;
- `src/invariant.ts`: module path, exact `PACKAGE_NAME`, companion plugin name, and invariant explanation;
- `tests/plugin.spec.ts`: package description, expected plugin id, configuration assertions;
- `cordis.patch.yml`: package names, deployment-local row ids, and planned configuration;
- `tsconfig.json`, `tsconfig.vitest.json`, `tsdown.config.ts`, and `scripts/*.mjs`: local compiler, artifact, and boundary-verification topology;
- `README.md`, `AGENTS.md`, and `LICENSE`: package-specific contract and ownership rather than template instructions.

Search afterward for all template markers in identity owners, excluding this reusable skill suite:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors' \
  --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=.agents \
  package.json src tests cordis.patch.yml README.md AGENTS.md tsconfig*.json
```

Review each match; do not suppress a remaining load-visible placeholder because it appears in documentation. Generic references inside `.agents/skills/` are intentionally not identity owners.

## Align dependencies and TypeScript

For every planned host API import, update these together:

1. `peerDependencies` for runtime-provided Cordis/host APIs;
2. a reachable registry development dependency when the package must typecheck or test against it;
3. local TypeScript settings and package declarations;
4. `pnpm-workspace.yaml`: keep `autoInstallPeers: false` and set `strictPeerDependencies: true` so local install and checks fail on missing or invalid required peers;
5. `tsconfig.vitest.json` and the Vitest resolver when test aliases are needed;
6. `inject` and `cordis.patch.yml` when the service must be composed.

`strictPeerDependencies` belongs to the repository workspace and is not copied into a packed plugin or a consuming DSH profile. Composition must therefore install or otherwise provide every required peer in the target profile before activation. Do not move a host peer into `dependencies` or `bundledDependencies` just to make a consumer install appear self-contained; only a package that owns and provides a runtime may bundle it.

Use `dependencies` for libraries bundled or required by the plugin at runtime. Keep optional peers explicit. This template forbids local `link:` and `file:` dependencies and forbids project references that leave the repository. Every fresh clone must resolve its build graph from its own manifest and lockfile.

## Establish repository state

Generate or refresh `pnpm-lock.yaml` only after identity and dependency edits. Initialize Git only when the user requested a new repository or approved that step; do not create a remote, commit, tag, or push without separate authority. Confirm generated `lib/`, `node_modules/`, and `*.tsbuildinfo` stay ignored.

Preserve the bundled `.agents/skills/dsh-plugin-*` directories in the new repository so project-root discovery keeps this workflow available. Copy the portable files as part of the template and never replace them with absolute symlinks that fail in another clone.

## Baseline verification

Before adding product behavior, run from the target repository:

```sh
pnpm install
pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
```

If the execution sandbox, network, native build, or package-manager state blocks one command, preserve its exact failure and retry unchanged only through the environment's approved narrow escalation path. Do not rewrite dependencies to hide an environmental denial.

Scaffolding is complete only when all placeholders are gone, package exports and bundle rows use the intended names, dependency/type-resolution records agree, generated files are ignored, and the baseline commands pass or have a concrete external blocker reported as unverified.

Return the updated shared handoff and exact commands run. Do not describe the scaffold as complete when behavior code was added before the baseline was proven.
