const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
const content = fs.readFileSync(envFile, 'utf-8');
const env = {};
content.split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq !== -1) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const GIBO_MIGRATIONS = [
  // 법적 근거 및 안내 (I~II장)
  { from: '법적근거',       to: '법적 근거 및 안내' },
  { from: '목차',           to: '법적 근거 및 안내' },
  { from: '일러두기',       to: '법적 근거 및 안내' },
  { from: '기재요령일반',   to: '법적 근거 및 안내' },
  // 기재 원칙 (III 01-06)
  { from: '목적',           to: '기재 원칙' },
  { from: '적용범위',       to: '기재 원칙' },
  { from: '용어정의',       to: '기재 원칙' },
  { from: '처리요령',       to: '기재 원칙' },
  { from: '출력서식',       to: '기재 원칙' },
  { from: '인적학적사항',   to: '기재 원칙' },
  { from: '학적처리',       to: '기재 원칙' },
  { from: '학적용어',       to: '기재 원칙' },
  { from: '전출입처리',     to: '기재 원칙' },
  { from: '기타',           to: '기재 원칙' },
  // 출결상황 (III 07) - 값 동일, 스킵 가능하지만 명시
  // { from: '출결상황', to: '출결상황' },
  // 학교폭력 조치상황 (III 08)
  { from: '학교폭력',           to: '학교폭력 조치상황' },
  { from: '학교폭력조치',       to: '학교폭력 조치상황' },
  { from: '학교폭력조치관리',   to: '학교폭력 조치상황' },
  { from: '보호처분',           to: '학교폭력 조치상황' },
  // 교과 및 활동상황 (III 09-12)
  { from: '교과학습발달상황',     to: '교과 및 활동상황' },
  { from: '세부능력특기사항',     to: '교과 및 활동상황' },
  { from: '창의적체험활동',       to: '교과 및 활동상황' },
  { from: '봉사활동',             to: '교과 및 활동상황' },
  { from: '일상생활활동상황',     to: '교과 및 활동상황' },
  { from: '행동특성',             to: '교과 및 활동상황' },
  { from: '행동특성및종합의견',   to: '교과 및 활동상황' },
  { from: '행동특성종합의견',     to: '교과 및 활동상황' },
  { from: '종합',                 to: '교과 및 활동상황' },
  // 자료 관리 (III 13-21)
  { from: '기타사항',       to: '자료 관리' },
  { from: '자료보존',       to: '자료 관리' },
  { from: '자료정정',       to: '자료 관리' },
  { from: '자료제공',       to: '자료 관리' },
  { from: '상업적이용제한', to: '자료 관리' },
  { from: '평가관리센터',   to: '자료 관리' },
  { from: '준용',           to: '자료 관리' },
  { from: '재검토기한',     to: '자료 관리' },
  { from: '부칙',           to: '자료 관리' },
  // 참고자료 (IV장)
  { from: '재외한국학교',       to: '참고자료' },
  { from: '청소년단체',         to: '참고자료' },
  { from: '대안학교',           to: '참고자료' },
  { from: '대안교육',           to: '참고자료' },
  { from: '시도교육청',         to: '참고자료' },
  { from: '시도교육청직속기관', to: '참고자료' },
  { from: '소년보호기관',       to: '참고자료' },
  { from: '위탁학생',           to: '참고자료' },
  { from: '특수학교',           to: '참고자료' },
  { from: '입력글자수',         to: '참고자료' },
  { from: '글자수제한',         to: '참고자료' },
];

const HAKJEOK_MIGRATIONS = [
  { from: '전학',     to: '전입·전출' },
  { from: '유예/면제', to: '면제·유예 및 정원 외 학적관리' },
];

async function updateDB() {
  console.log('=== 생기부기재요령 DB 업데이트 ===');
  for (const { from, to } of GIBO_MIGRATIONS) {
    const { error } = await supabase
      .from('questions')
      .update({ subcategory: to })
      .eq('category', '생기부기재요령')
      .eq('subcategory', from);
    if (error) console.error(`  ❌ '${from}' → '${to}': ${error.message}`);
    else console.log(`  ✅ '${from}' → '${to}'`);
  }

  console.log('\n=== 학적업무 DB 업데이트 ===');
  for (const { from, to } of HAKJEOK_MIGRATIONS) {
    const { error } = await supabase
      .from('questions')
      .update({ subcategory: to })
      .eq('category', '학적업무')
      .eq('subcategory', from);
    if (error) console.error(`  ❌ '${from}' → '${to}': ${error.message}`);
    else console.log(`  ✅ '${from}' → '${to}'`);
  }
  console.log('\nDB 업데이트 완료.\n');
}

function updateLocalFiles() {
  console.log('=== 로컬 JSON 파일 업데이트 ===');
  const giboMap = Object.fromEntries(GIBO_MIGRATIONS.map(m => [m.from, m.to]));
  const hakjeokMap = Object.fromEntries(HAKJEOK_MIGRATIONS.map(m => [m.from, m.to]));
  const publicDir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(publicDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const questions = Array.isArray(data) ? data : (data.questions ?? []);
      let changed = 0;

      for (const q of questions) {
        if (q.category === '생기부기재요령' && giboMap[q.subcategory]) {
          q.subcategory = giboMap[q.subcategory];
          changed++;
        } else if (q.category === '학적업무' && hakjeokMap[q.subcategory]) {
          q.subcategory = hakjeokMap[q.subcategory];
          changed++;
        }
      }

      if (changed > 0) {
        const out = Array.isArray(data) ? questions : { ...data, questions };
        fs.writeFileSync(filePath, JSON.stringify(out, null, 2));
        console.log(`  ✅ ${file} (${changed}건 변경)`);
      } else {
        console.log(`  - ${file}: 변경 없음`);
      }
    } catch (e) {
      console.error(`  ❌ ${file}: ${e.message}`);
    }
  }
  console.log('로컬 파일 업데이트 완료.');
}

async function main() {
  await updateDB();
  updateLocalFiles();
}

main().catch(console.error);
