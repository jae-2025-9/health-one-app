import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';

function eventRow(eventType: string, sourceType: string) {
  return {
    id: `he-${eventType}-1`,
    eventType,
    sourceId: 'src-1',
    externalRecordId: null,
    startedAt: new Date('2026-05-25T08:00:00Z'),
    endedAt: null,
    timezone: 'Asia/Seoul',
    confidenceScore: 1,
    rawPayload: {},
    createdAt: new Date('2026-05-25T08:00:00Z'),
    source: { sourceType },
  };
}

function buildPrismaMock() {
  const tx = {
    dataSource: {
      findFirst: jest.fn(async () => ({ id: 'src-1' })),
      create: jest.fn(),
    },
    healthEvent: {
      findFirst: jest.fn(),
      create: jest.fn(async ({ data }: any) =>
        eventRow(data.eventType, data.eventType === 'beverage' ? 'label_scan' : data.eventType === 'meal' ? 'vision_ai' : 'manual'),
      ),
    },
    activityRecord: { create: jest.fn() },
    sleepRecord: { create: jest.fn() },
    mealLog: { create: jest.fn() },
    beverageLog: { create: jest.fn() },
    mediaAsset: { create: jest.fn(async () => ({ id: 'media-1' })) },
    aiAnalysisResult: {
      create: jest.fn(async ({ data }: any) => ({ id: 'analysis-1', ...data })),
    },
  };

  return {
    $transaction: jest.fn(async (cb: any) => cb(tx)),
    activityRecord: {
      findMany: jest.fn(async () => [
        { steps: 1000, activeMinutes: 10, activeKcal: 50, distanceMeters: 800 },
        { steps: 2000, activeMinutes: 20, activeKcal: 100, distanceMeters: 1600 },
      ]),
    },
    sleepRecord: {
      findMany: jest.fn(async () => [
        {
          totalMinutes: 420,
          awakeMinutes: 20,
          deepSleepMinutes: 90,
          remSleepMinutes: 80,
          sleepScore: 82,
        },
      ]),
    },
    mealLog: { findMany: jest.fn(async () => []) },
    beverageLog: {
      findMany: jest.fn(async () => [
        { volumeMl: 355, kcal: 140, sugarG: 32, caffeineMg: 0 },
      ]),
    },
  };
}

describe('L2 API routes (e2e, mocked Prisma)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(buildPrismaMock())
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

  it('POST /v1/activities creates an activity event through the envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/activities')
      .send({
        eventType: 'activity',
        sourceType: 'manual',
        startedAt: '2026-05-25T08:00:00+09:00',
        timezone: 'Asia/Seoul',
        steps: 3000,
        activeMinutes: 30,
      })
      .expect(201);

    expect(res.body.data.eventType).toBe('activity');
    expect(res.body.data.sourceType).toBe('manual');
    expect(res.body.meta.requestId).toMatch(/^req_\d{8}_\d{4}$/);
  });

  it('GET /v1/activities/summary returns activity totals', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/activities/summary')
      .expect(200);

    expect(res.body.data.recordCount).toBe(2);
    expect(res.body.data.totalSteps).toBe(3000);
    expect(res.body.data.totalActiveMinutes).toBe(30);
  });

  it('POST /v1/sleep-records creates a sleep event', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sleep-records')
      .send({
        eventType: 'sleep',
        sourceType: 'manual',
        startedAt: '2026-05-25T22:30:00+09:00',
        endedAt: '2026-05-26T06:30:00+09:00',
        timezone: 'Asia/Seoul',
        totalMinutes: 480,
        sleepScore: 85,
      })
      .expect(201);

    expect(res.body.data.eventType).toBe('sleep');
    expect(res.body.data.sourceType).toBe('manual');
  });

  it('POST /v1/meals/analyze-image returns analysisId, draft, and safetyNotice', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/meals/analyze-image')
      .send({ imageUrl: 'https://example.test/meal.jpg' })
      .expect(200);

    expect(res.body.data.analysisId).toBe('analysis-1');
    expect(res.body.data.mealDraft.eventType).toBe('meal');
    expect(res.body.data.mealDraft.sourceType).toBe('vision_ai');
    expect(res.body.data.safetyNotice).toContain('의료 진단이 아닙니다');
  });

  it('POST /v1/beverages/analyze-label returns a label-scan beverage draft', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/beverages/analyze-label')
      .send({ imageUrl: 'https://example.test/beverage.jpg' })
      .expect(200);

    expect(res.body.data.analysisId).toBe('analysis-1');
    expect(res.body.data.beverageDraft.eventType).toBe('beverage');
    expect(res.body.data.beverageDraft.sourceType).toBe('label_scan');
    expect(res.body.data.safetyNotice).toContain('전문가');
  });
});
