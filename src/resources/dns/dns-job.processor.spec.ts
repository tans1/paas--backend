import { DnsJobProcessor } from './dns-job.processor';
import { Job } from 'bullmq';

describe('DnsJobProcessor', () => {
  let processor: DnsJobProcessor;
  let dnsService: any;
  let dnsQueue: any;
  let projectsRepo: any;
  const ENV_IP = '1.2.3.4';

  beforeEach(() => {
    process.env.SERVER_IP = ENV_IP;

    dnsService = {
      checkPropagation: jest.fn(),
      notifyUser: jest.fn(),
    };
    dnsQueue = { add: jest.fn() };
    projectsRepo = {
      findCustomDomainByDomainAndProjectId: jest.fn(),
      updateCustomDomain: jest.fn(),
    };

    processor = new DnsJobProcessor(
      dnsService,
      dnsQueue,
      projectsRepo,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.SERVER_IP;
  });

  function makeJob(data: any): Job {
    return { data } as Job;
  }

  it('requeues when propagation incomplete and attempts < MAX_ATTEMPTS', async () => {
    dnsService.checkPropagation.mockResolvedValue(false);
    const job = makeJob({
      userId: 'u1',
      domain: 'example.com',
      projectId: 10,
      zoneId: 'z1',
      aRecordId: 'a1',
      cnameRecordId: 'c1',
      attempts: 0,
      name_servers: ['ns1'],
    });

    await processor.process(job);

    expect(dnsService.checkPropagation).toHaveBeenCalledWith(
      'example.com', ENV_IP, ['ns1']
    );
    expect(dnsQueue.add).toHaveBeenCalledWith(
      'check-propagation',
      expect.objectContaining({ attempts: 1, domain: 'example.com' }),
      expect.objectContaining({
        delay: expect.any(Number),
        jobId: expect.stringContaining('example.com-attempt-1-'),
        removeOnComplete: true,
        removeOnFail: true,
      })
    );
    expect(dnsService.notifyUser).not.toHaveBeenCalled();
  });

  it('notifies failure when attempts >= MAX_ATTEMPTS', async () => {
    dnsService.checkPropagation.mockResolvedValue(false);
    const job = makeJob({
      userId: 'u2',
      domain: 'fail.com',
      projectId: 20,
      zoneId: 'z2',
      aRecordId: 'a2',
      cnameRecordId: 'c2',
      attempts: 144,
      name_servers: ['ns2'],
    });

    await processor.process(job);

    expect(dnsService.checkPropagation).toHaveBeenCalledWith(
      'fail.com', ENV_IP, ['ns2']
    );
    expect(dnsService.notifyUser).toHaveBeenCalledWith(
      'fail.com', 'u2', 20, 'z2', 'a2', 'c2',
      'custome domain configuration failed'
    );
    expect(dnsQueue.add).not.toHaveBeenCalled();
  });

  it('on propagation complete updates domain and notifies success', async () => {
    dnsService.checkPropagation.mockResolvedValue(true);
    const job = makeJob({
      userId: 'u3',
      domain: 'good.com',
      projectId: 30,
      zoneId: 'z3',
      aRecordId: 'a3',
      cnameRecordId: 'c3',
      attempts: 5,
      name_servers: ['ns3'],
    });
    const customDomain = { id: 99 };
    projectsRepo.findCustomDomainByDomainAndProjectId.mockResolvedValue(customDomain);

    await processor.process(job);

    expect(dnsQueue.add).not.toHaveBeenCalled();
    expect(projectsRepo.findCustomDomainByDomainAndProjectId).toHaveBeenCalledWith(
      'good.com', 30
    );
    expect(projectsRepo.updateCustomDomain).toHaveBeenCalledWith(
      99, { live: true }
    );
    expect(dnsService.notifyUser).toHaveBeenCalledWith(
      'good.com', 'u3', 30, 'z3', 'a3', 'c3',
      'Success : Your domain good.com is now live!'
    );
  });

  it('on propagation complete without existing domain still notifies success', async () => {
    dnsService.checkPropagation.mockResolvedValue(true);
    const job = makeJob({
      userId: 'u4',
      domain: 'nodomain.com',
      projectId: 40,
      zoneId: 'z4',
      aRecordId: 'a4',
      cnameRecordId: 'c4',
      attempts: 2,
      name_servers: ['ns4'],
    });
    projectsRepo.findCustomDomainByDomainAndProjectId.mockResolvedValue(null);

    await processor.process(job);

    expect(projectsRepo.updateCustomDomain).not.toHaveBeenCalled();
    expect(dnsService.notifyUser).toHaveBeenCalledWith(
      'nodomain.com', 'u4', 40, 'z4', 'a4', 'c4',
      'Success : Your domain nodomain.com is now live!'
    );
  });

  it('on error in processing notifies failure', async () => {
    dnsService.checkPropagation.mockRejectedValue(new Error('boom'));
    const job = makeJob({
      userId: 'u5',
      domain: 'error.com',
      projectId: 50,
      zoneId: 'z5',
      aRecordId: 'a5',
      cnameRecordId: 'c5',
      attempts: 1,
      name_servers: ['ns5'],
    });

    await processor.process(job);

    expect(dnsService.notifyUser).toHaveBeenCalledWith(
      'error.com', 'u5', 50, 'z5', 'a5', 'c5',
      'error: custom domain deployment failed'
    );
  });
});
