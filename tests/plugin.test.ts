import LoaderPlugin from '@cordisjs/plugin-loader'
import { Context } from 'cordis'
import { describe, expect, it, vi } from 'vitest'

import { createPluginHarness } from './harness.ts'

const TEST_TIMEOUT = 5000
const EXPECTED_SINGLE_CALL = 1
const FIRST_INDEX = 0
const SECOND_INDEX = 1
const PACKAGE_NAME = '@your-scope/dsh-plugin-template'

interface PluginExports {
  readonly name: unknown
  readonly inject: unknown
  readonly Config: unknown
  readonly apply: unknown
}

function isPluginExports(value: unknown): value is PluginExports {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && 'inject' in value
    && 'Config' in value
    && 'apply' in value
}

function createLoader(): LoaderPlugin {
  const candidate: unknown = Object.create(LoaderPlugin.prototype)
  if (!(candidate instanceof LoaderPlugin)) {
    throw new TypeError('Loader prototype did not produce a Loader instance')
  }
  return candidate
}

function assertPluginExports(unwrapped: unknown, plugin: object): void {
  if (!isPluginExports(unwrapped)) {
    throw new TypeError('Loader did not return plugin exports')
  }
  expect(unwrapped).toBe(plugin)
  expect(unwrapped.name).toBe('plugin-template')
  expect(unwrapped.inject).toStrictEqual([])
  expect(unwrapped.Config).toBeDefined()
  expect(unwrapped.apply).toBeTypeOf('function')
}

async function testPreservesPluginNamespace(): Promise<void> {
  expect.hasAssertions()
  const plugin = await import('#src/index')
  expect(['default' in plugin]).toStrictEqual([false])

  const loader = createLoader()
  const unwrapped: unknown = loader.unwrapExports(plugin)
  assertPluginExports(unwrapped, plugin)
}

async function testAppliesWithSchemaDefaults(): Promise<void> {
  expect.hasAssertions()
  const harness = await createPluginHarness()
  expect(harness.info).toHaveBeenCalledWith('DSH plugin template loaded')
  await harness.dispose()
}

async function testAcceptsCompositionConfiguration(): Promise<void> {
  expect.hasAssertions()
  const harness = await createPluginHarness({ message: 'hello from a profile' })
  expect(harness.info).toHaveBeenCalledWith('hello from a profile')
  await harness.dispose()
}

async function testRegistersInvariantCompanion(): Promise<void> {
  expect.hasAssertions()
  const ctx = new Context()
  const unregister = vi.fn<() => void>()
  const register = vi.fn<
    (packageName: string, installer: unknown) => () => void
  >(() => (): void => {
    unregister()
  })
  const removeService = ctx.provide('invariants', { register })
  const invariant = await import('#src/invariant')

  const fiber = await ctx.plugin(invariant)
  expect(register).toHaveBeenCalledTimes(EXPECTED_SINGLE_CALL)
  expect(register.mock.calls[FIRST_INDEX]?.[FIRST_INDEX]).toBe(PACKAGE_NAME)
  expect(register.mock.calls[FIRST_INDEX]?.[SECOND_INDEX]).toBeTypeOf('function')

  await fiber.dispose()
  expect(unregister).toHaveBeenCalledTimes(EXPECTED_SINGLE_CALL)
  removeService()
}

describe('@your-scope/dsh-plugin-template', () => {
  it(
    'preserves the function-plugin namespace through Loader unwrapping',
    { timeout: TEST_TIMEOUT },
    testPreservesPluginNamespace,
  )

  it(
    'applies with schema defaults',
    { timeout: TEST_TIMEOUT },
    testAppliesWithSchemaDefaults,
  )

  it(
    'accepts composition configuration',
    { timeout: TEST_TIMEOUT },
    testAcceptsCompositionConfiguration,
  )

  it(
    'registers the invariant companion through its local host contract',
    { timeout: TEST_TIMEOUT },
    testRegistersInvariantCompanion,
  )
})
