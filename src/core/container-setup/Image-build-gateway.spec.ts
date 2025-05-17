import { Test, TestingModule } from '@nestjs/testing';
import { ImageBuildGateway } from './Image-build-gateway';
import { Socket, Server } from 'socket.io';

describe('ImageBuildGateway', () => {
  let gateway: ImageBuildGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        query: {
          repositoryId: '123',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: 0,
        url: '',
        auth: {},
      },
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageBuildGateway],
    }).compile();

    gateway = module.get<ImageBuildGateway>(ImageBuildGateway);
    gateway.server = mockServer as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should add user to users map when repositoryId is provided', () => {
      gateway.handleConnection(mockSocket as Socket);
      expect(gateway['users'].get('123')).toBeDefined();
    });

    it('should not add user to users map when repositoryId is not provided', () => {
      const socketWithoutRepoId = {
        ...mockSocket,
        handshake: { 
          ...mockSocket.handshake,
          query: {} 
        },
      };
      gateway.handleConnection(socketWithoutRepoId as Socket);
      expect(gateway['users'].size).toBe(0);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from users map on disconnect', () => {
      gateway.handleConnection(mockSocket as Socket);
      expect(gateway['users'].size).toBe(1);
      
      gateway.handleDisconnect(mockSocket as Socket);
      expect(gateway['users'].size).toBe(0);
    });
  });

  describe('sendLogToUser', () => {
    it('should emit log message to correct user', () => {
      gateway.handleConnection(mockSocket as Socket);
      
      const logMessage = 'Test log message';
      gateway.sendLogToUser(123, logMessage);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('deploymentLog', logMessage);
    });

    it('should not emit log message if user not found', () => {
      const logMessage = 'Test log message';
      gateway.sendLogToUser(999, logMessage);
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
}); 