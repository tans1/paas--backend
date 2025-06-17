import { FrameworkMap } from './framework.config';

describe('FrameworkMap', () => {
  const expectedKeys = [
    'React',
    'Vue',
    'Angular',
    'NestJS',
    'Docker',
    'NextJs',
    'CreateReactApp',
    'Vite',
    'Python',
  ];

  it('has exactly the expected framework keys', () => {
    const keys = Object.keys(FrameworkMap);
    expect(keys).toHaveLength(expectedKeys.length);
    expect(keys.sort()).toEqual(expectedKeys.sort());
  });

  it('each framework definition has the required shape', () => {
    Object.entries(FrameworkMap).forEach(([key, def]) => {
      // name matches key
      expect(def.name).toBe(key);

      // file is string or array of strings
      expect(
        typeof def.file === 'string' ||
          (Array.isArray(def.file) &&
            def.file.every((f) => typeof f === 'string'))
      ).toBe(true);

      // sort is a number
      expect(typeof def.sort).toBe('number');

      // dependencies, if present, is an array of strings
      if ('dependencies' in def) {
        expect(Array.isArray(def.dependencies)).toBe(true);
        def.dependencies!.forEach((d) => expect(typeof d).toBe('string'));
      }

      // settings, if present, has the four command groups
      if ('settings' in def) {
        const s = def.settings!;
        ['installCommand', 'buildCommand', 'runCommand', 'outputDirectory'].forEach((group) => {
          expect(group in s).toBe(true);
          const cfg = (s as any)[group];
          expect(typeof cfg.placeholder).toBe('string');
          expect(typeof cfg.value).toBe('string');
        });
      }
    });
  });
});
