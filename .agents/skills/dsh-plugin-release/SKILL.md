---
name: dsh-plugin-release
description: Use when checking whether this standalone DSH plugin is ready for packed or GitHub Release tarball distribution. Validate placeholders, portable dependencies, typecheck/tests/build, public exports, packed files, clean-consumer installation, documentation, versioning, and release authority; require recorded composition evidence without owning ordinary profile wiring.
---

# Prepare a Plugin for Distribution

This skill proves that a plugin's ready-made artifact can be consumed through the selected channel. It is guidance, not publishing authority: never change remotes, push, tag, release, or run a registry publish command without a direct user request.

## Select the channel

Record one or more intended channels:

- **Packed local artifact:** consumer installs the tarball produced inside this repository; no repository-relative `link:` or `file:` dependency is allowed.
- **Git source:** only supported when the repository deliberately tracks complete built output or documents a separate source-build step; this template's official model is a prebuilt artifact.
- **npm/tarball:** consumer installs prepacked files; the tarball must already contain every exported runtime and declaration file.

Keep `private: true` unless npm publication is explicitly intended. A private package may still be consumed as a packed local artifact or from a GitHub Release. Distribution readiness does not grant permission to make it public.

## Audit identity and portability

Search source-controlled identity owners for template markers, old package names, stale row ids, absolute local paths, credentials, and forbidden local dependencies:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors|link:|file:|\.\./' \
  --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=.agents \
  package.json src tests cordis.patch.yml README.md AGENTS.md tsconfig*.json scripts
```

Review every match. This template does not permit repository-relative `link:`, `file:`, repository-external source, or repository-external project-reference paths. Registry packages and runtime host peers are package dependencies, not filesystem inputs; every consumer must resolve the ready-made build from the repository's own manifest and lockfile.

Confirm package name, version, description, license, repository metadata, Node engine, package manager, Cordis plugin id, invariant package name, bundle rows, README examples, and lockfile all describe the same package.

If `pnpm-workspace.yaml` declares `patchedDependencies`, verify every project-root patch path exists under `patches/`, targets the exact installed version, has a documented reason, and is available during a clean install. A DSH host patch under `patches/` must be a self-contained diff with a documented pinned host snapshot, regenerated and applied through `scripts/extract-patch.mjs` and `scripts/patch.sh` (configured in `patches/host-patch.config.json`), and must not appear in the published package's `files`. If no patch is declared, `patches/` must contain guidance only.

## Run package verification

Install from the lockfile using the package's documented package manager, then run:

```sh
pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
```

Import every public runtime export from `lib/` under plain Node. Verify `package.json` `main`, `types`, `exports`, and `files` point to files that actually exist after the build. Function plugins must retain their namespace exports; service plugins must resolve to the intended default class; `./invariant` must load.

## Inspect the package archive

Run:

```sh
pnpm pack --dry-run --json
```

`pnpm pack` calculates the archive from the already-built `lib/` output; inspect the complete file list. Require the runtime bundle, declarations and maps promised by exports, `cordis.patch.yml` for bundles, and any deliberately shipped assets. Reject credentials, `.env`, `.git`, tests, temporary stores, local caches, unexpected generated chunks, unexpected `node_modules` content, or files outside the documented package contract. Required host peers must be absent from the archive; only a package that owns and provides a runtime may use `bundledDependencies`. The repository's `strictPeerDependencies: true` setting validates the local workspace, not the consumer profile or the packed artifact.

When practical, create the tarball in a temporary directory, install it into a fresh minimal consumer, and import every public entry. Use the tarball rather than the source checkout so missing `files`, exports, and runtime dependencies fail.

## Verify release installation

Install the packed `pkg.tgz` (or the published GitHub Release URL) into an isolated profile after installing every required provider peer. Confirm the package manager adds the bundle, the effective rows include the intended plugin row, and every manifest-declared runtime and type entry resolves from the archive. If the profile does not enable strict peer checking, record missing-peer rejection as unverified rather than claiming the package manager hard-failed. Load and follow `dsh-plugin-compose` at `.agents/skills/dsh-plugin-compose/SKILL.md` for isolated profile installation and real-entry activation. A successful pack command does not prove profile resolution or activation.

## Documentation and repository state

Confirm README instructions cover prerequisites, local install, selected remote install, `allowBuilds` when applicable, profile activation, configuration, failures, verification, and known limitations. Keep public JSDoc synchronized with config, events, errors, and exports. Update the changelog or release notes only when that repository uses them.

Check source-control status and whitespace:

```sh
git status --short --branch
git diff --check
```

Ensure generated `lib/` and `node_modules/` are ignored unless the chosen distribution policy deliberately tracks built artifacts. Do not delete the user's uncommitted work, rewrite history, create a commit, or clean an unrelated file.

## Version and publication

Choose a version according to the package's actual compatibility policy. Verify the lockfile and packed manifest reflect it. Tagging, GitHub release creation, npm authentication, `pnpm publish`, and pushing are separate user-authorized actions; when authorized, inspect the destination and package owner before executing them and never print tokens.

## Release-readiness report

Report the selected channel, version/private status, placeholder/link audit, exact verification commands, public-entry imports, packed file findings, clean-consumer result, profile activation result, documentation status, Git status, and every unrun platform or credential-dependent step. State “ready” only for the channels actually proven, and list publication actions as not performed unless separately authorized.
