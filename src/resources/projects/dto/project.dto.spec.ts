import { ProjectDto } from './project.dto';

describe('ProjectDto', () => {
  it('should be defined', () => {
    expect(ProjectDto).toBeDefined();
  });

  it('should have required properties', () => {
    const dto = new ProjectDto();
    dto.id = 1;
    dto.repoId = 123;
    dto.name = 'Test Project';
    dto.url = 'https://github.com/test/project';
    dto.linkedByUserId = 456;
    dto.createdAt = new Date();

    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('repoId');
    expect(dto).toHaveProperty('name');
    expect(dto).toHaveProperty('url');
    expect(dto).toHaveProperty('linkedByUserId');
    expect(dto).toHaveProperty('createdAt');
  });

  it('should have optional properties', () => {
    const dto = new ProjectDto();
    dto.deployedIp = '127.0.0.1';
    dto.deployedPort = 3000;
    dto.deployments = [];

    expect(dto).toHaveProperty('deployedIp');
    expect(dto).toHaveProperty('deployedPort');
    expect(dto).toHaveProperty('deployments');
  });

  it('should validate property types', () => {
    const dto = new ProjectDto();
    dto.id = 1;
    dto.repoId = 123;
    dto.name = 'Test Project';
    dto.url = 'https://github.com/test/project';
    dto.linkedByUserId = 456;
    dto.createdAt = new Date();

    expect(typeof dto.id).toBe('number');
    expect(typeof dto.repoId).toBe('number');
    expect(typeof dto.name).toBe('string');
    expect(typeof dto.url).toBe('string');
    expect(typeof dto.linkedByUserId).toBe('number');
    expect(dto.createdAt instanceof Date).toBe(true);
  });
}); 