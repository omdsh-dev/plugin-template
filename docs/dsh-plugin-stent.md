# DSH Stent Plugin Contracts

Shared reference for the Stent plugin skills (`dsh-plugin-stent-*`). Stent gives a standalone DSH plugin a controlled hook surface: a static patch descriptor declares the target and operation, while trusted plugin code registers the runtime handler. It changes host or browser behavior without editing DSH source.

## The Stent packages

- `@oh-my-dsh/stent` — the platform-neutral service and transformation runtime. It validates descriptors, installs Node/browser hooks, records load-time bindings, and exposes `StentService` / `getStent`.
- `@oh-my-dsh/stent-api` — the optional compatibility facade for plugins that need `StentCompatService`, observation, or runtime browser serving. Use it only when the plugin imports that facade.
- `@oh-my-dsh/stent-dsh` — DSH-facing host facades and profile bootstrap. Its launcher installs the static descriptors before target modules load and checks required bindings after boot.
- `@oh-my-dsh/stent-pack` — the ready-made profile carrier that installs the Stent trio and the `stent-dsh` launcher.

A Stent-dependent consumer declares `@oh-my-dsh/stent` as a required `peerDependency` and mirrors it in `devDependencies`. Add `@oh-my-dsh/stent-api` in both places only when the plugin imports the compat facade. Neither package belongs in runtime `dependencies` or `bundledDependencies`; the consuming profile installs `@oh-my-dsh/stent-pack` separately. The profile's peer policy is not transferred from the plugin repository.

Handlers are trusted code. Never serialize executable handlers into YAML, JSON, model input, or a profile overlay; only static patch metadata belongs under `config.stent.patches`.

## Launch forms

- **Plain `dsh`** runs without the Stent preload. Rows that declare `config.stent.patches` stay disabled and are skipped. If one is explicitly enabled on plain `dsh`, `stent-dsh`'s gate fails loudly instead of silently running without hooks.
- **`stent-dsh`** installs the descriptors through its preload before the target CLI imports modules, enables Stent-required rows, and writes the composed descriptor set to `STENT_CONFIG`. The post-boot gate checks required bindings and prints a `stent: hooks summary`.

Use the profile launcher, for example:

```sh
$DSH_HOME/profiles/web/node_modules/.bin/stent-dsh --harness <official-checkout> web --port 8000
```

The harness must be an official source checkout when the selected launch form requires it; do not infer that an npm-installed host contains a source entry suitable for preload injection.

## Stent-required rows

A row that owns load-time transforms carries its own descriptors under `config.stent.patches` and ships disabled. The Stent launcher enables these rows; keeping the descriptor on the declaring row avoids bundle-layer ordering hazards.

```yaml
- insert:
    - id: my-plugin
      name: '@my-scope/dsh-my-plugin'
      disabled: true
      config:
        # Keep this metadata in the plugin Config schema as z.any() or an
        # equivalent field when the loader validates unknown row properties.
        stent:
          patches:
            - id: my-plugin/exposed-thing
              required: true
              target:
                module: '@scope/target'
                versionRange: '>=0.0.1-0'
                filePaths: ['src/x.js', 'lib/index.js']
                functionQuery: { functionName: decide, kind: Sync }
              operation: after
```

The provider bundle separately supplies the disabled `stent` descriptor-carrier row and the enabled `stent-dsh` integration row. Do not enable the pure `stent` package as a Loader plugin: its package root is a service library, not a function-plugin row.

Consequences are intentional:

- plain `dsh` skips a disabled Stent-required row; the dependent plugin does not load or degrade;
- `stent-dsh` installs the hooks and enables the row before target imports;
- explicit enablement on plain `dsh` fails loudly because the hooks are absent;
- `required: true` plus no recorded binding fails the Stent post-boot check instead of shipping an inert transform.

## Patch stub anatomy

One entry of `config.stent.patches` is a `StentPatchStub` without a runtime handler:

```yaml
- id: owner-scope/feature-name       # stable and namespaced
  required: true                     # fail the Stent gate when nothing binds
  priority: 0                        # optional; higher handlers run first
  target:
    module: '@scope/pkg-name'
    versionRange: '>=0.0.1-0'
    filePaths: ['src/file.js', 'lib/index.js']
    functionQuery:
      functionName: exposedNamespaces
      kind: Sync                    # Sync or Async
  operation: after                   # before | after | around | replace
```

- `filePaths` must cover every launch form that can load the target. A source launch may load `src/...`, while a packed deployment loads `lib/...`; a mismatch records no binding.
- `before` mutates `call.arguments`; `after` observes or replaces `call.result`; `around` and `replace` receive `invoke()` and decide whether the original body runs.
- Use an `astQuery` only when a name-based `functionQuery` cannot identify the target. Keep ids stable because they appear in diagnostics and binding reports.
- A browser-only target cannot be `required: true` for the Node boot check. Use the browser transform or runtime serving path and assert its own binding/output evidence.

## Register the trusted handler

Prefer the declared `stent` service when the plugin requires it:

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { StentCall, StentService } from '@oh-my-dsh/stent'

export const inject = ['stent']

export function apply(ctx: Context & { stent: StentService }): void {
  ctx.stent.register({
    id: 'my-plugin/exposed-thing',
    target: {
      module: '@scope/target',
      versionRange: '>=0.0.1-0',
      filePath: 'lib/index.js',
      functionQuery: { functionName: 'decide', kind: 'Sync' },
    },
    operation: 'after',
    handler(call: StentCall) {
      // Inspect or replace call.result here.
      call.result = call.result
    },
  })
}
```

If the service is optional for the plugin's normal operation, use the mount-aware `getStent(ctx)` fallback instead of manufacturing a second registry. Registrations are owned by the plugin fiber: dispose the plugin and the patch is disabled and removed. Patch ids are exclusive; a different plugin must fail loudly rather than overwrite the owner.

The compat route is available only when needed:

```ts
import { StentCompatService } from '@oh-my-dsh/stent-api'

await ctx.plugin(StentCompatService)
const compat = ctx.get('stentCompat')
compat.registerPatch({ /* static target, operation, and trusted handler */ })
```

## Browser rewrites

Node load-time hooks cannot see code that exists only in a browser bundle. For a host-owned client build, use Stent's browser transform and the host's client-bundle seam:

```ts
import { createWatchedBrowserTransform, repoSourceResolver } from '@oh-my-dsh/stent'

const transform = createWatchedBrowserTransform(
  new URL('./stent.patches.json', import.meta.url).pathname,
  repoSourceResolver('@my-scope/dsh-my-plugin', new URL('..', import.meta.url).pathname, '0.0.1'),
)
```

When the target bundle is owned by another package, use the compat `serveBundle` / Stent `serveBrowserTransform` route with an explicit route and `fallback: 'raw'` only when degraded output is acceptable. Guard the host webserver capability and the composition anchor (`ctx.baseUrl`) before serving. Browser descriptors use the same static shape as `config.stent.patches`; handlers remain trusted runtime code.

## Required-binding evidence

- `checkRequiredPatches` runs after boot and names every `required` patch that recorded no load-time binding.
- `ctx.stent.bindings(id?)` and `ctx.stent.list()` are the diagnostic ground truth; a descriptor existing in YAML is not proof that a target transformed.
- `stent-dsh` prints the `stent: hooks summary` after the check. Record the target module, file, node count, and launch form for every required binding.
- Hooks are installed before target module evaluation. The hook installation has process-lifetime mechanics, so each isolated fixture scenario must run in a fresh child process; the registration state is still fiber-owned and disposable.

## Install and update

1. Install the ready-made provider bundle in the target profile:
   `dsh plugin --profile web add @oh-my-dsh/stent-pack`.
2. Ensure the profile has the `stent` carrier row disabled and the `stent-dsh` integration row enabled as required by the selected profile.
3. Install the consumer plugin only after its Stent peer contract is available. The consumer artifact must not carry a second Stent copy.
4. Launch through the profile's `.bin/stent-dsh`; a plain `dsh` launch intentionally skips Stent-required rows.

The release provider bundle avoids nested Git/URL resolution and install-time `prepare`. A packed consumer artifact still needs its own build, peer, archive, and real-profile verification.

## Testing surface

- `@oh-my-dsh/stent/testing/testkit` (`runPatchFixture`) runs a fresh child process with static patches, imports a fixture entry, and returns both binding records and the result/error envelope.
- Composition tests use an isolated `DSH_HOME` and prove the three states: plain `dsh` skips the row, `stent-dsh` loads it with bindings, and plain `dsh` with an explicit enable fails loudly.
- Keep Loader export, disposal, and observable behavior assertions in `dsh-plugin-test`; this Stent-specific suite proves the hook binding and launch contract.
