'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type Mode = 'daily' | 'meds' | 'cosmetics';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  notice?: string;
  model?: string;
}

const modes: Array<{
  id: Mode;
  label: string;
  placeholder: string;
  promptPrefix: string;
}> = [
  {
    id: 'daily',
    label: '오늘 기록',
    placeholder: '오늘 기록 보고 컨디션 관리 팁 알려줘',
    promptPrefix: '오늘 건강 기록을 기준으로 답해줘.',
  },
  {
    id: 'meds',
    label: '약/영양제',
    placeholder: '오메가3랑 이부프로펜 같이 먹어도 되는지 알려줘',
    promptPrefix: '약/영양제 복용 주의 정보로 답해줘. 단정하지 말고 복용 간격과 전문가 상담 기준을 알려줘.',
  },
  {
    id: 'cosmetics',
    label: '화장품 성분',
    placeholder: '나이아신아마이드, 레티놀, 살리실산 성분 주의점 알려줘',
    promptPrefix: '화장품 성분과 피부 반응 관점으로 답해줘. 피부 타입별 주의점과 중단/상담 기준을 알려줘.',
  },
];

function AiPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('daily');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'meds' || requestedMode === 'cosmetics' || requestedMode === 'daily') {
      setMode(requestedMode);
    }
  }, [searchParams]);

  const selected = modes.find((item) => item.id === mode) ?? modes[0];

  async function submit() {
    const trimmed = question.trim();
    if (!trimmed) return;

    const userText = trimmed;
    setLoading(true);
    setError('');
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const data = await api.ai.ask({
        question: `${selected.promptPrefix}\n\n사용자 질문: ${userText}`,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer, notice: data.safetyNotice, model: data.model },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h1 className="text-[15px] font-semibold text-[#111111]">AI 질문</h1>
        <p className="text-[12px] leading-5 text-[#666666]">
          약/영양제 조합, 화장품 성분, 오늘 기록을 바로 물어볼 수 있습니다.
        </p>
      </section>

      <div className="segmented-control" role="tablist" aria-label="질문 종류">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`segment ${mode === item.id ? 'segment-active' : ''}`}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="chat-panel" aria-label="AI 대화창">
        <div className="chat-scroll">
          {messages.length === 0 ? (
            <div className="empty-state text-left">
              <p className="font-semibold text-[#333333]">{selected.label} 질문을 입력하세요.</p>
              <p className="mt-1 text-[12px] leading-5">
                답변은 참고 정보이며 진단이나 처방을 대신하지 않습니다.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                <p>{message.text}</p>
                {message.model && (
                  <p className="mt-2 text-[11px] font-semibold text-[#666666]">
                    모델: {message.model}
                  </p>
                )}
                {message.notice && <p className="mt-2 text-[11px] text-[#666666]">{message.notice}</p>}
              </div>
            ))
          )}
          {loading && <p className="quiet-note">답변 생성중...</p>}
        </div>

        <div className="space-y-2 border-t border-[#bdbdb8] pt-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1000}
            className="input min-h-[104px] resize-none leading-5"
            placeholder={selected.placeholder}
          />
          <button
            type="button"
            className="btn-primary w-full"
            onClick={submit}
            disabled={loading || !question.trim()}
          >
            {loading ? '전송중...' : '질문 보내기'}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </section>
    </div>
  );
}

export default function AiPage() {
  return (
    <Suspense fallback={<div className="quiet-note">AI 대화창을 준비중입니다.</div>}>
      <AiPageContent />
    </Suspense>
  );
}
