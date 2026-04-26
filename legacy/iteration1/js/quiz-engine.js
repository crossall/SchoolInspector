// quiz-engine.js - 간격 반복 알고리즘 및 오늘의 문제 추출 엔진
// 불변성 원칙: 모든 상태 변경은 새 객체를 반환

import { loadProgress, updateQuestionProgress } from './storage.js';

const DAILY_QUOTA = 10;

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * 기준일로부터 N일 후 날짜를 YYYY-MM-DD로 반환
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 오늘의 문제 10개를 추출한다.
 * 1순위: next_review_date <= 오늘 (복습 대상)
 * 2순위: 아직 안 푼 문제 (new) 순서대로
 * @param {Array} questionBank - 전체 문제 배열
 * @returns {Array} 오늘 풀어야 할 문제 배열 (최대 DAILY_QUOTA개)
 */
export function selectDailyQuestions(questionBank) {
  const progress = loadProgress();
  const today = getTodayStr();
  const selected = [];

  // 1순위: 복습 대상 문제 (next_review_date <= 오늘)
  const reviewDue = questionBank.filter((q) => {
    const p = progress[q.id];
    return p && p.next_review_date && p.next_review_date <= today;
  });

  // 날짜가 오래된 순서대로 정렬 (가장 밀린 것부터)
  reviewDue.sort((a, b) => {
    const dateA = progress[a.id].next_review_date;
    const dateB = progress[b.id].next_review_date;
    return dateA.localeCompare(dateB);
  });

  for (const q of reviewDue) {
    if (selected.length >= DAILY_QUOTA) break;
    selected.push(q);
  }

  // 2순위: 아직 안 푼 문제 (new)
  if (selected.length < DAILY_QUOTA) {
    const newQuestions = questionBank.filter((q) => {
      const p = progress[q.id];
      return !p || p.status === 'new';
    });

    for (const q of newQuestions) {
      if (selected.length >= DAILY_QUOTA) break;
      if (!selected.some((s) => s.id === q.id)) {
        selected.push(q);
      }
    }
  }

  return selected;
}

/**
 * 정답 처리: SM-2 변형 알고리즘 적용
 * - 처음 맞춤: interval=1, status='learning'
 * - 연속 정답: interval *= 2
 * @param {string} questionId
 * @returns {Object} 업데이트된 progress 항목
 */
export function handleCorrectAnswer(questionId) {
  const progress = loadProgress();
  const existing = progress[questionId];
  const today = getTodayStr();

  let newInterval;
  let newStatus;

  if (!existing || existing.status === 'new' || existing.interval === 0) {
    // 처음 맞춘 경우
    newInterval = 1;
    newStatus = 'learning';
  } else {
    // 연속 정답: interval 두 배
    newInterval = existing.interval * 2;
    newStatus = newInterval >= 16 ? 'graduated' : 'learning';
  }

  const updates = {
    status: newStatus,
    interval: newInterval,
    next_review_date: addDays(today, newInterval),
  };

  updateQuestionProgress(questionId, updates);
  return { ...updates, question_id: questionId };
}

/**
 * 오답 처리: interval을 1일로 초기화, 내일 복습
 * @param {string} questionId
 * @returns {Object} 업데이트된 progress 항목
 */
export function handleWrongAnswer(questionId) {
  const today = getTodayStr();

  const updates = {
    status: 'learning',
    interval: 1,
    next_review_date: addDays(today, 1),
  };

  updateQuestionProgress(questionId, updates);
  return { ...updates, question_id: questionId };
}
