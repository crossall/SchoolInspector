// supabase.ts - 브라우저용 Supabase 클라이언트 싱글턴

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url && !key) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  if (!url) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');

  client = createBrowserClient(url, key);
  return client;
}
