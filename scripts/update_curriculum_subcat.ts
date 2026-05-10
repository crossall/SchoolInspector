import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 누락되었습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 "교수평" 관련 문제 서브카테고리 업데이트 중...');

  // curriculum_ 로 시작하는 문제들의 서브카테고리를 "교수평"으로 변경
  const { data, error } = await supabase
    .from('questions')
    .update({ subcategory: '교수평' })
    .like('id', 'curriculum_%')
    .eq('category', '현장지원성');

  if (error) {
    console.error('❌ 업데이트 에러:', error);
    process.exit(1);
  }

  console.log('✅ "교수평" 서브카테고리 업데이트 완료');
}

main();
