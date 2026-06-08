import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service';

const OLD_ENV = process.env;
const originalFetch = global.fetch;

describe('AiService', () => {
  const reports = {
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
  const prisma = {
    aiAnalysisResult: {
      create: jest.fn(async () => ({ id: 'analysis-1' })),
    },
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    reports.daily.mockClear();
    prisma.aiAnalysisResult.create.mockClear();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls the Upstage-compatible chat completion endpoint without leaking the key', async () => {
    process.env.UPSTAGE_API_KEY = 'test-key';
    process.env.UPSTAGE_BASE_URL = 'https://api.upstage.ai/v1/';
    process.env.UPSTAGE_MODEL = 'solar-pro3';
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'solar-pro3',
        choices: [{ message: { content: '수면 시간을 조금 늘려보세요.' } }],
        usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
      }),
    }));
    global.fetch = fetchMock as any;

    const result = await new AiService(reports as any, prisma as any).ask('user-1', {
      question: '오늘 컨디션 개선 팁 알려줘',
      date: '2026-06-06',
    });

    expect(result.analysisId).toBe('analysis-1');
    expect(result.answer).toContain('수면');
    expect(result.model).toBe('solar-pro3');
    expect(result.safetyNotice).toContain('의료 진단');
    expect(reports.daily).toHaveBeenCalledWith('user-1', '2026-06-06');
    expect(prisma.aiAnalysisResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisType: 'ai_question',
        modelName: 'solar-pro3',
        resultPayload: expect.objectContaining({
          question: '오늘 컨디션 개선 팁 알려줘',
          date: '2026-06-06',
          answer: expect.stringContaining('수면'),
        }),
        safetyNotice: expect.stringContaining('의료 진단'),
      }),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.upstage.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      }),
    );
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const requestInit = calls[0]?.[1];
    expect(requestInit).toBeDefined();
    const body = JSON.parse(String(requestInit?.body));
    expect(body.model).toBe('solar-pro3');
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toContain('서버가 조회한 앱 기록 요약');
    expect(body.messages[1].content).toContain('9230');
    expect(JSON.stringify(result)).not.toContain('test-key');
  });

  it('returns a service-unavailable error when the provider key is missing', async () => {
    delete process.env.UPSTAGE_API_KEY;

    await expect(
      new AiService(reports as any, prisma as any).ask('user-1', { question: '질문입니다' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(reports.daily).not.toHaveBeenCalled();
  });

  it('does not expose provider errors to callers', async () => {
    process.env.UPSTAGE_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'secret provider detail' }),
    })) as any;

    await expect(
      new AiService(reports as any, prisma as any).ask('user-1', { question: '질문입니다' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: expect.not.stringContaining('secret provider detail'),
      }),
    });
  });

  it('rate-limits repeated AI provider calls per user', async () => {
    process.env.UPSTAGE_API_KEY = 'test-key';
    process.env.AI_RATE_LIMIT_MAX = '1';
    process.env.AI_RATE_LIMIT_WINDOW_MS = '60000';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'solar-pro3',
        choices: [{ message: { content: '첫 번째 답변입니다.' } }],
      }),
    })) as any;
    const service = new AiService(reports as any, prisma as any);

    await service.ask('user-1', { question: '첫 질문' }, 'ip:test');

    await expect(
      service.ask('user-2', { question: '두 번째 질문' }, 'ip:test'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'AI_RATE_LIMIT_EXCEEDED',
      }),
    });
  });
});
