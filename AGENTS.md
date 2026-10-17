# Plugin Template Contributor Notes

This repository is a standalone DeepSeek Harness plugin template.

- Read `docs/dsh-plugin-contracts.md` before changing package metadata, dependencies, display resources, lifecycle, client behavior, or distribution.
- Start with `.agents/skills/dsh-plugin-development/SKILL.md`; stage skills live under `.agents/skills/`.
- Keep the function-plugin named exports `name`, `inject`, `Config`, and `apply`; never add a default export.
- Own every registration with the plugin fiber and prove disposal.
- Keep `engines.dsh`, `engines.node`, `dsh.manifestVersion`, `dsh.bundle.patch`, `dsh.client`, `exports`, `files`, and the exported display assets synchronized with the package.
- Do not reintroduce the removed `./invariant` companion or an `invariants` service dependency.
- Run `pnpm run lint`, `pnpm test`, and `pnpm run build` before publishing.
- Do not commit, push, publish, tag, or change remotes without direct user authority.
