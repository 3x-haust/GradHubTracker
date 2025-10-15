import { Mail, Phone, MapPin, Shield, FileText } from "lucide-react"

const publicLogo = "/logo.jpg"

export function Footer() {
  return (
    <footer className="border-t bg-card text-sm text-muted-foreground">
  <div className="max-w-7xl mx-auto px-4 py-6 grid gap-y-4 md:grid-cols-3 md:gap-x-10 items-start">
        <div className="flex items-center gap-3">
          <img src={publicLogo} alt="School Logo" className="h-10 w-10 rounded-full object-cover" />
          <div className="space-y-1">
            <div className="text-foreground font-semibold">영락의료과학고등학교</div>
            <div>Youngnak Medical-science High School</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>서울특별시 관악구 청룡16길 25, 영락의료과학고등학교 진리관 2층</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>구직등록/구인등록 전화: 02-884-1004, 팩스: 02-884-1883</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-start">
          <a href="https://youngnak-c.sen.hs.kr/dggb/module/policy/selectPolicyDetail.do?policyTypeCode=PLC002&menuNo=81502" className="inline-flex items-center gap-1 hover:text-foreground">
            <Shield className="h-4 w-4" /> 개인정보 처리방침
          </a>
          <a href="https://youngnak-c.sen.hs.kr/dggb/module/policy/selectPolicyDetail.do?policyTypeCode=PLC003&menuNo=81503" className="inline-flex items-center gap-1 hover:text-foreground">
            <FileText className="h-4 w-4" /> 서비스 이용약관
          </a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-start text-muted-foreground">
        © 2025 All rights reserved. Youngnak Medical-science High School
      </div>
    </footer>
  )
}
