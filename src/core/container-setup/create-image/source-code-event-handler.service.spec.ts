import { SourceCodeEventHandlerService } from './source-code-event-handler.service';
import { ImageBuildService } from './image-build.service';
import { DeploymentRepositoryInterface, CreateDeploymentDTO } from '../../../infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { AlsService } from '../../../utils/als/als.service';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface, StatusEnum } from '../../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { RuntimeLogService } from './containter-runtime-log.service';
import { DeploymentUtilsService } from '../deployment-utils/deployment-utils.service';
import { ManageContainerService } from '../manage-containers/manage-containers.service';
import { DeploymentEventsGateway } from '../gateway/deployment-event/deployment-events.gateway';
import { DockerComposeFileService } from '../docker-compose/dockerComposeFile.service';
import { DockerComposeService } from '../docker-compose/dockerCompose.service';
import { DockerHubService } from './docker-hub.service';
import { LogType } from '../enums/log-type.enum';
import { HttpException } from '@nestjs/common';

describe('SourceCodeEventHandlerService', () => {
  let service: SourceCodeEventHandlerService;
  // mocks
  const imgBuild = { buildImage: jest.fn(), removeImage: jest.fn() };
  const deployRepo = { create: jest.fn(), update: jest.fn() };
  const als = {
    getrepositoryId: () => 11,
    getbranchName: () => 'feat',
    getprojectName: () => 'proj',
    getExtension: () => '.ext',
    getLastCommitMessage: () => null,
  };
  const dockerLog = { logMessage: jest.fn() };
  const projRepo = {
    findByRepoAndBranch: jest.fn(),
    update: jest.fn(),
  };
  const runtimeLog = { streamContainerLogs: jest.fn() };
  const utils = {
    getLatestContainerName: jest.fn(),
    getLatestImageName: jest.fn(),
    getDeployedUrl: jest.fn().mockReturnValue('http://app'),
  };
  const manage = { rm: jest.fn() };
  const eventsGw = { sendNewDeploymentEvent: jest.fn(), sendDeploymentUpdateEvent: jest.fn() };
  const dcFile = { createDockerComposeFile: jest.fn() };
  const dcService = { up: jest.fn() };
  const dockerHub = { pushImage: jest.fn() };

  beforeEach(() => {
    service = new SourceCodeEventHandlerService(
      imgBuild as any,
      deployRepo as any,
      als as AlsService,
      dockerLog as any,
      projRepo as any,
      runtimeLog as any,
      utils as any,
      manage as any,
      eventsGw as any,
      dcFile as any,
      dcService as any,
      dockerHub as any,
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('handles happy path', async () => {
    // project returned
    projRepo.findByRepoAndBranch.mockResolvedValue({
      id: 42,
      deployments: [{ containerName: 'oldC', imageName: 'oldI', id: 7 }],
      lastCommitMessage: 'initial',
    });
    // create returns deployment with id
    const newDeploy = { id: 99 };
    deployRepo.create.mockResolvedValue(newDeploy as any);
    utils.getLatestContainerName.mockReturnValue('oldC');
    utils.getLatestImageName.mockReturnValue('oldI');
    dcFile.createDockerComposeFile.mockResolvedValue(['img','ctr','dc.yml']);

    await service.handleSourceCodeReady({ projectPath: '/app', dockerFile: 'Df' });

    // create called
    expect(deployRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 42, status: 'in-progress', branch: 'feat',
    }));
    // log start
    expect(dockerLog.logMessage).toHaveBeenCalledWith(
      `Deployment started for project: 42`,11,'feat',LogType.BUILD,99,
    );
    // build image
    expect(imgBuild.buildImage).toHaveBeenCalledWith(
      '/app',11,99,'feat','img','Df',
    );
    // compose up
    expect(dcService.up).toHaveBeenCalledWith('/app','dc.yml','.ext','proj');
    // runtime logs
    expect(runtimeLog.streamContainerLogs).toHaveBeenCalledWith('ctr',11,'feat',99);
    // project update, deployment update
    expect(projRepo.update).toHaveBeenCalled();
    expect(deployRepo.update).toHaveBeenCalledWith(99, expect.objectContaining({ status: 'deployed' }));
    // final log & push
    expect(dockerLog.logMessage).toHaveBeenCalledWith(
      `Project 42 is now running on http://app`,11,'feat',LogType.BUILD,99,true,
    );
    expect(dockerHub.pushImage).toHaveBeenCalledWith('img',11,'feat',99);
    // cleanup old
    expect(manage.rm).toHaveBeenCalledWith('oldC','/app');
    expect(imgBuild.removeImage).toHaveBeenCalledWith('oldI','/app');
    // final status RUNNING
    expect(projRepo.update).toHaveBeenCalledWith(42, expect.objectContaining({ status: StatusEnum.RUNNING }));
    expect(eventsGw.sendDeploymentUpdateEvent).toHaveBeenCalledWith(
      11,'feat', expect.objectContaining({ deploymentId:99, status:'deployed' })
    );
  });

  it('errors and marks deployment failed', async () => {
    projRepo.findByRepoAndBranch.mockRejectedValueOnce(new Error('oops'));
    await expect(service.handleSourceCodeReady({ projectPath:'/x'}))
      .rejects.toThrow(HttpException);

    // since create failed early, no update on deployRepo
    expect(deployRepo.create).not.toHaveBeenCalled();
  });
});
