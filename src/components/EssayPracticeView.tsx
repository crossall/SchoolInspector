// EssayPracticeView.tsx - 현장지원성 서술형 실전 훈련 뷰
'use client';

import { useState } from 'react';
import type { EssayQuestion as EssayQuestionType } from '@/lib/types';
import EssayQuestion from './EssayQuestion';

// ── 문제 데이터 ────────────────────────────────────────────────────────────────

const ESSAY_QUESTIONS: EssayQuestionType[] = [
  // ── 학적 및 출결 ──
  {
    id: 'essay-hakjeok-001',
    category: '현장지원성',
    subcategory: '학적 및 출결',
    type: 'essay',
    question:
      '학교장이 장기 결석 학생에 대한 가정방문 후 보호자와 면담하였다. 이 학생이 당해 학년도 수료 기준(수업일수 2/3 이상 출석)을 충족하지 못할 것이 확실시된다.\n\n학교장으로서 이 상황에서 취해야 할 조치 절차를 관련 법적 근거를 포함하여 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 초·중등교육법 시행령 제45조에 따라 수업일수 2/3 미만 출석 시 수료 불가를 보호자에게 서면으로 안내한다.\n② 학교생활기록부 출결상황란에 장기결석 사유를 정확히 기재한다.\n③ 해당 학생의 수료 불가 처리를 위해 학적 담당 교사와 협의하고, 시도교육청 지침에 따라 정원 외 학적 관리 절차를 진행한다.\n④ 필요 시 위기학생 지원 체계(위클래스, CYS-net 등)와 연계하여 복귀를 지원한다.',
    grading_rubric: {
      required_keywords: ['수업일수 2/3', '초중등교육법 시행령', '서면 안내', '정원 외 학적 관리'],
      reference_text: '초·중등교육법 시행령 제45조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['초등', '중등'], difficulty: '상', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },
  {
    id: 'essay-hakjeok-002',
    category: '현장지원성',
    subcategory: '학적 및 출결',
    type: 'essay',
    question:
      '중학교 2학년 재학 중인 학생이 보호자의 동의 없이 자퇴를 요청하였다. 담임교사는 학교장에게 이 사실을 보고하였다.\n\n학교장이 자퇴 처리 전 반드시 거쳐야 할 행정 절차와 자퇴 후 학적 처리 방법을 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 초·중등교육법에 따라 의무교육 대상 학생(중학교)의 자퇴는 보호자의 동의서가 반드시 필요하다.\n② 보호자에게 자퇴 의사를 확인하고, 자퇴 이유를 파악하여 상담 지원 기관(위클래스, 청소년 상담복지센터 등)을 안내한다.\n③ 보호자 동의 후 자퇴 처리를 진행하며, 학교생활기록부에 자퇴 사유를 기재한다.\n④ 자퇴 이후 학적은 정원 외 학적으로 관리하며, 복학 희망 시 절차를 안내한다.',
    grading_rubric: {
      required_keywords: ['보호자 동의', '의무교육', '정원 외 학적', '상담 지원'],
      reference_text: '초·중등교육법 제12조, 시행령 제75조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['중등'], difficulty: '중', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },

  // ── 교원 복무 ──
  {
    id: 'essay-bokmu-001',
    category: '현장지원성',
    subcategory: '교원 복무',
    type: 'essay',
    question:
      '교사 A가 수업 중 학생 B를 훈육하는 과정에서 B의 보호자로부터 아동학대 신고를 받았다. 학교장은 해당 사안을 접수하였다.\n\n학교장이 아동학대 신고 접수 이후 취해야 할 법적·행정적 조치를 순서대로 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 아동학대범죄의 처벌 등에 관한 특례법에 따라 즉시 수사기관(경찰)에 신고한다.\n② 교육청(교육지원청)에 사안을 즉시 보고한다.\n③ 피해 아동의 안전을 위해 교사 A와 학생 B를 즉시 분리하는 조치를 취한다.\n④ 교원지위법에 따라 교사 A에 대한 직위해제 여부를 교육청과 협의하여 결정한다.',
    grading_rubric: {
      required_keywords: ['아동학대처벌특례법', '수사기관 신고', '즉시 분리', '교육청 보고'],
      reference_text: '아동학대범죄의 처벌 등에 관한 특례법 제10조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['초등', '중등'], difficulty: '상', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },
  {
    id: 'essay-bokmu-002',
    category: '현장지원성',
    subcategory: '교원 복무',
    type: 'essay',
    question:
      '교사가 출산휴가 종료 후 육아휴직을 신청하려 한다. 담당 교사는 육아휴직 신청 요건, 기간, 급여 지급 여부에 대해 학교장에게 문의하였다.\n\n학교장으로서 교사에게 안내해야 할 육아휴직 관련 법령 내용을 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 교육공무원법 및 남녀고용평등법에 따라, 만 8세 이하 또는 초등학교 2학년 이하 자녀를 둔 교원은 육아휴직을 신청할 수 있다.\n② 육아휴직 기간은 자녀 1인당 최대 3년이며, 분할하여 사용할 수 있다.\n③ 육아휴직급여는 고용보험에서 지급하며, 첫 3개월은 통상임금의 80%(상한 150만 원), 이후에는 50%(상한 120만 원)이다.\n④ 복직 후에는 휴직 전과 동일하거나 동등한 수준의 직위에 복직됨을 안내한다.',
    grading_rubric: {
      required_keywords: ['만 8세 이하', '최대 3년', '통상임금', '고용보험'],
      reference_text: '교육공무원법 제44조의2, 남녀고용평등법 제19조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['초등', '중등'], difficulty: '중', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },

  // ── 학교폭력 ──
  {
    id: 'essay-hakpok-001',
    category: '현장지원성',
    subcategory: '학교폭력',
    type: 'essay',
    question:
      '학교폭력 피해학생 보호자가 학교를 방문하여 가해학생을 즉시 전학 조치해 달라고 요청하였다. 학교장은 해당 사안을 접수하여 처리하려 한다.\n\n학교장이 학교폭력 사안 접수부터 심의위원회 개최까지 거쳐야 할 절차를 관련 법령에 근거하여 단계별로 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 학교폭력예방법에 따라 사안 인지 즉시 학교장에게 보고하고, 피해학생과 가해학생을 즉시 분리한다.\n② 피해학생에게 학교폭력 신고 및 학교폭력대책심의위원회(심의위) 개최 신청 권리를 안내한다.\n③ 학교는 사안 조사를 실시하고, 조사 결과를 교육지원청에 보고한다.\n④ 교육지원청 산하 심의위에 심의를 요청하며, 심의위는 14일 이내에 개최한다.\n⑤ 심의 결과에 따라 가해학생 조치(경고, 전학 등)와 피해학생 보호 조치를 시행한다.',
    grading_rubric: {
      required_keywords: ['학교폭력예방법', '즉시 분리', '심의위원회', '교육지원청 보고'],
      reference_text: '학교폭력예방 및 대책에 관한 법률 제12조, 제16조, 제17조',
      constraints: '분량 기준: 500자 이상 900자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['초등', '중등'], difficulty: '상', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },
  {
    id: 'essay-hakpok-002',
    category: '현장지원성',
    subcategory: '학교폭력',
    type: 'essay',
    question:
      '사이버 학교폭력 피해를 신고한 학생이 있다. 가해학생은 같은 반 학생으로, SNS에 피해학생의 개인정보와 허위 사실을 반복적으로 게시하였다.\n\n학교장이 이 사안에 대해 취해야 할 피해학생 보호 조치와 가해학생 선도 조치를 각각 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 피해학생 보호 조치: 즉각적인 심리 상담 지원(위클래스, 청소년 상담복지센터 연계), 해당 SNS 게시물 삭제 요청, 필요시 학급 교체 또는 일시보호 조치를 시행한다.\n② 가해학생 선도 조치: 학교폭력대책심의위원회에 심의를 요청하고, 심의 결과에 따라 서면 사과, 접촉·협박 금지, 학교봉사 등 조치를 부과한다.\n③ 디지털 성범죄에 준하는 사안일 경우 수사기관에 신고를 병행한다.\n④ 재발 방지를 위해 학급 전체를 대상으로 사이버 예절·학교폭력 예방 교육을 실시한다.',
    grading_rubric: {
      required_keywords: ['심리 상담', '심의위원회', '접촉 금지', '예방 교육'],
      reference_text: '학교폭력예방 및 대책에 관한 법률 제16조, 제17조',
      constraints: '분량 기준: 500자 이상 900자 이내',
    },
    meta: { year: 2024, region: ['common'], school_level: ['초등', '중등'], difficulty: '상', source: '현장지원성 모의고사 2024', is_premium: true, is_active: true },
  },
];

// ── 카테고리 정의 ──────────────────────────────────────────────────────────────

interface SubcategoryDef {
  key: string;
  emoji: string;
  description: string;
  accentColor: string;
  bgColor: string;
}

const SUBCATEGORY_DEFS: SubcategoryDef[] = [
  {
    key: '학적 및 출결',
    emoji: '📋',
    description: '학적 처리, 자퇴·유예, 수료·진급 기준 및 출결 기재 요령',
    accentColor: '#0891b2',
    bgColor: '#ecfeff',
  },
  {
    key: '교원 복무',
    emoji: '👨‍🏫',
    description: '교원 복무 기준, 아동학대 대응, 휴가·휴직 관련 법령',
    accentColor: '#7c3aed',
    bgColor: '#f5f3ff',
  },
  {
    key: '학교폭력',
    emoji: '🤝',
    description: '학교폭력 사안 처리 절차, 피해학생 보호 및 가해학생 조치',
    accentColor: '#dc2626',
    bgColor: '#fef2f2',
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface EssayPracticeViewProps {
  isPremium: boolean;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

type ViewState = 'categories' | 'quiz';

export default function EssayPracticeView({ isPremium, onBack }: EssayPracticeViewProps) {
  const [view, setView]             = useState<ViewState>('categories');
  const [sessionQs, setSessionQs]   = useState<EssayQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubcat, setActiveSubcat] = useState('');

  const handleSelectSubcategory = (subcategory: string) => {
    const filtered = ESSAY_QUESTIONS.filter((q) => q.subcategory === subcategory);
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
      // 세션 완료 → 카테고리 목록으로 복귀
      setView('categories');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleBackFromQuiz = () => {
    setView('categories');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const currentQuestion = sessionQs[currentIndex];
  const isLast = currentIndex >= sessionQs.length - 1;

  // ── 상단 바 ──
  const topBarLeft =
    view === 'categories' ? (
      <button
        onClick={onBack}
        aria-label="대시보드로 돌아가기"
        className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-xl"
      >
        ←
      </button>
    ) : (
      <button
        onClick={handleBackFromQuiz}
        aria-label="카테고리 목록으로"
        className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-xl"
      >
        ←
      </button>
    );

  const topBarRight =
    view === 'quiz' ? (
      <span className="text-sm text-slate-400 w-11 text-right">
        {currentIndex + 1} / {sessionQs.length}
      </span>
    ) : (
      <div className="w-11" />
    );

  const topBarCenter =
    view === 'categories' ? (
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">현장지원성 실전 훈련</p>
        <p className="text-xs text-slate-400">서술형 · AI 정밀 채점</p>
      </div>
    ) : (
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{activeSubcat}</p>
        <p className="text-xs text-slate-400">서술형 · AI 정밀 채점</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 바 */}
      <div
        className="bg-white border-b border-slate-100 px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        {topBarLeft}
        {topBarCenter}
        {topBarRight}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Pro 게이트 */}
        {!isPremium ? (
          <div className="flex flex-col items-center justify-center py-16 gap-5 bg-white rounded-2xl border-2 border-dashed border-amber-200">
            <span className="text-5xl">🔒</span>
            <div className="text-center px-4">
              <p className="font-bold text-slate-700 mb-2">
                현장지원성 훈련은 Pro 플랜 전용입니다
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                프리미엄으로 업그레이드하면<br />
                서술형 AI 채점 기능을 이용할 수 있습니다.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all active:scale-[0.98]"
            >
              대시보드로 돌아가기
            </button>
          </div>

        ) : view === 'categories' ? (
          /* ── 카테고리 선택 화면 ── */
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                영역 선택
              </h2>
              <p className="text-xs text-slate-400">
                훈련할 영역을 선택하면 해당 서술형 문제를 순서대로 풀 수 있습니다.
              </p>
            </div>

            {SUBCATEGORY_DEFS.map((def) => {
              const count = ESSAY_QUESTIONS.filter(
                (q) => q.subcategory === def.key
              ).length;

              return (
                <button
                  key={def.key}
                  onClick={() => handleSelectSubcategory(def.key)}
                  disabled={count === 0}
                  className="w-full flex items-center gap-4 rounded-2xl p-5 shadow-sm text-left transition-all active:scale-[0.98] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: def.bgColor }}
                >
                  {/* 아이콘 */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${def.accentColor}18` }}
                  >
                    {def.emoji}
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-extrabold leading-tight mb-1"
                      style={{ color: def.accentColor }}
                    >
                      {def.key}
                    </h3>
                    <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                      {def.description}
                    </p>
                  </div>

                  {/* 문제 수 뱃지 */}
                  <span
                    className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${def.accentColor}18`, color: def.accentColor }}
                  >
                    {count}문제
                  </span>
                </button>
              );
            })}
          </div>

        ) : (
          /* ── 문제 풀기 화면 ── */
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
