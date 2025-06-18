import { Framework } from './frameworks.enum';

describe('Framework Enum', () => {
  it('should have correct values', () => {
    expect(Framework.NodeJS).toBe('Node.js');
    expect(Framework.Python).toBe('Python');
    expect(Framework.Go).toBe('Go');
  });

  it('should have all required frameworks', () => {
    const frameworks = Object.values(Framework);
    expect(frameworks).toContain('Node.js');
    expect(frameworks).toContain('Python');
    expect(frameworks).toContain('Go');
  });

  it('should have unique values', () => {
    const values = Object.values(Framework);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
}); 