import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
  } catch (err) {
    console.error('Failed to load .env.local');
    process.exit(1);
  }
}

loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const filePath = resolve(process.cwd(), 'public/new_questions.json');
  const raw = readFileSync(filePath, 'utf-8');
  let newQuestions = JSON.parse(raw);
  if (!Array.isArray(newQuestions) && newQuestions.questions) {
    newQuestions = newQuestions.questions;
  }
  
  const newIds = newQuestions.map((q: any) => q.id);
  console.log(`Checking ${newIds.length} new IDs...`);
  
  let overlappingIds: string[] = [];
  
  for (let i = 0; i < newIds.length; i += 100) {
    const chunk = newIds.slice(i, i + 100);
    const { data, error } = await supabase.from('questions').select('id').in('id', chunk);
    if (error) {
      console.error(error);
      process.exit(1);
    }
    if (data && data.length > 0) {
      overlappingIds.push(...data.map(r => r.id));
    }
  }
  
  console.log(`Overlapping count: ${overlappingIds.length}`);
  if (overlappingIds.length > 0) {
    console.log(`Overlapping IDs (first 10): ${overlappingIds.slice(0, 10).join(', ')}`);
  } else {
    console.log('No overlapping IDs found. Safe to upload.');
  }
}

main().catch(console.error);
