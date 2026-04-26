// SettingsModal.tsx - 설정 변경 모달 (지역/학교급)
'use client';

import { useState } from 'react';
import { REGIONS, SCHOOL_LEVELS } from '@/lib/types';
import type { Region, SchoolLevel } from '@/lib/types';

interface SettingsModalProps {
  currentRegion: string | null;
  currentLevel: string | null;
  onSave: (region: string, schoolLevel: string) => void;
  onClose: () => void;
}

export default function SettingsModal({
  currentRegion,
  currentLevel,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [region, setRegion] = useState<Region | null>(
    (currentRegion as Region) ?? null
  );
  const [level, setLevel] = useState<SchoolLevel | null>(
    (currentLevel as SchoolLevel) ?? null
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-indigo-50 px-6 py-5 flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-lg font-bold text-slate-800">설정 변경</h2>
        </div>

        {/* Region */}
        <div className="px-6 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">
            응시 지역
          </h3>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  region === r
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* School Level */}
        <div className="px-6 pb-3">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">학교급</h3>
          <div className="flex gap-3">
            {SCHOOL_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  level === l
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-3 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            disabled={!region || !level}
            onClick={() => {
              if (region && level) onSave(region, level);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              region && level
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
