import { Test, TestingModule } from '@nestjs/testing';
import { VueModule } from './vue.module';
import { VueProjectService } from './vue-project-service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VueModule', () => {
  let module: TestingModule;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [VueModule],
      providers: [
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide VueProjectService', () => {
    const service = module.get<VueProjectService>(VueProjectService);
    expect(service).toBeDefined();
  });

  it('should provide EventEmitter2', () => {
    expect(eventEmitter).toBeDefined();
    expect(eventEmitter.emit).toBeDefined();
    expect(eventEmitter.on).toBeDefined();
  });
}); 