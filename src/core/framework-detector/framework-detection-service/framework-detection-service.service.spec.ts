import { FrameworkDetectionService } from './framework-detection.service';
import { FileHandlers } from './file-handler';

jest.mock('../framework.config', () => ({
  FrameworkMap: {
    A: { sort: 1, file: 'package.json', dependencies: ['depA'] },
    B: { sort: 2, file: 'Dockerfile',    dependencies: []         },
  },
}));

describe('FrameworkDetectionService', () => {
  let service: FrameworkDetectionService;
  let gitHubFileService: any;
  let eventEmitter: any;

  beforeEach(() => {
    gitHubFileService = {
      initialize: jest.fn(),
      setRepositoryContext: jest.fn(),
      getConfigFile: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() };
    service = new FrameworkDetectionService(eventEmitter, gitHubFileService);
  });

  it('detects frameworks A then B when their handlers match', async () => {
    // package.json: exists and contains depA for A
    // Dockerfile: exists for B (deps empty → dockerHandler returns true)
    gitHubFileService.getConfigFile.mockImplementation(async file => {
      if (file === 'package.json') {
        return { exists: true, content: JSON.stringify({ dependencies: { depA: '1.0.0' } }) };
      }
      if (file === 'Dockerfile') {
        return { exists: true, content: 'FROM node' };
      }
      return { exists: false, content: '' };
    });

    const result = await service.detectFramework({
      owner: 'o',
      repo: 'r',
      email: 'e@example.com',
    });

    expect(gitHubFileService.initialize).toHaveBeenCalledWith('e@example.com');
    expect(gitHubFileService.setRepositoryContext).toHaveBeenCalledWith('o', 'r', undefined);
    expect(result).toEqual(['A', 'B']);
  });

  it('skips non-existent files and returns empty when nothing matches', async () => {
    gitHubFileService.getConfigFile.mockResolvedValue({ exists: false, content: '' });

    const result = await service.detectFramework({
      owner: 'o',
      repo: 'r',
      email: 'e@example.com',
    });

    expect(result).toEqual([]);
  });

  it('returns empty array if initialize throws', async () => {
    gitHubFileService.initialize.mockRejectedValue(new Error('fail init'));

    const result = await service.detectFramework({
      owner: 'o',
      repo: 'r',
      email: 'e@example.com',
    });

    expect(result).toEqual([]);
  });
});
