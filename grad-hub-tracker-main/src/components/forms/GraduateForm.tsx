import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useGraduates } from "@/stores/graduates"
import { GraduateRecord } from "@/lib/types"

const graduateSchema = z.object({
  photo: z
    .any()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.size <= 3 * 1024 * 1024),
      { message: "사진은 3MB 이하의 파일만 업로드할 수 있습니다." }
    ),
  graduationYear: z.string().min(1, "졸업연도를 선택해주세요"),
  name: z.string().min(1, "이름을 입력해주세요").regex(/^[가-힣]+$/, "한글만 입력 가능합니다"),
  gender: z.string().min(1, "성별을 선택해주세요"),
  birthDate: z.date({ required_error: "생년월일을 선택해주세요" }),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^010-\d{4}-\d{4}$/, "전화번호 형식은 010-1234-5678 이어야 합니다"),
  address: z.string().min(1, "주소를 입력해주세요"),
  department: z.string().min(1, "졸업학과를 선택해주세요"),
  grade: z.number().min(0).max(100, "성적은 0-100% 사이여야 합니다"),
  attendance: z.string().min(1, "근태를 선택해주세요"),
  certificates: z.array(z.string()).default([]),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  employmentHistory: z.array(z.object({
    company: z.string(),
    period: z.string()
  })).default([]),
  educationHistory: z.array(z.object({
    school: z.string(),
    period: z.string()
  })).default([]),
  desiredField: z.array(z.string()).min(1, "희망분야를 선택해주세요"),
  currentStatus: z.array(z.string()).min(1, "현재상태를 선택해주세요"),
  memo: z.string().optional()
})

type GraduateFormData = z.infer<typeof graduateSchema>

interface GraduateFormProps {
  onBack: () => void
}

export default function GraduateForm({ onBack }: GraduateFormProps) {
  const grads = useGraduates()
  const [certificates, setCertificates] = useState<string[]>([])
  const [employmentHistory, setEmploymentHistory] = useState<{company: string, period: string}[]>([])
  const [educationHistory, setEducationHistory] = useState<{school: string, period: string}[]>([])
  const [error, setError] = useState<string>("")

  const form = useForm<GraduateFormData>({
    resolver: zodResolver(graduateSchema),
    defaultValues: {
      certificates: [],
      employmentHistory: [],
      educationHistory: [],
      desiredField: [],
      currentStatus: [],
      grade: 0
    }
  })

  const onSubmit = async (data: GraduateFormData) => {
    const record: Omit<GraduateRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      graduationYear: parseInt(data.graduationYear, 10),
      name: data.name,
      gender: data.gender as GraduateRecord["gender"],
  birthDate: data.birthDate.toISOString().split('T')[0],
      phone: data.phone,
      address: data.address,
      department: data.department,
      grade: data.grade,
      attendance: data.attendance as GraduateRecord["attendance"],
      certificates: data.certificates ?? [],
      email: data.email,
      employmentHistory: (data.employmentHistory ?? []).map((item) => ({
        company: item.company ?? "",
        period: item.period ?? "",
      })),
      educationHistory: (data.educationHistory ?? []).map((item) => ({
        school: item.school ?? "",
        period: item.period ?? "",
      })),
      desiredField: (data.desiredField as GraduateRecord["desiredField"]) ?? [],
      currentStatus: (data.currentStatus as GraduateRecord["currentStatus"]) ?? [],
      memo: data.memo,
    }
    try {
      const created = await grads.create(record)
      if (data.photo && data.photo instanceof File) {
        await grads.uploadPhoto(created.id, data.photo)
      }
      alert("졸업생이 등록되었습니다!")
      onBack()
    } catch (e) {
      setError("등록 중 오류가 발생했습니다. 입력 내용을 확인하거나 잠시 후 다시 시도해주세요.")
    }
  }

  const addCertificate = () => {
    setCertificates([...certificates, ""])
  }

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index))
  }

  const updateCertificate = (index: number, value: string) => {
    const newCertificates = [...certificates]
    newCertificates[index] = value
    setCertificates(newCertificates)
    form.setValue('certificates', newCertificates)
  }

  const addEmployment = () => {
    setEmploymentHistory([...employmentHistory, { company: "", period: "" }])
  }

  const removeEmployment = (index: number) => {
    setEmploymentHistory(employmentHistory.filter((_, i) => i !== index))
  }

  const addEducation = () => {
    setEducationHistory([...educationHistory, { school: "", period: "" }])
  }

  const removeEducation = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index))
  }

  const desiredFields = ["제조", "사무", "피부미용", "간호", "보안", "서비스", "기타"]
  const statusOptions = ["구직중", "교육중", "재학중", "재직중", "군복무"]
  const departments = ["유헬스시스템과", "유헬스디자인과", "의료IT과", "보건간호과", "3D콘텐츠디자인과", "건강과학과", "의료미용과"]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>졸업생 개별 등록</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사진 업로드</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && file.size > 3 * 1024 * 1024) {
                              alert("사진 용량은 3MB 이하만 가능합니다.")
                              e.target.value = ""
                              return
                            }
                            field.onChange(file)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>졸업연도 *</FormLabel>
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
                              <SelectItem key={year} value={year.toString()}>
                                {year}년
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 *</FormLabel>
                      <FormControl>
                        <Input placeholder="이름을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성별 *</FormLabel>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>생년월일 *</FormLabel>
                      <input
                        type="date"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v ? new Date(v + "T00:00:00") : undefined)
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>연락처 *</FormLabel>
                      <FormControl>
                        <Input placeholder="010-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일 *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>졸업학과 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="졸업학과 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성적 (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          placeholder="85"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>근태 *</FormLabel>
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
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소 *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="주소를 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 자격증 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>자격증</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addCertificate}>
                    <Plus className="h-4 w-4 mr-2" />
                    자격증 추가
                  </Button>
                </div>
                {certificates.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cert}
                      onChange={(e) => updateCertificate(index, e.target.value)}
                      placeholder="자격증명을 입력하세요"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCertificate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 취업처/취업기간 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>취업처/취업기간</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addEmployment}>
                    <Plus className="h-4 w-4 mr-2" />
                    취업처 추가
                  </Button>
                </div>
                {employmentHistory.map((employment, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      value={employment.company}
                      onChange={(e) => {
                        const newHistory = [...employmentHistory]
                        newHistory[index].company = e.target.value
                        setEmploymentHistory(newHistory)
                        form.setValue('employmentHistory', newHistory)
                      }}
                      placeholder="회사명"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={employment.period}
                        onChange={(e) => {
                          const newHistory = [...employmentHistory]
                          newHistory[index].period = e.target.value
                          setEmploymentHistory(newHistory)
                          form.setValue('employmentHistory', newHistory)
                        }}
                        placeholder="근무기간 (예: 2024.01-2024.12)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmployment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 대학명/재학기간 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>대학명/재학기간</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                    <Plus className="h-4 w-4 mr-2" />
                    대학 추가
                  </Button>
                </div>
                {educationHistory.map((education, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      value={education.school}
                      onChange={(e) => {
                        const newHistory = [...educationHistory]
                        newHistory[index].school = e.target.value
                        setEducationHistory(newHistory)
                        form.setValue('educationHistory', newHistory)
                      }}
                      placeholder="대학명"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={education.period}
                        onChange={(e) => {
                          const newHistory = [...educationHistory]
                          newHistory[index].period = e.target.value
                          setEducationHistory(newHistory)
                          form.setValue('educationHistory', newHistory)
                        }}
                        placeholder="재학기간 (예: 2024.03-2028.02)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 희망분야 */}
              <FormField
                control={form.control}
                name="desiredField"
                render={() => (
                  <FormItem>
                    <FormLabel>희망분야 *</FormLabel>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {desiredFields.map((field) => (
                        <FormField
                          key={field}
                          control={form.control}
                          name="desiredField"
                          render={({ field: formField }) => {
                            return (
                              <FormItem
                                key={field}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={formField.value?.includes(field)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? formField.onChange([...formField.value, field])
                                        : formField.onChange(
                                            formField.value?.filter(
                                              (value) => value !== field
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {field}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 현재상태 */}
              <FormField
                control={form.control}
                name="currentStatus"
                render={() => (
                  <FormItem>
                    <FormLabel>현재상태 *</FormLabel>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                      {statusOptions.map((status) => (
                        <FormField
                          key={status}
                          control={form.control}
                          name="currentStatus"
                          render={({ field: formField }) => {
                            return (
                              <FormItem
                                key={status}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={formField.value?.includes(status)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? formField.onChange([...formField.value, status])
                                        : formField.onChange(
                                            formField.value?.filter(
                                              (value) => value !== status
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {status}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 메모 */}
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="추가 메모사항이 있으면 입력하세요"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={onBack}>
                  취소
                </Button>
                <Button type="submit" className="bg-gradient-primary">
                  등록하기
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}