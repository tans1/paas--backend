import { Test, TestingModule } from '@nestjs/testing';
import { NodeProjectServiceService } from './node-project-service';

describe('NodeProjectServiceService', () => {
  let service: NodeProjectServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodeProjectServiceService],
    }).compile();

    service = module.get<NodeProjectServiceService>(NodeProjectServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
