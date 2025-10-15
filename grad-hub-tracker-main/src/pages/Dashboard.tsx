import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, Users, Briefcase } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"

type ActivityType = "register" | "employment" | "education" | "update" | "delete";
interface Activity {
  action: string;
  time: Date;
  type: ActivityType;
}


export default function Dashboard() {
  const navigate = useNavigate();
  const validated = useAuth((s) => s.validated)
  const me = useAuth((s) => s.me)
  const [stats, setStats] = useState([
    { title: "등록 졸업생", value: "-", description: "전체 등록된 졸업생 수", icon: Users, trend: "" },
    { title: "취업률", value: "-", description: "전체 대비 재직중 비율", icon: Briefcase, trend: "" },
    { title: "진학률", value: "-", description: "전체 대비 재학중 비율", icon: Briefcase, trend: "" },
    { title: "구직중", value: "-", description: "현재 구직중인 인원 수", icon: Search, trend: "" },
  ]);
  const [activities, setActivities] = useState<Activity[]>([]);
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!validated || !me || me.approved === false) return
      try {
        const grads = await api<{ items: unknown[]; total: number; page: number; pageSize: number }>(`/graduates?page=1`)
        if (!mounted) return
        const total = grads.total
        const s = await api<{ total: number; employed: number; employedRate: number; furtherStudy: number; furtherStudyRate: number; jobSeeking: number }>(`/graduates/stats`)
        if (!mounted) return
        setStats([
          { title: "등록 졸업생", value: total.toLocaleString(), description: "전체 등록된 졸업생 수", icon: Users, trend: total > 0 ? `+${total}` : "0" },
          { title: "취업률", value: `${s.employedRate}%`, description: `취업 ${s.employed.toLocaleString()}명 / 전체 ${s.total.toLocaleString()}명`, icon: Briefcase, trend: s.total > 0 ? `${s.employed >= 0 ? '+' : ''}${s.employed}` : "0" },
          { title: "진학률", value: `${s.furtherStudyRate}%`, description: `진학 ${s.furtherStudy.toLocaleString()}명 / 전체 ${s.total.toLocaleString()}명`, icon: Briefcase, trend: s.total > 0 ? `${s.furtherStudy >= 0 ? '+' : ''}${s.furtherStudy}` : "0" },
          { title: "구직중", value: s.jobSeeking.toLocaleString(), description: "현재 구직중인 인원 수", icon: Search, trend: s.total > 0 ? `${Math.round((s.jobSeeking / s.total) * 100)}%` : "0%" },
        ])

        const logs = await api<{ items: { type: string; message: string; at: string }[]; total: number }>(`/activity-logs?limit=10`)
        if (!mounted) return
        const acts: Activity[] = (logs.items || [])
          .map((l) => ({ action: l.message, time: new Date(l.at), type: (l.type as ActivityType) }))
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 10)
        setActivities(acts)
      } catch {
        if (!mounted) return
        setStats([
          { title: "등록 졸업생", value: "-", description: "전체 등록된 졸업생 수", icon: Users, trend: "" },
          { title: "취업률", value: "-", description: "전체 대비 재직중 비율", icon: Briefcase, trend: "" },
          { title: "진학률", value: "-", description: "전체 대비 재학중 비율", icon: Briefcase, trend: "" },
          { title: "구직중", value: "-", description: "현재 구직중인 인원 수", icon: Search, trend: "" },
        ])
        setActivities([])
      }
    })()
    return () => { mounted = false }
  }, [validated, me])


  const quickActions = [
    {
      title: "졸업생 검색",
      description: "졸업생 정보를 검색하고 관리합니다",
      icon: Search,
      action: () => navigate("/search"),
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "신규 등록",
      description: "새로운 졸업생을 등록합니다",
      icon: UserPlus,
      action: () => navigate("/register"),
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "취업처 매칭",
      description: "적합한 채용정보를 찾아봅니다",
      icon: Briefcase,
      action: () => navigate("/jobs"),
      color: "from-purple-500 to-indigo-500"
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">대시보드</h2>
        <p className="text-muted-foreground">
          졸업생 후속관리 현황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">빠른 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-elevated transition-all duration-300 group bg-gradient-card"
              onClick={action.action}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">최근 활동</CardTitle>
          <CardDescription>최근 시스템 활동 내역입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">최근 활동 내역이 없습니다.</div>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'update' ? 'bg-blue-500' :
                      activity.type === 'education' ? 'bg-purple-500' :
                      activity.type === 'employment' ? 'bg-green-500' :
                      'bg-orange-500'
                    }`} />
                    <span className="text-sm text-foreground">{activity.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                </div>
              ))
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}


function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}
