import { Link, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { LayoutDashboard, Settings as SettingsIcon, LogOut, FileHeart, User } from "lucide-react"

export function Navigation() {
  const location = useLocation()
  const { session } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navLinks = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/" || location.pathname.startsWith("/patients"),
    },
    {
      to: "/settings",
      label: "Pengaturan",
      icon: SettingsIcon,
      isActive: location.pathname === "/settings",
    },
  ]

  const userEmail = session?.user?.email || "Apoteker"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/85 backdrop-blur-md transition-all">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
              <FileHeart className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                CPPT Maker
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Apoteker Klinis
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1.5 ml-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    link.isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${link.isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-xs font-medium text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-[150px] truncate text-foreground/80">{userEmail}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Keluar dari akun"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden xs:inline">Keluar</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="flex sm:hidden items-center justify-around border-t border-border/50 px-2 py-1.5 bg-card/60">
        {navLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                link.isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}

