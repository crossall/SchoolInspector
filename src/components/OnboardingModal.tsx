// OnboardingModal.tsx - 최초 로그인 후 지역/학교급 선택
'use client';

import { useState } from 'react';
import { REGIONS, SCHOOL_LEVELS } from '@/lib/types';
import type { Region, SchoolLevel } from '@/lib/types';

interface OnboardingModalProps {
  onComplete: (region: string, schoolLevel: string) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | null>(null);

  const canStart = selectedRegion !== null && selectedLevel !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-4">
          <div className="text-5xl mb-3">📖</div>
          <h1 className="text-2xl font-extrabold text-slate-800">환영합니다!</h1>
          <p className="text-sm text-slate-400 mt-2">
            응시 지역과 학교급을 선택해 주세요.
            <br />
            맞춤형 문제가 제공됩니다.
          </p>
        </div>

        {/* Region Selection */}
        <div className="px-6 pb-4">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            응시 지역
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedRegion === r
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* School Level Selection */}
        <div className="px-6 pb-4">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">학교급</h2>
          <div className="flex gap-3">
            {SCHOOL_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedLevel === l
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="px-6 pb-8 pt-2">
          <button
            disabled={!canStart}
            onClick={() => {
              if (selectedRegion && selectedLevel) {
                onComplete(selectedRegion, selectedLevel);
              }
            }}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              canStart
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
