// EssayPracticeView.tsx - 현장지원성 서술형 실전 훈련 뷰
'use client';

import { useState } from 'react';
import type { EssayQuestion as EssayQuestionType } from '@/lib/types';
import EssayQuestion from './EssayQuestion';

const ESSAY_QUESTIONS: EssayQuestionType[] = [
  {
    id: 'essay-001',
    category: '현장지원성',
    subcategory: '학적 및 출결',
    type: 'essay',
    question:
      '학교장이 장기 결석 학생에 대한 가정방문 후 보호자와 면담하였다. 이 학생이 당해 학년도 수료 기준(수업일수 2/3 이상 출석)을 충족하지 못할 것이 확실시된다.\n\n학교장으로서 이 상황에서 취해야 할 조치 절차를 관련 법적 근거를 포함하여 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 초·중등교육법 시행령 제45조에 따라 수업일수 2/3 미만 출석 시 수료 불가를 보호자에게 서면으로 안내한다.\n② 학교생활기록부 출결상황란에 장기결석 사유를 정확히 기재한다.\n③ 해당 학생의 수료 불가 처리를 위해 학적 담당 교사와 협의하고, 시도교육청 지침에 따라 정원 외 학적 관리 절차를 진행한다.\n④ 필요 시 학교폭력 예방 및 위기학생 지원 체계(위클래스, CYS-net 등)와 연계하여 복귀를 지원한다.',
    grading_rubric: {
      required_keywords: ['수업일수 2/3', '초중등교육법 시행령', '서면 안내', '정원 외 학적 관리'],
      reference_text: '초·중등교육법 시행령 제45조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: {
      year: 2024,
      region: ['common'],
      school_level: ['초등', '중등'],
      difficulty: '상',
      source: '현장지원성 모의고사 2024',
      is_premium: true,
      is_active: true,
    },
  },
  {
    id: 'essay-002',
    category: '현장지원성',
    subcategory: '교원 복무',
    type: 'essay',
    question:
      '교사 A가 수업 중 학생 B를 훈육하는 과정에서 B의 보호자로부터 아동학대 신고를 받았다. 학교장은 해당 사안을 접수하였다.\n\n학교장이 아동학대 신고 접수 이후 취해야 할 법적·행정적 조치를 순서대로 서술하시오. (10점)',
    explanation: '',
    model_answer:
      '① 아동학대범죄의 처벌 등에 관한 특례법에 따라 즉시 수사기관(경찰)에 신고한다.\n② 교육청(교육지원청)에 사안을 즉시 보고한다.\n③ 피해 아동의 안전을 위해 교사 A와 학생 B를 즉시 분리하는 조치를 취한다.\n④ 교원지위법에 따라 교사 A에 대한 직위해제 여부를 교육청과 협의하여 결정한다.\n⑤ 학교 내 사안처리 담당팀(학교폭력대책심의위원회 등)과 협력하여 후속 지원 조치를 마련한다.',
    grading_rubric: {
      required_keywords: ['아동학대처벌특례법', '수사기관 신고', '즉시 분리', '교육청 보고'],
      reference_text: '아동학대범죄의 처벌 등에 관한 특례법 제10조',
      constraints: '분량 기준: 400자 이상 800자 이내',
    },
    meta: {
      year: 2024,
      region: ['common'],
      school_level: ['초등', '중등'],
      difficulty: '상',
      source: '현장지원성 모의고사 2024',
      is_premium: true,
      is_active: true,
    },
  },
];

interface EssayPracticeViewProps {
  isPremium: boolean;
  onBack: () => void;
}

export default function EssayPracticeView({ isPremium, onBack }: EssayPracticeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const question = ESSAY_QUESTIONS[currentIndex];
  const isLast = currentIndex >= ESSAY_QUESTIONS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div
        className="bg-white border-b border-slate-100 px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button
          onClick={onBack}
          aria-label="대시보드로 돌아가기"
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-xl"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">현장지원성 실전 훈련</p>
          <p className="text-xs text-slate-400">서술형 · AI 정밀 채점</p>
        </div>
        <span className="text-sm text-slate-400 w-11 text-right">
          {currentIndex + 1} / {ESSAY_QUESTIONS.length}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!isPremium ? (
          /* Pro 게이트 */
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
        ) : (
          <EssayQuestion
            key={question.id}
            question={question}
            onNext={handleNext}
            isLast={isLast}
          />
        )}
      </div>
    </div>
  );
}
