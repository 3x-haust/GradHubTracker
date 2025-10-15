import { SidebarTrigger } from "@/components/ui/sidebar"
const publicLogo = "/logo.jpg";
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import LoginWithGoogle from "@/components/LoginWithGoogle"

export function Header() {
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    if (auth.token && !auth.me) {
      auth.fetchMe().catch(() => {})
    }
  }, [auth])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={publicLogo} 
              alt="School Logo" 
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-primary">
                고졸자 후속관리지원 시스템
              </h1>
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {auth.me ? (
            <>
              <div className="hidden sm:block text-sm text-muted-foreground">
                {auth.me.name} · {auth.me.role}{auth.me.approved ? '' : ' (승인대기)'}
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-sm font-medium">{auth.me.name.charAt(0)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => auth.logout()}>로그아웃</Button>
            </>
          ) : (
            <LoginWithGoogle />
          )}
        </div>
      </div>
    </header>
  )
}