-- ============================================================
-- 01_setup_progress_and_pro.sql
-- 장학사 문제은행 — 오답 노트 + PRO 권한 스키마 설정
-- Supabase SQL Editor에 복사 후 실행하세요.
-- 실행 전: Auth > Users 확인, profiles 테이블 존재 확인
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profiles 테이블 — is_pro 컬럼 추가
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_pro
  IS 'true = PRO 유료 플랜 가입자. 수동 또는 결제 웹훅으로 갱신';

-- ────────────────────────────────────────────────────────────
-- 2. user_progress 테이블 — 기존 테이블 재구성
--    ⚠️  기존 user_progress 테이블이 있다면 데이터가 삭제됩니다.
--    필요 시 아래 DROP 전에 백업 쿼리를 먼저 실행하세요.
--    예) CREATE TABLE user_progress_backup AS SELECT * FROM user_progress;
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.user_progress CASCADE;

CREATE TABLE public.user_progress (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL
                                 REFERENCES public.profiles(id)
                                 ON DELETE CASCADE,
  question_id      text        NOT NULL,
  is_correct       boolean     NOT NULL,
  attempt_count    integer     NOT NULL DEFAULT 1
                                 CHECK (attempt_count >= 1),
  last_attempt_at  timestamptz NOT NULL DEFAULT now(),

  -- 동일 유저가 동일 문항을 중복 저장하지 않음
  CONSTRAINT uq_user_question UNIQUE (user_id, question_id)
);

COMMENT ON TABLE  public.user_progress IS '유저별 문항 풀이 이력 (오답 노트 소스)';
COMMENT ON COLUMN public.user_progress.is_correct       IS '마지막 시도의 정답 여부';
COMMENT ON COLUMN public.user_progress.attempt_count    IS '누적 시도 횟수 (최초 삽입 시 1)';
COMMENT ON COLUMN public.user_progress.last_attempt_at  IS '마지막으로 푼 UTC 시각';

-- ────────────────────────────────────────────────────────────
-- 3. Row Level Security — 본인 데이터만 접근 가능
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 기존 정책 초기화 후 재생성
DROP POLICY IF EXISTS "user_progress_own_data" ON public.user_progress;

CREATE POLICY "user_progress_own_data"
  ON public.user_progress
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. upsert_user_progress — 원자적 Upsert + attempt_count 증가
--    JS 레이어에서는 단순히 supabase.rpc('upsert_user_progress', {...}) 호출
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_user_progress(
  p_user_id     uuid,
  p_question_id text,
  p_is_correct  boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER          -- RLS를 우회하여 함수 소유자 권한으로 실행
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_progress
    (user_id, question_id, is_correct, attempt_count, last_attempt_at)
  VALUES
    (p_user_id, p_question_id, p_is_correct, 1, now())
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET
    is_correct      = EXCLUDED.is_correct,
    attempt_count   = public.user_progress.attempt_count + 1,
    last_attempt_at = now();
END;
$$;

COMMENT ON FUNCTION public.upsert_user_progress IS
  '정답/오답 저장: 최초 삽입 시 attempt_count=1, 이후 충돌 시 1씩 증가';

-- ────────────────────────────────────────────────────────────
-- 5. 인덱스 — 오답 노트 카운트 쿼리 최적화
--    WHERE is_correct = false 조건 자주 사용
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_progress_incorrect
  ON public.user_progress (user_id)
  WHERE is_correct = false;

-- 오답 노트 문항 목록 조회 (question_id 포함 조회) 인덱스
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
  ON public.user_progress (user_id, is_correct);

-- ────────────────────────────────────────────────────────────
-- 6. 실행 결과 확인 쿼리 (선택)
-- ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'is_pro';
--
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'user_progress';
--
-- SELECT routine_name FROM information_schema.routines
--   WHERE routine_name = 'upsert_user_progress';
