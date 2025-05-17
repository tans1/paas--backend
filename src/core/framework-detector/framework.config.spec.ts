import { FrameworkMap, FrameworkKey, FrameworkDefinition } from './framework.config';

describe('FrameworkConfig', () => {
  it('should contain all required frameworks', () => {
    const expectedFrameworks: FrameworkKey[] = ['React', 'Vue', 'Angular', 'NestJS', 'Express'];
    expectedFrameworks.forEach(framework => {
      expect(FrameworkMap[framework]).toBeDefined();
    });
  });

  it('should have correct structure for each framework', () => {
    Object.entries(FrameworkMap).forEach(([key, value]) => {
      expect(value).toHaveProperty('name');
      expect(value).toHaveProperty('file');
      expect(value).toHaveProperty('dependencies');
      expect(value.name).toBe(key);
      expect(value.file).toBe('package.json');
      expect(Array.isArray(value.dependencies)).toBe(true);
    });
  });

  it('should have correct dependencies for each framework', () => {
    expect(FrameworkMap.React.dependencies).toContain('react');
    expect(FrameworkMap.Vue.dependencies).toContain('vue');
    expect(FrameworkMap.Angular.dependencies).toContain('@angular/core');
    expect(FrameworkMap.NestJS.dependencies).toContain('@nestjs/core');
    expect(FrameworkMap.Express.dependencies).toContain('express');
  });
}); 