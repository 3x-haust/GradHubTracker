import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginWithGoogle from '@/components/LoginWithGoogle';
import { useAuth } from '@/stores/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [checking, setChecking] = useState(false);
  const token = useAuth((s) => s.token);
  const me = useAuth((s) => s.me);
  const validated = useAuth((s) => s.validated);
  const fetchMe = useAuth((s) => s.fetchMe);
  const didFetch = useRef(false);
  const didRedirect = useRef(false);
  const fetchMeRef = useRef(fetchMe);

  useEffect(() => {
    fetchMeRef.current = fetchMe;
  }, [fetchMe]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      if (validated) return;
      if (didFetch.current) return;
      didFetch.current = true;
      setChecking(true);
      try {
        await fetchMeRef.current();
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, validated]);

  type LocState = { from?: { pathname?: string } } | undefined;
  const locState = location.state as LocState;
  const fromPath = useMemo(() => (locState?.from?.pathname) || '/', [locState?.from?.pathname]);
  useEffect(() => {
    if (!didRedirect.current && token && me) {
      didRedirect.current = true;
      navigate(fromPath, { replace: true });
    }
  }, [token, me, navigate, fromPath]);

  if (checking && !(token && me)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">로그인 확인 중…</div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>Google 계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <LoginWithGoogle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
