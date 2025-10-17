import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Upload, Trash2 } from "lucide-react"
import GraduateForm from "@/components/forms/GraduateForm"
import { useGraduates } from "@/stores/graduates"
import { useAuth } from "@/stores/auth"
import { GraduateRecord, DesiredField, StatusOption, AttendanceLevel, Gender } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import ExcelJS from "exceljs"
import * as XLSX from "xlsx"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { apiForm, ApiError } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

export default function GraduateRegister() {
  const [showForm, setShowForm] = useState(false)
  const items = useGraduates((s) => s.items)
  const fetch = useGraduates((s) => s.fetch)
  const [recent, setRecent] = useState(items.slice(0, 5))
  const validated = useAuth((s) => s.validated)
  const me = useAuth((s) => s.me)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [matchMode, setMatchMode] = useState<'phone'|'email'|'name_birthDate'>('phone')
  const [overwrite, setOverwrite] = useState(true)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [bulkResults, setBulkResults] = useState<Array<{ filename: string; ok: boolean; matchedId?: string; reason?: string }>>([])
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setRecent(items.slice(0, 5))
  }, [showForm, items])

  useEffect(() => {
    (async () => {
      if (!validated || !me || me.approved === false) return
      try {
        await fetch({ page: 1 })
      } catch {
        // ignore
      }
    })()
  }, [validated, me, fetch])

  if (showForm) {
    return <GraduateForm onBack={() => setShowForm(false)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">졸업생 등록</h2>
        <p className="text-muted-foreground">
          새로운 졸업생을 시스템에 등록합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <CardTitle>개별 등록</CardTitle>
            <CardDescription>
              졸업생 한 명씩 개별로 등록합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-gradient-primary"
              onClick={() => setShowForm(true)}
            >
              등록 양식 열기
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <CardTitle>엑셀 일괄 업로드</CardTitle>
            <CardDescription>
              엑셀 파일을 업로드하여 여러 명을 한번에 등록합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={async () => {
                await downloadXlsxTemplate()
              }}
            >
              엑셀 템플릿 다운로드
            </Button>
            <Button
              className="w-full mt-2 bg-gradient-primary"
              onClick={() => fileRef.current?.click()}
            >
              엑셀 파일 업로드
            </Button>
            <input
              type="file"
              ref={fileRef}
              accept=".csv,.xlsx"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  let rows: string[][]
                  if (file.name.toLowerCase().endsWith('.xlsx')) {
                    rows = await parseXlsx(await file.arrayBuffer())
                  } else {
                    const text = await file.text()
                    rows = parseCSV(text)
                  }
                  const header = rows.shift() || []
                  const expectedFirst = "졸업연도"
                  let success = 0
                  let failed = 0
                  const errors: string[] = []
                  if (header[0] !== expectedFirst) {
                    errors.push("템플릿 형식이 올바르지 않습니다. 템플릿을 다시 다운로드 해주세요.")
                  } else {
                    const isValidDate = (s: string) => normalizeDateInput(s) !== ''
                    const isValidPhone = (s: string) => /^010-\d{4}-\d{4}$/.test(s)
                    const isKoreanName = (s: string) => /^[가-힣]+$/.test(s)
                    const isValidEmail = (s: string) => /^(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})$/i.test(s)

                    const colLetter = (idx: number) => {
                      const n = idx
                      let s = ''
                      let x = n
                      while (true) {
                        s = String.fromCharCode(65 + (x % 26)) + s
                        x = Math.floor(x / 26) - 1
                        if (x < 0) break
                      }
                      return s
                    }
                    const colRefByIndex = (idx: number) => `열 ${colLetter(idx)}${header[idx] ? `(${header[idx]})` : ''}`
                    const fieldToIndex: Record<string, number> = {
                      graduationYear: 0,
                      name: 1,
                      gender: 2,
                      birthDate: 3,
                      phone: 4,
                      address: 5,
                      department: 6,
                      grade: 7,
                      attendance: 8,
                      certificates: 9,
                      email: 10,
                      employmentHistory: 11,
                      educationHistory: 12,
                      desiredField: 13,
                      currentStatus: 14,
                      memo: 15,
                    }
                    const colRefByField = (field: string) => {
                      const idx = fieldToIndex[field]
                      return typeof idx === 'number' ? colRefByIndex(idx) : field
                    }

                    const isValidPeriod = (s: string) => {
                      const t = (s || '').trim()
                      if (!t) return false
                      const u = t.replace(/[–—−~]/g, '-')
                      const datePart = String.raw`\d{4}(?:[./-]\d{1,2}(?:[./-]\d{1,2})?)?`
                      const start = new RegExp(`^${datePart}$`)
                      const range = new RegExp(`^${datePart}\\s*[-]\\s*(${datePart})?$`)
                      return start.test(u) || range.test(u)
                    }

                    const validateRow = (r: string[]) => {
                      const msgs: string[] = []
                      const [graduationYear, name, gender, birthDate, phone, address, department, grade, attendance, certificates, email, employment, education, desired, status] = r
                      if (!graduationYear) msgs.push(`${colRefByIndex(0)}: 졸업연도 비어있음`)
                      if (!name) msgs.push(`${colRefByIndex(1)}: 이름 비어있음`)
                      if (!gender) msgs.push(`${colRefByIndex(2)}: 성별 비어있음`)
                      if (!birthDate) msgs.push(`${colRefByIndex(3)}: 생년월일 비어있음`)
                      if (!phone) msgs.push(`${colRefByIndex(4)}: 연락처 비어있음`)
                      if (!department) msgs.push(`${colRefByIndex(6)}: 졸업학과 비어있음`)
                      
                      if (name && !isKoreanName(name)) msgs.push(`${colRefByIndex(1)}: 이름은 한글만 허용`)
                      if (birthDate && !isValidDate(birthDate)) msgs.push(`${colRefByIndex(3)}: 생년월일 형식 오류(YYYY-MM-DD, YYYY.M.D, YYYY.MM.DD, YYYYMMDD, 또는 엑셀 숫자 날짜)`) 
                      if (phone && !isValidPhone(phone)) msgs.push(`${colRefByIndex(4)}: 연락처 형식 오류(010-1234-5678)`)
                      const gnum = Number(grade)
                      if (grade && (isNaN(gnum) || gnum < 0 || gnum > 100)) msgs.push(`${colRefByIndex(7)}: 성적은 0~100 사이 숫자`)
                      if (email && !isValidEmail(email)) msgs.push(`${colRefByIndex(10)}: 이메일 형식 오류`)
                      if (gender && !genderAllow.includes(gender as Gender)) msgs.push(`${colRefByIndex(2)}: 성별 허용값 아님(${gender})`)
                      if (attendance && !attendanceAllow.includes(attendance as AttendanceLevel)) msgs.push(`${colRefByIndex(8)}: 근태 허용값 아님(${attendance})`)
                      if (department && !departments.includes(department)) msgs.push(`${colRefByIndex(6)}: 졸업학과 목록에 없음(${department})`)
                      const invalidDesired = (desired || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .filter(s => !desiredAllow.includes(s as DesiredField))
                      
                      if (invalidDesired.length > 0) msgs.push(`${colRefByIndex(13)}: 희망분야 허용값 아님(${invalidDesired.join(', ')})`)
                      const invalidStatus = (status || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .filter(s => !statusAllow.includes(s as StatusOption))
                      
                      if (invalidStatus.length > 0) msgs.push(`${colRefByIndex(14)}: 현재상태 허용값 아님(${invalidStatus.join(', ')})`)
                      const empPairs = (employment || '').split(';').map(s => s.trim()).filter(Boolean)
                      const badEmp = empPairs.filter(p => {
                        if (!p.includes(':') && !p.includes('：')) {
                          return (p.trim().length === 0)
                        }
                        const [company, period] = p.split(/:|：/)
                        const companyOk = (company || '').trim().length > 0
                        const periodStr = (period || '').trim()
                        const periodOk = periodStr === '' || isValidPeriod(periodStr)
                        return !(companyOk && periodOk)
                      })
                      if (badEmp.length > 0) msgs.push(`${colRefByIndex(11)}: 취업처/기간 형식 오류(회사 또는 회사:기간; 세미콜론 구분, 기간 예: 2025.01 - 2025.12 또는 2025.01.01 - )`)
                      const eduPairs = (education || '').split(';').map(s => s.trim()).filter(Boolean)
                      const badEdu = eduPairs.filter(p => {
                        if (!p.includes(':') && !p.includes('：')) {
                          return (p.trim().length === 0)
                        }
                        const [school, period] = p.split(/:|：/)
                        const schoolOk = (school || '').trim().length > 0
                        const periodStr = (period || '').trim()
                        const periodOk = periodStr === '' || isValidPeriod(periodStr)
                        return !(schoolOk && periodOk)
                      })
                      if (badEdu.length > 0) msgs.push(`${colRefByIndex(12)}: 대학명/기간 형식 오류(대학 또는 대학:기간; 세미콜론 구분, 기간 예: 2025.03 - 또는 2025.03.01 - 2028.02.28)`)
                      return msgs
                    }

                    for (let i = 0; i < rows.length; i++) {
                      const r = rows[i]
                      if (r.length === 0 || r.every((c) => c.trim() === "")) continue
                      try {
                        const clientErrors = validateRow(r)
                        if (clientErrors.length > 0) {
                          failed++
                          errors.push(`${i + 2}행 유효성 오류: ${clientErrors.join('; ')}`)
                          continue
                        }
                        const payload = mapRowToCreatePayload(r)
                        await useGraduates.getState().create(payload as unknown as Omit<GraduateRecord, 'id' | 'createdAt' | 'updatedAt'>)
                        success++
                      } catch (err: unknown) {
                        let msg = err instanceof Error ? err.message : ''
                        const apiErr = err as ApiError
                        if (apiErr && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
                          const detail = apiErr.errors.map(e => `${colRefByField(e.field)}: ${e.message}`).join('; ')
                          msg = `서버 검증 실패 - ${detail}`
                        } else if (apiErr && apiErr.message) {
                          msg = apiErr.message
                        }
                        if (!msg) {
                          try {
                            msg = JSON.stringify(err)
                          } catch {
                            msg = String(err)
                          }
                        }
                        failed++
                        errors.push(`${i + 2}행 처리 실패: ${msg || "알 수 없는 오류"}`)
                      }
                    }
                  }
                  setImportSummary({ success, failed, errors })
                  await fetch({ page: 1 })
                  setRecent(useGraduates.getState().items.slice(0, 5))
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err)
                  setImportSummary({ success: 0, failed: 0, errors: [msg || "파일을 읽는 중 오류가 발생했습니다."] })
                } finally {
                  if (fileRef.current) fileRef.current.value = ""
                }
              }}
            />
            {(importSummary.success > 0 || importSummary.failed > 0 || importSummary.errors.length > 0) && (
              <div className="mt-4 text-sm">
                <div className="text-foreground">가져오기 완료: {importSummary.success}건</div>
                {importSummary.failed > 0 && (
                  <div className="text-muted-foreground">실패: {importSummary.failed}건</div>
                )}
                {importSummary.errors.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1 max-h-32 overflow-auto">
                    {importSummary.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <CardTitle>사진 일괄 업로드</CardTitle>
          <CardDescription>
            파일명을 기준으로 졸업생과 자동 매칭합니다. jpg/png, 각 3MB 이하. 매칭 규칙은 아래에서 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">매칭 방식</Label>
              <Select value={matchMode} onValueChange={(v) => setMatchMode(v as typeof matchMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="매칭 방식 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">전화번호 (파일명=01012345678)</SelectItem>
                  <SelectItem value="email">이메일 (파일명=user@example.com)</SelectItem>
                  <SelectItem value="name_birthDate">이름+생년월일 (홍길동_2001-10-03 또는 홍길동-20011003)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">기존 사진 덮어쓰기</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={overwrite} onCheckedChange={setOverwrite} />
                  <span className="text-sm text-muted-foreground">켜면 기존 사진이 있더라도 교체합니다</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">사진 파일 선택</Label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setSelectedFiles(files)
                }}
                ref={photoInputRef}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              disabled={selectedFiles.length === 0}
              onClick={() => {
                setStagedFiles((prev) => [...prev, ...selectedFiles])
                setSelectedFiles([])
                if (photoInputRef.current) photoInputRef.current.value = ''
              }}
            >
              추가 ({selectedFiles.length}개)
            </Button>
            <Button
              className="bg-gradient-primary"
              disabled={uploadingPhotos || stagedFiles.length === 0}
              onClick={async () => {
                if (stagedFiles.length === 0) return
                const batch = stagedFiles.slice(0, Math.min(2, stagedFiles.length))
                setUploadingPhotos(true)
                try {
                  const fd = new FormData()
                  batch.forEach((f) => fd.append('files', f))
                  const actor = me?.sub
                  const qs = new URLSearchParams({ match: matchMode, overwrite: overwrite ? '1' : '0', ...(actor ? { actor } : {}) })
                  const res = await apiForm<{ ok: boolean; count: number; results: { filename: string; ok: boolean; matchedId?: string; reason?: string }[] }>(
                    `/graduates/photos/bulk?${qs.toString()}`,
                    fd,
                    'POST'
                  )
                  setBulkResults((prev) => [...prev, ...(res.results || [])])
                  setStagedFiles((prev) => prev.slice(batch.length))
                  await fetch({ page: 1 })
                  setRecent(useGraduates.getState().items.slice(0, 5))
                } catch (e) {
                  alert('업로드 중 문제가 발생했습니다.')
                } finally {
                  setUploadingPhotos(false)
                }
              }}
            >
              {uploadingPhotos ? '업로드 중…' : `${stagedFiles.length}개 업로드`}
            </Button>
            <Button variant="ghost" onClick={() => { setSelectedFiles([]); setStagedFiles([]); setBulkResults([]); if (photoInputRef.current) photoInputRef.current.value = '' }}>초기화</Button>
          </div>
          {(selectedFiles.length > 0 || stagedFiles.length > 0) && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div>선택됨: {selectedFiles.length}개 · 업로드 대기: {stagedFiles.length}개</div>
            </div>
          )}
          {stagedFiles.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">업로드 대기 목록</div>
              <div className="max-h-48 overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 w-12">#</th>
                      <th className="text-left p-2">파일명</th>
                      <th className="text-left p-2 w-24">크기</th>
                      <th className="text-left p-2 w-16">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedFiles.map((f, idx) => (
                      <tr key={`${f.name}-${idx}`} className="border-t">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 truncate max-w-[320px]" title={f.name}>{f.name}</td>
                        <td className="p-2">{Math.ceil(f.size / 1024)} KB</td>
                        <td className="p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setStagedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {bulkResults.length > 0 && (
            <div className="mt-4 text-sm">
              <div className="text-foreground mb-2">처리 결과: {bulkResults.filter(r => r.ok).length}건 성공 / {bulkResults.filter(r => !r.ok).length}건 실패</div>
              <div className="max-h-60 overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2">파일명</th>
                      <th className="text-left p-2">결과</th>
                      <th className="text-left p-2">졸업생 ID</th>
                      <th className="text-left p-2">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((r, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{r.filename}</td>
                        <td className="p-2">
                          {r.ok ? <span className="text-green-600">성공</span> : <span className="text-red-600">실패</span>}
                        </td>
                        <td className="p-2">{r.matchedId || '-'}</td>
                        <td className="p-2">{r.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>최근 등록된 졸업생</CardTitle>
          <CardDescription>가장 최근에 등록된 졸업생들입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">등록된 졸업생이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {recent.map((g) => (
                <div key={g.id} className="flex items-start gap-4 border rounded-lg p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={g.photoUrl || ""} alt={g.name} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {g.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{g.name}</span>
                      <Badge variant="secondary">{g.graduationYear} 졸업</Badge>
                      <Badge variant="outline">{g.department}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {g.phone} · {g.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const desiredAllow: DesiredField[] = ["제조", "사무", "피부미용", "간호", "보안", "서비스", "기타"]
const statusAllow: StatusOption[] = ["구직중", "교육중", "재학중", "재직중", "군복무"]
const attendanceAllow: AttendanceLevel[] = ["상", "중", "하"]
const genderAllow: Gender[] = ["남", "여"]
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

function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  const rows: string[][] = []
  for (const line of lines) {
    if (line === "") {
      rows.push([])
      continue
    }
    const cells: string[] = []
    let cur = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur)
        cur = ""
      } else {
        cur += ch
      }
    }
    cells.push(cur)
    rows.push(cells.map((c) => c.trim()))
  }
  return rows
}

function normalizeDateInput(input: string): string {
  const t = (input || '').trim()
  if (!t) return ''
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const y = iso[1]
    const mo = iso[2]
    const d = iso[3]
    return `${y}-${mo}-${d}`
  }
  const m = t.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (m) {
    const y = m[1]
    const mo = m[2].padStart(2, '0')
    const d = m[3].padStart(2, '0')
    return `${y}-${mo}-${d}`
  }
  if (/^\d{8}$/.test(t)) {
    const y = t.slice(0, 4)
    const mo = t.slice(4, 6)
    const d = t.slice(6, 8)
    return `${y}-${mo}-${d}`
  }
  if (/^\d{5,6}$/.test(t)) {
    const n = parseInt(t, 10)
    if (!isNaN(n) && n > 0) {
      const epoch = Date.UTC(1899, 11, 30)
      const days = n > 59 ? n - 1 : n
      const ms = epoch + days * 86400000
      const dt = new Date(ms)
      const y = dt.getUTCFullYear()
      const mo = String(dt.getUTCMonth() + 1).padStart(2, '0')
      const d = String(dt.getUTCDate()).padStart(2, '0')
      return `${y}-${mo}-${d}`
    }
  }
  const dt = new Date(t)
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear()
    const mo = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${mo}-${d}`
  }
  return ''
}

async function downloadXlsxTemplate() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('졸업생등록')
  const lists = wb.addWorksheet('목록')
  lists.state = 'veryHidden'

  lists.getCell('A1').value = '졸업학과'
  departments.forEach((d, i) => lists.getCell(`A${i + 2}`).value = d)
  lists.getCell('B1').value = '성별'
  genderAllow.forEach((g, i) => lists.getCell(`B${i + 2}`).value = g)
  lists.getCell('C1').value = '근태'
  attendanceAllow.forEach((a, i) => lists.getCell(`C${i + 2}`).value = a)
  lists.getCell('D1').value = '희망분야'
  desiredAllow.forEach((d, i) => lists.getCell(`D${i + 2}`).value = d)
  lists.getCell('E1').value = '현재상태'
  statusAllow.forEach((s, i) => lists.getCell(`E${i + 2}`).value = s)
  lists.getCell('F1').value = '졸업연도'
  const yearNow = new Date().getFullYear()
  const yearStart = yearNow - 10
  const years: number[] = []
  for (let y = yearStart; y <= yearNow + 1; y++) years.push(y)
  years.forEach((y, i) => lists.getCell(`F${i + 2}`).value = y)

  const header = [
    "졸업연도",
    "이름",
    "성별",
    "생년월일(YYYY-MM-DD)",
    "연락처(010-1234-5678)",
    "주소(선택)",
    "졸업학과",
    "성적(%)(선택)",
    "근태(상/중/하)(선택)",
    "자격증(쉼표구분)(선택)",
    "이메일(선택)",
    "취업처(회사 또는 회사:기간; 세미콜론 구분, 기간 예: 2025.01 또는 2025.01 - 또는 2025.01-2025.12)(선택)",
    "대학(대학 또는 대학:기간; 세미콜론 구분, 기간 예: 2025.03 또는 2025.03 - 또는 2025.03.01 - 2028.02.28)(선택)",
    "희망분야(복수,쉼표)(선택)",
    "현재상태(복수,쉼표)(선택)",
    "메모(선택)",
  ]
  ws.addRow(header)
  ws.getRow(1).font = { bold: true }
  ws.columns = header.map(h => ({ width: Math.max(14, h.length + 4) }))

  const maxRow = 1000
  type DVRule = { type: 'list'; allowBlank?: boolean; formulae: string[] }
  interface WorksheetWithDV { dataValidations: { add: (range: string, rule: DVRule) => void } }
  const wsDV = ws as unknown as WorksheetWithDV
  wsDV.dataValidations.add(`C2:C${maxRow}`, { type: 'list', allowBlank: true, formulae: ['=목록!$B$2:$B$3'] })
  wsDV.dataValidations.add(`I2:I${maxRow}`, { type: 'list', allowBlank: true, formulae: ['=목록!$C$2:$C$4'] })
  wsDV.dataValidations.add(`G2:G${maxRow}`, { type: 'list', allowBlank: true, formulae: [`=목록!$A$2:$A$${departments.length + 1}`] })
  wsDV.dataValidations.add(`N2:N${maxRow}`, { type: 'list', allowBlank: true, formulae: [`=목록!$D$2:$D$${desiredAllow.length + 1}`] })
  wsDV.dataValidations.add(`O2:O${maxRow}`, { type: 'list', allowBlank: true, formulae: [`=목록!$E$2:$E$${statusAllow.length + 1}`] })
  wsDV.dataValidations.add(`A2:A${maxRow}`, { type: 'list', allowBlank: true, formulae: [`=목록!$F$2:$F$${years.length + 1}`] })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'graduates_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

async function parseXlsx(ab: ArrayBuffer): Promise<string[][]> {
  const wb = XLSX.read(ab, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown as (string | number | boolean | null | undefined)[][]
  const rows = Array.isArray(aoa) ? aoa : []
  return rows.map((row) => row.map((c) => (c == null ? '' : String(c))))
}

function mapRowToCreatePayload(r: string[]): Omit<GraduateRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const [
    graduationYear,
    name,
    gender,
    birthDate,
    phone,
    address,
    department,
    grade,
    attendance,
    certificates,
    email,
    employment,
    education,
    desired,
    status,
    memo,
  ] = r

  const desiredList = (desired || "").split(",").map((s) => s.trim()).filter((s): s is DesiredField => desiredAllow.includes(s as DesiredField))
  const statusList = (status || "").split(",").map((s) => s.trim()).filter((s): s is StatusOption => statusAllow.includes(s as StatusOption))
  const certList = (certificates || "").split(",").map((s) => s.trim()).filter(Boolean)
  const gradeStr = (grade ?? '').toString().trim()
  const gradeNum = gradeStr === '' ? undefined : Number(gradeStr)

  return {
    graduationYear: Number(graduationYear) || new Date().getFullYear(),
    name: name || "",
    gender: genderAllow.includes(gender as Gender) ? (gender as Gender) : "남",
    birthDate: normalizeDateInput(birthDate) || "",
    phone: phone || "",
    address: address || "",
    department: department || "",
  grade: typeof gradeNum === 'number' && !isNaN(gradeNum) ? gradeNum : undefined as unknown as number,
  attendance: attendanceAllow.includes(attendance as AttendanceLevel) ? (attendance as AttendanceLevel) : undefined,
    certificates: certList,
  email: (email && email.trim()) ? email.trim() : undefined,
    employmentHistory: parseEmploymentPairs(employment),
    educationHistory: parseEducationPairs(education),
    desiredField: desiredList,
    currentStatus: statusList,
    memo: memo || "",
  }
}

function parseEmploymentPairs(input: string): { company: string; period: string }[] {
  if (!input) return []
  return input
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [company, period] = pair.split(/:|：/)
      return {
        company: (company || "").trim(),
        period: (period || "").trim(),
      }
    })
}

function parseEducationPairs(input: string): { school: string; period: string }[] {
  if (!input) return []
  return input
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [school, period] = pair.split(/:|：/)
      return {
        school: (school || "").trim(),
        period: (period || "").trim(),
      }
    })
}