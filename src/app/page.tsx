// page.tsx - 메인 페이지: 인증 + 온보딩 + 대시보드 + 퀴즈 라우팅
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useQuestions } from '@/hooks/useQuestions';
import {
  filterByCategories,
  getIncorrectQuestions,
} from '@/lib/quiz-engine';
import OnboardingModal from '@/components/OnboardingModal';
import Dashboard from '@/components/Dashboard';
import QuizView from '@/components/QuizView';
import type { SessionResults } from '@/components/QuizView';
import SessionSummary from '@/components/SessionSummary';

type View = 'dashboard' | 'quiz' | 'summary';

export default function Home() {
  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
    needsOnboarding,
    signOut,
    updateProfile,
  } = useAuth();

  const {
    incorrectIds,
    incorrectCount,
    loading: progressLoading,
    markCorrect,
    markIncorrect,
    resetAll,
  } = useProgress(user?.id);

  const {
    questions,
    loading: questionsLoading,
    error: questionsError,
  } = useQuestions();

  const [view, setView] = useState<View>('dashboard');
  const [sessionQuestions, setSessionQuestions] = useState<
    import('@/lib/types').Question[]
  >([]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionResults, setSessionResults] =
    useState<SessionResults | null>(null);

  const prefs = useMemo(
    () =>
      profile?.target_region && profile?.target_school_level
        ? {
            region: profile.target_region,
            school_level: profile.target_school_level,
          }
        : null,
    [profile?.target_region, profile?.target_school_level]
  );

  // ── 온보딩 완료 ──
  const handleOnboardingComplete = useCallback(
    async (region: string, schoolLevel: string) => {
      await updateProfile({
        target_region: region,
        target_school_level: schoolLevel,
      });
    },
    [updateProfile]
  );

  // ── 설정 변경 ──
  const handleUpdateProfile = useCallback(
    async (region: string, schoolLevel: string) => {
      await updateProfile({
        target_region: region,
        target_school_level: schoolLevel,
      });
    },
    [updateProfile]
  );

  // ── 카테고리 세션 시작 ──
  const handleStartCategory = useCallback(
    (categoryKeys: string[], subcategory: string | null, label: string) => {
      const filtered = filterByCategories(questions, prefs, categoryKeys, subcategory);
      if (filtered.length === 0) {
        alert('해당 카테고리에 문제가 없습니다.');
        return;
      }
      const sessionLabel = subcategory ? `${label} > ${subcategory}` : `${label} > 전체`;
      setSessionQuestions(filtered);
      setSessionLabel(sessionLabel);
      setSessionResults(null);
      setView('quiz');
    },
    [questions, prefs]
  );

  // ── 오답 노트 세션 시작 ──
  const handleStartIncorrect = useCallback(() => {
    const incorrectQs = getIncorrectQuestions(
      questions,
      prefs,
      incorrectIds
    );
    if (incorrectQs.length === 0) {
      alert('오답 노트에 문제가 없습니다.');
      return;
    }
    setSessionQuestions(incorrectQs);
    setSessionLabel('오답 노트');
    setSessionResults(null);
    setView('quiz');
  }, [questions, prefs, incorrectIds]);

  // ── 퀴즈 완료 ──
  const handleFinish = useCallback((results: SessionResults) => {
    setSessionResults(results);
    setView('summary');
  }, []);

  // ── 로딩 화면 ──
  const isLoading = authLoading || progressLoading || questionsLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-slate-400 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  // ── 미인증 → 로그인 페이지로 ──
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // ── 인증 에러 (RLS, 네트워크, DB 접근 실패 등) ──
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            데이터베이스 연결에 문제가 발생했습니다
          </h2>
          <p className="text-sm text-slate-400 mb-6">{authError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
            >
              다시 시도
            </button>
            <button
              onClick={signOut}
              className="w-full px-6 py-3 text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              로그아웃 후 다시 로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 문제 데이터 에러 ──
  if (questionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            문제 데이터를 불러올 수 없습니다
          </h2>
          <p className="text-sm text-slate-400">{questionsError}</p>
        </div>
      </div>
    );
  }

  // ── 온보딩 (프로필 없거나 지역 미설정) ──
  if (needsOnboarding) {
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  // ── 뷰 라우팅 ──
  if (view === 'quiz' && sessionQuestions.length > 0) {
    return (
      <QuizView
        questions={sessionQuestions}
        categoryLabel={sessionLabel}
        isPremium={profile?.is_pro ?? false}
        userId={user?.id}
        onMarkCorrect={markCorrect}
        onMarkIncorrect={markIncorrect}
        onFinish={handleFinish}
      />
    );
  }

  if (view === 'summary' && sessionResults) {
    return (
      <SessionSummary
        results={sessionResults}
        incorrectCount={incorrectCount}
        onGoHome={() => setView('dashboard')}
        onGoIncorrect={() => {
          setView('dashboard');
          setTimeout(handleStartIncorrect, 0);
        }}
      />
    );
  }

  // ── 대시보드 (profile이 확실히 존재하는 상태) ──
  if (!profile) {
    return null;
  }

  return (
    <Dashboard
      questions={questions}
      profile={profile}
      incorrectCount={incorrectCount}
      onStartCategory={handleStartCategory}
      onStartIncorrect={handleStartIncorrect}
      onResetProgress={resetAll}
      onUpdateProfile={handleUpdateProfile}
      onSignOut={signOut}
    />
  );
}
