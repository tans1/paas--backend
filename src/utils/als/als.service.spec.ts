import { Test, TestingModule } from '@nestjs/testing';
import { AlsService } from './als.service';

describe('AlsService', () => {
  let service: AlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlsService],
    }).compile();

    service = module.get<AlsService>(AlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getprojectName', () => {
    it('should return sanitized project name when available', () => {
      const repositoryId = 123;
      const projectName = 'test-project---';
      
      service.runWithrepositoryInfo(repositoryId, projectName, () => {
        const result = service.getprojectName();
        expect(result).toBe('test-project');
      });
    });

    it('should return undefined when no project name is set', () => {
      const result = service.getprojectName();
      expect(result).toBeUndefined();
    });
  });

  describe('getrepositoryId', () => {
    it('should return repository ID when available', () => {
      const repositoryId = 123;
      const projectName = 'test-project';
      
      service.runWithrepositoryInfo(repositoryId, projectName, () => {
        const result = service.getrepositoryId();
        expect(result).toBe(repositoryId);
      });
    });

    it('should return undefined when no repository ID is set', () => {
      const result = service.getrepositoryId();
      expect(result).toBeUndefined();
    });
  });

  describe('getbranchName and setbranchName', () => {
    it('should set and get branch name', () => {
      const branchName = 'main';
      service.setbranchName(branchName);
      const result = service.getbranchName();
      expect(result).toBe(branchName);
    });

    it('should return undefined when no branch name is set', () => {
      const result = service.getbranchName();
      expect(result).toBeUndefined();
    });
  });
});
