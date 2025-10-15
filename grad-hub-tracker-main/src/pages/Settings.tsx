
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"


type AllowedEmail = { id: string; email: string; createdAt: string };

export default function Settings() {
  const auth = useAuth();
  const [allowed, setAllowed] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const users = await api<Array<{ id: string; email: string; approved: boolean; createdAt: string }>>("/users");
        const items = users.filter(u => u.approved).map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt }));
        setAllowed(items);
      } catch (e) {
        setError("목록을 가져오지 못했습니다.");
      }
    })();
  }, []);

  const handleAdd = async () => {
    if (!newEmail) return;
    try {
      const created = await api<{ id: string; email: string; createdAt: string }>("/users", {
        method: "POST",
        body: JSON.stringify({ name: newEmail, email: newEmail }),
      });
      const item: AllowedEmail = { id: created.id, email: created.email, createdAt: created.createdAt };
      setAllowed([item, ...allowed]);
      setNewEmail("");
    } catch (e) {
      setError("추가에 실패했습니다.");
    }
  };

  const handleRemove = async (idOrEmail: string) => {
    try {
      await api(`/users/${idOrEmail}`, { method: "DELETE" });
      setAllowed(allowed.filter((x) => x.id !== idOrEmail));
    } catch (e) {
      setError("삭제에 실패했습니다.");
    }
  };

  return (

    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">설정</h2>
        <p className="text-muted-foreground">관리자만 이메일 화이트리스트를 관리할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>허용 이메일 목록</CardTitle>
            <CardDescription>추가된 이메일은 최초 로그인 시 자동 승인됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <ul className="space-y-2">
              {allowed.length === 0 && <li className="text-muted-foreground">등록된 이메일이 없습니다.</li>}
              {allowed.map((t) => (
                <li key={t.id} className="flex gap-4 items-center justify-between">
                  <div>
                    <span className="text-muted-foreground text-sm">{t.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRemove(t.id)}>삭제</Button>
                </li>
              ))}
            </ul>
            <div className="space-y-2 mt-6">
              <Label>이메일</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="teacher@example.com" />
              <Button className="w-full mt-2 bg-gradient-primary" onClick={handleAdd}>이메일 추가</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}