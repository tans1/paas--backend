import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService } from './environment.service';
import { AlsService } from '../als/als.service';
import { Readable } from 'stream';
describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;
  let alsService: AlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: AlsService,
          useValue: {
            getprojectName: jest.fn(() => 'test'),
            getExtension: jest.fn(() => 'env'),
          },
        },
      ],
    }).compile();

    environmentService = module.get<EnvironmentService>(EnvironmentService);
    alsService = module.get<AlsService>(AlsService);
  });

  it('should process environment', async () => {
    const envVars = { test: 'test' };
    const envFile = Buffer.from('test=test');
    const result = await environmentService.processEnvironment(
      JSON.stringify(envVars),
      {
          buffer: envFile, originalname: 'test.env',
          fieldname: '',
          encoding: '',
          mimetype: '',
          size: 0,
          stream: new Readable,
          destination: '',
          filename: '',
          path: ''
      },
    );
    expect(result).toEqual({ test: 'test' });
  });});