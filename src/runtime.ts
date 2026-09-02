/**
 * Runtime boundary and Cordis activation for the plugin.
 * @module @your-scope/dsh-plugin-template/runtime
 */

import type { Context } from 'cordis'
import type { Config } from './config.ts'
import { resolveConfig } from './config.ts'

/** Fakeable host boundary used by the minimal plugin behavior. */
interface PluginRuntime {
  /** Publish one informational message through the host. */
  info: (message: string) => void
}

/**
 * Create the production runtime adapter from a scoped Cordis context.
 * @param ctx - Scoped plugin context.
 * @returns Host behavior used by the plugin implementation.
 */
function createPluginRuntime(ctx: Context): PluginRuntime {
  return {
    info: message => { ctx.logger.info(message) },
  }
}

/**
 * Apply the plugin to its Cordis context.
 * @param ctx - Scoped plugin context; registrations must be owned by its effects.
 * @param config - Configuration resolved by Cordis from the exported schema.
 */
function apply(ctx: Context, config: Config): void {
  const runtime = createPluginRuntime(ctx)
  runtime.info(resolveConfig(config).message)
}

export { apply, createPluginRuntime, type PluginRuntime }
