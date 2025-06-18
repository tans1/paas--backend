import { Test, TestingModule } from '@nestjs/testing';
import { DnsController } from './dns.controller';
import { DnsService } from './dns.service';
import { DNSDto } from './dto/dns.dto';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

describe('DnsController', () => {
  let controller: DnsController;
  let dnsService: jest.Mocked<DnsService>;
  let projectsRepo: jest.Mocked<ProjectsRepositoryInterface>;
  let dnsQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    dnsService = {
      createZone: jest.fn(),
      createDNSRecords: jest.fn(),
      updateSSLSetting: jest.fn(),
      addTraeficConfigFile: jest.fn(),
    } as any;

    projectsRepo = {
      findById: jest.fn(),
      createCustomDomain: jest.fn(),
    } as any;

    dnsQueue = {
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DnsController],
      providers: [
        { provide: DnsService, useValue: dnsService },
        { provide: ProjectsRepositoryInterface, useValue: projectsRepo },
        { provide: getQueueToken('dns-propagation'), useValue: dnsQueue },
      ],
    }).compile();

    controller = module.get(DnsController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createDns › happy path', () => {
    it('creates DNS, enqueues propagation check and returns correct payload', async () => {
      const dto: DNSDto = { domain: 'example.com', projectId: 42 };
      // Cast to any to satisfy TS
      const fakeZone: any = { id: 'z1', name_servers: ['ns1', 'ns2'] };
      const fakeA: any = { id: 'a1' };
      const fakeCname = { id: 'c1' };

      dnsService.createZone.mockResolvedValueOnce(fakeZone);
      dnsService.createDNSRecords.mockResolvedValueOnce([fakeA, fakeCname]);
      projectsRepo.findById.mockResolvedValueOnce({ id: 42 } as any);
      projectsRepo.createCustomDomain.mockResolvedValueOnce(undefined);
      dnsQueue.add.mockResolvedValueOnce(undefined);

      const result = await controller.createDns(dto);

      expect(dnsService.createZone).toHaveBeenCalledWith('example.com');
      expect(dnsService.createDNSRecords).toHaveBeenCalledWith('z1', 'example.com');
      expect(dnsService.updateSSLSetting).toHaveBeenCalledWith('z1');
      expect(dnsService.addTraeficConfigFile).toHaveBeenCalledWith('example.com', 42);
      expect(projectsRepo.findById).toHaveBeenCalledWith(42);
      expect(projectsRepo.createCustomDomain).toHaveBeenCalledWith({
        domain: 'example.com',
        projectId: 42,
      });
      expect(dnsQueue.add).toHaveBeenCalledWith(
        'check-propagation',
        {
          userId: 1,
          domain: 'example.com',
          projectId: 42,
          zoneId: 'z1',
          aRecordId: 'a1',
          cnameRecordId: 'c1',
          name_servers: ['ns1', 'ns2'],
        },
      );

      expect(result).toEqual({
        message:
          'Please remove your existing name servers from your domain registrar and update it with these nameservers:',
        nameservers: ['ns1', 'ns2'],
        next_steps: [
          'Update nameservers at your domain registrar',
          'Propagation typically takes 24-48 hours',
          'We will notify you once setup is complete',
        ],
        documentation_url: 'https://example.com/nameserver-setup-guide',
      });
    });
  });

  describe('createDns › error path', () => {
    it('propagates if createZone throws', async () => {
      const dto: DNSDto = { domain: 'bad.com', projectId: 99 };
      dnsService.createZone.mockRejectedValueOnce(new Error('test error'));

      await expect(controller.createDns(dto)).rejects.toThrow('test error');

      expect(dnsService.createDNSRecords).not.toHaveBeenCalled();
      expect(projectsRepo.createCustomDomain).not.toHaveBeenCalled();
      expect(dnsQueue.add).not.toHaveBeenCalled();
    });
  });
});
