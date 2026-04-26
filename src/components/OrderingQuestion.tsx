// OrderingQuestion.tsx - 드래그 앤 드롭 순서 맞추기 컴포넌트
// dnd-kit PointerSensor (마우스+터치 통합)
'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrderingQuestion as OrdQuestion } from '@/lib/types';
import { shuffle, normalizeAnswer } from '@/lib/quiz-engine';

interface Props {
  question: OrdQuestion;
  answered: boolean;
  onSubmit: (orderedAnswer: string[]) => void;
}

interface SortableItemProps {
  item: string;
  index: number;
  answered: boolean;
  isCorrect: boolean | null;
}

function SortableItem({ item, index, answered, isCorrect }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const cardClass = answered
    ? isCorrect
      ? 'bg-emerald-50 border-2 border-emerald-400'
      : 'bg-red-50 border-2 border-red-400'
    : 'bg-white border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl px-4 py-4 transition-all ${cardClass}`}
    >
      {/* 그립 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-col gap-[3px] cursor-grab active:cursor-grabbing shrink-0 p-1"
        aria-label="드래그 핸들"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-[3px]">
            {[0, 1].map((col) => (
              <div
                key={col}
                className={`w-1 h-1 rounded-full ${answered ? (isCorrect ? 'bg-emerald-400' : 'bg-red-400') : 'bg-slate-400'}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 순서 번호 */}
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          answered
            ? isCorrect
              ? 'bg-emerald-400 text-white'
              : 'bg-red-400 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {index + 1}
      </span>

      {/* 항목 텍스트 */}
      <span
        className={`text-sm font-semibold flex-1 ${
          answered ? (isCorrect ? 'text-emerald-700' : 'text-red-700') : 'text-slate-700'
        }`}
      >
        {item}
      </span>

      {answered && (
        <span className="text-lg">{isCorrect ? '✓' : '✗'}</span>
      )}
    </div>
  );
}

export default function OrderingQuestion({ question, answered, onSubmit }: Props) {
  const [orderedItems, setOrderedItems] = useState<string[]>(
    () => shuffle([...question.items])
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = orderedItems.indexOf(String(active.id));
    const newIdx = orderedItems.indexOf(String(over.id));
    if (oldIdx !== -1 && newIdx !== -1) {
      setOrderedItems(arrayMove(orderedItems, oldIdx, newIdx));
    }
  }, [orderedItems]);

  const getItemCorrectness = (item: string, idx: number): boolean | null => {
    if (!answered) return null;
    return normalizeAnswer(item) === normalizeAnswer(question.answer_order[idx]);
  };

  return (
    <div className="space-y-4">
      {/* 안내 */}
      {!answered && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          항목을 드래그하여 올바른 순서로 배열하세요
        </p>
      )}

      {/* 드래그 리스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedItems.map((item, idx) => (
              <SortableItem
                key={item}
                item={item}
                index={idx}
                answered={answered}
                isCorrect={getItemCorrectness(item, idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 제출 버튼 */}
      {!answered && (
        <button
          onClick={() => onSubmit(orderedItems)}
          className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all mt-2"
        >
          정답 확인
        </button>
      )}

      {/* 정답 순서 표시 (오답 시) */}
      {answered && orderedItems.some((item, i) =>
        normalizeAnswer(item) !== normalizeAnswer(question.answer_order[i])
      ) && (
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold">올바른 순서: </span>
          {question.answer_order.join(' → ')}
        </div>
      )}
    </div>
  );
}
