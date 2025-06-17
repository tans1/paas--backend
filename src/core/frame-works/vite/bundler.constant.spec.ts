import { BundlerMap } from './bundler.constants';

describe('BundlerMap', () => {
  it('should contain all required bundlers', () => {
    const expectedBundlers = ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'fusebox'];
    expectedBundlers.forEach(bundler => {
      expect(BundlerMap[bundler]).toBeDefined();
    });
  });

  it('should have correct structure for each bundler', () => {
    Object.entries(BundlerMap).forEach(([key, value]) => {
      expect(value).toHaveProperty('defaultBuildLocation');
      expect(value).toHaveProperty('dependancy');
      expect(typeof value.defaultBuildLocation).toBe('string');
      expect(typeof value.dependancy).toBe('string');
    });
  });

  it('should have correct build locations', () => {
    expect(BundlerMap.webpack.defaultBuildLocation).toBe('build');
    expect(BundlerMap.vite.defaultBuildLocation).toBe('dist');
    expect(BundlerMap.rollup.defaultBuildLocation).toBe('dist');
    expect(BundlerMap.parcel.defaultBuildLocation).toBe('dist');
    expect(BundlerMap.esbuild.defaultBuildLocation).toBe('dist');
    expect(BundlerMap.fusebox.defaultBuildLocation).toBe('dist');
  });

  it('should have correct dependencies', () => {
    expect(BundlerMap.webpack.dependancy).toBe('webpack');
    expect(BundlerMap.vite.dependancy).toBe('vite');
    expect(BundlerMap.rollup.dependancy).toBe('rollup');
    expect(BundlerMap.parcel.dependancy).toBe('parcel');
    expect(BundlerMap.esbuild.dependancy).toBe('esbuild');
    expect(BundlerMap.fusebox.dependancy).toBe('fuse-box');
  });
}); 