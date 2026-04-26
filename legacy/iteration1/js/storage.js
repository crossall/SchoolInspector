// storage.js - LocalStorage 기반 사용자 학습 이력 관리
// 불변성 원칙: 모든 업데이트는 새 객체를 반환

const STORAGE_KEY = 'quiz_user_progress';

/**
 * 전체 사용자 진행 데이터를 읽어온다.
 * @returns {Object<string, UserProgress>} question_id를 키로 하는 맵
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.error('Failed to load progress from localStorage');
    return {};
  }
}

/**
 * 전체 사용자 진행 데이터를 저장한다.
 * @param {Object<string, UserProgress>} progressMap
 */
export function saveProgress(progressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  } catch {
    console.error('Failed to save progress to localStorage');
  }
}

/**
 * 특정 문제의 진행 데이터를 업데이트한다 (불변 방식).
 * @param {string} questionId
 * @param {Partial<UserProgress>} updates
 * @returns {Object<string, UserProgress>} 새로운 progressMap
 */
export function updateQuestionProgress(questionId, updates) {
  const current = loadProgress();
  const existing = current[questionId] || {
    question_id: questionId,
    status: 'new',
    interval: 0,
    next_review_date: null,
  };

  const updated = { ...existing, ...updates, question_id: questionId };
  const newMap = { ...current, [questionId]: updated };
  saveProgress(newMap);
  return newMap;
}

/**
 * 모든 학습 이력을 초기화한다.
 */
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
