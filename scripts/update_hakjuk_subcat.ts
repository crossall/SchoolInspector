import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env.local 파일을 확인해주세요. SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 학적업무 관련 문제 서브카테고리 업데이트 중...');

  // Update all questions where id starts with 'hakjuk_' and category is '현장지원성'
  const { data, error } = await supabase
    .from('questions')
    .update({ subcategory: '학적업무' })
    .like('id', 'hakjuk_%')
    .eq('category', '현장지원성');

  if (error) {
    console.error('❌ 업데이트 중 에러 발생:', error);
    process.exit(1);
  }

  console.log('✅ 학적업무 서브카테고리 업데이트 완료');
}

main();
