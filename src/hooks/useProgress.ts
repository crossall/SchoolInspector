// useProgress.ts — 오답 ID 집합 관리 훅
// DB 쓰기는 QuizView → saveProgress(lib/progress.ts) 경로로만 수행한다.
// 이 훅은 읽기(초기 로드) + 로컬 상태 업데이트만 담당한다.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

interface ProgressState {
  incorrectIds: Set<string>;
  loading: boolean;
}

export function useProgress(userId: string | undefined) {
  const [state, setState] = useState<ProgressState>({
    incorrectIds: new Set(),
    loading: true,
  });

  // 초기 로드: user_progress에서 is_correct = false인 question_id 목록
  useEffect(() => {
    if (!userId) {
      setState({ incorrectIds: new Set(), loading: false });
      return;
    }

    async function load() {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('user_progress')
        .select('question_id')
        .eq('user_id', userId)
        .eq('is_correct', false);   // 새 스키마: is_correct (이전: is_incorrect)

      if (error) {
        console.error('[progress] Load failed:', error.message);
        setState({ incorrectIds: new Set(), loading: false });
        return;
      }

      const ids = new Set((data ?? []).map((row) => row.question_id as string));
      setState({ incorrectIds: ids, loading: false });
    }

    load();
  }, [userId]);

  /**
   * 정답 처리: 로컬 Set에서 제거
   * DB 쓰기는 QuizView → saveProgress 경로에서 이미 수행됨
   */
  const markCorrect = useCallback((questionId: string) => {
    setState((prev) => {
      const next = new Set(prev.incorrectIds);
      next.delete(questionId);
      return { ...prev, incorrectIds: next };
    });
  }, []);

  /**
   * 오답 처리: 로컬 Set에 추가
   * DB 쓰기는 QuizView → saveProgress 경로에서 이미 수행됨
   */
  const markIncorrect = useCallback((questionId: string) => {
    setState((prev) => {
      const next = new Set(prev.incorrectIds);
      next.add(questionId);
      return { ...prev, incorrectIds: next };
    });
  }, []);

  /** 학습 이력 전체 초기화 (DB + 로컬) */
  const resetAll = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabase();
    const { error } = await supabase.from('user_progress').delete().eq('user_id', userId);
    if (error) {
      console.error('[progress] resetAll failed:', error.message);
      return;
    }
    setState({ incorrectIds: new Set(), loading: false });
  }, [userId]);

  return {
    incorrectIds: state.incorrectIds,
    incorrectCount: state.incorrectIds.size,
    loading: state.loading,
    markCorrect,
    markIncorrect,
    resetAll,
  };
}
