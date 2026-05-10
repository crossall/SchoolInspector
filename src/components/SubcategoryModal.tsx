// SubcategoryModal.tsx - 서브카테고리 선택 모달
'use client';

import type { ReactNode } from 'react';

export interface SubcategoryGroup {
  categoryKey: string;
  label: string;
  subcategories: string[];
}

interface SubcategoryModalProps {
  label: string;
  accentColor: string;
  bgColor: string;
  icon: ReactNode;
  subcategories: string[];
  groups?: SubcategoryGroup[];
  onSelect: (subcategory: string | null, categoryKeyOverride?: string) => void;
  onClose: () => void;
}

export default function SubcategoryModal({
  label,
  accentColor,
  bgColor,
  icon,
  subcategories,
  groups,
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
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-3 shrink-0"
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
        <div className="px-6 py-5 space-y-3 overflow-y-auto">
          <p className="text-sm text-slate-400 mb-2">
            세부 카테고리를 선택하세요
          </p>

          {groups ? (
            /* 그룹 모드: 카테고리별 섹션 */
            groups.map((group, idx) => (
              <div key={group.categoryKey}>
                {idx > 0 && <div className="border-t border-slate-100 pt-3" />}

                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>

                <button
                  onClick={() => onSelect(null, group.categoryKey)}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] mb-1"
                  style={{ background: accentColor }}
                >
                  {group.label} 전체 풀기
                </button>

                {group.subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onSelect(sub, group.categoryKey)}
                    className="w-full py-3 rounded-xl font-semibold border-2 transition-all hover:shadow-md active:scale-[0.98] mt-1"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            ))
          ) : (
            /* 단일 카테고리 모드 */
            <>
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
            </>
          )}
        </div>

        {/* Close */}
        <div className="px-6 pb-5 shrink-0">
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
