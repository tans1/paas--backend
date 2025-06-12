import { Test, TestingModule } from '@nestjs/testing';
import { DnsService } from './dns.service';
import { ProjectsRepositoryInterface } from '../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Cloudflare from 'cloudflare';
import { exec } from 'child_process';
import { promises as dnsPromises } from 'dns';
import fetch from 'node-fetch';
import { JsonValue } from '@prisma/client/runtime/library';

// Mock external dependencies
jest.mock('cloudflare');
jest.mock('child_process');
jest.mock('dns');
jest.mock('node-fetch');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('DnsService', () => {
  let service: DnsService;
  let mockProjectsRepository: jest.Mocked<ProjectsRepositoryInterface>;
  let mockLogger: jest.Mocked<any>;

  const mockCloudflareApi = {
    dns: {
      records: {
        list: jest.fn(),
        create: jest.fn(),
      },
    },
    zones: {
      list: jest.fn(),
      create: jest.fn(),
      settings: {
        ssl: {
          edit: jest.fn(),
        },
      },
    },
  };

  beforeEach(async () => {
    mockProjectsRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    (Cloudflare as unknown as jest.Mock).mockImplementation(() => mockCloudflareApi);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DnsService,
        {
          provide: ProjectsRepositoryInterface,
          useValue: mockProjectsRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DnsService>(DnsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordExists', () => {
    it('should return null when no record exists', async () => {
      mockCloudflareApi.dns.records.list.mockResolvedValue({ result: [] });

      const result = await service.recordExists('zone123', 'A', 'example.com');
      expect(result).toBeNull();
    });

    it('should return the record when it exists', async () => {
      const mockRecord = { type: 'A', name: 'example.com', content: '1.2.3.4' };
      mockCloudflareApi.dns.records.list.mockResolvedValue({ result: [mockRecord] });

      const result = await service.recordExists('zone123', 'A', 'example.com');
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getRootDomain', () => {
    it('should remove www. prefix', () => {
      expect(service['getRootDomain']('www.example.com')).toBe('example.com');
    });

    it('should return domain as is if no www prefix', () => {
      expect(service['getRootDomain']('example.com')).toBe('example.com');
    });
  });

  describe('createZone', () => {
    it('should return existing zone if found', async () => {
      const existingZone = { id: 'zone123', name: 'example.com' };
      mockCloudflareApi.zones.list.mockResolvedValue({ result: [existingZone] });

      const result = await service.createZone('example.com');
      expect(result).toEqual(existingZone);
    });

    it('should create new zone if none exists', async () => {
      const newZone = { id: 'zone123', name: 'example.com' };
      mockCloudflareApi.zones.list.mockResolvedValue({ result: [] });
      mockCloudflareApi.zones.create.mockResolvedValue({ result: newZone });

      const result = await service.createZone('example.com');
      expect(result).toEqual(newZone);
      expect(mockCloudflareApi.zones.create).toHaveBeenCalledWith({
        name: 'example.com',
        jump_start: true,
      });
    });
  });

  describe('createDNSRecords', () => {
    beforeEach(() => {
      process.env.SERVER_IP = '1.2.3.4';
    });

    it('should create A and CNAME records', async () => {
      const mockARecord = {
        result: {
          id: 'a123',
          type: 'A',
          name: 'example.com',
          content: '1.2.3.4',
          proxiable: true,
          proxied: true,
          ttl: 1,
        }
      };
      const mockCNAMERecord = {
        result: {
          id: 'cname123',
          type: 'CNAME',
          name: 'www.example.com',
          content: 'example.com',
          proxiable: true,
          proxied: true,
          ttl: 1,
        }
      };

      mockCloudflareApi.dns.records.create
        .mockResolvedValueOnce(mockARecord)
        .mockResolvedValueOnce(mockCNAMERecord);

      const result = await service.createDNSRecords('zone123', 'example.com');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockARecord.result);
      expect(result[1]).toEqual(mockCNAMERecord.result);
    });
  });

  describe('checkPropagation', () => {
    it('should return true when DNS propagation is successful', async () => {
      const mockDnsResponse = [{ address: '1.2.3.4' }];
      const mockNsResponse = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];
      
      const mockDnsPromises = {
        resolve4: jest.fn().mockResolvedValue(mockDnsResponse),
        resolveNs: jest.fn().mockResolvedValue(mockNsResponse),
      };
      
      (dnsPromises as any) = mockDnsPromises;
      (fetch as unknown as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await service.checkPropagation(
        'example.com',
        '1.2.3.4',
        ['cloudflare.com'],
      );

      expect(result).toBe(true);
    });

    it('should return false when DNS resolution fails', async () => {
      const mockDnsPromises = {
        resolve4: jest.fn().mockRejectedValue(new Error('DNS resolution failed')),
        resolveNs: jest.fn(),
      };
      
      (dnsPromises as any) = mockDnsPromises;

      const result = await service.checkPropagation(
        'example.com',
        '1.2.3.4',
        ['cloudflare.com'],
      );

      expect(result).toBe(false);
    });
  });

  describe('runDockerCompose', () => {
    it('should execute docker compose command', async () => {
      const mockProject = {
        id: 1,
        name: 'test-project',
        repoId: 1,
        branch: 'main',
        url: 'https://github.com/test/repo',
        linkedByUserId: 1,
        createdAt: new Date(),
        environmentVariables: {} as JsonValue,
        deployedIp: '1.2.3.4',
        deployedPort: 3000,
        deployedUrl: 'https://example.com',
        localRepoPath: '/path/to/project',
        zoneId: null,
        aRecordId: null,
        cnameRecordId: null,
      };
      
      mockProjectsRepository.findById.mockResolvedValue(mockProject);
      (exec as unknown as jest.Mock).mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: 'Success', stderr: '' });
      });

      await service.runDockerCompose('example.com', 1);

      expect(exec).toHaveBeenCalled();
      expect(mockProjectsRepository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('notifyUser', () => {
    it('should update project with DNS record IDs', async () => {
      await service.notifyUser(
        'example.com',
        'user123',
        1,
        'zone123',
        'a123',
        'cname123',
        'Deployment successful',
      );

      expect(mockProjectsRepository.update).toHaveBeenCalledWith(1, {
        zoneId: 'zone123',
        aRecordId: 'a123',
        cnameRecordId: 'cname123',
      });
    });
  });
});
