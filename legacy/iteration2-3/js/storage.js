// storage.js - LocalStorage 기반 오답 추적, 학습 이력, 사용자 설정 관리
// 불변성 원칙: 모든 업데이트는 새 객체를 반환

const PROGRESS_KEY = 'quiz_user_progress';
const PREFS_KEY = 'user_preferences';

// ── 지역/학교급 상수 ──

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export const SCHOOL_LEVELS = ['초등', '중등', '고등'];

// ══════════════════════════════════
// 사용자 설정 (Preferences)
// ══════════════════════════════════

/**
 * 사용자 설정을 불러온다.
 * @returns {{ region: string, school_level: string } | null}
 */
export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    console.error('[storage] Failed to load preferences');
    return null;
  }
}

/**
 * 사용자 설정을 저장한다 (불변 - 항상 새 객체).
 * @param {string} region
 * @param {string} schoolLevel
 * @returns {{ region: string, school_level: string }}
 */
export function savePreferences(region, schoolLevel) {
  const prefs = { region, school_level: schoolLevel };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    console.error('[storage] Failed to save preferences');
  }
  return prefs;
}

/**
 * 온보딩 완료 여부를 반환한다.
 * @returns {boolean}
 */
export function hasCompletedOnboarding() {
  return loadPreferences() !== null;
}

// ══════════════════════════════════
// 오늘 날짜
// ══════════════════════════════════

export function getTodayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ══════════════════════════════════
// User Progress (오답 추적)
// ══════════════════════════════════

/**
 * 전체 User Progress 맵을 읽어온다.
 * @returns {Object<string, {question_id: string, is_incorrect: boolean, last_solved_date: string}>}
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.error('[storage] Failed to load progress');
    return {};
  }
}

function saveProgress(progressMap) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
  } catch {
    console.error('[storage] Failed to save progress');
  }
}

export function markCorrect(questionId) {
  const current = loadProgress();
  const existing = current[questionId] || { question_id: questionId };
  const updated = {
    ...existing,
    question_id: questionId,
    is_incorrect: false,
    last_solved_date: getTodayStr(),
  };
  const newMap = { ...current, [questionId]: updated };
  saveProgress(newMap);
  return newMap;
}

export function markIncorrect(questionId) {
  const current = loadProgress();
  const existing = current[questionId] || { question_id: questionId };
  const updated = {
    ...existing,
    question_id: questionId,
    is_incorrect: true,
    last_solved_date: getTodayStr(),
  };
  const newMap = { ...current, [questionId]: updated };
  saveProgress(newMap);
  return newMap;
}

export function getIncorrectIds() {
  const progress = loadProgress();
  return Object.values(progress)
    .filter((p) => p.is_incorrect === true)
    .map((p) => p.question_id);
}

export function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}
