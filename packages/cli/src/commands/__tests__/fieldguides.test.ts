import { runFieldGuides } from '../fieldguides';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('FieldGuides CLI', () => {
  const originalArgv = process.argv;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Initialize argv to simulate invoking "fieldguides" command
    process.argv = [...originalArgv.slice(0, 2), 'fieldguides'];
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
  });

  it('should generate field guide successfully for valid input', async () => {
    const templatePath = 'template.hbs';
    const inputPath = 'fields.json';
    const outputPath = 'out.md';

    process.argv.push(
      '--template', templatePath,
      '--input', inputPath,
      '--output', outputPath
    );

    // Both template and data files exist
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    // Mock reading template and JSON data
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
      if (filePath === templatePath) {
        return 'Hello {{name}}';
      }
      if (filePath === inputPath) {
        return JSON.stringify({ name: 'World' });
      }
      throw new Error('Unexpected file path');
    });

    await runFieldGuides();

    // Expect the output file to be written with the interpolated content
    expect((fs.writeFileSync as jest.Mock)).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('Hello World')
    );
  });

  it('should output help when --help flag is passed', async () => {
    process.argv.push('--help');

    await runFieldGuides();

    // yargs help typically prints "Options" or usage info
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Options'));
  });

  it('should handle missing required argument gracefully', async () => {
    // Omit the --template flag
    process.argv.push('--input', 'fields.json', '--output', 'out.md');

    await expect(runFieldGuides()).rejects.toThrow('Missing required argument');
  });

  it('should fail when template file is missing', async () => {
    const templatePath = 'template.hbs';
    process.argv.push(
      '--template', templatePath,
      '--input', 'fields.json',
      '--output', 'out.md'
    );

    // Simulate template file not existing
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => filePath !== templatePath);

    await expect(runFieldGuides()).rejects.toThrow(`Template file not found: ${templatePath}`);
  });

  it('should propagate underlying fs errors', async () => {
    const templatePath = 'template.hbs';
    const inputPath = 'fields.json';
    process.argv.push(
      '--template', templatePath,
      '--input', inputPath,
      '--output', 'out.md'
    );

    // File existence check passes
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    // Simulate a low-level read error
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('fs failure');
    });

    await expect(runFieldGuides()).rejects.toThrow('fs failure');
  });
});