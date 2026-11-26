import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/cache.service';

describe('AiService (NVIDIA NIM)', () => {
  let service: AiService;

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn().mockResolvedValue({ name: 'Acme Test Corp', currency: 'INR' }),
      findUnique: jest.fn().mockResolvedValue({ name: 'Acme Test Corp', currency: 'INR' }),
    },
    invoice: {
      aggregate: jest.fn().mockResolvedValue({
        _count: 42,
        _sum: { grandTotal: '150000.00', paidAmount: '120000.00', balanceDue: '30000.00' },
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      aggregate: jest.fn().mockResolvedValue({
        _count: 38,
        _sum: { amount: '120000.00' },
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customer: {
      count: jest.fn().mockResolvedValue(150),
    },
    order: {
      count: jest.fn().mockResolvedValue(88),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      if (key === 'NVIDIA_NIM_MODEL') return 'meta/llama-3.3-70b-instruct';
      if (key === 'NVIDIA_NIM_BASE_URL') return 'https://integrate.api.nvidia.com/v1';
      return defaultVal;
    }),
  };

  const mockCacheService = {
    tenantKey: jest.fn((tenantId, ns, key) => `tenant:${tenantId}:${ns}:${key}`),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should answer questions using deterministic engine when NVIDIA key is not set', async () => {
    const res = await service.ask('tenant-1', 'user-1', { question: 'What is our revenue this month?' });
    expect(res).toBeDefined();
    expect(res.answer).toContain('150000.00');
    expect(res.facts.currency).toBe('INR');
  });

  it('should audit financial anomalies without crashing', async () => {
    const res = await service.auditAnomalies('tenant-1', 'user-1');
    expect(res).toBeDefined();
    expect(res.anomaliesFound).toBe(0);
    expect(res.aiEvaluation).toBeDefined();
  });

  it('should generate voice script successfully', async () => {
    const res = await service.generateVoiceScript('tenant-1', 'user-1', {
      purpose: 'ORDER_CONFIRMATION',
      customerName: 'John Doe',
      orderNumber: 'ORD-101',
    });
    expect(res.script).toContain('John Doe');
    expect(res.purpose).toBe('ORDER_CONFIRMATION');
  });

  it('should draft communication messages', async () => {
    const res = await service.draftCommunication('tenant-1', 'user-1', {
      channel: 'WHATSAPP',
      recipientType: 'CUSTOMER',
      customerName: 'Rahul Sharma',
      amount: '5000',
      tone: 'FRIENDLY',
    });
    expect(res.body).toContain('Rahul Sharma');
    expect(res.channel).toBe('WHATSAPP');
  });
});

