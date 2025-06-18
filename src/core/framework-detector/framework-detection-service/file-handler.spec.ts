import {
  packageJsonHandler,
  requirementsHandler,
  pyprojectHandler,
  dockerHandler,
} from './file-handler';
import { FrameworkDefinition } from '../framework.config';

describe('FileHandlers', () => {
  describe('packageJsonHandler', () => {
    const criteria: FrameworkDefinition = {
        dependencies: ['foo'], sort: 0, file: '',
        name: 'Name'
    };

    it('returns true when dependency present in dependencies', () => {
      const content = JSON.stringify({ dependencies: { foo: '1.0' }, devDependencies: {} });
      expect(packageJsonHandler(content, criteria)).toBe(true);
    });

    it('returns true when dependency present in devDependencies', () => {
      const content = JSON.stringify({ dependencies: {}, devDependencies: { foo: '1.0' } });
      expect(packageJsonHandler(content, criteria)).toBe(true);
    });

    it('returns false for invalid JSON', () => {
      expect(packageJsonHandler('not-json', criteria)).toBe(false);
    });

    it('returns false when dependency missing', () => {
      const content = JSON.stringify({ dependencies: {}, devDependencies: {} });
      expect(packageJsonHandler(content, criteria)).toBe(false);
    });
  });

  describe('requirementsHandler', () => {
    const criteria: FrameworkDefinition = {
        dependencies: ['bar'], sort: 0, file: '',
        name: 'Name'
    };

    it('returns true when package listed before version', () => {
      const content = `foo==1.0\nbar>=2.0\nbaz`;
      expect(requirementsHandler(content, criteria)).toBe(true);
    });

    it('returns false when missing', () => {
      const content = `foo\nbaz`;
      expect(requirementsHandler(content, criteria)).toBe(false);
    });
  });

  describe('pyprojectHandler', () => {
    const criteria: FrameworkDefinition = {
        dependencies: ['baz'], sort: 0, file: '',
        name: 'Name'
    };

    it('returns true when baz listed under [tool.poetry.dependencies]', () => {
      const content = `
[tool.poetry.dependencies]
foo = "1.0"
baz = "^3.0"

[tool.poetry.group.dev.dependencies]
`;
      expect(pyprojectHandler(content, criteria)).toBe(true);
    });

    it('returns false if section missing', () => {
      const content = `some unrelated text`;
      expect(pyprojectHandler(content, criteria)).toBe(false);
    });
  });

  describe('dockerHandler', () => {
    it('returns true when dependencies array is empty', () => {
      expect(dockerHandler('anything', {
          dependencies: [], sort: 0, file: '',
          name: 'Name'
      })).toBe(true);
    });

    it('returns true when content includes dependency', () => {
      expect(dockerHandler('FROM node\nRUN install dep', {
          dependencies: ['dep'], sort: 0, file: '',
          name: 'Name'
      })).toBe(true);
    });

    it('returns false when dependency missing', () => {
      expect(dockerHandler('FROM node', {
          dependencies: ['dep'], sort: 0, file: '',
          name: 'Name'
      })).toBe(false);
    });
  });
});
