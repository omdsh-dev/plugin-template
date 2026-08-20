---
name: dsh-plugin-fabric-verify
description: Use when proving a Fabric-dependent DSH plugin works end to end: testkit fixture runs with binding assertions, child-process composition tests, the three-state boot matrix (plain dsh skips the row, fabric-dsh loads it with bindings, explicit enable on plain dsh fails), and the install/update steps before the evidence counts.
---

# Verify a Fabric Plugin End to End

This skill owns the Fabric-specific evidence: bindings, the boot matrix, and the launch form. Read the project-root `docs/dsh-plugin-fabric.md` first. General Loader export, disposal, and snapshot checks stay in `dsh-plugin-test`; this skill adds what Fabric changes.

## Prove the transform in a fixture process

Use `cordis-fabric/testing/testkit` for one transformed target plus handler, asserted on bindings and results:

- the target fixture lives under a `node_modules`-shaped path so package identity resolution matches production;
- each case runs in a fresh child process — the synchronous loader hooks cannot be unregistered within a process;
- assert both the recorded binding (`{module, file, nodes}`) and the rewritten call result; a binding with zero nodes is an inert transform.

## Run the three-state boot matrix

Compose a real profile tree (isolated `DSH_HOME`, bundle layers in `dsh.profile.bundles` order, the trio installed in the profile) and assert all three states:

1. **Plain `dsh` skips the row** — the app boots, and the Fabric-required plugin is absent from the mounted roster and the served client manifest. This is the normal non-fabric behavior, not an error.
2. **`fabric-dsh` loads it** — the boot succeeds, the plugin appears in the client manifest, the required patch recorded a binding (the post-boot check fails the boot when it did not), and the boot output carries the preload's `fabric-dsh:` launch marker followed by the hook summary (each patch with its hooked target file and node count, or "not hooked"); the marker's absence means the hooks never installed.
3. **Plain `dsh` with an explicit enable fails** — enabling the Fabric-required row in the profile layer without the launcher must fail loud ("enabled on a plain-dsh boot", hooks not installed).

Boot the CLI from the official checkout with the profile's `DSH_HOME`; clear a stale `TSX_TSCONFIG_PATH` from the environment (the launcher pins the harness tsconfig itself).

## Verify the launch forms

- Profile bin: `$DSH_HOME/profiles/web/node_modules/.bin/fabric-dsh --harness <official-checkout> web --port 8000` — home and profile derive from the install path; the preload resolves the trio from the profile so hooks and plugins share one module instance.
- The checkout form `node <bundle-repo>/scripts/fabric-dsh.mjs --harness <checkout> --profile web ...` is for development; either way the harness must be an official source checkout (an npm-installed `dsh` cannot run fabric-dsh).

## Keep installs honest

- Install the ready-made bundle through the official channel: `dsh plugin --profile web add https://github.com/omdsh-dev/fabric/releases/latest/download/pkg.tgz`, then enable the `cordis-fabric-dsh` row; the release artifact avoids nested Git/URL resolution and install-time `prepare`.

## Record the evidence

Report per state: command, exit behavior, roster/manifest observation, and the binding line when applicable. A plugin whose Fabric evidence only covers state 2 has not proven the dependency contract.
