// progress.ts — 학습 기록 저장 유틸리티
// DB 쓰기는 이 파일에만 집중시켜 단일 진실 원천(Single Source of Truth)을 유지한다.
// 읽기(오답 목록 조회 등)는 훅 레이어(useProgress, useIncorrectCount)에서 담당.

import { getSupabase } from './supabase';

/**
 * 유저의 문항 풀이 결과를 Supabase에 원자적으로 Upsert한다.
 *
 * - 최초 시도: INSERT (attempt_count = 1)
 * - 재시도: UPDATE is_correct, attempt_count += 1, last_attempt_at = now()
 * - DB 함수 `upsert_user_progress` (01_setup_progress_and_pro.sql)를 RPC로 호출
 *
 * @throws Supabase RPC 에러가 발생하면 그대로 throw
 */
export async function saveProgress(
  userId: string,
  questionId: string,
  isCorrect: boolean,
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.rpc('upsert_user_progress', {
    p_user_id:     userId,
    p_question_id: questionId,
    p_is_correct:  isCorrect,
  });

  if (error) {
    // 호출부(QuizView)에서 처리할 수 있도록 에러를 그대로 전파
    throw new Error(`[saveProgress] ${error.message}`);
  }
}
