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
      create: jest.fn(async ({ data }: any) => eventRow(data.eventType, 'manual')),
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

  const prisma = {
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
    mealLog: {
      findMany: jest.fn(async () => [
        {
          mealType: 'lunch',
          totalKcal: 650,
          carbsG: 80,
          proteinG: 30,
          fatG: 18,
          analysisStatus: 'manual',
          healthEvent: eventRow('meal', 'manual'),
          foodItems: [
            {
              id: 'food-1',
              name: '닭가슴살 샐러드',
              servingAmount: 1,
              servingUnit: 'plate',
              kcal: 650,
              carbsG: 80,
              proteinG: 30,
              fatG: 18,
              confidenceScore: 0.9,
            },
          ],
        },
      ]),
    },
    beverageLog: {
      findMany: jest.fn(async () => [
        { volumeMl: 355, kcal: 140, sugarG: 32, caffeineMg: 0 },
      ]),
    },
  };

  return { prisma, tx };
}

describe('L2 API routes (e2e, mocked Prisma)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeAll(async () => {
    prismaMock = buildPrismaMock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock.prisma)
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

  it('GET /v1/sleep-records/summary returns sleep rollups', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/sleep-records/summary')
      .expect(200);

    expect(res.body.data.recordCount).toBe(1);
    expect(res.body.data.totalMinutes).toBe(420);
    expect(res.body.data.averageSleepScore).toBe(82);
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

  it('POST /v1/meals creates a meal event', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/meals')
      .send({
        eventType: 'meal',
        sourceType: 'manual',
        startedAt: '2026-05-25T12:10:00+09:00',
        timezone: 'Asia/Seoul',
        mealType: 'lunch',
        totalKcal: 650,
        items: [{ name: '닭가슴살 샐러드', kcal: 650 }],
      })
      .expect(201);

    expect(res.body.data.eventType).toBe('meal');
    expect(res.body.data.sourceType).toBe('manual');
  });

  it('GET /v1/meals lists meal logs with food items', async () => {
    const res = await request(app.getHttpServer()).get('/v1/meals').expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].mealType).toBe('lunch');
    expect(res.body.data[0].items[0].name).toBe('닭가슴살 샐러드');
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

  it('POST /v1/beverages creates a beverage event', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/beverages')
      .send({
        eventType: 'beverage',
        sourceType: 'manual',
        startedAt: '2026-05-25T15:20:00+09:00',
        timezone: 'Asia/Seoul',
        beverageType: 'coffee',
        name: '아메리카노',
        volumeMl: 355,
        caffeineMg: 120,
      })
      .expect(201);

    expect(res.body.data.eventType).toBe('beverage');
    expect(res.body.data.sourceType).toBe('manual');
  });

  it('GET /v1/beverages/summary returns beverage rollups', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/beverages/summary')
      .expect(200);

    expect(res.body.data.recordCount).toBe(1);
    expect(res.body.data.totalVolumeMl).toBe(355);
    expect(res.body.data.totalSugarG).toBe(32);
  });

  it('POST /v1/activities returns 409 for duplicate external records', async () => {
    const createCallCount = prismaMock.tx.healthEvent.create.mock.calls.length;
    prismaMock.tx.healthEvent.findFirst.mockResolvedValueOnce({
      id: 'existing-event',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/activities')
      .send({
        eventType: 'activity',
        sourceType: 'apple_health',
        externalRecordId: 'apple-activity-1',
        startedAt: '2026-05-25T08:00:00+09:00',
        timezone: 'Asia/Seoul',
        steps: 3000,
      })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
    expect(prismaMock.tx.healthEvent.create).toHaveBeenCalledTimes(createCallCount);
  });
});
