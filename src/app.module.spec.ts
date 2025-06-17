import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 1) Mock passport-oauth2 so its strategy ctor never runs
jest.mock('passport-oauth2', () => ({
  OAuth2Strategy: jest.fn().mockImplementation(() => ({})),
}));

// 2) Stub out ioredis so no real connection is attempted
jest.mock('ioredis', () => {
  return {
    // Called by RedisModule.forRoot() under the hood
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),    // swallow all events
      scan: jest.fn(),
      xadd: jest.fn(),
      xrange: jest.fn(),
      del: jest.fn(),
    })),
  };
});

// 3) Stub RedisModule.forRoot so it registers our mocked client
jest.mock('@nestjs-modules/ioredis', () => ({
  RedisModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class DummyRedisModule {},
      providers: [],
      exports: [],
    }),
  },
}));

// 4) Stub BullModule.forRoot (since it also creates a Redis connection)
jest.mock('@nestjs/bullmq', () => ({
  BullModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class DummyBullModule {},
      providers: [],
      exports: [],
    }),
  },
}));

// 5) Stub WinstonModule.forRoot to avoid deep dependencies
jest.mock('nest-winston', () => ({
  WinstonModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class DummyWinstonModule {},
      providers: [],
      exports: [],
    }),
  },
  utilities: {
    format: {
      combine: jest.fn().mockReturnThis(),
      timestamp: jest.fn().mockReturnThis(),
      ms: jest.fn().mockReturnThis(),
      nestLike: jest.fn().mockReturnValue(() => {}),
    },
  },
}));

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('compiles successfully', () => {
    expect(module).toBeDefined();
  });

  it('provides AppService', () => {
    const svc = module.get<AppService>(AppService);
    expect(svc).toBeInstanceOf(AppService);
  });

  it('provides AppController', () => {
    const ctrl = module.get<AppController>(AppController);
    expect(ctrl).toBeInstanceOf(AppController);
  });
});
