/**
 * upload-questions.ts — JSON 문제 파일을 Supabase questions 테이블에 upsert
 *
 * 사용법:
 *   npx tsx scripts/upload-questions.ts                     # public/new_questions.json 업로드
 *   npx tsx scripts/upload-questions.ts public/questions.json  # 특정 파일 업로드
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── 환경변수 로드 (.env.local) ──
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    console.error('❌ .env.local 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── 문제 파일 읽기 ──
const filePath = resolve(process.cwd(), process.argv[2] || 'public/new_questions.json');

let questions: Record<string, unknown>[];
try {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  questions = Array.isArray(parsed) ? parsed : (parsed.questions ? parsed.questions : []);
} catch (err) {
  console.error(`❌ 파일 읽기 실패: ${filePath}`);
  console.error(err);
  process.exit(1);
}

if (!Array.isArray(questions) || questions.length === 0) {
  console.log('⚠️  업로드할 문제가 없습니다 (빈 배열).');
  process.exit(0);
}

console.log(`📂 파일: ${filePath}`);
console.log(`📝 문제 수: ${questions.length}개`);

// ── 데이터 변환 (JSON 타입 → Supabase 컬럼 매핑) ──
interface QuestionRow {
  id: string;
  category: string;
  subcategory: string;
  type: string;
  meta: Record<string, unknown>;
  question: string;
  options: string[];
  answer: string | null;         // 객관식/OX: 단일 문자열
  answer_array: string[] | null; // 빈칸채우기: 문자열 배열
  word_chips: string[] | null;
  items: string[] | null;
  answer_order: string[] | null;
  explanation: string;
}

const rows: QuestionRow[] = questions.map((q) => {
  const type = q.type as string;
  const rawAnswer = q.answer;

  return {
    id: q.id as string,
    category: q.category as string,
    subcategory: q.subcategory as string,
    type,
    meta: q.meta as Record<string, unknown>,
    question: q.question as string,
    options: (q.options as string[]) || [],
    // 유형별 answer 분리
    answer: typeof rawAnswer === 'string' ? rawAnswer : null,
    answer_array: Array.isArray(rawAnswer) ? rawAnswer : null,
    word_chips: (q.word_chips as string[]) || null,
    items: (q.items as string[]) || null,
    answer_order: (q.answer_order as string[]) || null,
    explanation: q.explanation as string,
  };
});

// ── Upsert 실행 (50개씩 배치) ──
async function upload() {
  const batchSize = 50;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ 배치 ${i + 1}~${i + batch.length} 실패:`, error.message);
      errors += batch.length;
    } else {
      uploaded += batch.length;
      console.log(`✅ ${uploaded}/${rows.length} 업로드 완료`);
    }
  }

  console.log('\n════════════════════════════════');
  console.log(`✅ 성공: ${uploaded}개`);
  if (errors > 0) console.log(`❌ 실패: ${errors}개`);
  console.log('════════════════════════════════');
}

upload().catch((err) => {
  console.error('❌ 업로드 중 예외 발생:', err);
  process.exit(1);
});
