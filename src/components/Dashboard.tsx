// Dashboard.tsx - 메인 대시보드 (4대 카테고리 카드 + 오답 노트 + 설정)
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  Target,
  Lock,
  ChevronRight,
  Settings,
  LogOut,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import type { Question, Profile } from '@/lib/types';
import { extractCategories } from '@/lib/quiz-engine';
import SubcategoryModal from './SubcategoryModal';
import SettingsModal from './SettingsModal';
import PaywallModal from './PaywallModal';

// ── 4대 카테고리 정의 ──────────────────────────────────────────────────────────

interface CategoryCard {
  id: string;
  label: string;
  description: string;
  categoryKeys: string[];   // questions.json의 category 필드와 일치
  isFree: boolean;
  accentColor: string;
  bgColor: string;
  Icon: LucideIcon;
}

const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: 'curriculum',
    label: '개정교육과정 총론',
    description: '교육과정 편성·운영 원리 및 최신 개정 방향 완벽 대비',
    categoryKeys: ['교육과정'],
    isFree: true,
    accentColor: '#7c3aed',
    bgColor: '#f5f3ff',
    Icon: BookOpen,
  },
  {
    id: 'hr',
    label: '인사실무',
    description: '임용·복무·호봉 등 교원 인사 전반 시도별 지침 대비',
    categoryKeys: ['인사실무'],
    isFree: false,
    accentColor: '#4f46e5',
    bgColor: '#eef2ff',
    Icon: Users,
  },
  {
    id: 'records',
    label: '생기부 및 학적',
    description: '학교생활기록부 기재 요령 및 학적 관련 지침 완벽 대비',
    categoryKeys: ['생기부기재요령', '학적업무'],
    isFree: true,
    accentColor: '#0891b2',
    bgColor: '#ecfeff',
    Icon: GraduationCap,
  },
  {
    id: 'plans',
    label: '각종 교육계획안',
    description: '학교 교육계획서·업무계획 작성 실무 전국 공통 기준',
    categoryKeys: ['각종 교육계획안'],
    isFree: false,
    accentColor: '#ea580c',
    bgColor: '#fff7ed',
    Icon: Target,
  },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface DashboardProps {
  questions: Question[];
  profile: Profile;
  incorrectCount: number;
  onStartCategory: (categoryKeys: string[], subcategory: string | null, label: string) => void;
  onStartIncorrect: () => void;
  onResetProgress: () => void;
  onUpdateProfile: (region: string, schoolLevel: string) => void;
  onSignOut: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  questions,
  profile,
  incorrectCount,
  onStartCategory,
  onStartIncorrect,
  onResetProgress,
  onUpdateProfile,
  onSignOut,
}: DashboardProps) {
  const [activeCard, setActiveCard] = useState<CategoryCard | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const prefs = useMemo(
    () =>
      profile.target_region && profile.target_school_level
        ? { region: profile.target_region, school_level: profile.target_school_level }
        : null,
    [profile.target_region, profile.target_school_level]
  );

  // 전체 카테고리→서브카테고리 맵 (questions.json 기반)
  const categoryMap = useMemo(
    () => extractCategories(questions, prefs),
    [questions, prefs]
  );

  // 카드 하나의 서브카테고리 목록을 여러 categoryKey에서 합산
  const getSubcategories = useCallback(
    (card: CategoryCard): string[] => {
      const set = new Set<string>();
      for (const key of card.categoryKeys) {
        (categoryMap[key] ?? []).forEach((s) => set.add(s));
      }
      return [...set].sort();
    },
    [categoryMap]
  );

  // 카드에 문제가 하나라도 있는지 (prefs + categoryKeys 기준)
  const hasQuestions = useCallback(
    (card: CategoryCard): boolean =>
      card.categoryKeys.some((key) => (categoryMap[key] ?? []).length > 0),
    [categoryMap]
  );

  const handleCardClick = useCallback(
    (card: CategoryCard) => {
      if (!card.isFree && !profile.is_premium) {
        setShowPaywall(true);
        return;
      }
      setActiveCard(card);
    },
    [profile.is_premium]
  );

  const handleSubcategorySelect = useCallback(
    (subcategory: string | null) => {
      if (!activeCard) return;
      onStartCategory(activeCard.categoryKeys, subcategory, activeCard.label);
      setActiveCard(null);
    },
    [activeCard, onStartCategory]
  );

  const handleSettingsSave = useCallback(
    (region: string, schoolLevel: string) => {
      onUpdateProfile(region, schoolLevel);
      setShowSettings(false);
    },
    [onUpdateProfile]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
            교육전문직 문제은행
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            장학사 시험 대비
          </h1>
          {prefs && (
            <p className="text-sm text-slate-400 mt-1">
              {prefs.region} · {prefs.school_level}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* ── Top Action Bar ── */}
        <div className="flex items-center justify-between">
          {profile.is_premium ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <Crown size={13} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700">프리미엄</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
              <span className="text-xs text-slate-500 font-medium">무료 플랜</span>
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all text-sm font-medium"
              aria-label="설정"
            >
              <Settings size={15} />
              <span>설정</span>
            </button>
            <button
              onClick={onSignOut}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
              aria-label="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ── 오답 노트 배너 ── */}
        {incorrectCount > 0 ? (
          <button
            onClick={onStartIncorrect}
            className="w-full flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-4 hover:border-red-400 hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            <span className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-base shrink-0">
              🔴
            </span>
            <span className="text-sm font-semibold text-red-700 flex-1 text-left">
              오답 노트 풀기{' '}
              <strong className="text-red-600">({incorrectCount}문제)</strong>
            </span>
            <ChevronRight size={18} className="text-red-400" />
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <span className="text-base">✅</span>
            <span className="text-sm text-emerald-600 font-medium">
              오답 노트가 비어 있습니다
            </span>
          </div>
        )}

        {/* ── 카테고리 그리드 2×2 ── */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
            시험 영역 선택
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_CARDS.map((card) => {
              const locked = !card.isFree && !profile.is_premium;
              const available = hasQuestions(card);
              const { Icon } = card;

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className="relative flex flex-col items-start text-left rounded-2xl p-4 shadow-sm transition-all active:scale-[0.96] hover:shadow-md"
                  style={{ background: card.bgColor }}
                >
                  {/* 잠금 배지 */}
                  {locked && (
                    <span
                      className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: '#fef3c7', color: '#b45309' }}
                    >
                      <Lock size={9} />
                      PRO
                    </span>
                  )}

                  {/* 아이콘 */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${card.accentColor}18` }}
                  >
                    <Icon size={22} style={{ color: card.accentColor }} />
                  </div>

                  {/* 텍스트 */}
                  <h3
                    className="text-sm font-extrabold leading-tight mb-1"
                    style={{ color: card.accentColor }}
                  >
                    {card.label}
                  </h3>
                  <p className="text-xs leading-snug text-slate-400">
                    {card.description}
                  </p>

                  {/* 문제 수 표시 */}
                  {available && !locked && (
                    <span
                      className="mt-3 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${card.accentColor}18`, color: card.accentColor }}
                    >
                      학습 가능
                    </span>
                  )}
                  {!available && !locked && (
                    <span className="mt-3 text-xs font-medium text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">
                      문제 준비 중
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 학습 이력 초기화 ── */}
        <button
          onClick={() => {
            if (confirm('모든 학습 이력과 오답 기록을 초기화하시겠습니까?')) {
              onResetProgress();
            }
          }}
          className="w-full py-3 text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          학습 이력 초기화
        </button>
      </div>

      {/* ── 모달 ── */}
      {activeCard && (
        <SubcategoryModal
          label={activeCard.label}
          accentColor={activeCard.accentColor}
          bgColor={activeCard.bgColor}
          icon={<activeCard.Icon size={22} />}
          subcategories={getSubcategories(activeCard)}
          onSelect={handleSubcategorySelect}
          onClose={() => setActiveCard(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          currentRegion={profile.target_region}
          currentLevel={profile.target_school_level}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
