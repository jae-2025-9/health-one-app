import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';
import { ReportsService } from './reports/reports.service';
import { AiService } from './ai/ai.service';

/**
 * In-process e2e: boots the real AppModule with PrismaService mocked, so the
 * full HTTP stack (routing, ValidationPipe, response envelope, error filter)
 * is exercised with NO live database.
 */
const ID1 = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';

function buildPrismaMock() {
  const tx = {
    interactionCheck: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'chk-1',
        ...data,
        createdAt: new Date('2026-05-25T00:00:00Z'),
      })),
    },
    interactionCheckItem: { createMany: jest.fn(async () => ({ count: 2 })) },
  };
  return {
    medicationItem: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'med-1',
        ...data,
        createdAt: new Date('2026-05-25T00:00:00Z'),
      })),
    },
    supplementItem: {
      findFirst: jest.fn(async ({ where }: any) => ({
        id: where.id,
        name: where.id === ID1 ? '와파린' : '종합비타민',
        ingredientName: where.id === ID1 ? 'Warfarin' : 'Vitamin K',
      })),
    },
    aiAnalysisResult: {
      create: jest.fn(async () => ({ id: 'analysis-1' })),
    },
    interactionCheck: { findFirst: jest.fn(async () => null) },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
}

function buildReportsMock() {
  return {
    daily: jest.fn(async () => ({
      date: '2026-06-06',
      timezone: 'Asia/Seoul',
      activity: { totalSteps: 9230, totalActiveMinutes: 57, totalActiveKcal: 455 },
      sleep: { totalMinutes: 465, deepSleepMinutes: 102, remSleepMinutes: 84, sleepScore: 79 },
      nutrition: { totalKcal: 1710, totalCarbsG: 222, totalProteinG: 60, totalFatG: 43, mealCount: 1 },
      hydration: { totalVolumeMl: 1900, totalCaffeineMg: 95, totalSugarG: 1 },
      intakes: { scheduledCount: 1, takenCount: 1, skippedCount: 0 },
      reminders: null,
    })),
  };
}

describe('L3 API (e2e, mocked Prisma)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(buildPrismaMock())
      .overrideProvider(ReportsService)
      .useValue(buildReportsMock())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/healthz wraps the success envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/healthz').expect(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.meta.requestId).toMatch(/^req_\d{8}_\d{4}$/);
    expect(typeof res.body.meta.generatedAt).toBe('string');
  });

  it('POST /v1/intakes/items creates an item (201 + envelope)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/intakes/items')
      .send({ itemType: 'medication', name: '타이레놀' })
      .expect(201);
    expect(res.body.data.itemType).toBe('medication');
    expect(res.body.data.id).toBe('med-1');
    expect(res.body.meta.requestId).toBeDefined();
  });

  it('POST /v1/intakes/items rejects an invalid body with the error envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/intakes/items')
      .send({ itemType: 'medication' }) // missing name
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.meta).toBeDefined();
  });

  it('POST /v1/interaction-checks returns riskLevel + mandatory safetyNotice', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/interaction-checks')
      .send({
        items: [
          { itemType: 'supplement', itemId: ID1 },
          { itemType: 'supplement', itemId: ID2 },
        ],
      })
      .expect(201);
    expect(res.body.data.riskLevel).toBe('high');
    expect(res.body.data.safetyNotice).toContain('전문가');
    expect(Array.isArray(res.body.data.evidence)).toBe(true);
  });

  it('POST /v1/interaction-checks rejects fewer than 2 items', async () => {
    await request(app.getHttpServer())
      .post('/v1/interaction-checks')
      .send({ items: [{ itemType: 'supplement', itemId: ID1 }] })
      .expect(400);
  });

  it('GET /v1/interaction-checks/{id} 404s when missing', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/interaction-checks/${ID1}`)
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /v1/interaction-checks/{id} 400s on a non-uuid id', async () => {
    await request(app.getHttpServer())
      .get('/v1/interaction-checks/not-a-uuid')
      .expect(400);
  });

  it('POST /v1/cosmetics/analyze-ingredients requires text or image', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/cosmetics/analyze-ingredients')
      .send({ productName: 'x' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /v1/ai/questions returns an Upstage-backed answer envelope', async () => {
    const oldKey = process.env.UPSTAGE_API_KEY;
    const oldFetch = global.fetch;
    process.env.UPSTAGE_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'solar-pro3',
        choices: [{ message: { content: '오늘은 수분 섭취를 유지해 보세요.' } }],
      }),
    })) as any;

    try {
      const res = await request(app.getHttpServer())
        .post('/v1/ai/questions')
        .send({ question: '오늘 건강 팁 알려줘', date: '2026-06-06' })
        .expect(200);
      expect(res.body.data.analysisId).toBe('analysis-1');
      expect(res.body.data.answer).toContain('수분');
      expect(res.body.data.model).toBe('solar-pro3');
      expect(res.body.data.safetyNotice).toContain('의료 진단');
      expect(res.body.meta.requestId).toBeDefined();
    } finally {
      if (oldKey === undefined) delete process.env.UPSTAGE_API_KEY;
      else process.env.UPSTAGE_API_KEY = oldKey;
      global.fetch = oldFetch;
    }
  });

  it('POST /v1/ai/questions cannot bypass rate limits by rotating X-User-Id', async () => {
    const oldKey = process.env.UPSTAGE_API_KEY;
    const oldMax = process.env.AI_RATE_LIMIT_MAX;
    const oldGlobalMax = process.env.AI_GLOBAL_RATE_LIMIT_MAX;
    const oldFetch = global.fetch;
    (app.get(AiService) as any).rateLimitBuckets.clear();
    process.env.UPSTAGE_API_KEY = 'test-key';
    process.env.AI_RATE_LIMIT_MAX = '1';
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = '100';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'solar-pro3',
        choices: [{ message: { content: '첫 답변입니다.' } }],
      }),
    })) as any;

    try {
      await request(app.getHttpServer())
        .post('/v1/ai/questions')
        .set('X-User-Id', ID1)
        .send({ question: '첫 질문', date: '2026-06-06' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/v1/ai/questions')
        .set('X-User-Id', ID2)
        .send({ question: '두 번째 질문', date: '2026-06-06' })
        .expect(429);

      expect(res.body.error.code).toBe('AI_RATE_LIMIT_EXCEEDED');
      expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1);
    } finally {
      if (oldKey === undefined) delete process.env.UPSTAGE_API_KEY;
      else process.env.UPSTAGE_API_KEY = oldKey;
      if (oldMax === undefined) delete process.env.AI_RATE_LIMIT_MAX;
      else process.env.AI_RATE_LIMIT_MAX = oldMax;
      if (oldGlobalMax === undefined) delete process.env.AI_GLOBAL_RATE_LIMIT_MAX;
      else process.env.AI_GLOBAL_RATE_LIMIT_MAX = oldGlobalMax;
      global.fetch = oldFetch;
    }
  });
});
