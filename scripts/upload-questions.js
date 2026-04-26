const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { resolve } = require('path');

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
  } catch (e) {
    console.error('Failed to load .env.local');
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('URL or KEY missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const filePath = resolve(process.cwd(), process.argv[2] || 'public/new_questions.json');

let questions = [];
try {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  questions = Array.isArray(parsed) ? parsed : (parsed.questions ? parsed.questions : []);
} catch (err) {
  console.error(`Failed to read file: ${filePath}`);
  process.exit(1);
}

if (!Array.isArray(questions) || questions.length === 0) {
  console.log('No questions to upload.');
  process.exit(0);
}

console.log(`File: ${filePath}`);
console.log(`Total questions: ${questions.length}`);

const rows = questions.map((q) => {
  const type = q.type;
  const rawAnswer = q.answer;

  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    type,
    meta: q.meta,
    question: q.question,
    options: q.options || [],
    answer: typeof rawAnswer === 'string' ? rawAnswer : null,
    answer_array: Array.isArray(rawAnswer) ? rawAnswer : null,
    word_chips: q.word_chips || null,
    items: q.items || null,
    answer_order: q.answer_order || null,
    explanation: q.explanation,
  };
});

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
      console.error(`Batch ${i + 1}~${i + batch.length} failed:`, error.message);
      errors += batch.length;
    } else {
      uploaded += batch.length;
      console.log(`Uploaded ${uploaded}/${rows.length}`);
    }
  }

  console.log(`\nSuccess: ${uploaded}`);
  if (errors > 0) console.log(`Failures: ${errors}`);
}

upload().catch((err) => {
  console.error('Exception during upload:', err);
  process.exit(1);
});
