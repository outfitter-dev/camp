import {
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { exec } from 'child_process';
import inquirer from 'inquirer';
import { Add } from '../add';

jest.mock('fs-extra');
jest.mock('child_process', () => ({
  exec: jest.fn(
    (cmd: string, opts: any, cb: (err: Error | null, stdout: string) => void) =>
      cb(null, '')
  ),
}));
jest.mock('inquirer', () => ({ prompt: jest.fn() }));

describe('Add Command', () => {
  let tmpDir: string;
  const originalCwd = process.cwd();

  beforeEach(async () => {
    jest.resetAllMocks();
    // spy on console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // create an isolated tmp dir
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'add-test-'));
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tmpDir);
    jest.restoreAllMocks();
  });

  it('happy path: creates project, writes files and runs install', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const execMock = exec as jest.Mock;
    execMock.mockImplementation((cmd, opts, cb) => cb(null, ''));

    await expect(Add.run(['my-app'])).resolves.not.toThrow();

    // assert project directory created
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(tmpDir, 'my-app', 'package.json'),
      expect.stringContaining('"name": "my-app"'),
      'utf8'
    );
    // assert npm install was run
    expect(execMock).toHaveBeenCalledWith(
      'npm install',
      expect.objectContaining({ cwd: path.join(tmpDir, 'my-app') }),
      expect.any(Function)
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Project my-app created')
    );
  });

  it('errors on invalid name containing special characters', async () => {
    await expect(Add.run(['my@pp!'])).rejects.toThrow(/Invalid project name/);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid project name')
    );
  });

  it('prompts and aborts if target path exists without --force', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (inquirer.prompt as jest.Mock).mockResolvedValue({ overwrite: false });

    await expect(Add.run(['existing-app'])).rejects.toThrow();
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'existing-app already exists. Overwrite?',
      },
    ]);
    expect(console.log).toHaveBeenCalledWith('Aborting operation.');
  });

  it('overwrites without prompt when --force flag is used', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.remove as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    const execMock = exec as jest.Mock;
    execMock.mockImplementation((cmd, opts, cb) => cb(null, ''));

    await expect(Add.run(['proj', '--force'])).resolves.not.toThrow();
    expect(inquirer.prompt).not.toHaveBeenCalled();
    expect(fs.remove).toHaveBeenCalledWith(path.join(tmpDir, 'proj'));
    expect(execMock).toHaveBeenCalled();
  });

  it('skips installation when --skip-install flag is used', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    const execMock = exec as jest.Mock;

    await expect(
      Add.run(['noinstall', '--skip-install'])
    ).resolves.not.toThrow();
    expect(execMock).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Skipping installation')
    );
  });

  it('handles fs.writeFile errors gracefully', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error('disk full'));

    await expect(Add.run(['failapp'])).rejects.toThrow('disk full');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error creating project')
    );
  });

  it('errors on unsupported template name', async () => {
    await expect(Add.run(['app', '--template', 'nonexistent'])).rejects.toThrow(
      /Unsupported template/
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported template')
    );
  });
});
