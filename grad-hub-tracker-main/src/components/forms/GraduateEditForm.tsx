import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduateRecord } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { assetUrl } from "@/lib/api"
import { useGraduates } from "@/stores/graduates"

const schema = z.object({
  graduationYear: z.string().min(1),
  name: z.string().min(1).regex(/^[가-힣]+$/),
  gender: z.enum(["남", "여"]),
  birthDate: z.string().min(4),
  phone: z
    .string()
    .min(1)
    .regex(/^010-\d{4}-\d{4}$/, "전화번호 형식은 010-1234-5678 이어야 합니다"),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  address: z.string().min(1),
  department: z.string().min(1),
  grade: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).max(100)).optional(),
  attendance: z.enum(["상", "중", "하"]).optional(),
  certificates: z.string().optional(),
  desiredField: z.string().optional(),
  currentStatus: z.string().optional(),
  employmentHistory: z.string().optional(),
  educationHistory: z.string().optional(),
  memo: z.string().optional(),
});

type FormData = z.infer<typeof schema>

export default function GraduateEditForm({ record, onBack }: { record: GraduateRecord; onBack: () => void }) {
  const grads = useGraduates()
  const upload = useGraduates((s) => s.uploadPhoto)
  const deletePhoto = useGraduates((s) => s.deletePhoto)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      graduationYear: String(record.graduationYear),
      name: record.name,
      gender: record.gender,
      birthDate: record.birthDate,
      phone: record.phone,
      email: record.email || "",
      address: record.address,
      department: record.department,
      grade: record.grade ?? undefined,
      attendance: record.attendance ?? undefined,
      certificates: (record.certificates || []).join(", "),
      desiredField: (record.desiredField || []).join(", "),
      currentStatus: (record.currentStatus || []).join(", "),
      employmentHistory: (record.employmentHistory || [])
        .map((e) => (e.period ? `${e.company}:${e.period}` : `${e.company}`))
        .join("; "),
      educationHistory: (record.educationHistory || [])
        .map((e) => (e.period ? `${e.school}:${e.period}` : `${e.school}`))
        .join("; "),
      memo: record.memo || "",
    },
  })

  useEffect(() => {
    form.reset({
      graduationYear: String(record.graduationYear),
      name: record.name,
      gender: record.gender,
      birthDate: record.birthDate,
      phone: record.phone,
      email: record.email || "",
      address: record.address,
      department: record.department,
      grade: record.grade,
      attendance: record.attendance,
      certificates: (record.certificates || []).join(", "),
      desiredField: (record.desiredField || []).join(", "),
      currentStatus: (record.currentStatus || []).join(", "),
      employmentHistory: (record.employmentHistory || []).map((e) => `${e.company}:${e.period}`).join("; "),
      educationHistory: (record.educationHistory || []).map((e) => `${e.school}:${e.period}`).join("; "),
      memo: record.memo || "",
    })
  }, [record, form])

  const onSubmit = async (data: FormData) => {
    const toList = (s?: string) =>
      (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    const toPairs = (s?: string) =>
      (s || "")
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((p) => {
          const [a, b] = p.split(":")
          return { first: (a || "").trim(), second: (b || "").trim() }
        })
    try {
      await grads.update(record.id, {
        graduationYear: Number(data.graduationYear),
        name: data.name,
        gender: data.gender as GraduateRecord["gender"],
        birthDate: data.birthDate,
        phone: data.phone,
        email: data.email,
        address: data.address,
        department: data.department,
        grade: typeof data.grade === 'number' ? data.grade : undefined,
        attendance: (data.attendance as GraduateRecord["attendance"]) ?? undefined,
        certificates: toList(data.certificates),
        desiredField: toList(data.desiredField) as GraduateRecord["desiredField"],
        currentStatus: toList(data.currentStatus) as GraduateRecord["currentStatus"],
        employmentHistory: toPairs(data.employmentHistory).map((x) => ({ company: x.first, period: x.second || undefined })),
        educationHistory: toPairs(data.educationHistory).map((x) => ({ school: x.first, period: x.second || undefined })),
        memo: data.memo ?? null,
      })
      onBack()
    } catch {
      alert("수정에 실패했습니다. 입력을 확인해주세요.")
    }
  }

  const departments = [
    "유헬스시스템과",
    "유헬스디자인과",
    "의료IT과",
    "의료비즈니스과",
    "디지털 의료IT과",
    "보건간호과",
    "3D콘텐츠디자인과",
    "건강과학과",
    "의료미용과",
  ]

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>졸업생 정보 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={assetUrl(record.photoUrl)} alt={record.name} />
            <AvatarFallback className="bg-gradient-primary text-white">{record.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">사진 변경</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.size > 3 * 1024 * 1024) {
                    alert("사진 용량은 3MB 이하만 가능합니다.")
                    e.currentTarget.value = ""
                    return
                  }
                  try {
                    await upload(record.id, f)
                    alert("사진이 변경되었습니다.")
                  } catch {
                    alert("사진 업로드에 실패했습니다.")
                  } finally {
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
            {record.photoUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!confirm("사진을 삭제하시겠습니까?")) return
                  try {
                    await deletePhoto(record.id)
                    alert("사진이 삭제되었습니다.")
                  } catch {
                    alert("사진 삭제에 실패했습니다.")
                  }
                }}
              >
                사진 삭제
              </Button>
            )}
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="graduationYear" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>졸업연도</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="졸업연도 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() - 2010 }, (_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="gender" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>성별</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="성별 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="남">남</SelectItem>
                      <SelectItem value="여">여</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="birthDate" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>생년월일</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="phone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="department" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>졸업학과</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="졸업학과 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="grade" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>성적 (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="attendance" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>근태</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="근태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="상">상</SelectItem>
                      <SelectItem value="중">중</SelectItem>
                      <SelectItem value="하">하</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField name="address" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>주소</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="certificates" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>자격증 (쉼표로 구분)</FormLabel>
                <FormControl><Input placeholder="컴활, 운전면허" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="desiredField" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>희망분야 (쉼표로 구분)</FormLabel>
                <FormControl><Input placeholder="제조, 서비스" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="currentStatus" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>현재상태 (쉼표로 구분)</FormLabel>
                <FormControl><Input placeholder="재학중, 구직중" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="employmentHistory" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>취업처/기간 (회사:기간; 세미콜론 구분)</FormLabel>
                <FormControl><Input placeholder="회사명:2024.01-2024.12; 다른회사:2025.01-" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="educationHistory" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>대학명/기간 (대학:기간; 세미콜론 구분)</FormLabel>
                <FormControl><Input placeholder="대학명:2024.03-2028.02" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="memo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>메모</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onBack}>취소</Button>
              <Button type="submit" className="bg-gradient-primary">수정 저장</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
