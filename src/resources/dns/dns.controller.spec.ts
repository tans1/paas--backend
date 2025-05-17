import { Test, TestingModule } from '@nestjs/testing';
import { DnsController } from './dns.controller';
import { DnsService } from './dns.service';
import { Queue } from 'bullmq';
import { DNSDto } from './dto/dns.dto';
import { CloudflareZone, CloudflareDNSRecord } from './types';

describe('DnsController', () => {
  let controller: DnsController;
  let dnsService: jest.Mocked<DnsService>;
  let dnsQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DnsController],
      providers: [
        {
          provide: DnsService,
          useValue: {
            createZone: jest.fn(),
            createDNSRecords: jest.fn(),
            updateSSLSetting: jest.fn(),
            createDockerComposeFile: jest.fn(),
          },
        },
        {
          provide: 'BullQueue_dns-propagation',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DnsController>(DnsController);
    dnsService = module.get(DnsService);
    dnsQueue = module.get('BullQueue_dns-propagation');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDns', () => {
    it('should create DNS configuration successfully', async () => {
      const dto: DNSDto = {
        domain: 'example.com',
        projectId: 123,
      };

      const mockZone: CloudflareZone = {
        id: 'zone-123',
        name: 'example.com',
        status: 'active',
        paused: false,
        type: 'full',
        name_servers: ['ns1.example.com', 'ns2.example.com'],
      };

      const mockRecords: CloudflareDNSRecord[] = [
        {
          id: 'a-123',
          type: 'A',
          name: 'example.com',
          content: '1.2.3.4',
          proxiable: true,
          proxied: true,
          ttl: 1,
        },
        {
          id: 'cname-123',
          type: 'CNAME',
          name: 'www.example.com',
          content: 'example.com',
          proxiable: true,
          proxied: true,
          ttl: 1,
        },
      ];

      dnsService.createZone.mockResolvedValue(mockZone);
      dnsService.createDNSRecords.mockResolvedValue(mockRecords);
      dnsService.updateSSLSetting.mockResolvedValue(undefined);
      dnsService.createDockerComposeFile.mockResolvedValue(undefined);
      dnsQueue.add.mockResolvedValue(undefined);

      const result = await controller.createDns(dto);

      expect(dnsService.createZone).toHaveBeenCalledWith(dto.domain);
      expect(dnsService.createDNSRecords).toHaveBeenCalledWith(mockZone.id, dto.domain);
      expect(dnsService.updateSSLSetting).toHaveBeenCalledWith(mockZone.id);
      expect(dnsService.createDockerComposeFile).toHaveBeenCalledWith(dto.domain, dto.projectId);
      expect(dnsQueue.add).toHaveBeenCalledWith('check-propagation', {
        userId: 1,
        domain: dto.domain,
        projectId: dto.projectId,
        zoneId: mockZone.id,
        aRecordId: mockRecords[0].id,
        cnameRecordId: mockRecords[1].id,
        name_servers: mockZone.name_servers,
      });

      expect(result).toEqual({
        message: 'Please remove your existing name servers from your domain registrar and update it with these nameservers:',
        nameservers: mockZone.name_servers,
        next_steps: [
          'Update nameservers at your domain registrar',
          'Propagation typically takes 24-48 hours',
          'We will notify you once setup is complete',
        ],
        documentation_url: 'https://example.com/nameserver-setup-guide',
      });
    });

    it('should handle errors during DNS creation', async () => {
      const dto: DNSDto = {
        domain: 'example.com',
        projectId: 123,
      };

      const error = new Error('DNS creation failed');
      dnsService.createZone.mockRejectedValue(error);

      const result = await controller.createDns(dto);
      expect(result).toBe(error);
    });
  });
});
