import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/auth';

type Props = { children: ReactNode; role?: 'admin' | 'teacher' };

export default function ProtectedRoute({ children, role }: Props) {
  const location = useLocation();
  const [checking, setChecking] = useState<boolean>(false);
  const didFetch = useRef(false);
  const token = useAuth((s) => s.token);
  const validated = useAuth((s) => s.validated);
  const me = useAuth((s) => s.me);
  const fetchMe = useAuth((s) => s.fetchMe);
  const fetchMeRef = useRef(fetchMe);
  useEffect(() => {
    fetchMeRef.current = fetchMe;
  }, [fetchMe]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token || validated || didFetch.current) return;
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

  const authedShallow = !!token && !!me; 
  const authed = authedShallow && validated;
  const roleOk = useMemo(() => !role || (me && me.role === role), [role, me]);
  const approved = me?.approved !== false;

  if (checking && !authedShallow) {
    return <div className="p-6 text-center text-muted-foreground">확인 중...</div>;
  }
  if (!authedShallow) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!approved) {
    return (
      <div className="p-6 text-center">
        <div className="text-xl font-semibold mb-2">승인이 필요합니다</div>
        <div className="text-muted-foreground">관리자의 승인이 완료되면 접근할 수 있습니다.</div>
      </div>
    );
  }
  if (!roleOk) {
    return <div className="p-6 text-center text-red-600">권한이 없습니다.</div>;
  }
  return <>{children}</>;
}
