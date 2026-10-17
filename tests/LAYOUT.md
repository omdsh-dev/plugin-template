# Test Layout

`tests/plugin.test.ts` owns the baseline Loader shape, configuration behavior,
activation, and disposal evidence. `tests/harness.ts` provides the shared
real-Cordis mount with an observable fake host boundary.

Extend test support only when the plugin requires it:

- extend `tests/harness.ts` when several suites need the same deterministic
  production composition;
- add `tests/<feature>.test.ts` for focused feature behavior;
- add fixtures under `tests/snapshots/` for stable user-, model-, CLI-,
  terminal-, editor-, or browser-visible expected output.

A harness should mount production services and expose observable state rather
than duplicate the implementation. The baseline has no snapshot fixtures and
therefore defines no refresh command. When snapshots are introduced, add and
document a repository-local refresh command here, with deterministic inputs,
exact fixture ownership, and semantic review. Type-aware static checking is
provided by the repository's Oxlint command.

A product-visible plugin also needs a real Loader/profile composition test in
its consuming DSH application; hand-mounted `ctx.plugin(...)` suites are unit
coverage, not composition evidence.
