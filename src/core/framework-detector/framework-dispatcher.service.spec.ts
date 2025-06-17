import { FrameworkDispatcherService } from './framework-dispatcher.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../events/event.module';
import { FrameworkMap } from './framework.config';

describe('FrameworkDispatcherService', () => {
  let service: FrameworkDispatcherService;
  let emitter: { emit: jest.Mock };
  let alsService: { getframework: jest.Mock };

  beforeEach(() => {
    emitter = { emit: jest.fn() };
    alsService = { getframework: jest.fn() };
    service = new FrameworkDispatcherService(emitter as any, alsService as any);
  });

  it('reads framework from AlsService and emits correct event', async () => {
    alsService.getframework.mockReturnValue('React');
    const payload = { projectPath: '/path/to/proj' };

    await service.handleEvent(payload);

    expect(alsService.getframework).toHaveBeenCalled();
    const expectedConfig = FrameworkMap['React'].file;
    expect(emitter.emit).toHaveBeenCalledWith(
      `${EventNames.FRAMEWORK_DETECTED}.React`,
      {
        projectPath: '/path/to/proj',
        framework: 'React',
        configFile: expectedConfig,
      },
    );
  });

  it('works for a different framework key', async () => {
    alsService.getframework.mockReturnValue('Docker');
    const payload = { projectPath: '/dkr' };

    await service.handleEvent(payload);

    expect(emitter.emit).toHaveBeenCalledWith(
      `${EventNames.FRAMEWORK_DETECTED}.Docker`,
      {
        projectPath: '/dkr',
        framework: 'Docker',
        configFile: FrameworkMap['Docker'].file,
      },
    );
  });
});
