import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, MapPin, Briefcase, GraduationCap } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { GraduateRecord, DesiredField, StatusOption } from "@/lib/types"
import { useGraduates } from "@/stores/graduates"
import { assetUrl } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import ExcelJS from "exceljs"
import { useAuth } from "@/stores/auth"

function useGraduatesData() {
  const items = useGraduates((s) => s.items)
  const fetch = useGraduates((s) => s.fetch)
  const remove = useGraduates((s) => s.remove)
  return { items, fetch, remove }
}

export default function GraduateSearch() {
  const navigate = useNavigate()
  const validated = useAuth((s) => s.validated)
  const me = useAuth((s) => s.me)
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    employment: "",
    school: "",
    graduationYear: "",
    gender: "",
    department: "",
    desiredField: "",
    currentStatus: "",
    birthDate: undefined as Date | undefined,
    phone: "",
    email: "",
    address: "",
    attendance: "",
    minGrade: "",
    certificate: "",
  })
  const grads = useGraduatesData()
  const serverTotal = useGraduates((s) => s.total)
  const serverPageSize = useGraduates((s) => s.pageSize)
  const serverCurrentPage = useGraduates((s) => s.currentPage)
  const didFetchRef = useRef(false)
  const fetchRef = useRef(grads.fetch)
  useEffect(() => { fetchRef.current = grads.fetch }, [grads.fetch])
  const [filteredGraduates, setFilteredGraduates] = useState<GraduateRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string>("")
  // 서버 페이지네이션을 사용하므로 클라이언트 단 분할은 하지 않습니다.

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
  const desiredFields: DesiredField[] = ["제조", "사무", "피부미용", "간호", "보안", "서비스", "기타"]
  const statusOptions: StatusOption[] = ["구직중", "교육중", "재학중", "재직중", "군복무"]
  const graduationYears = Array.from({length: 15}, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    (async () => {
      if (!validated || !me || me.approved === false) return
      if (didFetchRef.current) return
      didFetchRef.current = true
      try {
        await fetchRef.current({ page: 1 })
      } catch (e) {
        setError("데이터를 불러오지 못했습니다. 로그인 상태를 확인해주세요.")
      }
    })()
  }, [validated, me])

  useEffect(() => {
    setFilteredGraduates(grads.items)
    setCurrentPage(serverCurrentPage)
  }, [grads.items, serverCurrentPage])

  const handleSearch = () => {
    const desiredFilter = desiredFields.includes(searchFilters.desiredField as DesiredField)
      ? (searchFilters.desiredField as DesiredField)
      : undefined
    const statusFilter = statusOptions.includes(searchFilters.currentStatus as StatusOption)
      ? (searchFilters.currentStatus as StatusOption)
      : undefined
  const filtered = grads.items.filter((g) => {
      const birthDateStr = g.birthDate ? format(new Date(g.birthDate), "yyyy-MM-dd") : ""
      const matchCert = searchFilters.certificate
        ? g.certificates.some((c) => c.includes(searchFilters.certificate))
        : true
      const empMatch = searchFilters.employment
        ? (g.employmentHistory || []).some(e => e.company?.includes(searchFilters.employment))
        : true
      const eduMatch = searchFilters.school
        ? (g.educationHistory || []).some(e => e.school?.includes(searchFilters.school))
        : true
      const employmentDurationMatch = true
      return (
        (!searchFilters.name || g.name.includes(searchFilters.name)) &&
        empMatch &&
        eduMatch &&
        (!searchFilters.phone || g.phone.includes(searchFilters.phone)) &&
        (!searchFilters.email || g.email.includes(searchFilters.email)) &&
        (!searchFilters.address || g.address.includes(searchFilters.address)) &&
        (!searchFilters.graduationYear || g.graduationYear.toString() === searchFilters.graduationYear) &&
        (!searchFilters.gender || g.gender === searchFilters.gender) &&
        (!searchFilters.department || g.department === searchFilters.department) &&
  (!desiredFilter || g.desiredField.includes(desiredFilter)) &&
  (!statusFilter || g.currentStatus.includes(statusFilter)) &&
        (!searchFilters.attendance || g.attendance === searchFilters.attendance) &&
        (!searchFilters.minGrade || g.grade >= Number(searchFilters.minGrade)) &&
        (!searchFilters.birthDate || birthDateStr === format(searchFilters.birthDate, "yyyy-MM-dd")) &&
        matchCert && employmentDurationMatch
      )
    })
    setFilteredGraduates(filtered)
    setCurrentPage(1)
  }

  const hasActiveFilters = !!(
    searchFilters.name ||
    searchFilters.employment ||
    searchFilters.school ||
    searchFilters.graduationYear ||
    searchFilters.gender ||
    searchFilters.department ||
    searchFilters.desiredField ||
    searchFilters.currentStatus ||
    searchFilters.birthDate ||
    searchFilters.phone ||
    searchFilters.email ||
    searchFilters.address ||
    searchFilters.attendance ||
    searchFilters.minGrade ||
    searchFilters.certificate
  )

  const displayedGraduates = hasActiveFilters ? filteredGraduates : grads.items
  const totalPages = hasActiveFilters
    ? 1
    : Math.max(1, Math.ceil(serverTotal / serverPageSize))

  const handleExportXlsx = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("검색결과")

    ws.columns = [
      { header: "이름", key: "name", width: 12 },
      { header: "졸업연도", key: "graduationYear", width: 10 },
      { header: "성별", key: "gender", width: 8 },
      { header: "생년월일", key: "birthDate", width: 12 },
      { header: "연락처", key: "phone", width: 16 },
      { header: "이메일", key: "email", width: 24 },
      { header: "주소", key: "address", width: 30 },
      { header: "학과", key: "department", width: 16 },
      { header: "성적(%)", key: "grade", width: 10 },
      { header: "근태", key: "attendance", width: 8 },
      { header: "자격증", key: "certificates", width: 24 },
      { header: "희망분야", key: "desiredField", width: 18 },
      { header: "현재상태", key: "currentStatus", width: 18 },
      { header: "취업처/기간", key: "employment", width: 30 },
      { header: "대학명/재학기간", key: "education", width: 30 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true }

    filteredGraduates.forEach((g) => {
      const birth = g.birthDate ? format(new Date(g.birthDate), "yyyy-MM-dd") : ""
      const certs = g.certificates?.join(", ") || ""
      const desired = g.desiredField?.join(", ") || ""
      const status = g.currentStatus?.join(", ") || ""
      const employ = (g.employmentHistory || [])
        .map((e) => `${e.company}${e.period ? ` (${e.period})` : ""}`)
        .join("; ")
      const edu = (g.educationHistory || [])
        .map((e) => `${e.school}${e.period ? ` (${e.period})` : ""}`)
        .join("; ")

      ws.addRow({
        name: g.name,
        graduationYear: g.graduationYear ?? "",
        gender: g.gender ?? "",
        birthDate: birth,
        phone: g.phone ?? "",
        email: g.email ?? "",
        address: g.address ?? "",
        department: g.department ?? "",
        grade: g.grade ?? "",
        attendance: g.attendance ?? "",
        certificates: certs,
        desiredField: desired,
        currentStatus: status,
        employment: employ,
        education: edu,
      })
    })

    ws.columns?.forEach((col) => {
      let max = 10
      col.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value?.toString() ?? ""
        if (v.length > max) max = Math.min(v.length, 60)
      })
      col.width = Math.max(col.width ?? 10, max + 1)
    })

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const ts = format(new Date(), "yyyyMMdd_HHmmss")
    a.href = url
    a.download = `graduates-search_${ts}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">졸업생 검색</h2>
        <p className="text-muted-foreground">
          다양한 조건으로 졸업생을 검색하고 관리할 수 있습니다
        </p>
      </div>

      
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            검색 필터
          </CardTitle>
          <CardDescription>
            원하는 조건을 설정하여 졸업생을 검색하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">이름</label>
              <Input
                placeholder="이름을 입력하세요"
                value={searchFilters.name}
                onChange={(e) => setSearchFilters({...searchFilters, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">취업처</label>
              <Input
                placeholder="회사명 포함 검색"
                value={searchFilters.employment}
                onChange={(e) => setSearchFilters({...searchFilters, employment: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">대학</label>
              <Input
                placeholder="대학명 포함 검색"
                value={searchFilters.school}
                onChange={(e) => setSearchFilters({...searchFilters, school: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">연락처</label>
              <Input
                placeholder="010-1234-5678"
                value={searchFilters.phone}
                onChange={(e) => setSearchFilters({...searchFilters, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">이메일</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={searchFilters.email}
                onChange={(e) => setSearchFilters({...searchFilters, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">졸업연도</label>
              <Select value={searchFilters.graduationYear} onValueChange={(value) => setSearchFilters({...searchFilters, graduationYear: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="졸업연도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {graduationYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">성별</label>
              <Select value={searchFilters.gender} onValueChange={(value) => setSearchFilters({...searchFilters, gender: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="성별 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남">남</SelectItem>
                  <SelectItem value="여">여</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">생년월일</label>
              <input
                type="date"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                value={searchFilters.birthDate ? format(searchFilters.birthDate, "yyyy-MM-dd", { locale: ko }) : ""}
                onChange={(e) => {
                  const v = e.target.value
                  setSearchFilters({
                    ...searchFilters,
                    birthDate: v ? new Date(v + "T00:00:00") : undefined
                  })
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">학과</label>
              <Select value={searchFilters.department} onValueChange={(value) => setSearchFilters({...searchFilters, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="학과 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">희망분야</label>
              <Select value={searchFilters.desiredField} onValueChange={(value) => setSearchFilters({...searchFilters, desiredField: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="희망분야 선택" />
                </SelectTrigger>
                <SelectContent>
                  {desiredFields.map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">현재상태</label>
              <Select value={searchFilters.currentStatus} onValueChange={(value) => setSearchFilters({...searchFilters, currentStatus: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">근태</label>
              <Select value={searchFilters.attendance} onValueChange={(value) => setSearchFilters({...searchFilters, attendance: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="근태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="상">상</SelectItem>
                  <SelectItem value="중">중</SelectItem>
                  <SelectItem value="하">하</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">최소 성적 (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={searchFilters.minGrade}
                onChange={(e) => setSearchFilters({...searchFilters, minGrade: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">자격증 포함</label>
              <Input
                placeholder="예: 컴활"
                value={searchFilters.certificate}
                onChange={(e) => setSearchFilters({...searchFilters, certificate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-gradient-primary">
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            <Button variant="outline" onClick={() => {
              setSearchFilters({
                name: "",
                employment: "",
                school: "",
                graduationYear: "",
                gender: "",
                department: "",
                desiredField: "",
                currentStatus: "",
                birthDate: undefined,
                phone: "",
                email: "",
                address: "",
                attendance: "",
                minGrade: "",
                certificate: "",
              })
              grads.fetch({ page: 1 })
            }}>
              초기화
            </Button>
            <Button variant="outline" onClick={handleExportXlsx}>
              <Download className="h-4 w-4 mr-2" />
              엑셀 다운로드
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>검색 결과 ({filteredGraduates.length}명)</CardTitle>
          <CardDescription>
            검색된 졸업생 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedGraduates.map((graduate) => (
              <div key={graduate.id} className="border rounded-lg p-4 bg-card hover:shadow-card transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={assetUrl(graduate.photoUrl)} alt={graduate.name} />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg">
                      {graduate.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-lg text-foreground">{graduate.name}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {graduate.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {graduate.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {graduate.address}
                        </div>
                        {graduate.employmentHistory.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3 w-3" />
                            <span>
                              {graduate.employmentHistory
                                .map((e) => `${e.company}${e.period ? ` (${e.period})` : ""}`)
                                .join("; ")}
                            </span>
                          </div>
                        )}
                        {graduate.educationHistory.length > 0 && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-3 w-3" />
                            <span>
                              {graduate.educationHistory
                                .map((e) => `${e.school}${e.period ? ` (${e.period})` : ""}`)
                                .join("; ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{graduate.department}</Badge>
                          <Badge variant="secondary">{graduate.graduationYear}년 졸업</Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">성적:</span> {graduate.grade}% 
                          <span className="mx-2">|</span>
                          <span className="font-medium">근태:</span> {graduate.attendance}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {graduate.certificates.map((cert, index) => (
                            <Badge key={index} className="text-xs bg-edu-accent text-edu-primary">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {graduate.currentStatus.map((status, index) => (
                            <Badge key={index} variant={status === '재직중' ? 'default' : 'secondary'}>
                              {status}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">희망분야:</span> {graduate.desiredField.join(", ")}
                        </div>
                        
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/graduates/${graduate.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/graduates/${graduate.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await grads.remove(graduate.id)
                        if (hasActiveFilters) {
                          setFilteredGraduates((prev) => prev.filter((g) => g.id !== graduate.id))
                        } else {
                          const nextPage = serverCurrentPage
                          await fetchRef.current({ page: nextPage })
                          setCurrentPage(nextPage)
                        }
                      } catch (e) {
                        setError("삭제에 실패했습니다. 다시 시도해주세요.")
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          
          {!hasActiveFilters && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === serverCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    try {
                      await fetchRef.current({ page })
                      setCurrentPage(page)
                    } catch (e) {
                      setError("페이지를 불러오지 못했습니다.")
                    }
                  }}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}