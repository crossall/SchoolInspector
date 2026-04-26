// types.ts - Supabase DB 스키마 타입 및 앱 공통 타입

// ── Supabase DB 테이블 타입 ──

export interface Profile {
  id: string;
  email: string | null;
  nickname: string | null;
  target_region: string | null;
  target_school_level: string | null;
  is_premium: boolean;
  is_pro?: boolean;   // PRO 유료 플랜 가입 여부 (01_setup_progress_and_pro.sql 적용 후 활성)
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;          // 마지막 시도 정답 여부 (false = 오답 노트 대상)
  attempt_count: number;        // 누적 시도 횟수
  last_attempt_at: string;      // 마지막 시도 UTC 시각 (ISO 8601)
}

// ── Supabase 제네릭 DB 타입 ──

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'attempt_count' | 'last_attempt_at'>;
        Update: Partial<Pick<UserProgress, 'is_correct' | 'attempt_count' | 'last_attempt_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── 문제 은행 타입 (Discriminated Union) ──

/**
 * 문항 메타데이터 — 연도별 규정 개정·데이터 마이그레이션 대응 스키마
 */
export interface QuestionMeta {
  year: number;              // 규정 기준 연도 (예: 2024)
  region: string[];          // 적용 지역 (예: ["common"] 또는 ["서울"])
  school_level: string[];    // 적용 학교급 (예: ["초등", "중등"])
  difficulty: '상' | '중' | '하';
  source: string;            // 출처·페이지 (예: "2024_공통_인사실무_복무_p15")
  is_premium: boolean;       // true이면 Pro 플랜 전용
  is_active: boolean;        // false이면 폐지 규정 — soft-delete, 화면에 노출 안 함
}

interface BaseQuestion {
  id: string;
  category: string;
  subcategory: string;
  meta: QuestionMeta;
  question: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  answer: string;
}

export interface OxQuestion extends BaseQuestion {
  type: 'ox_quiz';
  options: string[];
  answer: string;
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank';
  word_chips: string[];  // 정답 + 오답 칩 풀
  answer: string[];      // 빈칸 순서대로 정답 배열
  options: string[];     // 빈 배열 (하위호환)
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  items: string[];        // 순서 맞출 항목 목록 (컴포넌트가 셔플)
  answer_order: string[]; // 올바른 순서
  options: string[];      // 빈 배열 (하위호환)
}

export type Question =
  | MultipleChoiceQuestion
  | OxQuestion
  | FillInBlankQuestion
  | OrderingQuestion;

// ── 상수 ──

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const;

export const SCHOOL_LEVELS = ['초등', '중등', '고등'] as const;

export type Region = (typeof REGIONS)[number];
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

