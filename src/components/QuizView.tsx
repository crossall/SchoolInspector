// QuizView.tsx - 퀴즈 풀이 화면 (OX + 객관식 + 빈칸 + 순서배열)
'use client';

import { useState, useCallback } from 'react';
import type { Question, FillInBlankQuestion as FIBType, OrderingQuestion as OrdType } from '@/lib/types';
import { normalizeAnswer, formatExplanation, checkAnswer } from '@/lib/quiz-engine';
import { saveProgress } from '@/lib/progress';
import FillInBlankQuestion from './FillInBlankQuestion';
import OrderingQuestion from './OrderingQuestion';
import ReportModal from './ReportModal';

interface QuizViewProps {
  questions: Question[];
  categoryLabel: string;
  isPremium: boolean;
  userId: string | undefined;
  onMarkCorrect: (questionId: string) => void;
  onMarkIncorrect: (questionId: string) => void;
  onFinish: (results: SessionResults) => void;
}

export interface SessionResults {
  total: number;
  correct: number;
  wrong: number;
  wrongList: Question[];
  categoryLabel: string;
}

const badgeMap: Record<string, { label: string; cls: string }> = {
  ox_quiz:          { label: 'OX 퀴즈',    cls: 'bg-blue-50 text-blue-600' },
  multiple_choice:  { label: '객관식',      cls: 'bg-violet-50 text-violet-600' },
  fill_in_blank:    { label: '빈칸 채우기', cls: 'bg-amber-50 text-amber-600' },
  ordering:         { label: '순서 배열',   cls: 'bg-teal-50 text-teal-600' },
};

export default function QuizView({
  questions,
  categoryLabel,
  isPremium,
  userId,
  onMarkCorrect,
  onMarkIncorrect,
  onFinish,
}: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [wrongList, setWrongList] = useState<Question[]>([]);
  const [showReport, setShowReport] = useState(false);

  const finishSession = useCallback(
    (correct: number, wrong: number, wrongs: Question[]) => {
      onFinish({
        total: correct + wrong,
        correct,
        wrong,
        wrongList: wrongs,
        categoryLabel,
      });
    },
    [onFinish, categoryLabel]
  );

  if (currentIndex >= questions.length) {
    finishSession(sessionCorrect, sessionWrong, wrongList);
    return null;
  }

  const q = questions[currentIndex];
  const isLocked = q.meta.is_premium && !isPremium;
  const isCorrect = selectedAnswer !== null && checkAnswer(q, selectedAnswer);

  const handleAnswer = (value: string | string[]) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(value);

    const correct = checkAnswer(q, value);

    // DB 저장 — 비동기이지만 UI는 기다리지 않음 (fire-and-forget)
    if (userId) {
      saveProgress(userId, q.id, correct).catch((err: unknown) => {
        console.error('[QuizView] saveProgress failed:', err);
      });
    }

    if (correct) {
      onMarkCorrect(q.id);
      setSessionCorrect((prev) => prev + 1);
    } else {
      onMarkIncorrect(q.id);
      setSessionWrong((prev) => prev + 1);
      setWrongList((prev) => [...prev, q]);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      finishSession(sessionCorrect, sessionWrong, wrongList);
      return;
    }
    setCurrentIndex(nextIndex);
    setAnswered(false);
    setSelectedAnswer(null);
    setShowReport(false);
  };

  const handleEndSession = () => {
    finishSession(sessionCorrect, sessionWrong, wrongList);
  };

  const getOptionClass = (value: string) => {
    if (!answered) {
      return 'bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50';
    }
    if (q.type !== 'multiple_choice' && q.type !== 'ox_quiz') return '';
    const isAnswer = normalizeAnswer(value) === normalizeAnswer(q.answer);
    const isSelected =
      typeof selectedAnswer === 'string' &&
      normalizeAnswer(value) === normalizeAnswer(selectedAnswer);

    if (isAnswer) return 'bg-emerald-50 border-2 border-emerald-400';
    if (isSelected && !isAnswer) return 'bg-red-50 border-2 border-red-400';
    return 'bg-slate-50 border-2 border-slate-200 opacity-50';
  };

  const getOxClass = (value: string) => {
    const base =
      value === 'O'
        ? 'border-blue-300 text-blue-500'
        : 'border-red-300 text-red-500';

    if (!answered) {
      return `${base} bg-white hover:shadow-lg`;
    }
    if (q.type !== 'ox_quiz') return base;
    const isAnswer = normalizeAnswer(value) === normalizeAnswer(q.answer);
    const isSelected =
      typeof selectedAnswer === 'string' &&
      normalizeAnswer(value) === normalizeAnswer(selectedAnswer);

    if (isAnswer) return 'bg-emerald-50 border-emerald-400 text-emerald-600';
    if (isSelected && !isAnswer) return 'bg-red-50 border-red-400 text-red-600';
    return `${base} opacity-30`;
  };

  const badge = badgeMap[q.type] ?? { label: q.type, cls: 'bg-slate-100 text-slate-600' };

  const renderCorrectAnswer = () => {
    if (q.type === 'fill_in_blank') return q.answer.join(' / ');
    if (q.type === 'ordering') return q.answer_order.join(' → ');
    return q.answer;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div
        className="bg-white border-b border-slate-100 px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button
          onClick={handleEndSession}
          aria-label="문제 풀기 종료"
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
        <span className="text-sm font-semibold text-slate-500">
          {categoryLabel}
        </span>
        <span className="text-sm text-slate-400">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${badge.cls}`}>
            {badge.label}
          </div>

          <p className="text-base font-semibold text-slate-800 leading-relaxed mb-6">
            {q.question}
          </p>

          {/* ── 프리미엄 잠금 UI ── */}
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50">
              <span className="text-5xl">🔒</span>
              <div className="text-center px-4">
                <p className="font-bold text-slate-700 mb-1">
                  이 문제는 Pro 플랜 전용입니다
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  프리미엄으로 업그레이드하면<br />
                  모든 지역·학교급 문제를 풀 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all active:scale-[0.98]"
              >
                다음 문제로 건너뛰기 →
              </button>
            </div>
          ) : (
            <>
              {/* OX */}
              {q.type === 'ox_quiz' && (
                <div className="grid grid-cols-2 gap-4">
                  {['O', 'X'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswer(val)}
                      disabled={answered}
                      className={`flex flex-col items-center justify-center py-8 rounded-2xl border-3 font-bold transition-all active:scale-[0.96] ${getOxClass(val)}`}
                    >
                      <span className="text-5xl font-extrabold">{val}</span>
                      <span className="text-sm mt-2 opacity-70">
                        {val === 'O' ? '맞다' : '틀리다'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 객관식 */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all active:scale-[0.98] ${getOptionClass(opt)}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 빈칸 채우기 */}
              {q.type === 'fill_in_blank' && (
                <FillInBlankQuestion
                  key={currentIndex}
                  question={q as FIBType}
                  answered={answered}
                  onSubmit={handleAnswer}
                />
              )}

              {/* 순서 배열 */}
              {q.type === 'ordering' && (
                <OrderingQuestion
                  key={currentIndex}
                  question={q as OrdType}
                  answered={answered}
                  onSubmit={handleAnswer}
                />
              )}
            </>
          )}
        </div>

        {/* Feedback — 잠금 문항은 표시 안 함 */}
        {answered && !isLocked && (
          <div className="space-y-4 mb-6">
            <div
              className={`rounded-xl px-5 py-4 ${
                isCorrect
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isCorrect ? '정답입니다!' : '틀렸습니다'}
                </span>
              </div>
              {!isCorrect && (
                <p className="text-sm text-red-600 mt-1">
                  정답: <strong>{renderCorrectAnswer()}</strong>
                </p>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-indigo-500 mb-3">
                📖 해설 · 근거 지침
              </p>
              <div
                className="text-[15px] text-slate-600"
                style={{ lineHeight: '1.75' }}
                dangerouslySetInnerHTML={{
                  __html: formatExplanation(q.explanation),
                }}
              />
              {/* 출처 footer */}
              <p className="text-[11px] text-slate-300 mt-4 pt-3 border-t border-slate-100">
                출처: {q.meta.source} ({q.meta.year}년 기준)
              </p>
            </div>

            {/* 오류 제보 버튼 */}
            <button
              onClick={() => setShowReport(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98]"
            >
              <span>🚩</span>
              <span>문제 오류 제보</span>
            </button>

            {/* Next / End Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                {currentIndex + 1 >= questions.length ? '결과 보기' : '다음 문제로 →'}
              </button>
              {currentIndex + 1 < questions.length && (
                <button
                  onClick={handleEndSession}
                  className="px-4 py-4 text-slate-400 text-sm hover:text-slate-600 transition-colors"
                >
                  종료
                </button>
              )}
            </div>
          </div>
        )}

        {/* 오류 제보 모달 */}
        {showReport && (
          <ReportModal
            questionId={q.id}
            questionText={q.question}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
    </div>
  );
}
