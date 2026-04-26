// quiz-engine.js - 카테고리 필터링, 지역/학교급 필터, 오답 노트, 세션 관리
// 불변성 원칙: 필터링은 항상 새 배열을 반환

import { getIncorrectIds, loadPreferences } from './storage.js';

/**
 * 사용자 설정(지역, 학교급)에 맞는 문제만 필터링한다.
 * region이 "common"이거나 사용자 지역 포함, school_level에 사용자 학교급 포함
 * @param {Array} questions
 * @returns {Array} 필터링된 문제 배열
 */
export function filterByPreferences(questions) {
  const prefs = loadPreferences();
  if (!prefs) return questions; // 설정 없으면 전체 반환

  return questions.filter((q) => {
    const regionMatch = q.region.includes('common') || q.region.includes(prefs.region);
    const levelMatch = q.school_level.includes(prefs.school_level);
    return regionMatch && levelMatch;
  });
}

/**
 * 문제 은행에서 고유한 카테고리 구조를 추출한다.
 * 사용자 설정에 맞는 문제만 대상으로 한다.
 * @param {Array} questions - 전체 문제 배열
 * @returns {Object<string, string[]>} { "인사실무": ["복무", "호봉"], ... }
 */
export function extractCategories(questions) {
  const filtered = filterByPreferences(questions);
  const catMap = {};
  for (const q of filtered) {
    if (!catMap[q.category]) {
      catMap[q.category] = new Set();
    }
    catMap[q.category].add(q.subcategory);
  }
  const result = {};
  for (const [cat, subs] of Object.entries(catMap)) {
    result[cat] = [...subs].sort();
  }
  return result;
}

/**
 * 카테고리 + 서브카테고리로 문제를 필터링한다.
 * 사용자 설정(지역/학교급)이 자동으로 적용된다.
 * @param {Array} questions
 * @param {string} category
 * @param {string|null} subcategory
 * @returns {Array} 필터링된 문제 배열 (셔플됨)
 */
export function filterByCategory(questions, category, subcategory) {
  const prefFiltered = filterByPreferences(questions);
  const filtered = prefFiltered.filter((q) => {
    if (q.category !== category) return false;
    if (subcategory && q.subcategory !== subcategory) return false;
    return true;
  });
  return shuffle(filtered);
}

/**
 * 오답 노트 문제를 반환한다 (사용자 설정 적용).
 * @param {Array} questions - 전체 문제 배열
 * @returns {Array} is_incorrect=true인 문제들 (셔플됨)
 */
export function getIncorrectQuestions(questions) {
  const incorrectIds = new Set(getIncorrectIds());
  if (incorrectIds.size === 0) return [];
  const prefFiltered = filterByPreferences(questions);
  const filtered = prefFiltered.filter((q) => incorrectIds.has(q.id));
  return shuffle(filtered);
}

/**
 * 오답 총 개수를 반환한다.
 * @returns {number}
 */
export function getIncorrectCount() {
  return getIncorrectIds().length;
}

/**
 * 배열을 셔플한다 (Fisher-Yates). 원본을 변경하지 않는다.
 */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
