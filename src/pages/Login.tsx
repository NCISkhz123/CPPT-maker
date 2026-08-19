import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileHeart, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        navigate("/")
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setSuccessMessage("Pendaftaran akun berhasil! Silakan masuk dengan akun Anda.")
        setMode("login")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses permintaan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <FileHeart className="h-7 w-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            CPPT Maker
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Sistem Catatan Perkembangan Pasien Terintegrasi & Asuhan Kefarmasian PCNE
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/80 shadow-elevated">
          <CardHeader className="space-y-3 pb-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-muted/80 text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-xs"
                    : "hover:text-foreground"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register")
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-card text-foreground shadow-xs"
                    : "hover:text-foreground"
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <div>
              <CardTitle className="text-lg">
                {mode === "login" ? "Masuk ke Akun Anda" : "Pendaftaran Apoteker"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Masukkan email dan kata sandi untuk mengakses dashboard pasien."
                  : "Buat akun baru untuk mulai mengelola CPPT pasien."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gagal</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Berhasil</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Apoteker</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="apoteker@rumahsakit.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Memproses...</span>
                  </>
                ) : mode === "login" ? (
                  "Masuk ke Dashboard"
                ) : (
                  "Daftarkan Akun"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          Aplikasi Asuhan Kefarmasian & Evaluasi Masalah Terapi Obat
        </p>
      </div>
    </div>
  )
}

