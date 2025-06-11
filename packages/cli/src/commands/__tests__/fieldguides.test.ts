import { promises as fs } from 'fs';
import path from 'path';
import mockFs from 'mock-fs';
import Fieldguides from '../fieldguides';

// Using Jest as the test framework

describe('fieldguides command', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFs(); // initialize an empty virtual filesystem
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should generate a field guide file under a provided name (happy path)', async () => {
    const writeSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue();
    const guideName = 'MyGuide';

    await Fieldguides.run([guideName]);

    const expectedPath = path.join(process.cwd(), `${guideName}.md`);
    expect(writeSpy).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining(`# ${guideName}`)
    );
  });

  it('should fail with a clear error when name argument missing', async () => {
    await expect(Fieldguides.run([]))
      .rejects
      .toThrow('Missing name argument');
  });

  it('should error if target file already exists', async () => {
    const guideName = 'ExistingGuide';
    const filePath = path.join(process.cwd(), `${guideName}.md`);
    mockFs({ [filePath]: 'existing content' });

    await expect(Fieldguides.run([guideName]))
      .rejects
      .toThrow(`File ${guideName}.md already exists`);
  });

  it('should handle template write fs errors gracefully', async () => {
    jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('disk full'));

    await expect(Fieldguides.run(['FaultyGuide']))
      .rejects
      .toThrow('disk full');
  });
});