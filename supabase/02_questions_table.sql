-- ============================================================
-- 02_questions_table.sql
-- 장학사 문제은행 — questions 테이블 (Supabase DB 마이그레이션)
-- Supabase Dashboard > SQL Editor에 복사 후 실행하세요.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. questions 테이블 생성
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id             text        PRIMARY KEY,
  category       text        NOT NULL,
  subcategory    text        NOT NULL,
  type           text        NOT NULL
                              CHECK (type IN ('multiple_choice', 'ox_quiz', 'fill_in_blank', 'ordering')),
  meta           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  question       text        NOT NULL,
  options        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  answer         text        DEFAULT NULL,       -- 객관식/OX 정답 (단일 문자열)
  answer_array   jsonb       DEFAULT NULL,       -- 빈칸 채우기 정답 (문자열 배열)
  word_chips     jsonb       DEFAULT NULL,       -- fill_in_blank 전용
  items          jsonb       DEFAULT NULL,       -- ordering 전용
  answer_order   jsonb       DEFAULT NULL,       -- ordering 전용
  explanation    text        NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.questions IS '문제 은행 — 4가지 유형(객관식, OX, 빈칸, 순서) 통합 테이블';
COMMENT ON COLUMN public.questions.id           IS '문제 고유 ID (예: insa_common_all_001)';
COMMENT ON COLUMN public.questions.type         IS '문제 유형: multiple_choice | ox_quiz | fill_in_blank | ordering';
COMMENT ON COLUMN public.questions.meta         IS '메타데이터 JSON: year, region[], school_level[], difficulty, source, is_premium, is_active';
COMMENT ON COLUMN public.questions.options      IS '보기 배열 (객관식/OX: 실제 보기, 빈칸/순서: 빈 배열)';
COMMENT ON COLUMN public.questions.answer       IS '정답: string(객관식/OX) 또는 string[](빈칸)';
COMMENT ON COLUMN public.questions.word_chips   IS '빈칸 채우기 전용: 정답+오답 칩 배열';
COMMENT ON COLUMN public.questions.items        IS '순서 맞추기 전용: 항목 문자열 배열';
COMMENT ON COLUMN public.questions.answer_order IS '순서 맞추기 전용: 올바른 순서 배열';

-- ────────────────────────────────────────────────────────────
-- 2. Row Level Security — 인증 사용자 읽기 전용
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_read_authenticated" ON public.questions;

CREATE POLICY "questions_read_authenticated"
  ON public.questions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 3. 인덱스 — 카테고리별 필터링 + is_active 조건
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_category
  ON public.questions (category, subcategory);

CREATE INDEX IF NOT EXISTS idx_questions_type
  ON public.questions (type);

-- meta->>'is_active' 조건용 표현식 인덱스
CREATE INDEX IF NOT EXISTS idx_questions_active
  ON public.questions ((meta->>'is_active'));

-- ────────────────────────────────────────────────────────────
-- 4. 실행 확인 쿼리 (선택)
-- ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'questions';
