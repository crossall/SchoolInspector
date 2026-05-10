import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('category, subcategory, type');
    
  if (error) {
    console.error('Error fetching:', error);
    process.exit(1);
  }

  const map = new Map<string, Set<string>>();
  
  data.forEach(row => {
    const typeLabel = row.type === 'essay' ? '에세이형' : '객관식형';
    const key = `[${typeLabel}] ${row.category}`;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row.subcategory);
  });
  
  console.log('\n=== 현재 DB 카테고리 현황 ===');
  for (const [key, subcats] of map.entries()) {
    console.log(`\n${key}`);
    const sortedSubcats = Array.from(subcats).sort();
    for (const sub of sortedSubcats) {
      console.log(`  - ${sub}`);
    }
  }
}

main();
