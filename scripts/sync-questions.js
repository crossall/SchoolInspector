/**
 * sync-questions.js
 *
 * 로컬 JSON 데이터와 이미지를 Supabase에 한 번에 동기화하는 스크립트.
 *
 * 사전 준비:
 *   1. data/questions.json 에 문제 배열을 위치시킨다.
 *   2. public/images/questions/{id}.png 또는 {id}.jpg 로 이미지를 저장한다.
 *   3. Supabase 대시보드 > Storage > 버킷 생성: "question-images" (Public 버킷)
 *
 * 실행:
 *   node scripts/sync-questions.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── 환경변수 로드 (.env.local 우선, 없으면 .env) ──────────────────────────────

const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
if (!fs.existsSync(envFile)) {
  console.error(`❌ 환경변수 파일을 찾을 수 없습니다: .env.local 또는 .env`);
  process.exit(1);
}

const env = {};
fs.readFileSync(envFile, 'utf-8')
  .split('\n')
  .forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq !== -1) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  });

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── 경로 설정 ─────────────────────────────────────────────────────────────────

const QUESTIONS_PATH = path.resolve('data', 'questions.json');
const IMAGES_DIR     = path.resolve('public', 'images', 'questions');
const BUCKET         = 'question-images';
const EXTENSIONS     = ['.png', '.jpg', '.jpeg', '.webp'];

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function findLocalImage(id) {
  for (const ext of EXTENSIONS) {
    const p = path.join(IMAGES_DIR, `${id}${ext}`);
    if (fs.existsSync(p)) return { filePath: p, ext };
  }
  return null;
}

function mimeType(ext) {
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. 소스 JSON 읽기
  if (!fs.existsSync(QUESTIONS_PATH)) {
    console.error(`❌ 소스 파일을 찾을 수 없습니다: ${QUESTIONS_PATH}`);
    console.error('   data/questions.json 파일을 먼저 준비해 주세요.');
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
  console.log(`✅ 문제 ${questions.length}개 로드 완료 (${QUESTIONS_PATH})`);

  let uploadCount  = 0;
  let skipCount    = 0;
  let upsertErrors = 0;

  for (const q of questions) {
    const imgInfo = findLocalImage(q.id);

    // 2. 이미지 업로드
    if (imgInfo) {
      const { filePath, ext } = imgInfo;
      const storagePath = `${q.id}${ext}`;
      const fileBuffer  = fs.readFileSync(filePath);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType(ext),
          upsert: true,        // 이미 존재하면 덮어씀
        });

      if (uploadError) {
        console.error(`  ⚠️  이미지 업로드 실패 [${q.id}]: ${uploadError.message}`);
      } else {
        // 3. Public URL 가져오기
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);
        q.image_url = urlData.publicUrl;
        uploadCount++;
        console.log(`  🖼️  업로드 완료 [${q.id}] → ${q.image_url}`);
      }
    } else {
      skipCount++;
    }

    // 4. Supabase questions 테이블에 Upsert
    const { error: upsertError } = await supabase
      .from('questions')
      .upsert(q, { onConflict: 'id' });

    if (upsertError) {
      console.error(`  ❌ Upsert 실패 [${q.id}]: ${upsertError.message}`);
      upsertErrors++;
    }
  }

  console.log('\n──────────────────────────────────────');
  console.log(`✅ 동기화 완료`);
  console.log(`   이미지 업로드: ${uploadCount}개`);
  console.log(`   이미지 없음 (스킵): ${skipCount}개`);
  console.log(`   Upsert 오류: ${upsertErrors}개`);
  console.log('──────────────────────────────────────');
}

main().catch((err) => {
  console.error('예상치 못한 오류:', err);
  process.exit(1);
});
