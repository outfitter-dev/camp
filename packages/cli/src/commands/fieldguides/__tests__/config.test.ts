// Jest unit tests for config module
import fs from 'fs';
import { loadConfig, ConfigError } from '../config';

jest.mock('fs');

describe('loadConfig', () => {
  const TEST_PATH = '/fake/path/config.json';

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.CONFIG_PATH;
  });

  it('should return parsed config for a valid JSON file', () => {
    const fakeConfig = { foo: 'bar', baz: 123 };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(fakeConfig));

    const result = loadConfig(TEST_PATH);
    expect(result).toEqual(fakeConfig);
  });

  it('should throw ConfigError when the file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    expect(() => loadConfig(TEST_PATH)).toThrow(ConfigError);
  });

  it('should throw ConfigError for malformed JSON content', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

    expect(() => loadConfig(TEST_PATH)).toThrow(ConfigError);
  });

  it('should throw ConfigError when readFileSync throws an error', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const err: NodeJS.ErrnoException = new Error('permission denied');
    err.code = 'EACCES';
    (fs.readFileSync as jest.Mock).mockImplementation(() => { throw err; });

    expect(() => loadConfig(TEST_PATH)).toThrow(ConfigError);
  });
});