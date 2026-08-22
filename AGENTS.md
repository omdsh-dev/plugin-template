# Plugin Template Contributor Notes

This repository is a standalone DeepSeek Harness plugin template.

- Preserve the function-plugin named exports: `name`, `inject`, `Config`, and `apply`; do not add a default export.
- Keep Loader metadata in `src/index.ts`, schema/defaults in `src/config.ts`, and host boundaries plus activation in `src/runtime.ts`.
- Keep all registrations scoped to the plugin fiber and test disposal.
- Keep host-provided runtime APIs as peer dependencies and resolve development imports from this repository's declared dependencies.
- Do not add source, configuration, documentation, project-reference, `link:`, or `file:` paths that leave this repository.
- Describe repository files with project-root paths such as `docs/dsh-plugin-contracts.md`; never use parent-directory navigation in documentation.
- Update `README.md`, configuration JSDoc, tests, and `cordis.patch.yml` together when behavior changes.
- Keep the repository-local `.agents/skills/dsh-plugin-*` workflow synchronized with template paths, commands, and package conventions. The `dsh-plugin-stent-*` skills share one reference contract at `docs/dsh-plugin-stent.md`; keep their counts, frontmatter, and `agents/openai.yaml` metadata synchronized with the repository files.
- Run `pnpm run lint`, `pnpm test`, and `pnpm run build` before publishing changes.
