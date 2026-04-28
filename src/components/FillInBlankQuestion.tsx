// FillInBlankQuestion.tsx - 단어 칩 빈칸 채우기 컴포넌트
// 빈칸 마커: {{blank}}
'use client';

import { useState, useCallback } from 'react';
import type { FillInBlankQuestion as FIBQuestion } from '@/lib/types';
import { normalizeAnswer } from '@/lib/quiz-engine';

interface Props {
  question: FIBQuestion;
  answered: boolean;
  onSubmit: (filledAnswer: string[]) => void;
}

const BLANK_MARKER = '{{blank}}';

export default function FillInBlankQuestion({ question, answered, onSubmit }: Props) {
  const segments = question.question.split(BLANK_MARKER);
  const blankCount = segments.length - 1;

  const [slots, setSlots] = useState<(string | null)[]>(
    () => new Array(blankCount).fill(null)
  );
  const [remaining, setRemaining] = useState<string[]>(() => [...question.word_chips]);

  const handleChipClick = useCallback((chip: string) => {
    if (answered) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;

    setSlots((prev) => {
      const next = [...prev];
      next[firstEmpty] = chip;
      return next;
    });
    setRemaining((prev) => {
      const idx = prev.indexOf(chip);
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, [answered, slots]);

  const handleSlotClick = useCallback((slotIdx: number) => {
    if (answered) return;
    const chip = slots[slotIdx];
    if (!chip) return;

    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
    setRemaining((prev) => [...prev, chip]);
  }, [answered, slots]);

  const allFilled = slots.every((s) => s !== null);

  const getSlotClass = (slotIdx: number) => {
    if (!answered || slots[slotIdx] === null) {
      return slots[slotIdx]
        ? 'bg-indigo-50 border-2 border-indigo-400 text-indigo-700'
        : 'bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400';
    }
    const correct = normalizeAnswer(slots[slotIdx]!) === normalizeAnswer(question.answer[slotIdx]);
    return correct
      ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
      : 'bg-red-50 border-2 border-red-400 text-red-700';
  };

  return (
    <div className="space-y-5">
      {/* 빈칸이 포함된 문제 텍스트 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-base font-semibold text-slate-800 leading-loose">
          {segments.map((seg, i) => (
            <span key={i}>
              {seg}
              {i < blankCount && (
                <button
                  onClick={() => handleSlotClick(i)}
                  disabled={answered && slots[i] === null}
                  className={`inline-flex items-center justify-center mx-1 px-3 py-1 rounded-lg min-w-[80px] text-sm font-bold transition-all ${getSlotClass(i)}`}
                >
                  {slots[i] ?? <span className="text-xs opacity-50">빈칸 {i + 1}</span>}
                </button>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* 단어 칩 풀 */}
      {!answered && (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            단어를 탭해서 빈칸을 채우세요
          </p>
          <div className="flex flex-wrap gap-2">
            {remaining.map((chip, i) => (
              <button
                key={`${chip}-${i}`}
                onClick={() => handleChipClick(chip)}
                className="px-4 py-2 rounded-full bg-white border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm"
              >
                {chip}
              </button>
            ))}
            {remaining.length === 0 && (
              <p className="text-xs text-slate-400">모든 칩이 배치되었습니다</p>
            )}
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      {!answered && (
        <button
          onClick={() => onSubmit(slots as string[])}
          disabled={!allFilled}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98] ${
            allFilled
              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {allFilled ? '정답 확인' : `빈칸 ${blankCount - slots.filter(Boolean).length}개 남음`}
        </button>
      )}
    </div>
  );
}
