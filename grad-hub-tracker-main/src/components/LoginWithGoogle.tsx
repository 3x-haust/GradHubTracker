import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/stores/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options?: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginWithGoogle() {
  const auth = useAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const isAuthed = !!auth.me;
  const loginWithGoogleIdToken = auth.loginWithGoogleIdToken;

  useEffect(() => {
    if (isAuthed || !btnRef.current || initialized.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('환경 변수 VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
        return;
      }
      if (!window.google) {
        setError('Google 로그인 스크립트를 불러오지 못했습니다.');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        itp_support: true,
        callback: async (response: { credential: string }) => {
          try {
            const id_token = response.credential;
            await loginWithGoogleIdToken(id_token);
          } catch (e) {
            setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'medium',
        text: 'signin_with',
        locale: 'ko',
      });
    };
    script.onerror = () => setError('Google 로그인 스크립트 로드 실패');
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isAuthed, loginWithGoogleIdToken]);

  if (isAuthed) return null;
  return (
    <>
      {error && (
        <div className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </div>
      )}
      <div ref={btnRef} />
    </>
  );
}
