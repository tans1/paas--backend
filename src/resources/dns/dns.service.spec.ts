import { DnsService } from './dns.service';
import Cloudflare from 'cloudflare';
import * as fs from 'fs';
import * as ejs from 'ejs';
import fetch from 'node-fetch';
import { promises as dnsPromises } from 'dns';
import { isIP } from 'net';

const mockListRecords = jest.fn();
const mockDNSCreate = jest.fn();
const mockZonesList = jest.fn();
const mockZonesCreate = jest.fn();
const mockZonesSettingsEdit = jest.fn();
jest.mock('cloudflare', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    dns: {
      records: {
        list: mockListRecords,
        create: mockDNSCreate,
      },
    },
    zones: {
      list: mockZonesList,
      create: mockZonesCreate,
      settings: {
        edit: mockZonesSettingsEdit,
      },
    },
  })),
}));


jest.mock('ejs', () => ({
  render: jest.fn(),
}));

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('DnsService', () => {
  let service: DnsService;
  let projectsRepo: any;
  let logger: any;
  let notificationQueue: any;
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env.CLOUDFLARE_EMAIL = 'e';
    process.env.CLOUDFLARE_API_KEY = 'k';
    process.env.SERVER_IP = '1.2.3.4';

    projectsRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    logger = { log: jest.fn(), error: jest.fn() };
    notificationQueue = { enqueueNotification: jest.fn() };

    service = new DnsService(
      projectsRepo,
      logger,
      notificationQueue,
    );

    mockListRecords.mockReset();
    mockDNSCreate.mockReset();
    mockZonesList.mockReset();
    mockZonesCreate.mockReset();
    mockZonesSettingsEdit.mockReset();
    (ejs.render as jest.Mock).mockReset();
    (fs.promises.readFile as any) = jest.fn();
    (fs.promises.writeFile as any) = jest.fn();
    (fetch as unknown as jest.Mock).mockReset();
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
  });

  describe('recordExists', () => {
    it('returns matching record when found', async () => {
      const record = { id: 'r1', type: 'A', name: 'd' };
      mockListRecords.mockResolvedValueOnce({ result: [record] });

      const res = await service.recordExists('z1', 'A', 'd');
      expect(mockListRecords).toHaveBeenCalledWith({ zone_id: 'z1' });
      expect(res).toBe(record);
    });

    it('returns null when none match', async () => {
      mockListRecords.mockResolvedValueOnce({ result: [{ type: 'CNAME', name: 'x' }] });
      const res = await service.recordExists('z2', 'A', 'd');
      expect(res).toBeNull();
    });
  });

  describe('getRootDomain', () => {
    it('strips leading www.', () => {
      expect((service as any).getRootDomain('www.Example.COM')).toBe('example.com');
      expect((service as any).getRootDomain('Sub.Domain.com')).toBe('sub.domain.com');
    });
  });

  describe('createZone', () => {
    it('returns existing zone when found', async () => {
      const zone = { id: 'z', name: 'd' };
      mockZonesList.mockResolvedValueOnce({ result: [zone] });
      const res = await service.createZone('example.com');
      expect(mockZonesList).toHaveBeenCalledWith({ name: 'example.com' });
      expect(res).toBe(zone);
    });

    it('creates new zone when none exist', async () => {
      mockZonesList.mockResolvedValueOnce({ result: [] });
      mockZonesCreate.mockResolvedValueOnce({ id: 'z2' });
      const res = await service.createZone('test.com');
      expect(mockZonesCreate).toHaveBeenCalledWith({ name: 'test.com', jump_start: true });
      expect(res).toEqual({ id: 'z2' });
    });

    it('throws on missing ID in creation response', async () => {
      mockZonesList.mockResolvedValueOnce({ result: [] });
      mockZonesCreate.mockResolvedValueOnce({ });
      await expect(service.createZone('fail.com')).rejects.toThrow(
        'Zone operation failed: Zone creation failed: No ID returned from Cloudflare'
      );
    });
  });

  describe('createDNSRecords', () => {
    beforeEach(() => {
      // bypass recordExists to always return null
      jest.spyOn(service as any, 'recordExists').mockResolvedValue(null);
    });

    it('creates A and CNAME when none exist', async () => {
      mockDNSCreate
        .mockResolvedValueOnce({ id: 'a1' })
        .mockResolvedValueOnce({ id: 'c1' });

      const [a, c] = await service.createDNSRecords('z', 'example.com');
      expect(mockDNSCreate).toHaveBeenNthCalledWith(1, {
        zone_id: 'z',
        type: 'A',
        name: 'example.com',
        content: '1.2.3.4',
        ttl: 1,
        proxied: true,
      });
      expect(mockDNSCreate).toHaveBeenNthCalledWith(2, {
        zone_id: 'z',
        type: 'CNAME',
        name: 'www.example.com',
        content: 'example.com',
        ttl: 1,
        proxied: true,
      });
      expect(a).toEqual({ id: 'a1' });
      expect(c).toEqual({ id: 'c1' });
    });

    it('throws CreateDNSRecordsFaildException on error', async () => {
      mockDNSCreate.mockRejectedValueOnce(new Error('err'));
      await expect(service.createDNSRecords('z', 'bad.com')).rejects.toThrow(
        'Creating DNS Record Faild'
      );
    });
  });

  describe('updateSSLSetting', () => {
    it('calls zones.settings.edit', async () => {
      mockZonesSettingsEdit.mockResolvedValueOnce({ result: {} });
      await service.updateSSLSetting('z', 'flexible');
      expect(mockZonesSettingsEdit).toHaveBeenCalledWith(
        'ssl',
        { zone_id: 'z' },
        { body: { value: 'flexible' } }
      );
    });
  });

  describe('addTraeficConfigFile', () => {
    it('reads template, renders, and writes file', async () => {
      const tpl = 'TEMPLATE';
      (fs.promises.readFile as jest.Mock).mockResolvedValue(tpl);
      (ejs.render as jest.Mock).mockReturnValue('CFG');
      projectsRepo.findById.mockResolvedValue({ name: 'proj', PORT: 3000 });

      await service.addTraeficConfigFile('domain.com', 7);

      expect(projectsRepo.findById).toHaveBeenCalledWith(7);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('domain.config.ejs'),
        'utf-8'
      );
      expect(ejs.render).toHaveBeenCalledWith(tpl, {
        projectName: 'proj',
        rootDomain: 'domain.com',
        PORT: 3000,
      });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('domain-config.domain.com.yml'),
        'CFG',
        'utf-8'
      );
    });
  });

  describe('checkPropagation', () => {
    it('returns false for invalid IP', async () => {
      const res = await service.checkPropagation('d', 'notip', ['ns']);
      expect(res).toBe(false);
    });

    it('returns false when no A records', async () => {
      jest.spyOn(dnsPromises, 'resolve4').mockResolvedValue([]);
      const res = await service.checkPropagation('d', '1.2.3.4', ['ns'], 10);
      expect(res).toBe(false);
    });

    it('returns false when NS do not match', async () => {
      jest.spyOn(dnsPromises, 'resolve4').mockResolvedValue([{ address: 'x', ttl: 1 }]);
      jest.spyOn(dnsPromises, 'resolveNs').mockResolvedValue(['other']);
      const res = await service.checkPropagation('d', '1.2.3.4', ['ns'], 10);
      expect(res).toBe(false);
    });

    it('returns true when HEAD fetch succeeds', async () => {
      jest.spyOn(dnsPromises, 'resolve4').mockResolvedValue([{ address: 'x', ttl: 1 }]);
      jest.spyOn(dnsPromises, 'resolveNs').mockResolvedValue(['ns.example.com']);
      (fetch as unknown as jest.Mock)
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ status: 200 });
      const res = await service.checkPropagation('d', '1.2.3.4', ['ns'], 10);
      expect(res).toBe(true);
    });
  });

  describe('notifyUser', () => {
    it('updates project and enqueues notification', async () => {
      await service.notifyUser('d.com', '5', 11, 'z', 'a', 'c', 'msg');

      expect(projectsRepo.update).toHaveBeenCalledWith(11, {
        zoneId: 'z',
        aRecordId: 'a',
        cnameRecordId: 'c',
      });
      expect(notificationQueue.enqueueNotification).toHaveBeenCalledWith({
        title: 'Domain Propagation',
        message: 'msg',
        type: expect.any(String),
        priority: expect.any(String),
        userId: 5,
      });
    });
  });
});
