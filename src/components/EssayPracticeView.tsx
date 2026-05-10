// EssayPracticeView.tsx - 현장지원성 서술형 실전 훈련 뷰
'use client';

import { useState, useMemo } from 'react';
import type { EssayQuestion as EssayQuestionType } from '@/lib/types';
import { useEssayQuestions } from '@/hooks/useEssayQuestions';
import EssayQuestion from './EssayQuestion';

// ── 알려진 서브카테고리 스타일 맵 ──────────────────────────────────────────────

interface SubcategoryStyle {
  emoji: string;
  description: string;
  accentColor: string;
  bgColor: string;
}

const SUBCATEGORY_STYLES: Record<string, SubcategoryStyle> = {
  '학적 및 출결':   { emoji: '📋', description: '학적 처리, 자퇴·유예, 수료·진급 기준 및 출결 기재', accentColor: '#0891b2', bgColor: '#ecfeff' },
  '교원 복무':      { emoji: '👨‍🏫', description: '교원 복무 기준, 아동학대 대응, 휴가·휴직 법령', accentColor: '#7c3aed', bgColor: '#f5f3ff' },
  '학교폭력':       { emoji: '🤝', description: '학교폭력 사안 처리 절차 및 피해·가해학생 조치',  accentColor: '#dc2626', bgColor: '#fef2f2' },
  '교육과정 운영':  { emoji: '📚', description: '교육과정 편성·운영 및 수업 관련 법령',            accentColor: '#d97706', bgColor: '#fffbeb' },
  '학교회계':       { emoji: '💰', description: '학교 예산 편성·집행 및 회계 관련 지침',           accentColor: '#059669', bgColor: '#ecfdf5' },
  '학교안전':       { emoji: '🛡️', description: '학교안전사고 예방·처리 및 보상 절차',             accentColor: '#0284c7', bgColor: '#f0f9ff' },
  '생활지도':       { emoji: '🧑‍🤝‍🧑', description: '학생 생활지도, 교권 보호, 학생인권 관련 사항', accentColor: '#9333ea', bgColor: '#faf5ff' },
  '정보공시':       { emoji: '📊', description: '학교 정보공시 항목 및 공개 의무 관련 내용',        accentColor: '#4f46e5', bgColor: '#eef2ff' },
};

const DEFAULT_STYLE: SubcategoryStyle = {
  emoji: '📝',
  description: '현장지원성 서술형 문제',
  accentColor: '#64748b',
  bgColor: '#f8fafc',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface EssayPracticeViewProps {
  isPremium: boolean;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

type ViewState = 'categories' | 'quiz';

export default function EssayPracticeView({ isPremium, onBack }: EssayPracticeViewProps) {
  const { questions, loading, error } = useEssayQuestions();

  const [view, setView]                 = useState<ViewState>('categories');
  const [sessionQs, setSessionQs]       = useState<EssayQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubcat, setActiveSubcat] = useState('');

  // DB에서 동적으로 서브카테고리 목록 추출
  const subcategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      counts[q.subcategory] = (counts[q.subcategory] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
      .map(([key, count]) => ({ key, count, style: SUBCATEGORY_STYLES[key] ?? DEFAULT_STYLE }));
  }, [questions]);

  const handleSelectSubcategory = (subcategory: string) => {
    const filtered = questions.filter((q) => q.subcategory === subcategory);
    if (filtered.length === 0) return;
    setSessionQs(filtered);
    setCurrentIndex(0);
    setActiveSubcat(subcategory);
    setView('quiz');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < sessionQs.length) {
      setCurrentIndex(nextIdx);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setView('categories');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleBackFromQuiz = () => {
    setView('categories');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const currentQuestion = sessionQs[currentIndex];
  const isLast          = currentIndex >= sessionQs.length - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 바 */}
      <div
        className="bg-white border-b border-slate-100 px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button
          onClick={view === 'quiz' ? handleBackFromQuiz : onBack}
          aria-label={view === 'quiz' ? '카테고리 목록으로' : '대시보드로 돌아가기'}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-xl"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {view === 'quiz' ? activeSubcat : '현장지원성 실전 훈련'}
          </p>
          <p className="text-xs text-slate-400">서술형 · AI 정밀 채점</p>
        </div>

        {view === 'quiz' ? (
          <span className="text-sm text-slate-400 w-11 text-right">
            {currentIndex + 1} / {sessionQs.length}
          </span>
        ) : (
          <div className="w-11" />
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Pro 게이트 */}
        {!isPremium ? (
          <div className="flex flex-col items-center justify-center py-16 gap-5 bg-white rounded-2xl border-2 border-dashed border-amber-200">
            <span className="text-5xl">🔒</span>
            <div className="text-center px-4">
              <p className="font-bold text-slate-700 mb-2">현장지원성 훈련은 Pro 플랜 전용입니다</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                프리미엄으로 업그레이드하면<br />서술형 AI 채점 기능을 이용할 수 있습니다.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all active:scale-[0.98]"
            >
              대시보드로 돌아가기
            </button>
          </div>

        ) : loading ? (
          /* 로딩 */
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">문제를 불러오는 중...</p>
          </div>

        ) : error ? (
          /* 에러 */
          <div className="text-center py-16">
            <p className="text-lg font-bold text-slate-700 mb-2">문제를 불러올 수 없습니다</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>

        ) : view === 'categories' ? (
          /* ── 카테고리 선택 ── */
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                영역 선택
              </h2>
              <p className="text-xs text-slate-400">
                훈련할 영역을 선택하면 해당 서술형 문제를 순서대로 풀 수 있습니다.
              </p>
            </div>

            {subcategories.length === 0 ? (
              <div className="text-center py-16 text-sm text-slate-400">
                등록된 문제가 없습니다.
              </div>
            ) : (
              subcategories.map(({ key, count, style }) => (
                <button
                  key={key}
                  onClick={() => handleSelectSubcategory(key)}
                  className="w-full flex items-center gap-4 rounded-2xl p-5 shadow-sm text-left transition-all active:scale-[0.98] hover:shadow-md"
                  style={{ background: style.bgColor }}
                >
                  {/* 아이콘 */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${style.accentColor}18` }}
                  >
                    {style.emoji}
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-extrabold leading-tight mb-1"
                      style={{ color: style.accentColor }}
                    >
                      {key}
                    </h3>
                    <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                      {style.description}
                    </p>
                  </div>

                  {/* 문제 수 뱃지 */}
                  <span
                    className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${style.accentColor}18`, color: style.accentColor }}
                  >
                    {count}문제
                  </span>
                </button>
              ))
            )}
          </div>

        ) : (
          /* ── 문제 풀기 ── */
          currentQuestion && (
            <EssayQuestion
              key={currentQuestion.id}
              question={currentQuestion}
              onNext={handleNext}
              isLast={isLast}
            />
          )
        )}
      </div>
    </div>
  );
}
