import { Context } from 'cordis'
import { vi } from 'vitest'

import type { Config as PluginConfig } from '#src/config'
import { Config, apply, inject, name } from '#src/index'

const plugin = { Config, apply, inject, name }

interface PluginHarness {
  ctx: Context
  fiber: Awaited<ReturnType<Context['plugin']>>
  info: ReturnType<typeof vi.spyOn>
  dispose: () => Promise<void>
}

/** Mount the production plugin with an observable host logger. */
export async function createPluginHarness(
  config: PluginConfig = {},
): Promise<PluginHarness> {
  const ctx = new Context()
  const info = vi.spyOn(ctx.logger, 'info').mockReturnValue()
  const fiber = await ctx.plugin(plugin, config)

  return {
    ctx,
    fiber,
    info,
    async dispose(): Promise<void> {
      try {
        await fiber.dispose()
      } finally {
        info.mockRestore()
      }
    },
  }
}
