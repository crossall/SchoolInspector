// useAuth.ts - Supabase 인증 + 프로필 관리 훅
// 핵심: onAuthStateChange에서는 user만 캡처 (sync)
// DB 작업(upsert)은 별도 useEffect에서 실행 → auth lock 바깥
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  // ── 1단계: 인증 유저 (onAuthStateChange에서 동기적으로 설정) ──
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // ── 2단계: 프로필 (별도 useEffect에서 DB 통신) ──
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const profileCacheRef = useRef<{ userId: string; profile: Profile } | null>(null);

  // ── useEffect #1: onAuthStateChange → user만 캡처 ──
  useEffect(() => {
    const supabase = getSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // ★ 여기서는 절대 await/DB 호출 안 함 — lock 충돌 방지
        setAuthUser(session?.user ?? null);
        setAuthResolved(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── useEffect #2: authUser 변경 시 → 프로필 DB 작업 (lock 바깥) ──
  useEffect(() => {
    if (!authResolved) return;

    let cancelled = false;

    async function loadProfile(user: User) {
      // 캐시 히트 — 같은 유저면 DB 스킵
      const cached = profileCacheRef.current;
      if (cached && cached.userId === user.id) {
        if (!cancelled) {
          setState({ user, profile: cached.profile, loading: false, error: null });
        }
        return;
      }

      try {
        const profile = await upsertProfile(user);

        profileCacheRef.current = { userId: user.id, profile };

        if (!cancelled) {
          setState({ user, profile, loading: false, error: null });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string })?.code ?? 'UNKNOWN';
        console.error('[auth] catch — DB Error:', { code, message });

        if (!cancelled) {
          setState({
            user,
            profile: null,
            loading: false,
            error: `데이터베이스 연결에 문제가 발생했습니다. (에러 코드: ${code})`,
          });
        }
      }
    }

    if (authUser) {
      // loading 유지한 채 프로필 로드 시작
      setState((prev) => ({ ...prev, user: authUser, loading: true, error: null }));
      loadProfile(authUser);
    } else {
      profileCacheRef.current = null;
      if (!cancelled) {
        setState({ user: null, profile: null, loading: false, error: null });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [authUser, authResolved]);

  // ── 로그인 ──
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error('[auth] Google sign-in failed:', error);
  }, []);

  const signInWithKakao = useCallback(async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile_nickname',
      },
    });
    if (error) console.error('[auth] Kakao sign-in failed:', error);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    profileCacheRef.current = null;
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (
    updates: { target_region?: string; target_school_level?: string; is_pro?: boolean }
  ) => {
    if (!state.user) return null;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();

    if (error) {
      console.error('[auth] Profile update failed:', error);
      return null;
    }

    profileCacheRef.current = { userId: state.user.id, profile: data };
    setState((prev) => ({ ...prev, profile: data }));
    return data;
  }, [state.user]);

  const needsOnboarding =
    state.user !== null &&
    !state.loading &&
    !state.error &&
    (state.profile === null || state.profile.target_region === null);

  return {
    ...state,
    needsOnboarding,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    updateProfile,
  };
}

// ── 닉네임 추출 ──

function extractNickname(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw =
    meta.nickname ??
    meta.name ??
    meta.full_name ??
    meta.profile_nickname ??
    meta.preferred_username ??
    null;

  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return 'User';
}

// ── 프로필 Upsert ──

async function upsertProfile(user: User): Promise<Profile> {
  const supabase = getSupabase();
  const nickname = extractNickname(user);

  const payload: Record<string, unknown> = {
    id: user.id,
    nickname,
  };
  if (user.email) {
    payload.email = user.email;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    const dbError = new Error(`프로필 upsert 실패: ${error.message}`) as Error & { code: string };
    dbError.code = error.code;
    throw dbError;
  }

  if (!data) {
    const noDataError = new Error('프로필 upsert 후 데이터가 반환되지 않았습니다.') as Error & { code: string };
    noDataError.code = 'NO_DATA';
    throw noDataError;
  }

  return data as Profile;
}
