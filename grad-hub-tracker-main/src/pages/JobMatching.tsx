import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, Clock, Building, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { GraduateStore } from "@/lib/storage"
import { DesiredField, GraduateRecord } from "@/lib/types"

export default function JobMatching() {
  const [field, setField] = useState<DesiredField | "">("");
  const [graduates, setGraduates] = useState<GraduateRecord[]>([]);
  useEffect(() => {
    setGraduates(GraduateStore.list());
  }, []);

  const filtered = graduates.filter((g) =>
    field === "" || g.desiredField.includes(field)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">취업처 매칭</h2>
        <p className="text-muted-foreground">
          졸업생의 희망분야, 자격증, 취업기간 등으로 필터링하여 매칭할 수 있습니다. (채용공고 API 연동 예정)
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          className="border rounded px-3 py-2"
          value={field}
          onChange={e => setField(e.target.value as DesiredField | "")}
        >
          <option value="">전체 희망분야</option>
          <option value="제조">제조</option>
          <option value="사무">사무</option>
          <option value="피부미용">피부미용</option>
          <option value="간호">간호</option>
          <option value="보안">보안</option>
          <option value="서비스">서비스</option>
          <option value="기타">기타</option>
        </select>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>졸업생 매칭 리스트</CardTitle>
          <CardDescription>
            필터 조건에 맞는 졸업생 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">조건에 맞는 졸업생이 없습니다.</div>
            ) : (
              filtered.map((g) => (
                <div key={g.id} className="border rounded-lg p-4 bg-card hover:shadow-card transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-foreground">{g.name}</h4>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <span>{g.department}</span>
                        <span>| {g.graduationYear}년 졸업</span>
                      </div>
                    </div>
                    <Badge className="bg-edu-accent text-edu-primary">
                      {g.desiredField.join(", ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {g.certificates.map((cert: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    연락처: {g.phone} / 이메일: {g.email}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-gradient-primary">
                      상세보기
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}