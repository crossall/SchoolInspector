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

const MIGRATIONS = [
  { from: '총론',         to: '교육과정의 성격' },
  { from: '설계와운영',   to: '학교 교육과정 설계와 운영' },
  { from: '편성운영',     to: '학교 교육과정 설계와 운영' },
  { from: '평가',         to: '학교 교육과정 설계와 운영' },
  { from: '기본사항',     to: '교육과정 편성운영' },
  { from: '공통편성',     to: '교육과정 편성운영' },
  { from: '학교자율시간', to: '교육과정 편성운영' },
  { from: '초등편성',     to: '초등편성운영' },
  { from: '중등편성',     to: '중등편성운영' },
  { from: '고등편성',     to: '중등편성운영' },
  { from: '특수편성',     to: '특수편성운영' },
  { from: '지원',         to: '학교 교육과정 지원' },
];

async function updateDB() {
  console.log('=== Supabase DB 업데이트 시작 ===');
  for (const { from, to } of MIGRATIONS) {
    const { error, count } = await supabase
      .from('questions')
      .update({ subcategory: to })
      .eq('category', '교육과정')
      .eq('subcategory', from)
      .select('id', { count: 'exact', head: true });
    if (error) {
      console.error(`  ❌ '${from}' → '${to}': ${error.message}`);
    } else {
      console.log(`  ✅ '${from}' → '${to}' (${count ?? '?'}건)`);
    }
  }
  console.log('DB 업데이트 완료.\n');
}

function updateLocalFiles() {
  console.log('=== 로컬 JSON 파일 업데이트 시작 ===');
  const fromMap = Object.fromEntries(MIGRATIONS.map(m => [m.from, m.to]));
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
        if (q.category === '교육과정' && fromMap[q.subcategory]) {
          q.subcategory = fromMap[q.subcategory];
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
