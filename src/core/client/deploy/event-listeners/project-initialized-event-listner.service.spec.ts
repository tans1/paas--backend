import { Test, TestingModule } from '@nestjs/testing';
import { ProjectInitializedEventListenerService } from './project-initialized-event-listner.service';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '../../../../utils/als/als.service';
import { UsersService } from '../../../../resources/users/users.service';
import { Logger } from '@nestjs/common';

describe('ProjectInitializedEventListenerService', () => {
  let service: ProjectInitializedEventListenerService;
  let repositoryBootstrapService: RepositoryBootstrapService;
  let eventEmitter: EventEmitter2;
  let alsService: AlsService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectInitializedEventListenerService,
        {
          provide: RepositoryBootstrapService,
          useValue: { bootstrapRepository: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: AlsService,
          useValue: { setbranchName: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProjectInitializedEventListenerService>(ProjectInitializedEventListenerService);
    repositoryBootstrapService = module.get<RepositoryBootstrapService>(RepositoryBootstrapService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    alsService = module.get<AlsService>(AlsService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process project and call bootstrapRepository', async () => {
    const payload = {
      repository: { full_name: 'owner/repo', clone_url: 'https://github.com/owner/repo.git' },
      branch: 'main',
      email: 'test@example.com',
    };
    const user = { githubAccessToken: 'token' };
    (usersService.findOneBy as jest.Mock).mockResolvedValue(user);
    (repositoryBootstrapService.bootstrapRepository as jest.Mock).mockResolvedValue(undefined);

    await service.processProject(payload);

    expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
    expect(alsService.setbranchName).toHaveBeenCalledWith('main');
    expect(repositoryBootstrapService.bootstrapRepository).toHaveBeenCalledWith(
      'https://github.com/owner/repo.git',
      expect.any(String),
      'main',
      'token',
    );
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('should log error if repository info is missing', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    (usersService.findOneBy as jest.Mock).mockResolvedValue({ githubAccessToken: 'token' });
    await service.processProject({ repository: {}, branch: 'main', email: 'test@example.com' });
    expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid payload: missing repository information.');
    loggerErrorSpy.mockRestore();
  });

  it('should log error if user is not found', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    (usersService.findOneBy as jest.Mock).mockResolvedValue(undefined);
    await service.processProject({ repository: { full_name: 'owner/repo', clone_url: 'url' }, branch: 'main', email: 'notfound@example.com' });
    expect(loggerErrorSpy).toHaveBeenCalledWith('User not found for email: notfound@example.com');
    loggerErrorSpy.mockRestore();
  });
});
