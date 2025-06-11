/**
 * Jest + ts-jest tests for the fieldguides:update command.
 * Mocks: fs/promises, node-fetch.
 * These tests cover happy paths, edge cases, and failure conditions.
 */

import { handler as updateFieldguide } from '../update';
import { join } from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';

function createMockFetch(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

jest.mock('node-fetch', () => jest.fn());
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

afterEach(() => {
  jest.resetAllMocks();
});

describe('fieldguides:update – happy path', () => {
  it('downloads and writes new guide when remote version is newer', async () => {
    (fetch as jest.Mock).mockImplementation(
      createMockFetch({ version: '1.2.3', data: { foo: 'bar' } })
    );
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

    await updateFieldguide({ guide: 'test-guide', output: '/tmp' });

    expect(fs.mkdir).toHaveBeenCalledWith(join('/tmp', 'fieldguides'), { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      join('/tmp', 'fieldguides', 'test-guide.json'),
      JSON.stringify({ version: '1.2.3', data: { foo: 'bar' } }, null, 2)
    );
  });

  it('does not write when remote version is unchanged', async () => {
    (fetch as jest.Mock).mockImplementation(
      createMockFetch({ version: '1.0.0', data: {} })
    );
    (fs.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ version: '1.0.0', data: {} })
    );
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

    await updateFieldguide({ guide: 'test-guide', output: '/tmp' });

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith('No updates available for test-guide');
    consoleInfoSpy.mockRestore();
  });
});

describe('fieldguides:update – edge cases', () => {
  it('creates directory if manifest missing', async () => {
    (fetch as jest.Mock).mockImplementation(createMockFetch({ version: '2.0.0' }));
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    await updateFieldguide({ guide: 'new-guide', output: '/tmp' });

    expect(fs.mkdir).toHaveBeenCalledWith(join('/tmp', 'fieldguides'), { recursive: true });
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('invalid flags should error', async () => {
    await expect(
      // @ts-expect-error testing invalid input
      updateFieldguide({ unknown: 'flag' })
    ).rejects.toThrow('Invalid guide name');
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

describe('fieldguides:update – failure handling', () => {
  it('handles network failures gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    await expect(
      updateFieldguide({ guide: 'fail-guide', output: '/tmp' })
    ).rejects.toThrow('Network Error');
  });

  it('throws on non-2xx status codes', async () => {
    (fetch as jest.Mock).mockImplementation(createMockFetch(null, 500));
    await expect(
      updateFieldguide({ guide: 'error-guide', output: '/tmp' })
    ).rejects.toThrow('Failed to fetch error-guide: 500');
  });
});