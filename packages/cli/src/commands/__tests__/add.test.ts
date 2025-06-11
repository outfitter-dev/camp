import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import add from '../add'
import fs from 'fs-extra'

// Mock fs-extra methods
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    pathExists: vi.fn(),
  },
}))

// Tests written with Vitest
/*
 * Testable behaviours:
 * - Successful add when provided valid name.
 * - Handling optional flags such as --force, --dry-run.
 * - Validation errors for missing name or invalid characters.
 * - Behaviour when target path already exists (with/without --force).
 * - Error propagation when fs operations fail.
 * - Console/log output correctness.
 */

// Cast to mocks for TypeScript
const fsMock = fs as unknown as {
  ensureDir: Mock
  writeFile: Mock
  pathExists: Mock
}

let run: (args?: string[]) => Promise<void>

beforeEach(() => {
  vi.clearAllMocks()
  // Helper to invoke the add command with argv-style args
  run = async (args: string[] = []) => {
    return add(args)
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('add command', () => {
  it('creates files for new component', async () => {
    fsMock.pathExists.mockResolvedValue(false)
    await expect(run(['MyComponent'])).resolves.toBeUndefined()
    expect(fsMock.ensureDir).toHaveBeenCalledWith(expect.stringContaining('MyComponent'))
    expect(fsMock.writeFile).toHaveBeenCalled()
  })

  it('errors when component already exists without --force', async () => {
    fsMock.pathExists.mockResolvedValue(true)
    await expect(run(['MyComponent'])).rejects.toThrow(/already exists/i)
  })

  it('--force overwrites existing component', async () => {
    fsMock.pathExists.mockResolvedValue(true)
    await expect(run(['MyComponent', '--force'])).resolves.toBeUndefined()
    expect(fsMock.writeFile).toHaveBeenCalled()
  })

  it('--dry-run performs no filesystem writes', async () => {
    fsMock.pathExists.mockResolvedValue(false)
    await expect(run(['MyComponent', '--dry-run'])).resolves.toBeUndefined()
    expect(fsMock.ensureDir).not.toHaveBeenCalled()
    expect(fsMock.writeFile).not.toHaveBeenCalled()
  })

  it('throws when no name supplied', async () => {
    await expect(run()).rejects.toThrow(/name/i)
  })

  it('errors on invalid name characters', async () => {
    await expect(run(['Invalid/Name'])).rejects.toThrow(/invalid characters/i)
  })

  it('propagates fs error', async () => {
    const error = new Error('fail')
    fsMock.ensureDir.mockRejectedValue(error)
    await expect(run(['MyComponent'])).rejects.toThrow(error)
  })
})