// SubcategoryModal.tsx - 서브카테고리 선택 모달
'use client';

import type { ReactNode } from 'react';

interface SubcategoryModalProps {
  label: string;
  accentColor: string;
  bgColor: string;
  icon: ReactNode;
  subcategories: string[];
  onSelect: (subcategory: string | null) => void;
  onClose: () => void;
}

export default function SubcategoryModal({
  label,
  accentColor,
  bgColor,
  icon,
  subcategories,
  onSelect,
  onClose,
}: SubcategoryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{ background: bgColor }}
        >
          <span className="text-2xl" style={{ color: accentColor }}>
            {icon}
          </span>
          <h2 className="text-lg font-bold" style={{ color: accentColor }}>
            {label}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-400 mb-2">
            세부 카테고리를 선택하세요
          </p>

          <button
            onClick={() => onSelect(null)}
            className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: accentColor }}
          >
            전체 문제 풀기
          </button>

          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => onSelect(sub)}
              className="w-full py-3 rounded-xl font-semibold border-2 transition-all hover:shadow-md active:scale-[0.98]"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Close */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
