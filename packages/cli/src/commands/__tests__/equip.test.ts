import { EquipCommand } from '../equip'
import * as fs from 'fs-extra'
import { jest } from '@jest/globals'

jest.mock('fs-extra', () => ({
  readJson: jest.fn(),
  writeJson: jest.fn()
}))

describe('EquipCommand', () => {
  let exitSpy: jest.SpyInstance

  beforeAll(() => {
    jest.useFakeTimers()
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number) => { throw new Error(`process.exit: ${code}`) } as never)
  })

  afterAll(() => {
    jest.useRealTimers()
    exitSpy.mockRestore()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should show help or error when no flags provided', async () => {
    const cmd = new EquipCommand([], {})
    await expect(cmd.run()).rejects.toThrow()
  })

  it('should equip specific item successfully when valid name is provided', async () => {
    (fs.readJson as jest.Mock).mockResolvedValue({
      items: [{ name: 'sword', equipped: false }]
    })
    const cmd = new EquipCommand([], { name: 'sword' })
    await expect(cmd.run()).resolves.not.toThrow()
    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'sword', equipped: true })
        ])
      })
    )
  })

  it('should equip all items successfully when --all flag is used', async () => {
    (fs.readJson as jest.Mock).mockResolvedValue({
      items: [
        { name: 'sword', equipped: false },
        { name: 'shield', equipped: false }
      ]
    })
    const cmd = new EquipCommand([], { all: true })
    await expect(cmd.run()).resolves.not.toThrow()
    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        items: [
          expect.objectContaining({ name: 'sword', equipped: true }),
          expect.objectContaining({ name: 'shield', equipped: true })
        ]
      })
    )
  })

  it('should throw an error when an invalid equipment name is provided', async () => {
    (fs.readJson as jest.Mock).mockResolvedValue({
      items: [{ name: 'shield', equipped: false }]
    })
    const cmd = new EquipCommand([], { name: 'dagger' })
    await expect(cmd.run()).rejects.toThrow('Invalid equipment name')
  })

  it('should propagate errors from dependencies gracefully', async () => {
    (fs.readJson as jest.Mock).mockRejectedValue(new Error('Read error'))
    const cmd = new EquipCommand([], { name: 'sword' })
    await expect(cmd.run()).rejects.toThrow('Read error')
  })
})