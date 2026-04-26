// useQuestions.ts - Supabase에서 문제 데이터 로딩
'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Question } from '@/lib/types';

interface QuestionsState {
  questions: Question[];
  loading: boolean;
  error: string | null;
}

/**
 * Supabase DB의 questions 테이블에서 row를 가져와
 * 앱의 Question 유니온 타입으로 매핑한다.
 */
function mapRow(row: Record<string, unknown>): Question {
  const base = {
    id: row.id as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    question: row.question as string,
    explanation: row.explanation as string,
    meta: row.meta as Question['meta'],
  };

  const type = row.type as string;

  if (type === 'fill_in_blank') {
    return {
      ...base,
      type: 'fill_in_blank',
      options: (row.options as string[]) ?? [],
      word_chips: (row.word_chips as string[]) ?? [],
      answer: (row.answer_array as string[]) ?? [],
    };
  }

  if (type === 'ordering') {
    return {
      ...base,
      type: 'ordering',
      options: (row.options as string[]) ?? [],
      items: (row.items as string[]) ?? [],
      answer_order: (row.answer_order as string[]) ?? [],
    };
  }

  if (type === 'ox_quiz') {
    return {
      ...base,
      type: 'ox_quiz',
      options: (row.options as string[]) ?? ['O', 'X'],
      answer: row.answer as string,
    };
  }

  // multiple_choice (default)
  return {
    ...base,
    type: 'multiple_choice',
    options: (row.options as string[]) ?? [],
    answer: row.answer as string,
  };
}

export function useQuestions() {
  const [state, setState] = useState<QuestionsState>({
    questions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabase();

        let allData: Record<string, unknown>[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;

        // Supabase PostgREST caps at 1000 rows per request — loop until all pages fetched
        while (true) {
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('meta->>is_active', 'true')
            .range(from, from + PAGE_SIZE - 1);

          if (error) throw new Error(error.message);
          if (!data || data.length === 0) break;

          allData = [...allData, ...(data as Record<string, unknown>[])];

          if (data.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }

        const questions = allData.map(mapRow);
        setState({ questions, loading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[questions] Load failed:', message);
        setState({ questions: [], loading: false, error: message });
      }
    }
    load();
  }, []);

  return state;
}
