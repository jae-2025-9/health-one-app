import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';

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
    interactionCheck: { findFirst: jest.fn(async () => null) },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
}

describe('L3 API (e2e, mocked Prisma)', () => {
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
});
