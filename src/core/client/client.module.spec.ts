import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from './client.module';
import { ClientController } from './client.controller';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/resources/auth/auth.module';

describe('ClientModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ClientController', () => {
    const controller = module.get<ClientController>(ClientController);
    expect(controller).toBeDefined();
  });

  it('should provide EventEmitter2', () => {
    const eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    expect(eventEmitter).toBeDefined();
  });
}); 