// PaywallModal.tsx - 프리미엄 잠금 모달
'use client';

interface PaywallModalProps {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-8 text-center">
          <div className="text-5xl mb-3">👑</div>
          <h2 className="text-xl font-bold text-white">프리미엄 콘텐츠</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-center text-slate-600 leading-relaxed mb-6">
            해당 지역 맞춤형 심화 문제는
            <br />
            <strong className="text-slate-800">프리미엄 이용권</strong>이
            필요합니다.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium mb-2">
              프리미엄 혜택
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>- 17개 시도 지역 맞춤 문제</li>
              <li>- 학교급별 심화 문제</li>
              <li>- 매월 새 문제 업데이트</li>
            </ul>
          </div>

          <button
            onClick={() => {
              alert('결제 기능은 준비 중입니다.');
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:brightness-95 transition-all active:scale-[0.98]"
          >
            결제하기
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 mt-2 text-slate-400 text-sm hover:text-slate-600 transition-colors"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
