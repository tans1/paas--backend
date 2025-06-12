
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientController } from './client.controller';
import { EventNames } from '../events/event.module';
import { AuthModule } from 'src/resources/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

// Mock EventEmitter2
jest.mock('@nestjs/event-emitter', () => ({
  EventEmitter2: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
  })),
}));

describe('ClientController', () => {
  let controller: ClientController;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    // Mock console.log to suppress logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Load .env for AuthModule
        AuthModule, // Provide Public decorator context
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks, including console.log
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should emit PROJECT_UPLOADED event with correct project path', () => {
      const expectedProjectPath =
        'C:\\Users\\user\\Desktop\\Final_Year_Project\\backend\\projects\\my-nestjs-app';

      // Call the upload method
      controller.upload();

      // Verify console.log was called
      expect(console.log).toHaveBeenCalledWith('upload');

      // Verify eventEmitter.emit was called with correct event and payload
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.PROJECT_UPLOADED, {
        projectPath: expectedProjectPath,
      });
    });

    it('should return undefined', () => {
      // Verify the upload method returns undefined (as it has no return statement)
      const result = controller.upload();
      expect(result).toBeUndefined();
    });
  });
})