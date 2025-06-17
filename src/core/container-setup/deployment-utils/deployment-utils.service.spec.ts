import { DeploymentUtilsService } from './deployment-utils.service';

describe('DeploymentUtilsService', () => {
  let svc: DeploymentUtilsService;
  const OLD = process.env;

  beforeEach(() => {
    svc = new DeploymentUtilsService();
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    process.env.DOMAIN_NAME = 'example.com';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...OLD };
  });

  describe('getDeployedUrl', () => {
    it('builds URL with 6-char random and domain', () => {
      const url = svc.getDeployedUrl('proj');
      // randomString = Math.random().toString(36).substring(2,8)
      const rnd = Math.random().toString(36).substring(2, 8);
      expect(url).toBe(`proj-${rnd}.example.com`);
    });
  });

  describe('getLatestContainerName', () => {
    it('returns null for empty list', () => {
      expect(svc.getLatestContainerName([])).toBeNull();
    });
    it('picks newest by createdAt', () => {
      const a = { createdAt: new Date('2020-01-01'), containerName: 'old' };
      const b = { createdAt: new Date('2021-01-01'), containerName: 'new' };
      expect(svc.getLatestContainerName([a, b])).toBe('new');
    });
    it('returns null when containerName missing', () => {
      const rec = { createdAt: new Date(), containerName: null };
      expect(svc.getLatestContainerName([rec])).toBeNull();
    });
  });

  describe('getLatestImageName', () => {
    it('returns null for empty list', () => {
      expect(svc.getLatestImageName([])).toBeNull();
    });
    it('picks newest imageName', () => {
      const x = { createdAt: new Date('2020-01-01'), imageName: 'i1' };
      const y = { createdAt: new Date('2022-01-01'), imageName: 'i2' };
      expect(svc.getLatestImageName([x, y])).toBe('i2');
    });
    it('returns null when imageName missing', () => {
      const rec = { createdAt: new Date(), imageName: undefined };
      expect(svc.getLatestImageName([rec])).toBeNull();
    });
  });

  describe('getLatestDeployment', () => {
    it('returns null for empty', () => {
      expect(svc.getLatestDeployment([])).toBeNull();
    });
    it('returns full object of latest', () => {
      const old = { createdAt: new Date('2020-01-01'), foo: 1 };
      const nw = { createdAt: new Date('2023-01-01'), foo: 2 };
      expect(svc.getLatestDeployment([old, nw])).toBe(nw);
    });
  });
});
