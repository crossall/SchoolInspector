// quiz-engine.ts - 카테고리 필터링, 지역/학교급 필터, 셔플
// 불변성 원칙: 필터링은 항상 새 배열을 반환

import type { Question, FillInBlankQuestion, OrderingQuestion } from './types';

interface Preferences {
  region: string;
  school_level: string;
}

/**
 * 사용자 설정(지역, 학교급)에 맞는 문제만 필터링한다.
 * region이 "common"이거나 사용자 지역 포함, school_level에 사용자 학교급 포함
 */
export function filterByPreferences(
  questions: readonly Question[],
  prefs: Preferences | null
): Question[] {
  if (!prefs) return [...questions];

  return questions.filter((q) => {
    const region = q.meta?.region ?? [];
    const schoolLevel = q.meta?.school_level ?? [];
    const regionMatch = region.includes('common') || region.includes(prefs.region);
    const levelMatch = schoolLevel.includes(prefs.school_level);
    return regionMatch && levelMatch;
  });
}

/**
 * 문제 은행에서 고유한 카테고리 구조를 추출한다.
 * 사용자 설정에 맞는 문제만 대상으로 한다.
 */
export function extractCategories(
  questions: readonly Question[],
  prefs: Preferences | null
): Record<string, string[]> {
  const filtered = filterByPreferences(questions, prefs);
  const catMap: Record<string, Set<string>> = {};

  for (const q of filtered) {
    if (!catMap[q.category]) {
      catMap[q.category] = new Set();
    }
    catMap[q.category].add(q.subcategory);
  }

  const result: Record<string, string[]> = {};
  for (const [cat, subs] of Object.entries(catMap)) {
    result[cat] = [...subs].sort();
  }
  return result;
}

/**
 * 카테고리 + 서브카테고리로 문제를 필터링한다.
 */
export function filterByCategory(
  questions: readonly Question[],
  prefs: Preferences | null,
  category: string,
  subcategory: string | null
): Question[] {
  return filterByCategories(questions, prefs, [category], subcategory);
}

/**
 * 여러 카테고리 키 + 서브카테고리로 문제를 필터링한다.
 * 대시보드 카드가 여러 DB 카테고리를 묶을 때 사용한다.
 */
export function filterByCategories(
  questions: readonly Question[],
  prefs: Preferences | null,
  categoryKeys: string[],
  subcategory: string | null
): Question[] {
  const prefFiltered = filterByPreferences(questions, prefs);
  const filtered = prefFiltered.filter((q) => {
    if (!categoryKeys.includes(q.category)) return false;
    if (subcategory && q.subcategory !== subcategory) return false;
    return true;
  });
  return shuffle(filtered);
}

/**
 * 오답 노트 문제를 반환한다 (사용자 설정 적용).
 */
export function getIncorrectQuestions(
  questions: readonly Question[],
  prefs: Preferences | null,
  incorrectIds: Set<string>
): Question[] {
  if (incorrectIds.size === 0) return [];
  const prefFiltered = filterByPreferences(questions, prefs);
  const filtered = prefFiltered.filter((q) => incorrectIds.has(q.id));
  return shuffle(filtered);
}

/**
 * 배열을 셔플한다 (Fisher-Yates). 원본을 변경하지 않는다.
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 답변 문자열을 정규화한다.
 */
export function normalizeAnswer(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * 문제 타입별 채점 로직. 순수 함수 — React 의존성 없음.
 */
export function checkAnswer(
  q: Question,
  userAnswer: string | string[]
): boolean {
  if (q.type === 'multiple_choice' || q.type === 'ox_quiz') {
    return normalizeAnswer(userAnswer as string) === normalizeAnswer(q.answer);
  }
  if (q.type === 'fill_in_blank') {
    const ua = userAnswer as string[];
    return (
      ua.length === (q as FillInBlankQuestion).answer.length &&
      ua.every((v, i) => normalizeAnswer(v) === normalizeAnswer((q as FillInBlankQuestion).answer[i]))
    );
  }
  if (q.type === 'ordering') {
    const ua = userAnswer as string[];
    return (
      ua.length === (q as OrderingQuestion).answer_order.length &&
      ua.every((v, i) => normalizeAnswer(v) === normalizeAnswer((q as OrderingQuestion).answer_order[i]))
    );
  }
  return false;
}

/**
 * 해설 텍스트를 HTML로 포맷한다.
 */
export function formatExplanation(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-800 font-bold">$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '<span class="text-indigo-500 font-bold">•</span>')
    .replace(/※/g, '<span class="text-amber-600 font-bold">※</span>')
    .replace(/「([^」]+)」/g, '<span class="text-blue-600 font-semibold">「$1」</span>')
    .replace(/←/g, '<span class="text-red-500 font-bold">←</span>');
}
