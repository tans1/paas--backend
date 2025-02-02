import { Test, TestingModule } from '@nestjs/testing';
import { NodeProjectScannerService } from './node-project-scanner.service';

describe('NodeProjectScannerService', () => {
  let service: NodeProjectScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodeProjectScannerService],
    }).compile();

    service = module.get<NodeProjectScannerService>(NodeProjectScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
