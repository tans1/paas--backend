import { Test, TestingModule } from '@nestjs/testing';
import { NestJsModule } from './nestjs.module';
import { NestJsProjectService } from './nestjs-project-service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NestJsModule', () => {
  let module: TestingModule;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [NestJsModule],
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

  it('should provide NestJsProjectService', () => {
    const service = module.get<NestJsProjectService>(NestJsProjectService);
    expect(service).toBeDefined();
  });

  it('should provide EventEmitter2', () => {
    expect(eventEmitter).toBeDefined();
    expect(eventEmitter.emit).toBeDefined();
    expect(eventEmitter.on).toBeDefined();
  });
}); 