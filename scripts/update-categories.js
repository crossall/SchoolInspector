const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경변수 로드
const content = fs.readFileSync('.env.local', 'utf-8');
const env = {};
content.split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq !== -1) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const targetSubcatsToImyong = [
  "보직교사", "전직", "파견", "겸임겸직", 
  "직위해제", "퇴직면직", "공모교장", "초빙교사"
];

async function updateDB() {
  console.log('1. DB: "호봉" -> "호봉 및 승급" 업데이트 시작...');
  const { error: err1 } = await supabase
    .from('questions')
    .update({ subcategory: '호봉 및 승급' })
    .eq('category', '인사실무')
    .eq('subcategory', '호봉');
  if (err1) console.error('Error 1:', err1);

  console.log('2. DB: 지정된 카테고리들을 "임용"으로 병합 업데이트 시작...');
  const { error: err2 } = await supabase
    .from('questions')
    .update({ subcategory: '임용' })
    .eq('category', '인사실무')
    .in('subcategory', targetSubcatsToImyong);
  if (err2) console.error('Error 2:', err2);
  
  console.log('✅ DB 업데이트 완료.');
}

function updateLocalFiles() {
  console.log('3. 로컬 JSON 파일들 업데이트 시작...');
  const publicDir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(publicDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      
      let questions = Array.isArray(data) ? data : (data.questions ? data.questions : []);
      let changed = false;
      
      questions.forEach(q => {
        if (q.category === '인사실무') {
          if (q.subcategory === '호봉') {
            q.subcategory = '호봉 및 승급';
            changed = true;
          } else if (targetSubcatsToImyong.includes(q.subcategory)) {
            q.subcategory = '임용';
            changed = true;
          }
        }
      });
      
      if (changed) {
        if (Array.isArray(data)) {
          fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        } else {
          data.questions = questions;
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        console.log(`  ✅ Updated ${file}`);
      } else {
        console.log(`  - No changes needed for ${file}`);
      }
    } catch (e) {
      console.error(`  ❌ Error processing ${file}:`, e.message);
    }
  });
  console.log('✅ 로컬 파일 업데이트 완료.');
}

async function main() {
  await updateDB();
  updateLocalFiles();
}

main().catch(console.error);
