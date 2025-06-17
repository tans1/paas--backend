import { Test, TestingModule } from '@nestjs/testing';
import { AlsService } from './als.service';
import * as uuid from 'uuid';

describe('AlsService', () => {
  let service: AlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlsService],
    }).compile();

    service = module.get<AlsService>(AlsService);
  });

  describe('Initialization', () => {
    it('should initialize context successfully', () => {
      service.initContext();

      // Verify store exists after initialization
      const store = service['als'].getStore();
      expect(store).toBeDefined();
      expect(store.size).toBe(0);
    });
  });

  describe('Repository ID Operations', () => {
    it('should get undefined repositoryId initially', () => {
      service.initContext();
      expect(service.getrepositoryId()).toBeUndefined();
    });

    it('should set and get repositoryId correctly', () => {
      service.initContext();
      const testId = 123;
      service.setRepositoryId(testId);
      expect(service.getrepositoryId()).toBe(testId);
    });
  });

  describe('Project Name Operations', () => {
    it('should handle empty project name', () => {
      service.initContext();
      service.setProjectName('');
      expect(service.getprojectName()).toBeUndefined();
    });

    it('should sanitize project name correctly', () => {
      service.initContext();
      const originalName = '123 !@#$%^&*() My Project 123 !@#$%^&*()';
      service.setProjectName(originalName);
      const expected = 'amy-project-123';
      expect(service.getprojectName()).toBe(expected);
    });

    it('should preserve alphanumeric characters in project name', () => {
      service.initContext();
      const originalName = 'MyProject123';
      service.setProjectName(originalName);
      const expected = 'myproject123';
      expect(service.getprojectName()).toBe(expected);
    });
  });

  describe('Branch Name Operations', () => {
    it('should get undefined branchName initially', () => {
      service.initContext();
      expect(service.getbranchName()).toBeUndefined();
    });

    it('should set and get branchName correctly', () => {
      service.initContext();
      const testBranch = 'feature/test';
      service.setbranchName(testBranch);
      expect(service.getbranchName()).toBe(testBranch);
    });
  });

  describe('Framework Operations', () => {
    it('should get undefined framework initially', () => {
      service.initContext();
      expect(service.getframework()).toBeUndefined();
    });

    it('should set and get framework correctly', () => {
      service.initContext();
      const testFramework = 'NestJS';
      service.setframework(testFramework);
      expect(service.getframework()).toBe(testFramework);
    });
  });

  describe('Last Commit Message Operations', () => {
    it('should get undefined lastCommitMessage initially', () => {
      service.initContext();
      expect(service.getLastCommitMessage()).toBeUndefined();
    });

    it('should set and get lastCommitMessage correctly', () => {
      service.initContext();
      const testMessage = 'Initial commit';
      service.setLastCommitMessage(testMessage);
      expect(service.getLastCommitMessage()).toBe(testMessage);
    });
  });

  describe('Extension Operations', () => {
    it('should generate unique extension on each call', () => {
      service.initContext();

      const mockUuid = jest.spyOn(uuid, 'v4');

      // Set the extension first
      service.setExtension();
      const ext1 = service.getExtension();
      
      service.setExtension();
      const ext2 = service.getExtension();

      expect(ext1).toBeDefined();
      expect(ext2).toBeDefined();
      expect(typeof ext1).toBe('string');
      expect(ext1).not.toBe(ext2);
      expect(mockUuid).toHaveBeenCalled();
    });
  });

  describe('Context Isolation', () => {
    it('should maintain separate contexts', async () => {
      // Create first context
      service.initContext();
      service.setRepositoryId(1);

      // Create second context
      service.initContext();
      service.setRepositoryId(2);

      expect(service.getrepositoryId()).toBe(2);
    });
  });

  describe('Error Cases', () => {
    it('should handle operations without initialization gracefully', () => {
      expect(() => service.getrepositoryId()).not.toThrow();
      expect(() => service.getprojectName()).not.toThrow();
      expect(() => service.getbranchName()).not.toThrow();
      expect(() => service.getframework()).not.toThrow();
      expect(() => service.getLastCommitMessage()).not.toThrow();
      expect(() => service.getExtension()).not.toThrow();
    });
  });
});