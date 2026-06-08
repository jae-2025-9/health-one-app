import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { AI_SAFETY_NOTICE, AI_SYSTEM_PROMPT } from './ai.constants';
import { CreateAiQuestionDto } from './dto/create-ai-question.dto';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

const DEFAULT_UPSTAGE_BASE_URL = 'https://api.upstage.ai/v1';
const DEFAULT_UPSTAGE_MODEL = 'solar-pro3';
const AI_TIMEOUT_MS = 15_000;
const DEFAULT_RATE_LIMIT_MAX = 8;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_GLOBAL_RATE_LIMIT_MAX = 50;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class AiService {
  private readonly rateLimitBuckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly reports: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  async ask(userId: string, dto: CreateAiQuestionDto, rateLimitSubject = userId) {
    const apiKey = process.env.UPSTAGE_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: 'AI_PROVIDER_NOT_CONFIGURED',
        message: 'AI 제공자 설정이 아직 완료되지 않았습니다.',
        details: [],
      });
    }
    this.enforceRateLimit(rateLimitSubject);
    this.enforceRateLimit(
      'global',
      'AI_GLOBAL_RATE_LIMIT_MAX',
      'AI_GLOBAL_RATE_LIMIT_WINDOW_MS',
      DEFAULT_GLOBAL_RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_WINDOW_MS,
    );

    const baseUrl = normalizeBaseUrl(
      process.env.UPSTAGE_BASE_URL ?? DEFAULT_UPSTAGE_BASE_URL,
    );
    const model = process.env.UPSTAGE_MODEL?.trim() || DEFAULT_UPSTAGE_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const dailyReport = await this.reports.daily(userId, dto.date);
    const contextSummary = buildDailyContext(dailyReport);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: buildMessages(dto.question, contextSummary),
          temperature: 0.2,
          max_tokens: 700,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException({
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'AI 응답을 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          details: [],
        });
      }

      const payload = (await response.json()) as ChatCompletionResponse;
      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        throw new InternalServerErrorException({
          code: 'AI_EMPTY_RESPONSE',
          message: 'AI 응답이 비어 있습니다.',
          details: [],
        });
      }
      const guardedAnswer = applySafetyGuard(answer);
      const usage = {
        promptTokens: payload.usage?.prompt_tokens ?? null,
        completionTokens: payload.usage?.completion_tokens ?? null,
        totalTokens: payload.usage?.total_tokens ?? null,
      };
      const analysis = await this.prisma.aiAnalysisResult.create({
        data: {
          analysisType: 'ai_question',
          modelName: payload.model ?? model,
          confidenceScore: null,
          resultPayload: {
            question: dto.question.trim(),
            date: dailyReport.date,
            answer: guardedAnswer,
            usage,
          } as Prisma.InputJsonValue,
          safetyNotice: AI_SAFETY_NOTICE,
        },
      });

      return {
        analysisId: analysis.id,
        answer: guardedAnswer,
        model: payload.model ?? model,
        safetyNotice: AI_SAFETY_NOTICE,
        usage,
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'AI 응답을 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        details: [],
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private enforceRateLimit(
    key: string,
    maxEnv = 'AI_RATE_LIMIT_MAX',
    windowEnv = 'AI_RATE_LIMIT_WINDOW_MS',
    defaultMax = DEFAULT_RATE_LIMIT_MAX,
    defaultWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
  ): void {
    const max = numberEnv(maxEnv, defaultMax);
    const windowMs = numberEnv(windowEnv, defaultWindowMs);
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (bucket.count >= max) {
      throw new HttpException(
        {
          code: 'AI_RATE_LIMIT_EXCEEDED',
          message: 'AI 질문 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
          details: [],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
  }
}

function buildMessages(question: string, contextSummary: string) {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: AI_SYSTEM_PROMPT },
  ];

  messages.push({
    role: 'user',
    content: `서버가 조회한 앱 기록 요약:\n${contextSummary}`,
  });

  messages.push({
    role: 'user',
    content: question.trim(),
  });

  return messages;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function numberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildDailyContext(
  report: Awaited<ReturnType<ReportsService['daily']>>,
): string {
  return [
    `날짜: ${report.date}`,
    `시간대: ${report.timezone}`,
    `걸음수: ${report.activity?.totalSteps ?? '기록 없음'}`,
    `활동 시간: ${report.activity?.totalActiveMinutes ?? '기록 없음'}분`,
    `활동 칼로리: ${report.activity?.totalActiveKcal ?? '기록 없음'}kcal`,
    `수면: ${report.sleep?.totalMinutes ?? '기록 없음'}분`,
    `수면 점수: ${report.sleep?.sleepScore ?? '기록 없음'}`,
    `식사 칼로리: ${report.nutrition?.totalKcal ?? '기록 없음'}kcal`,
    `음용량: ${report.hydration?.totalVolumeMl ?? '기록 없음'}ml`,
    `카페인: ${report.hydration?.totalCaffeineMg ?? '기록 없음'}mg`,
    `복용 완료: ${report.intakes?.takenCount ?? '기록 없음'}`,
  ].join('\n');
}

function applySafetyGuard(answer: string): string {
  const normalized = answer.replace(/\s+/g, ' ').trim();
  const hasProfessionalCaution = /전문가|의사|약사|상담/.test(normalized);
  const hasMedicalDecision =
    /진단|처방|복용을?\s*중단|복용하세요|치료|완치/.test(normalized);

  if (!hasMedicalDecision && hasProfessionalCaution) return normalized;

  const caution =
    ' 이 답변은 참고 정보이며, 증상이나 약 복용 판단은 의사 또는 약사와 상담해 주세요.';
  if (normalized.includes(caution.trim())) return normalized;
  return `${normalized}${caution}`;
}
