// External dependencies and command under test
import fs from 'fs-extra';
import prompts from 'prompts';
import { logger } from '../../utils/logger';
import { init } from '../init';

jest.mock('fs-extra');
jest.mock('prompts');
jest.mock('../../utils/logger');

describe('init command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully initializes project with valid name and template', async () => {
    (prompts as jest.Mock).mockResolvedValue({
      projectName: 'test-app',
      template: 'default',
    });
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    const ensureDirSpy = (fs.ensureDir as jest.Mock).mockResolvedValue(
      undefined
    );
    const writeFileSpy = (fs.writeFile as jest.Mock).mockResolvedValue(
      undefined
    );

    await expect(
      init({ name: 'test-app', template: 'default' })
    ).resolves.not.toThrow();

    expect(ensureDirSpy).toHaveBeenCalledWith('test-app');
    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-app'),
      expect.any(String)
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Project initialized')
    );
  });

  it('throws an error when project name is missing', async () => {
    await expect(init({} as any)).rejects.toThrow('Project name is required');
  });

  it('throws an error for invalid template option', async () => {
    await expect(
      init({ name: 'app', template: 'nonexistent' })
    ).rejects.toThrow('Invalid template: nonexistent');
  });

  it('handles filesystem errors gracefully', async () => {
    (prompts as jest.Mock).mockResolvedValue({
      projectName: 'app',
      template: 'default',
    });
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.ensureDir as jest.Mock).mockRejectedValue(new Error('Disk full'));

    await expect(init({ name: 'app', template: 'default' })).rejects.toThrow(
      'Disk full'
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Disk full')
    );
  });

  it('prompts user when no options are provided and proceeds with input', async () => {
    (prompts as jest.Mock).mockResolvedValue({
      projectName: 'interactive-app',
      template: 'default',
    });
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await init({});

    expect(prompts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'projectName' }),
        expect.objectContaining({ name: 'template' }),
      ])
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Project initialized')
    );
  });
});
