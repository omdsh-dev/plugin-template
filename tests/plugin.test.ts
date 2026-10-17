import { Context } from '@deepseek-ai/cordis'
import { Loader } from '@deepseek-ai/cordis-plugin-loader'
import { describe, expect, it } from 'vitest'

import { createPluginHarness } from './harness.ts'

const TEST_TIMEOUT = 5000
const EXPECTED_SINGLE_CALL = 1

interface PluginExports {
  readonly name: unknown
  readonly inject: unknown
  readonly Config: unknown
  readonly apply: unknown
}

function isPluginExports(value: unknown): value is PluginExports {
  return (
    typeof value === 'object'
    && value !== null
    && 'name' in value
    && 'inject' in value
    && 'Config' in value
    && 'apply' in value
  )
}

function createLoader(): Loader {
  return new Loader(new Context())
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

async function testLogsOncePerActivation(): Promise<void> {
  expect.hasAssertions()
  const harness = await createPluginHarness({ message: 'once' })
  expect(harness.info).toHaveBeenCalledTimes(EXPECTED_SINGLE_CALL)
  await harness.dispose()
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
    'logs once for one activation',
    { timeout: TEST_TIMEOUT },
    testLogsOncePerActivation,
  )
})
