import { DeploymentDto } from './deployment.dto';

describe('DeploymentDto', () => {
  it('should be defined', () => {
    expect(DeploymentDto).toBeDefined();
  });

  it('should have required properties', () => {
    const dto = new DeploymentDto();
    dto.id = 1;
    dto.projectId = 123;
    dto.status = 'completed';
    dto.branch = 'main';
    dto.createdAt = new Date();

    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('projectId');
    expect(dto).toHaveProperty('status');
    expect(dto).toHaveProperty('branch');
    expect(dto).toHaveProperty('createdAt');
  });

  it('should have optional properties', () => {
    const dto = new DeploymentDto();
    dto.environmentVariables = { NODE_ENV: 'production' };
    dto.rollbackToId = 2;
    dto.rollbackedDeployments = [];
    dto.logs = [];

    expect(dto).toHaveProperty('environmentVariables');
    expect(dto).toHaveProperty('rollbackToId');
    expect(dto).toHaveProperty('rollbackedDeployments');
    expect(dto).toHaveProperty('logs');
  });

  it('should validate property types', () => {
    const dto = new DeploymentDto();
    dto.id = 1;
    dto.projectId = 123;
    dto.status = 'completed';
    dto.branch = 'main';
    dto.createdAt = new Date();
    dto.environmentVariables = { NODE_ENV: 'production' };
    dto.rollbackToId = 2;
    dto.rollbackedDeployments = [];
    dto.logs = [];

    expect(typeof dto.id).toBe('number');
    expect(typeof dto.projectId).toBe('number');
    expect(typeof dto.status).toBe('string');
    expect(typeof dto.branch).toBe('string');
    expect(dto.createdAt instanceof Date).toBe(true);
    expect(typeof dto.environmentVariables).toBe('object');
    expect(typeof dto.rollbackToId).toBe('number');
    expect(Array.isArray(dto.rollbackedDeployments)).toBe(true);
    expect(Array.isArray(dto.logs)).toBe(true);
  });
}); 