// Node.js 기반 알고리즘 테스트 v2 - 지역/학교급 필터링 포함

const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

const {
  loadProgress, markCorrect, markIncorrect, getIncorrectIds, resetProgress,
  getTodayStr, loadPreferences, savePreferences, hasCompletedOnboarding,
  REGIONS, SCHOOL_LEVELS,
} = await import('./js/storage.js');

const {
  extractCategories, filterByCategory, filterByPreferences,
  getIncorrectQuestions, getIncorrectCount,
} = await import('./js/quiz-engine.js');

const fs = await import('fs');
const bank = JSON.parse(fs.readFileSync('./questions.json', 'utf-8'));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { console.log(`  ✅ PASS: ${msg}`); passed++; }
  else { console.log(`  ❌ FAIL: ${msg}`); failed++; }
}

console.log('=== 교육전문직 문제은행 v2 테스트 ===\n');
console.log(`오늘: ${getTodayStr()}`);
console.log(`문제 은행: ${bank.length}개\n`);

// ── Test 1: 데이터 스키마 검증 ──
console.log('[Test 1] 데이터 스키마 (region, school_level 필수)');
const allHaveRegion = bank.every(q => Array.isArray(q.region) && q.region.length > 0);
const allHaveLevel = bank.every(q => Array.isArray(q.school_level) && q.school_level.length > 0);
assert(allHaveRegion, '모든 문제에 region 배열 존재');
assert(allHaveLevel, '모든 문제에 school_level 배열 존재');

const regionValues = new Set(bank.flatMap(q => q.region));
const levelValues = new Set(bank.flatMap(q => q.school_level));
console.log(`  지역 값: ${[...regionValues].join(', ')}`);
console.log(`  학교급 값: ${[...levelValues].join(', ')}`);

// ── Test 2: REGIONS/SCHOOL_LEVELS 상수 ──
console.log('\n[Test 2] 상수 검증');
assert(REGIONS.length === 17, `17개 시도 (실제: ${REGIONS.length})`);
assert(SCHOOL_LEVELS.length === 3, `3개 학교급 (실제: ${SCHOOL_LEVELS.length})`);
assert(REGIONS.includes('서울'), '서울 포함');
assert(SCHOOL_LEVELS.includes('초등'), '초등 포함');

// ── Test 3: 온보딩 (설정 저장/로드) ──
console.log('\n[Test 3] 온보딩 & 설정 관리');
assert(!hasCompletedOnboarding(), '초기: 온보딩 미완료');

savePreferences('서울', '초등');
assert(hasCompletedOnboarding(), '저장 후: 온보딩 완료');

const prefs = loadPreferences();
assert(prefs.region === '서울', 'region = 서울');
assert(prefs.school_level === '초등', 'school_level = 초등');

// ── Test 4: 지역/학교급 필터링 - 서울 초등 ──
console.log('\n[Test 4] 필터링: 서울 + 초등');
const seoulCho = filterByPreferences(bank);
const seoulChoIds = seoulCho.map(q => q.id);
console.log(`  필터 결과: ${seoulCho.length}개 → ${seoulChoIds.join(', ')}`);

// 서울 초등 전용 문제 포함
assert(seoulChoIds.includes('insa_seoul_cho_001'), '서울 초등 전용 문제 포함');
// common + 초등 포함
assert(seoulChoIds.includes('insa_common_all_001'), 'common + 전학교급 포함');
// 경기 전용 문제 미포함
assert(!seoulChoIds.includes('insa_gyeonggi_mid_001'), '경기 중등 전용 문제 미포함');
// common + 중등/고등만 있는 문제 미포함
assert(!seoulChoIds.includes('seng_common_midhi_001'), 'common이지만 중/고등만 → 미포함');
// common + 초등 포함된 문제 포함
assert(seoulChoIds.includes('hakjuk_common_cho_002'), 'common + 초등 포함 문제 포함');

// ── Test 5: 설정 변경 후 필터링 - 경기 중등 ──
console.log('\n[Test 5] 필터링: 경기 + 중등');
savePreferences('경기', '중등');
const gyeonggiMid = filterByPreferences(bank);
const gyeonggiMidIds = gyeonggiMid.map(q => q.id);
console.log(`  필터 결과: ${gyeonggiMid.length}개 → ${gyeonggiMidIds.join(', ')}`);

assert(gyeonggiMidIds.includes('insa_gyeonggi_mid_001'), '경기 중등 전용 포함');
assert(!gyeonggiMidIds.includes('insa_seoul_cho_001'), '서울 초등 전용 미포함');
assert(gyeonggiMidIds.includes('seng_common_midhi_001'), 'common + 중등/고등 포함');
assert(gyeonggiMidIds.includes('insa_common_all_001'), 'common + 전학교급 포함');
assert(!gyeonggiMidIds.includes('hakjuk_common_cho_002'), '초등 전용 문제 미포함');

// ── Test 6: 카테고리 추출 (설정 반영) ──
console.log('\n[Test 6] 카테고리 추출 (경기 중등 설정)');
const cats = extractCategories(bank);
const catKeys = Object.keys(cats);
console.log(`  카테고리: ${JSON.stringify(cats)}`);
assert(catKeys.includes('인사실무'), '인사실무 존재');
// 경기 중등에서 전보 서브카테고리가 있어야 함 (gyeonggi_mid_001)
assert(cats['인사실무'].includes('전보'), '경기 중등이므로 전보 서브카테고리 포함');

// ── Test 7: 카테고리 필터 + 설정 연동 ──
console.log('\n[Test 7] 카테고리 필터 + 설정 연동');
savePreferences('서울', '초등');
const insaSeoulCho = filterByCategory(bank, '인사실무', null);
console.log(`  인사실무(서울초등): ${insaSeoulCho.length}개 → ${insaSeoulCho.map(q=>q.id).join(', ')}`);
assert(insaSeoulCho.some(q => q.id === 'insa_seoul_cho_001'), '서울 초등 전보 포함');
assert(!insaSeoulCho.some(q => q.id === 'insa_gyeonggi_mid_001'), '경기 중등 미포함');

// ── Test 8: 오답 처리 ──
console.log('\n[Test 8] 오답 처리 + 해제');
resetProgress();
markIncorrect('insa_common_all_001');
markIncorrect('insa_seoul_cho_001');
assert(getIncorrectCount() === 2, `오답 2개 (실제: ${getIncorrectCount()})`);

markCorrect('insa_common_all_001');
assert(getIncorrectCount() === 1, '오답 1개로 감소');

const incorrectQs = getIncorrectQuestions(bank);
assert(incorrectQs.length === 1, '오답 문제 1개');
assert(incorrectQs[0].id === 'insa_seoul_cho_001', '남은 오답 = insa_seoul_cho_001');

// ── Test 9: 오답 노트도 설정 필터 적용 ──
console.log('\n[Test 9] 오답 노트 + 설정 필터');
resetProgress();
markIncorrect('insa_seoul_cho_001');     // 서울 초등 전용
markIncorrect('insa_gyeonggi_mid_001'); // 경기 중등 전용

savePreferences('서울', '초등');
const incorrectFiltered = getIncorrectQuestions(bank);
console.log(`  서울초등 오답: ${incorrectFiltered.map(q=>q.id).join(', ')}`);
assert(incorrectFiltered.length === 1, '서울초등 설정에서 오답 1개만 보임');
assert(incorrectFiltered[0].id === 'insa_seoul_cho_001', '서울초등 문제만 보임');

// ── Test 10: OX 퀴즈 타입 확인 ──
console.log('\n[Test 10] 문제 타입 분포');
const oxCount = bank.filter(q => q.type === 'ox_quiz').length;
const mcCount = bank.filter(q => q.type === 'multiple_choice').length;
assert(oxCount > 0, `OX 문제: ${oxCount}개`);
assert(mcCount > 0, `객관식 문제: ${mcCount}개`);

// ── 결과 ──
console.log(`\n=== 결과: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
