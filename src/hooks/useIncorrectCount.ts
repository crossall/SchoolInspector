// useIncorrectCount.ts — 오답 노트 문항 수 조회 훅
// user_progress 테이블에서 is_correct = false인 행의 수만 가져온다.
// 무거운 데이터가 아닌 카운트만 조회하므로 대시보드 배지에 최적화되어 있다.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

interface IncorrectCountState {
  count: number;
  loading: boolean;
  error: string | null;
}

export function useIncorrectCount(userId: string | undefined) {
  const [state, setState] = useState<IncorrectCountState>({
    count: 0,
    loading: true,
    error: null,
  });

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setState({ count: 0, loading: false, error: null });
      return;
    }

    const supabase = getSupabase();

    // head: true → 데이터 페이로드 없이 COUNT만 반환 (네트워크 최소화)
    const { count, error } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', false);

    if (error) {
      setState({ count: 0, loading: false, error: error.message });
      return;
    }

    setState({ count: count ?? 0, loading: false, error: null });
  }, [userId]);

  useEffect(() => {
    fetchCount();
    // fetchCount is stable (userId is the only dependency) — depend on userId directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    incorrectCount: state.count,
    loading: state.loading,
    error: state.error,
    /** 오답 제출 후 카운트를 즉시 갱신할 때 호출 */
    refetch: fetchCount,
  };
}
