/**
 * Serializable configuration, schema, and direct-call defaults.
 * @module @your-scope/dsh-plugin-template/config
 */

import schema from 'schemastery'

/** Plugin configuration supplied by the profile composition. */
interface Config {
  /** Message written when this plugin loads. */
  message?: string
}

/** Configuration after defaults have been resolved. */
interface ResolvedConfig {
  /** Message written when this plugin loads. */
  message: string
}

/** Loader-visible configuration schema and defaults. */
const Config: schema<Config> = schema.object({
  message: schema.string().default('DSH plugin template loaded'),
})

/**
 * Resolve the same defaults for direct callers that bypass Cordis Loader.
 * @param config - Partial serialized configuration.
 * @returns Configuration with all template defaults applied.
 */
function resolveConfig(config: Config = {}): ResolvedConfig {
  return {
    message: config.message ?? 'DSH plugin template loaded',
  }
}

export { Config, resolveConfig, type ResolvedConfig }
