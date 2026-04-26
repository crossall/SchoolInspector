// ReportModal.tsx - 문제 오류 제보 모달
'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';

export type ErrorType = 'typo' | 'wrong_answer' | 'explanation_error' | 'outdated';

const ERROR_TYPE_OPTIONS: { value: ErrorType; label: string }[] = [
  { value: 'typo',              label: '오타' },
  { value: 'wrong_answer',      label: '잘못된 정답' },
  { value: 'explanation_error', label: '해설 오류' },
  { value: 'outdated',          label: '최신 규정과 다름' },
];

export interface ReportPayload {
  questionId: string;
  errorType: ErrorType;
  detail: string;
}

interface ReportModalProps {
  questionId: string;
  questionText: string;
  onClose: () => void;
}

/**
 * 제보 데이터를 백엔드로 전송한다.
 * TODO: Supabase `question_reports` 테이블 insert로 교체
 */
async function submitReport(payload: ReportPayload): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[오류 제보]', payload);

  // 백엔드 연동 뼈대:
  // const { error } = await supabase
  //   .from('question_reports')
  //   .insert({
  //     question_id: payload.questionId,
  //     error_type:  payload.errorType,
  //     detail:      payload.detail || null,
  //   });
  // if (error) throw error;
}

export default function ReportModal({
  questionId,
  questionText,
  onClose,
}: ReportModalProps) {
  const [errorType, setErrorType] = useState<ErrorType>('typo');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReport({ questionId, errorType, detail });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-rose-500" />
            <h2 className="text-base font-bold text-slate-800">문제 오류 제보</h2>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* 완료 상태 */
          <div className="px-5 py-8 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <p className="font-bold text-slate-800 mb-1">제보해 주셔서 감사합니다!</p>
            <p className="text-sm text-slate-400 mb-6">
              검토 후 신속히 수정하겠습니다.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-[0.98]"
            >
              닫기
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* 설명 */}
            <p className="text-sm text-slate-500 leading-relaxed">
              문제에 오류가 있나요? 의견을 남겨주시면{' '}
              <strong className="text-slate-700">검토 후 즉시 수정</strong>하겠습니다.
            </p>

            {/* 대상 문제 미리보기 */}
            <div className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
              {questionText}
            </div>

            {/* 오류 유형 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                오류 유형
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ERROR_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setErrorType(opt.value)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-[0.97] ${
                      errorType === opt.value
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 상세 내용 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                상세 내용 <span className="font-normal text-slate-400 normal-case">(선택)</span>
              </p>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="구체적인 오류 내용을 입력해 주세요."
                rows={3}
                className="w-full px-3 py-2.5 text-sm text-slate-700 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-indigo-400 placeholder:text-slate-300 transition-colors"
              />
            </div>

            {/* 제보 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                submitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {submitting ? '제보 중...' : '제보하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
