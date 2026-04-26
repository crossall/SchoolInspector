// SessionSummary.tsx - 학습 결과 화면
'use client';

import type { SessionResults } from './QuizView';

interface SessionSummaryProps {
  results: SessionResults;
  incorrectCount: number;
  onGoHome: () => void;
  onGoIncorrect: () => void;
}

export default function SessionSummary({
  results,
  incorrectCount,
  onGoHome,
  onGoIncorrect,
}: SessionSummaryProps) {
  const accuracy =
    results.total > 0
      ? Math.round((results.correct / results.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800">학습 결과</h1>
          <p className="text-sm text-slate-400 mt-1">
            {results.categoryLabel}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-extrabold text-slate-800">
              {results.total}
            </div>
            <div className="text-xs text-slate-400 mt-1">풀이 수</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-extrabold text-indigo-500">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-400 mt-1">정답률</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-600">
              {results.correct}
            </div>
            <div className="text-xs text-emerald-500 mt-1">정답</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-extrabold text-red-500">
              {results.wrong}
            </div>
            <div className="text-xs text-red-400 mt-1">오답</div>
          </div>
        </div>

        {/* Wrong List or Perfect */}
        {results.wrongList.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-red-500 mb-3">
              ❌ 틀린 문제 목록
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              아래 문제들이 오답 노트에 저장되었습니다.
            </p>
            <div className="space-y-3">
              {results.wrongList.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-red-100 p-4"
                >
                  <span className="text-xs font-semibold text-red-400">
                    {q.subcategory}
                  </span>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {q.question}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-2">
                    정답:{' '}
                    {q.type === 'fill_in_blank'
                      ? q.answer.join(' / ')
                      : q.type === 'ordering'
                      ? q.answer_order.join(' → ')
                      : q.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center mb-8 py-8">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-lg font-bold text-slate-700">
              모든 문제를 맞추셨습니다!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onGoHome}
            className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
          >
            홈으로 돌아가기
          </button>

          {incorrectCount > 0 && (
            <button
              onClick={onGoIncorrect}
              className="w-full py-4 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:border-red-400 transition-all active:scale-[0.98]"
            >
              오답 노트 풀기 ({incorrectCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
