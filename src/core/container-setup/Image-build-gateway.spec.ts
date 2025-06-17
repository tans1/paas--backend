import { Test, TestingModule } from '@nestjs/testing';
import { ImageBuildGateway } from './gateway/Image-build-gateway';
import { Server, Socket } from 'socket.io';

describe('ImageBuildGateway', () => {
  let gateway: ImageBuildGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    // Mock server with required methods
    mockServer = {
      emit: jest.fn(),
      // adapter: {
      //   allRooms: jest.fn(),
      // },
    };

    // Mock socket with complete handshake data
    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        query: {
          repositoryId: '123',
          branch: 'main',
          type: 'build'
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
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageBuildGateway],
    }).compile();

    gateway = module.get<ImageBuildGateway>(ImageBuildGateway);
    gateway.server = mockServer as Server;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should initialize with empty subscribers map', () => {
      expect(gateway['buildSubscribers'].size).toBe(0);
    });
  });

  describe('handleConnection', () => {
    it('should add client to subscribers map when all required parameters are present', () => {
      gateway.handleConnection(mockSocket as Socket);
      expect(gateway['buildSubscribers'].size).toBe(1);
      expect(gateway['buildSubscribers'].get('123:main:build')).toBeDefined();
    });

    it('should not add client when missing required parameters', () => {
      const socketWithoutParams = {
        ...mockSocket,
        handshake: {
          query: {}
        }
      };
      gateway.handleConnection(socketWithoutParams as Socket);
      expect(gateway['buildSubscribers'].size).toBe(0);
    });

    it('should handle multiple connections with different parameters', () => {
      const socket2 = {
        ...mockSocket,
        id: 'test-socket-id-2',
        handshake: {
          query: {
            repositoryId: '456',
            branch: 'dev',
            type: 'test'
          }
        }
      };

      gateway.handleConnection(mockSocket as Socket);
      gateway.handleConnection(socket2 as unknown as Socket);

      expect(gateway['buildSubscribers'].size).toBe(2);
      expect(gateway['buildSubscribers'].get('123:main:build')).toBeDefined();
      expect(gateway['buildSubscribers'].get('456:dev:test')).toBeDefined();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from subscribers map on disconnect', () => {
      gateway.handleConnection(mockSocket as Socket);
      expect(gateway['buildSubscribers'].size).toBe(1);

      gateway.handleDisconnect(mockSocket as Socket);
      expect(gateway['buildSubscribers'].size).toBe(0);
    });

    it('should handle disconnect when client is not in subscribers map', () => {
      gateway.handleDisconnect(mockSocket as Socket);
      expect(gateway['buildSubscribers'].size).toBe(0);
    });
  });

  describe('sendLogToUser', () => {
    const repositoryId = 123;
    const branch = 'main';
    const logType = 'build';
    const logMessage = 'Test log message';

    beforeEach(() => {
      // Reset mockSocket.emit before each test
      jest.clearAllMocks();
      gateway.handleConnection(mockSocket as Socket);
    });

    it('should emit log message to correct client', () => {
      gateway.sendLogToUser(repositoryId, branch, logType, logMessage);
      expect(mockSocket.emit).toHaveBeenCalledWith(`${logType}Log`, logMessage);
    });

    it('should emit completion event when complete flag is true', () => {
      gateway.sendLogToUser(repositoryId, branch, logType, logMessage, true);
      expect(mockSocket.emit).toHaveBeenCalledWith('buildComplete', logMessage);
    });

    it('should not emit when client is not found', () => {
      gateway.handleDisconnect(mockSocket as Socket);
      gateway.sendLogToUser(repositoryId, branch, logType, logMessage);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle multiple clients with different parameters', () => {
      const socket2 = {
        ...mockSocket,
        id: 'test-socket-id-2',
        handshake: {
          query: {
            repositoryId: '456',
            branch: 'dev',
            type: 'test'
          }
        }
      };

      gateway.handleConnection(mockSocket as Socket);
      gateway.handleConnection(socket2 as unknown as Socket);

      gateway.sendLogToUser(repositoryId, branch, logType, logMessage);
      expect(mockSocket.emit).toHaveBeenCalledWith(`${logType}Log`, logMessage);
      expect((socket2 as unknown as Socket).emit).toHaveBeenCalledWith(`${logType}Log`, logMessage);
    });
  });

  // describe('getKey', () => {
  //   it('should combine repositoryId, branch, and logType correctly', () => {
  //     const result = gateway.getKey(123, 'main', 'build');
  //     expect(result).toBe('123:main:build');
  //   });

  //   it('should handle different parameter combinations', () => {
  //     expect(gateway.getKey(456, 'dev', 'test')).toBe('456:dev:test');
  //     expect(gateway.getKey(789, 'feature/abc', 'deploy')).toBe('789:feature/abc:deploy');
  //   });
  // });
});