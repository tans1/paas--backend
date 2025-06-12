import { Test, TestingModule } from '@nestjs/testing';
import { AngularModule } from './angular.module';
import { AngularProjectService } from './angular-project-service';

describe('AngularModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AngularModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AngularProjectService', () => {
    const service = module.get<AngularProjectService>(AngularProjectService);
    expect(service).toBeDefined();
  });
}); 