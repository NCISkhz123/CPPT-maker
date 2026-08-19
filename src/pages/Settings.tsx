import { useState, useEffect } from "react"
import { setApiKey, getApiKey } from "@/lib/aiConfig"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Cpu,
  Info,
} from "lucide-react"

export default function Settings() {
  const [apiKey, setApiKeyValue] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const existingKey = getApiKey()
    if (existingKey) {
      setApiKeyValue(existingKey)
    }
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Peringatan",
        description: "Mohon masukkan API Key Google Gemini terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    setApiKey(apiKey.trim())
    toast({
      title: "Berhasil Disimpan",
      description: "API Key Google Gemini berhasil disimpan di browser Anda.",
    })
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Kosong",
        description: "Masukkan API Key terlebih dahulu sebelum menguji koneksi.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setTestStatus("idle")
    setTestMessage("")

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      const result = await model.generateContent("Koneksi berhasil. Jawab hanya 'OK'.")
      const response = await result.response
      
      if (response.text()) {
        setTestStatus("success")
        setTestMessage("Koneksi ke Google Gemini AI berhasil! Model siap digunakan untuk analisis PCNE.")
        toast({
          title: "Koneksi Berhasil",
          description: "API Key valid dan terhubung dengan Google Gemini AI.",
        })
      }
    } catch (error: any) {
      setTestStatus("error")
      setTestMessage(error.message || "Gagal menghubungi server Gemini AI. Pastikan API Key valid.")
      toast({
        title: "Koneksi Gagal",
        description: error.message || "Gagal terhubung dengan Gemini API.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi integrasi kecerdasan buatan Google Gemini dan parameter asuhan farmasi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Gemini AI Config Card */}
        <Card className="border-border/80 shadow-subtle">
          <CardHeader className="space-y-1 pb-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Integrasi Google Gemini AI</CardTitle>
                <CardDescription>
                  Gunakan API Key mandiri (Bring Your Own Key) untuk mengaktifkan asisten SOAP & PCNE.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="apiKey" className="font-semibold text-sm">
                  Gemini API Key
                </Label>
                {apiKey && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    Tersimpan secara lokal
                  </span>
                )}
              </div>

              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  id="apiKey" 
                  type={showKey ? "text" : "password"} 
                  placeholder="AIzaSy..." 
                  value={apiKey}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  className="pl-10 pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Kunci API disimpan hanya di peramban (Local Storage) perangkat Anda demi keamanan data privasi.
              </p>
            </div>

            {/* Test Status Banner */}
            {testStatus === "success" && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Koneksi Aktif</AlertTitle>
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}

            {testStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Koneksi Bermasalah</AlertTitle>
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}

            {/* Guide Callout */}
            <div className="rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 p-4 space-y-2 text-xs text-sky-900 dark:text-sky-200">
              <div className="flex items-center gap-2 font-semibold text-sky-950 dark:text-sky-100">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Cara Mendapatkan API Key Google Gemini Gratis:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-muted-foreground dark:text-sky-200/80">
                <li>Buka konsol resmi <strong className="text-foreground">Google AI Studio</strong>.</li>
                <li>Masuk menggunakan akun Google Anda.</li>
                <li>Klik tombol <strong className="text-foreground">"Get API key"</strong> lalu buat kunci baru.</li>
                <li>Salin kuncinya dan tempelkan pada kolom di atas.</li>
              </ol>
              <div className="pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <span>Buka Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 sm:p-6 pt-0 flex flex-col sm:flex-row gap-3 border-t border-border/40 mt-2">
            <Button onClick={handleSave} className="w-full sm:flex-1 shadow-sm font-semibold">
              Simpan Kunci API
            </Button>
            <Button
              onClick={handleTestConnection}
              variant="outline"
              className="w-full sm:flex-1 font-medium"
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : (
                "Uji Koneksi Gemini"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* System & Standards Info */}
        <Card className="border-border/80 shadow-subtle bg-muted/20">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0 border border-border/70">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Standar Asuhan Kefarmasian</h4>
                <p className="text-xs text-muted-foreground">
                  Klasifikasi Masalah Terkait Obat (DRP) mengacu pada Pharmaceutical Care Network Europe (PCNE v9.00).
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right tabular-nums">
              Versi: <strong className="text-foreground">1.0.0</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

