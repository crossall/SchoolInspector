const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function main() {
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
  const raw = fs.readFileSync('public/new_questions.json', 'utf-8');
  const newQuestions = JSON.parse(raw);
  const newIds = newQuestions.map(q => q.id);

  console.log(`Checking ${newIds.length} IDs against Supabase...`);

  // To avoid URL length limits, we'll check in chunks of 100
  let overlappingIds = [];
  for (let i = 0; i < newIds.length; i += 100) {
    const chunk = newIds.slice(i, i + 100);
    const { data, error } = await supabase.from('questions').select('id').in('id', chunk);
    if (error) {
      console.error('Error fetching data:', error);
      process.exit(1);
    }
    if (data && data.length > 0) {
      overlappingIds.push(...data.map(row => row.id));
    }
  }

  console.log(JSON.stringify({
    totalNew: newIds.length,
    overlappingCount: overlappingIds.length,
    overlappingIds: overlappingIds.slice(0, 10)
  }, null, 2));
}

main();
