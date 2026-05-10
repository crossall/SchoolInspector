// useEssayQuestions.ts - Supabase에서 essay 문제만 로딩
'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { EssayQuestion, GradingRubric } from '@/lib/types';

interface EssayQuestionsState {
  questions: EssayQuestion[];
  loading: boolean;
  error: string | null;
}

function mapEssayRow(row: Record<string, unknown>): EssayQuestion {
  return {
    id: row.id as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    question: row.question as string,
    explanation: (row.explanation as string) ?? '',
    image_url: (row.image_url as string) ?? undefined,
    meta: row.meta as EssayQuestion['meta'],
    type: 'essay',
    model_answer: (row.model_answer as string) ?? undefined,
    grading_rubric: (row.grading_rubric as GradingRubric) ?? undefined,
  };
}

export function useEssayQuestions() {
  const [state, setState] = useState<EssayQuestionsState>({
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

        while (true) {
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('type', 'essay')
            .eq('meta->>is_active', 'true')
            .range(from, from + PAGE_SIZE - 1);

          if (error) throw new Error(error.message);
          if (!data || data.length === 0) break;

          allData = [...allData, ...(data as Record<string, unknown>[])];
          if (data.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }

        setState({ questions: allData.map(mapEssayRow), loading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[essayQuestions] Load failed:', message);
        setState({ questions: [], loading: false, error: message });
      }
    }
    load();
  }, []);

  return state;
}
