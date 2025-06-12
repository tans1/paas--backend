import { Test, TestingModule } from '@nestjs/testing';
import { AngularProjectService } from './angular-project-service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../../events/event.module';

describe('AngularProjectService', () => {
  let service: AngularProjectService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngularProjectService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AngularProjectService>(AngularProjectService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAngularProject', () => {
    it('should process Angular project correctly', async () => {
      const mockProjectPath = '/test/project/path';
      const payload = { projectPath: mockProjectPath };

      await service.processAngularProject(payload);
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should handle errors during project processing', async () => {
      const mockProjectPath = '/invalid/path';
      const payload = { projectPath: mockProjectPath };

      await expect(service.processAngularProject(payload)).rejects.toThrow();
    });
  });
}); 