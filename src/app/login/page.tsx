// 로그인 페이지 - 구글/카카오 소셜 로그인
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithKakao } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📖</div>
          <h1 className="text-2xl font-extrabold text-slate-800">교육전문직 문제은행</h1>
          <p className="text-sm text-slate-400 mt-1">장학사 시험 대비 학습 시스템</p>
        </div>

        {/* 로그인 버튼 */}
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 로그인
          </button>

          <button
            onClick={signInWithKakao}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] border-2 border-[#FEE500] rounded-xl text-[#191919] font-semibold hover:brightness-95 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.112 4.508 6.459l-1.15 4.26a.5.5 0 0 0 .77.526l4.94-3.297c.3.02.6.035.932.035 5.523 0 10-3.463 10-7.983C22 6.463 17.523 3 12 3z" />
            </svg>
            카카오로 로그인
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          로그인 시 서비스 이용약관에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
