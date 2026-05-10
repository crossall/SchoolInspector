'use server';

import Anthropic from '@anthropic-ai/sdk';
import type { GradingResult, GradingRubric } from '@/lib/types';

// Anthropic client will be instantiated inside gradeEssay function after verifying API key
const SYSTEM_PROMPT = `당신은 교육전문직(장학사) 임용시험 수석 채점관입니다.
답안을 채점 기준에 따라 엄밀하게 평가하고, **반드시 아래 JSON 형식만** 출력하세요. 다른 텍스트는 절대 출력하지 마세요.

출력 형식:
{"score":숫자,"is_pass":불리언,"feedback_summary":"한 문장 요약","missing_keywords":["누락된 키워드"],"detailed_feedback":"상세 피드백"}

채점 기준:
- score: 0~10점 (6점 이상이면 is_pass = true)
- feedback_summary: 채점 결과를 한 문장으로 요약
- missing_keywords: 답안에서 누락된 필수 키워드만 배열로 (모두 포함 시 빈 배열)
- detailed_feedback: 답안의 강점과 개선점을 구체적으로 서술 (200자 내외)`;

export async function gradeEssay(
  questionText: string,
  rubric: GradingRubric,
  userAnswer: string
): Promise<GradingResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `[채점 기준]
필수 키워드: ${rubric.required_keywords.join(', ')}
참고 지침: ${rubric.reference_text}
분량 기준: ${rubric.constraints}

[문제]
${questionText}

[수험생 답안]
${userAnswer}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude로부터 응답을 받지 못했습니다.');
  }

  let parsed: GradingResult;
  try {
    parsed = JSON.parse(textBlock.text) as GradingResult;
  } catch {
    throw new Error('채점 결과를 파싱하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
  }

  if (
    typeof parsed.score !== 'number' ||
    typeof parsed.is_pass !== 'boolean' ||
    typeof parsed.feedback_summary !== 'string' ||
    !Array.isArray(parsed.missing_keywords) ||
    typeof parsed.detailed_feedback !== 'string'
  ) {
    throw new Error('채점 결과 형식이 올바르지 않습니다. 다시 시도해 주세요.');
  }

  return parsed;
}
