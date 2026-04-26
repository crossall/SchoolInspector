// Node.js 기반 알고리즘 단위 테스트
// LocalStorage를 모킹하여 quiz-engine 로직 검증

// LocalStorage mock
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

// Dynamic import after mock setup
const { loadProgress, saveProgress, updateQuestionProgress, resetProgress } = await import('./js/storage.js');
const { selectDailyQuestions, handleCorrectAnswer, handleWrongAnswer, getTodayStr, addDays } = await import('./js/quiz-engine.js');

const fs = await import('fs');
const bank = JSON.parse(fs.readFileSync('./question_bank.json', 'utf-8'));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

console.log('=== 간격 반복 알고리즘 테스트 ===\n');
console.log(`오늘: ${getTodayStr()}`);

// Test 1: addDays
console.log('\n[Test 1] addDays 함수');
assert(addDays('2026-03-26', 1) === '2026-03-27', '1일 후');
assert(addDays('2026-03-26', 7) === '2026-04-02', '7일 후 (월 넘김)');
assert(addDays('2026-12-31', 1) === '2027-01-01', '연도 넘김');

// Test 2: 초기 상태 - 10개 추출
console.log('\n[Test 2] 초기 문제 추출');
resetProgress();
const daily = selectDailyQuestions(bank);
assert(daily.length === 10, `10개 추출됨 (실제: ${daily.length})`);
assert(daily[0].id === 'q001', '첫 번째 문제 = q001');

// Test 3: 정답 처리 - 첫 정답
console.log('\n[Test 3] 첫 정답 처리');
resetProgress();
const r1 = handleCorrectAnswer('q001');
assert(r1.interval === 1, 'interval = 1');
assert(r1.status === 'learning', "status = 'learning'");
assert(r1.next_review_date === addDays(getTodayStr(), 1), 'next_review = 내일');

// Test 4: 연속 정답 - interval 두 배
console.log('\n[Test 4] 연속 정답 interval 증가');
resetProgress();
const intervals = [];
for (let i = 0; i < 5; i++) {
  const r = handleCorrectAnswer('q001');
  intervals.push(r.interval);
}
assert(intervals[0] === 1, 'step1: 1');
assert(intervals[1] === 2, 'step2: 2');
assert(intervals[2] === 4, 'step3: 4');
assert(intervals[3] === 8, 'step4: 8');
assert(intervals[4] === 16, 'step5: 16');

// Test 5: graduated 상태 전환
console.log('\n[Test 5] graduated 상태');
const progress = loadProgress();
assert(progress['q001'].status === 'graduated', "interval>=16 시 status='graduated'");

// Test 6: 오답 처리 - interval 초기화
console.log('\n[Test 6] 오답 처리');
const rw = handleWrongAnswer('q001');
assert(rw.interval === 1, 'interval이 1로 초기화');
assert(rw.next_review_date === addDays(getTodayStr(), 1), 'next_review = 내일');

// Test 7: 오답 후 다시 정답
console.log('\n[Test 7] 오답 후 정답');
const ra = handleCorrectAnswer('q001');
assert(ra.interval === 2, '오답(1) 후 정답 시 interval 두 배 = 2');

// Test 8: 복습 대상 우선 추출
console.log('\n[Test 8] 복습 대상 우선 추출');
resetProgress();
// q001을 learning으로 만들고 next_review를 오늘로 설정
updateQuestionProgress('q001', { status: 'learning', interval: 1, next_review_date: getTodayStr() });
// q005도 복습 대상
updateQuestionProgress('q005', { status: 'learning', interval: 2, next_review_date: addDays(getTodayStr(), -1) });

const daily2 = selectDailyQuestions(bank);
const ids = daily2.map(q => q.id);
assert(ids.includes('q001'), 'q001 (오늘 복습) 포함');
assert(ids.includes('q005'), 'q005 (어제 복습 밀림) 포함');
assert(ids.indexOf('q005') < ids.indexOf('q001'), 'q005가 q001보다 먼저 (더 밀림)');
assert(daily2.length === 10, `총 10개 (실제: ${daily2.length})`);

// 결과
console.log(`\n=== 결과: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
