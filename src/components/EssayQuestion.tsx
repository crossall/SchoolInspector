// EssayQuestion.tsx - 서술형 문제 입력 + AI 채점 UI
'use client';

import { useState, useEffect } from 'react';
import type { EssayQuestion as EssayQuestionType, GradingResult } from '@/lib/types';
import { gradeEssay } from '@/app/actions/grade-essay';
import ReportModal from './ReportModal';

interface EssayQuestionProps {
  question: EssayQuestionType;
  onNext?: () => void;
  isLast?: boolean;
}

export default function EssayQuestion({ question, onNext, isLast = false }: EssayQuestionProps) {
  const draftKey = `essay_draft_${question.id}`;

  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) setAnswer(saved);
  }, [draftKey]);

  useEffect(() => {
    if (answer) {
      localStorage.setItem(draftKey, answer);
    }
  }, [answer, draftKey]);

  const handleSubmit = async () => {
    if (!answer.trim() || isLoading) return;
    if (!question.grading_rubric) {
      alert('이 문제에는 채점 기준이 설정되어 있지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const gradingResult = await gradeEssay(
        question.question,
        question.grading_rubric,
        answer
      );
      setResult(gradingResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '채점 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setShowModelAnswer(false);
  };

  return (
    <div className="space-y-5">
      {/* 문제 카드 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* 배지 + 오류 제보 */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
            서술형 · 논술형
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            🚩 오류 제보
          </button>
        </div>

        <p className="text-base font-semibold text-slate-800 leading-relaxed">
          {question.question.split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </p>

        {question.image_url && (
          <img
            src={question.image_url}
            alt="문제 이미지"
            className="w-full max-w-full rounded-lg object-contain my-4"
          />
        )}

        {question.grading_rubric?.constraints && (
          <p className="mt-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
            ✏️ {question.grading_rubric.constraints}
          </p>
        )}
      </div>

      {/* 답안 입력 — 채점 전까지만 표시 */}
      {!result && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <label className="text-sm font-semibold text-slate-600">내 답안 작성</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="이 곳에 답안을 작성하세요..."
            disabled={isLoading}
            className="w-full min-h-[220px] md:min-h-[320px] p-4 border-2 border-slate-200 rounded-xl resize-y text-sm text-slate-700 leading-relaxed focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-50"
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium text-center">
                AI 수석 채점관이 답안을 분석하고 있습니다...
              </p>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              답안 제출 및 AI 채점하기
            </button>
          )}
        </div>
      )}

      {/* 채점 결과 */}
      {result && (
        <div className="space-y-4">
          {/* 점수 헤더 */}
          <div
            className={`rounded-2xl p-6 border-2 ${
              result.is_pass ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">AI 채점 결과</p>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-4xl font-extrabold ${
                      result.is_pass ? 'text-blue-600' : 'text-orange-500'
                    }`}
                  >
                    {result.score}
                  </span>
                  <span className="text-lg text-slate-400 mb-1">/ 10점</span>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full font-bold text-sm ${
                  result.is_pass
                    ? 'bg-blue-500 text-white'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {result.is_pass ? '✅ 합격' : '💪 보완 필요'}
              </span>
            </div>
            <p className={`text-sm font-medium ${result.is_pass ? 'text-blue-700' : 'text-orange-700'}`}>
              {result.feedback_summary}
            </p>
          </div>

          {/* 누락 키워드 */}
          {result.missing_keywords.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">⚠️ 누락된 핵심 키워드</p>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                ※ AI가 채점 기준(Rubric)을 바탕으로 추출한 권장 키워드이며, 의미가 상통하는 유의어를 사용하셨다면 정답으로 인정될 수 있습니다.
              </p>
            </div>
          )}

          {/* 상세 피드백 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-indigo-500 mb-3">📝 상세 피드백</p>
            <p className="text-sm text-slate-600 leading-relaxed">{result.detailed_feedback}</p>
          </div>

          {/* 내 답안 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 mb-3">📄 내 답안</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>

          {/* 모범 답안 토글 */}
          {question.model_answer && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowModelAnswer((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-semibold text-emerald-600">
                  📖 모범 답안 확인하기
                </span>
                <span className="text-slate-400">{showModelAnswer ? '▲' : '▼'}</span>
              </button>
              {showModelAnswer && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {question.model_answer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-4 border-2 border-slate-300 text-slate-500 font-bold rounded-xl hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all active:scale-[0.98]"
            >
              다시 작성하기
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                {isLast ? '훈련 완료 ✓' : '다음 문제로 →'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 오류 제보 모달 */}
      {showReport && (
        <ReportModal
          questionId={question.id}
          questionText={question.question}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
