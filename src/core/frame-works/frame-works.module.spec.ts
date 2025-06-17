import { Test, TestingModule } from '@nestjs/testing';
import { FrameWorksModule } from './frame-works.module';

// Mock the imported modules to avoid their deep dependencies
jest.mock('./react/react.module', () => ({ ReactModule: class {} }));
jest.mock('./vue/vue.module', () => ({ VueModule: class {} }));
jest.mock('./angular/angular.module', () => ({ AngularModule: class {} }));
jest.mock('./nestjs/nestjs.module', () => ({ NestJsModule: class {} }));
jest.mock('./Docker/docker.module', () => ({ DockerModule: class {} }));
jest.mock('./nextjs/nextjs.module', () => ({ NextJsModule: class {} }));
jest.mock('./create-react-app/react.module', () => ({ CRAModule: class {} }));
jest.mock('./vite/vite.module', () => ({ ViteModule: class {} }));
jest.mock('./python/python.module', () => ({ PythonModule: class {} }));

describe('FrameWorksModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FrameWorksModule],
    }).compile();
  });

  it('should compile', () => {
    expect(module).toBeDefined();
  });

  it('should include all framework modules', () => {
    const metadata = Reflect.getMetadata('imports', FrameWorksModule);
    expect(metadata).toEqual(
      expect.arrayContaining([
        expect.any(Function), // ReactModule
        expect.any(Function), // VueModule
        expect.any(Function), // AngularModule
        expect.any(Function), // NestJsModule
        expect.any(Function), // DockerModule
        expect.any(Function), // NextJsModule
        expect.any(Function), // CRAModule
        expect.any(Function), // ViteModule
        expect.any(Function), // PythonModule
      ]),
    );
    expect(metadata.length).toBe(9);
  });
});
