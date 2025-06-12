import { Test, TestingModule } from '@nestjs/testing';
import { ReactModule } from './react.module';
import { ReactProjectService } from './react-project-service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ReactModule', () => {
  let module: TestingModule;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    process.env.DEPLOYMENT_HASH = 'testhash';
    module = await Test.createTestingModule({
      imports: [ReactModule],
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

  it('should provide ReactProjectService', () => {
    const service = module.get<ReactProjectService>(ReactProjectService);
    expect(service).toBeDefined();
  });

  it('should provide EventEmitter2', () => {
    expect(eventEmitter).toBeDefined();
    expect(eventEmitter.emit).toBeDefined();
    expect(eventEmitter.on).toBeDefined();
  });
});