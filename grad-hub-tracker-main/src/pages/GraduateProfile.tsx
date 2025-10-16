import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGraduates } from "@/stores/graduates";
import { GraduateRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { assetUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function GraduateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GraduateRecord | null>(null);
  const grads = useGraduates();
  const [error, setError] = useState<string>("")

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const g = await grads.get(id);
        setRecord(g);
      } catch (e) {
        setRecord(null);
        setError("데이터를 불러오지 못했습니다. 로그인 상태를 확인해주세요.")
      }
    })();
  }, [id, grads]);

  if (!record) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>졸업생 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            <p className="text-muted-foreground">해당 졸업생을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">뒤로가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>졸업생 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={assetUrl(record.photoUrl)} alt={record.name} />
              <AvatarFallback className="bg-gradient-primary text-white text-lg">
                {record.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{record.name}</h3>
                <Badge variant="secondary">{record.graduationYear} 졸업</Badge>
                <Badge variant="outline">{record.department}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                성별: {record.gender} · 생일: {record.birthDate}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                연락처: {record.phone} · 이메일: {record.email}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                주소: {record.address}
              </div>
              <div className="mt-4 text-sm">
                성적: {record.grade}% · 근태: {record.attendance}
              </div>
              <div className="mt-2 text-sm">
                희망분야: {record.desiredField.join(", ")}
              </div>
              <div className="mt-2 text-sm">
                상태: {record.currentStatus.join(", ")}
              </div>
              {record.certificates && record.certificates.length > 0 && (
                <div className="mt-2 text-sm">
                  자격증: {record.certificates.join(', ')}
                </div>
              )}
              {record.employmentHistory && record.employmentHistory.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">취업 이력</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {record.employmentHistory.map((e, idx) => (
                      <li key={`emp-${idx}`}>
                        <span className="font-medium text-foreground">{e.company}: </span>
                        <span className="ml-2">{e.period}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {record.educationHistory && record.educationHistory.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">학력 이력</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {record.educationHistory.map((e, idx) => (
                      <li key={`edu-${idx}`}>
                        <span className="font-medium text-foreground">{e.school}: </span>
                        <span className="ml-2">{e.period}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {record.memo && (
                <div className="mt-4 text-sm">
                  <div className="font-medium mb-1">메모</div>
                  <div className="whitespace-pre-wrap text-muted-foreground">{record.memo}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
