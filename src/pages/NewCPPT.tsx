import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { getApiKey } from "@/lib/aiConfig"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Save,
  AlertCircle,
  BookOpen,
  ExternalLink,
  Loader2,
  History,
  FileText,
} from "lucide-react"

export default function NewCPPT() {
  const { id: patient_id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()

  const getLocalDate = () => {
    const d = new Date()
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]
  }

  const [tanggal, setTanggal] = useState(getLocalDate())
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")
  const [references, setReferences] = useState<{ title: string; url: string }[] | null>(null)
  
  const [patientName, setPatientName] = useState("")
  const [patientRm, setPatientRm] = useState("")
  const [loadingAI, setLoadingAI] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const [previousRecord, setPreviousRecord] = useState<any>(null)

  useEffect(() => {
    const fetchPatientAndPreviousRecord = async () => {
      if (!patient_id) return
      
      // Fetch patient's details
      const { data: patientData } = await supabase
        .from("patients")
        .select("nama, no_rm, admitted_at")
        .eq("id", patient_id)
        .single()
        
      if (patientData) {
        setPatientName(patientData.nama)
        setPatientRm(patientData.no_rm)
      }
        
      let query = supabase
        .from("cppt_records")
        .select("*")
        .eq("patient_id", patient_id)
        
      if (patientData?.admitted_at) {
        query = query.gte("created_at", patientData.admitted_at)
      }
      
      const { data, error } = await query
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        
      if (!error && data) {
        setPreviousRecord(data)
      } else {
        setPreviousRecord(null)
      }
    }
    
    fetchPatientAndPreviousRecord()
  }, [patient_id])

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: "Tersalin ke Clipboard",
      description: `Teks ${fieldName} berhasil disalin.`,
    })
  }

  const generateAI = async () => {
    setErrorMsg("")
    const apiKey = getApiKey()
    if (!apiKey) {
      setErrorMsg("API Key Google Gemini belum diatur. Silakan ke menu Pengaturan untuk menyimpan API Key.")
      return
    }

    if (!subjective.trim() || !objective.trim()) {
      setErrorMsg("Mohon lengkapi bagian Subjektif (S) dan Objektif (O) terlebih dahulu sebelum membuat analisis AI.")
      return
    }

    setLoadingAI(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [
          {
            googleSearch: {}
          } as any
        ],
        generationConfig: {
          temperature: 0.0,
        }
      })

      const globalInstruction = `SANGAT PENTING (ATURAN UMUM):
1. Di dalam pedoman apoteker klinis, data Objective mencakup "Obat yang sedang digunakan / terapi saat ini". Oleh karena itu, jika Anda melihat daftar obat di data Objective, evaluasilah obat tersebut sebagai TERAPI SAAT INI yang diberikan oleh dokter. Jangan otomatis menyimpulkan bahwa terapi tersebut "telah gagal" (misalnya: "TD masih tinggi padahal sudah minum obat X"), melainkan evaluasilah apakah pemilihan obat tersebut (terapi saat ini) sudah TEPAT untuk kondisi pasien saat ini.
2. JANGAN mencampuradukkan kondisi yang sudah diterapi dengan tepat ke dalam poin masalah (kode C atau P). Jika sebuah penyakit (misal: hipertensi) sudah mendapat obat yang tepat, JANGAN masukkan ke dalam poin "Pengobatan tidak diberikan" hanya untuk sekadar dibahas. Fokuskan poin masalah (kode C/P) HANYA pada kondisi yang bermasalah atau belum mendapat obat (misal: TG tinggi belum ada obatnya). Kondisi yang sudah mendapat terapi tepat bisa dimasukkan ke dalam Plan (I0.1 Tanpa Intervensi) atau tidak perlu dijadikan problem utama.
3. ETIKA INTERVENSI: Jika Anda merekomendasikan penambahan terapi baru pada bagian Plan, sebutkan NAMA GOLONGAN OBATNYA SAJA (misalnya: "Analgetik" atau "Obat penurun lipid golongan Fibrat"). DILARANG KERAS meresepkan nama obat spesifik beserta dosisnya (misalnya: "Parasetamol 500mg" atau "Simvastatin 20mg") untuk menghormati kewenangan klinis dokter.
4. GAYA BAHASA (NADA BICARA): Pada bagian Plan, gunakan bahasa yang sangat sopan, kolaboratif, dan bersifat menyarankan. JANGAN menggurui atau mendikte dokter. Gunakan frasa penawaran seperti "Mengusulkan untuk mempertimbangkan...", "Dapat didiskusikan kemungkinan...", atau "Mohon pertimbangkan penambahan..." alih-alih kalimat perintah seperti "Harus diberikan..." atau "Wajib diganti...".
5. Pada bagian Assessment (Masalah/Penyebab), Anda BOLEH memberikan lebih dari 1 poin PCNE jika memang ditemukan indikasi multipel.
6. Pada bagian Plan (Intervensi), Anda WAJIB menggunakan format kode poin PCNE Intervensi yang bersesuaian.`

      const contextInstruction = previousRecord
        ? `KONTEKS PASIEN (PERAWATAN LANJUTAN / HARI KE-N):
- Pasien ini sudah memiliki riwayat perawatan sebelumnya.
- Pada bagian Objective saat ini, obat yang tercantum adalah TERAPI / RESEP HARI INI.
- Anda harus melihat data Riwayat Obat Sebelumnya sebagai acuan untuk mengevaluasi Resep Hari Ini (apakah ini terapi baru, perubahan dosis, dsb).

Data Riwayat CPPT Sebelumnya (Untuk Konteks):
S: ${previousRecord.subjective}
O: ${previousRecord.objective}
A: ${previousRecord.assessment}
P: ${previousRecord.plan}`
        : `KONTEKS PASIEN (PERAWATAN HARI PERTAMA):
- Ini adalah hari pertama CPPT pasien. Obat-obatan yang dicantumkan pada bagian Objective adalah TERAPI YANG BARU DIRESEPKAN HARI INI OLEH DOKTER.
- Tugas Anda adalah mengevaluasi ketepatan resep baru tersebut terhadap kondisi pasien (Subjective/Objective) menggunakan PCNE. JANGAN menganggap obat tersebut sebagai riwayat pengobatan yang sudah gagal.`

      const prompt = `Anda adalah asisten apoteker klinis. Diberikan data Subjective dan Objective pasien, buatlah Assessment dan Plan menggunakan klasifikasi metode PCNE (Pharmaceutical Care Network Europe).

${globalInstruction}

${contextInstruction}

ATURAN FORMAT PENULISAN (WAJIB DIIKUTI):
1. SANGAT DISARANKAN untuk menggabungkan kode PCNE yang saling berkaitan (misalnya pasangan kode Masalah/P dan kode Penyebab/C) ke dalam satu blok penjelasan agar tidak bertele-tele dan repetitif.
2. Format gabungan HARUS persis seperti ini:
[Kode 1 & Kode 2] - [Gabungan Deskripsi Singkat Poin PCNE]
[Penjelasan analitis klinis yang padat dan mencakup kedua kode tersebut secara komprehensif]

Contoh Assessment yang BENAR (Format Gabungan):
[P1.3 & C1.6] - Gejala tidak diobati akibat pengobatan tidak lengkap
Kadar Trigliserida (TG) pasien saat ini mencapai 250 mg/dL (hipertrigliseridemia), namun belum mendapatkan terapi penurun lipid yang diresepkan oleh dokter untuk mencegah risiko komplikasi kardiovaskular.

Contoh Plan yang BENAR (Format Gabungan):
[I1.3 & I3.6] - Intervensi diusulkan kepada penulis resep untuk memulai obat baru
Mengusulkan kepada dokter penanggung jawab untuk mempertimbangkan pemberian terapi penurun lipid (seperti golongan Fibrat atau Statin) untuk mengatasi kondisi hipertrigliseridemia.

Kembalikan respon HANYA dalam bentuk JSON murni tanpa awalan/akhiran markdown blocks (tanpa \`\`\`json), dengan struktur:
{
  "assessment": "string (gabungkan semua poin assessment dengan newline ganda (\\n\\n) jika ada lebih dari 1)",
  "plan": "string (gabungkan semua poin plan dengan newline ganda (\\n\\n) jika ada lebih dari 1)",
  "references": [{"title": "Nama Guideline/Jurnal", "url": "https://..."}]
}

Instruksi Referensi (WAJIB DIIKUTI):
- Anda WAJIB memberikan referensi yang relevan untuk **SETIAP** masalah klinis spesifik atau intervensi kritis yang Anda angkat.
- OPTIMASI WAKTU TUNGGU: JANGAN gunakan fitur Google Search jika Anda sudah mengetahui nomor DOI jurnal tersebut secara pasti (langsung berikan format \`https://doi.org/[DOI]\`). 
- KARENA FITUR GOOGLE SEARCH ANDA AKTIF, HANYA lakukan pencarian web JIKA Anda merujuk pada artikel/pedoman/website obat yang tidak memiliki DOI, guna menemukan URL ASLI (Direct Link) yang 100% aktif dan valid.
- Referensi harus berkualitas tinggi HANYA dari jenis literatur berikut: Guideline Medis, SRMA, RCT, atau Cohort Study.
- Berikan URL LANGSUNG (*direct link*) yang spesifik. Jika merujuk ke obat, gunakan link spesifik halamannya di drugs.com.
- Judul ("title") harus spesifik menyebutkan nama guideline atau topik jurnalnya secara akurat.

REFERENSI KODE PCNE v9.00 (GUNAKAN KODE INI SECARA KETAT, JANGAN MENGARANG):

--- MASALAH & PENYEBAB (Untuk Assessment) ---
P1.1 Tidak ada efek dari terapi obat
P1.2 Efek terapi obat tidak optimal
P1.3 Gejala atau indikasi yang tidak diobati
P2.1 Kejadian obat yang merugikan (mungkin) terjadi
P3.1 Masalah pengobatan yang berkaitan dengan efektivitas biaya
P3.2 Pengobatan yang tidak diperlukan
P3.3 Masalah terkait obat yang tidak jelas
C1.1 Obat tidak sesuai dengan pedoman / formularium
C1.2 Obat sesuai pedoman, namun terdapat kontraindikasi
C1.3 Tidak ada indikasi untuk obat
C1.4 Kombinasi tidak tepat (obat-obat, obat-herbal)
C1.5 Duplikasi dari kelompok terapeutik/bahan aktif
C1.6 Pengobatan tidak diberikan atau tidak lengkap
C1.7 Terlalu banyak obat yang diresepkan untuk satu indikasi
C2.1 Bentuk sediaan obat yang tidak sesuai dengan pasien
C3.1 Dosis obat terlalu rendah
C3.2 Dosis obat terlalu tinggi
C3.3 Regimen dosis kurang
C3.4 Regimen dosis terlalu sering
C3.5 Instruksi waktu pemberian dosis salah, tidak jelas
C4.1 Durasi pengobatan terlalu singkat
C4.2 Durasi pengobatan terlalu lama
C5.1 Obat yang diresepkan tidak tersedia
C5.2 Informasi yang diperlukan tidak tersedia
C5.3 Salah obat, kekuatan sediaan atau regimen
C5.4 Salah penyiapan obat atau kekuatan dosis
C6.1 Waktu pemberian obat atau interval dosis tidak tepat
C6.2 Obat yang diberikan kurang
C6.3 Obat yang diberikan berlebih
C6.4 Obat tidak diberikan sama sekali
C6.5 Obat yang diberikan salah
C6.6 Obat diberikan melalui rute yang salah
C7.1 Pasien menggunakan obat lebih sedikit/tidak menggunakan
C7.2 Pasien menggunakan obat lebih banyak dari yang diresepkan
C7.3 Pasien menyalahgunakan obat
C7.4 Pasien menggunakan obat yang tidak perlu
C7.5 Pasien mengonsumsi makanan yang menyebabkan interaksi
C7.6 Pasien menyimpan obat secara tidak tepat
C7.7 Waktu atau interval pemberian dosis yang tidak tepat
C7.8 Pasien menggunakan obat dengan cara yang salah
C7.9 Pasien tidak dapat menggunakan obat/bentuk sediaan sesuai petunjuk
C7.10 Pasien tidak dapat memahami instruksi dengan benar
C8.1 Tidak ada rekonsiliasi obat saat pasien dipindahkan
C8.2 Tidak ada daftar obat terbaru yang tersedia
C8.3 Informasi tentang obat-obatan pada saat pemulangan/transfer tidak lengkap
C8.4 Informasi klinis tentang pasien tidak memadai
C8.5 Pasien belum menerima obat yang diperlukan saat pemulangan
C9.1 Tidak terdapat hasil pemantauan terapi obat yang sesuai
C9.2 Penyebab lain; sebutkan
C9.3 Tidak ada penyebab yang jelas

--- RENCANA INTERVENSI (Untuk Plan) ---
I0.1 Tanpa Intervensi
I1.1 Dokter penulis resep hanya diinformasikan
I1.2 Dokter penulis resep meminta informasi
I1.3 Intervensi diusulkan kepada dokter penulis resep
I1.4 Intervensi dibahas dengan dokter penulis resep
I2.1 Konseling kepada pasien terkait obat
I2.2 Tersedia informasi tertulis
I2.3 Pasien disarankan kembali ke dokter
I2.4 Menyampaikan kepada anggota keluarga / pengasuh
I3.1 Obat diubah menjadi ...
I3.2 Dosis diubah menjadi ...
I3.3 Formulasi diubah menjadi ...
I3.4 Petunjuk penggunaan diubah menjadi…
I3.5 Obat ditunda atau dihentikan
I3.6 Obat dimulai
I4.1 Intervensi lainnya (sebutkan)
I4.2 Efek samping dilaporkan ke pihak berwenang

Data Pasien:
Subjective: ${subjective}
Objective: ${objective}
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleanText)

      setAssessment(parsed.assessment || "")
      setPlan(parsed.plan || "")
      setReferences(parsed.references || null)
      
      toast({
        title: "Analisis PCNE Berhasil Dibuat",
        description: "Bagian Assessment dan Plan telah diperbarui.",
      })
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : "Gagal menghasilkan analisis dengan AI. Periksa kembali API Key dan koneksi internet.")
    } finally {
      setLoadingAI(false)
    }
  }

  const handleSave = async () => {
    if (!patient_id || !session?.user.id) return
    if (!subjective.trim() && !objective.trim() && !assessment.trim() && !plan.trim()) {
      setErrorMsg("Mohon isi setidaknya salah satu kolom SOAP sebelum menyimpan.")
      return
    }

    setSaving(true)
    setErrorMsg("")

    try {
      const { error } = await supabase
        .from("cppt_records")
        .insert({
          patient_id,
          user_id: session.user.id,
          tanggal,
          subjective,
          objective,
          assessment,
          plan,
          references
        })

      if (error) throw error

      toast({
        title: "CPPT Berhasil Disimpan",
        description: "Catatan perkembangan pasien telah ditambahkan ke rekam medis.",
      })
      navigate(`/patients/${patient_id}`)
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : "Gagal menyimpan data CPPT.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 text-muted-foreground hover:text-foreground">
            <Link to={`/patients/${patient_id}`} aria-label="Kembali ke detail pasien">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pembuatan Catatan CPPT Baru
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pasien: <strong className="text-foreground">{patientName || "Memuat..."}</strong> (No. RM: <span className="font-mono">{patientRm}</span>)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${patient_id}`)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="shadow-sm font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                <span>Simpan Catatan CPPT</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Context Information Pill */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground/90">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <History className="h-4 w-4" />
        </div>
        <div>
          <span className="font-bold text-foreground">
            {previousRecord ? "Mode Kunjungan Lanjutan (Follow-up Care)" : "Mode Pasien Baru (Day-1 Admission)"}:
          </span>{" "}
          {previousRecord
            ? "Data CPPT sebelumnya otomatis digunakan AI sebagai riwayat untuk mengevaluasi resep & terapi hari ini."
            : "Ini adalah rekam CPPT pertama pasien. Obat pada kolom Objektif akan dievaluasi sebagai terapi awal."}
        </div>
      </div>

      {/* 2-Column Clinical Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: S & O Form + AI Trigger */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="border-border/80 shadow-subtle">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Data Klinis Pasien</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="tanggal" className="text-xs text-muted-foreground">
                    Tanggal:
                  </Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="h-8 text-xs w-36 tabular-nums"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Subjective (S) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-sky-500 text-white font-bold text-xs">
                      S
                    </span>
                    <Label htmlFor="subjective" className="text-xs font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                      Subjektif (Keluhan Pasien)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(subjective, "Subjektif")}
                    aria-label="Salin Subjektif"
                  >
                    {copiedField === "Subjektif" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>{copiedField === "Subjektif" ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
                <Textarea
                  id="subjective"
                  rows={4}
                  placeholder="Contoh: Pasien mengeluh pusing berputar sejak kemarin malam, mual (+), muntah 1x..."
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  className="bg-card border-sky-200/80 dark:border-sky-900/60 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
                />
              </div>

              {/* Objective (O) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-emerald-600 text-white font-bold text-xs">
                      O
                    </span>
                    <Label htmlFor="objective" className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      Objektif (Lab & Terapi Obat Saat Ini)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(objective, "Objektif")}
                    aria-label="Salin Objektif"
                  >
                    {copiedField === "Objektif" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>{copiedField === "Objektif" ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
                <Textarea
                  id="objective"
                  rows={6}
                  placeholder="Contoh:
TD: 150/90 mmHg, HR: 88x/m, GDS: 180 mg/dL.
Obat saat ini:
- Amlodipine 10mg 1x1 tab
- Metformin 500mg 2x1 tab
- Ketorolac inj 30mg / 8 jam"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="bg-card border-emerald-200/80 dark:border-emerald-900/60 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
                />
                <p className="text-[11px] text-muted-foreground italic">
                  * Sertakan tanda vital, hasil lab relevan, dan daftar obat yang sedang dikonsumsi/diresepkan dokter.
                </p>
              </div>

              {/* AI Trigger Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={generateAI}
                  disabled={loadingAI}
                  className="w-full h-11 bg-gradient-to-r from-primary to-sky-600 hover:from-primary/90 hover:to-sky-600/90 text-primary-foreground font-semibold shadow-md shadow-primary/20"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Menganalisis DRP & Panduan PCNE...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      <span>✨ Generate Assessment & Plan dengan AI</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Assessment & Plan Editors + References */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="border-border/80 shadow-subtle">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Rekomendasi Farmasi Klinis (PCNE v9.00)</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Assessment (A) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-violet-600 text-white font-bold text-xs">
                      A
                    </span>
                    <Label htmlFor="assessment" className="text-xs font-semibold uppercase tracking-wider text-violet-900 dark:text-violet-300">
                      Assessment (Problem & Cause PCNE)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(assessment, "Assessment")}
                    aria-label="Salin Assessment"
                  >
                    {copiedField === "Assessment" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>{copiedField === "Assessment" ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
                <Textarea
                  id="assessment"
                  rows={5}
                  placeholder="Hasil analisis masalah terapi obat (DRP) akan muncul di sini dan dapat Anda sesuaikan..."
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="bg-card border-violet-200/80 dark:border-violet-900/60 focus-visible:border-violet-600 focus-visible:ring-violet-600/20 leading-relaxed"
                />
              </div>

              {/* Plan (P) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-indigo-600 text-white font-bold text-xs">
                      P
                    </span>
                    <Label htmlFor="plan" className="text-xs font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                      Plan (Intervensi & Rekomendasi Apoteker)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(plan, "Plan")}
                    aria-label="Salin Plan"
                  >
                    {copiedField === "Plan" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>{copiedField === "Plan" ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
                <Textarea
                  id="plan"
                  rows={5}
                  placeholder="Saran intervensi klinis kepada dokter atau konseling pasien akan muncul di sini..."
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="bg-card border-indigo-200/80 dark:border-indigo-900/60 focus-visible:border-indigo-600 focus-visible:ring-indigo-600/20 leading-relaxed"
                />
              </div>

              {/* References Preview Card */}
              {references && references.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Referensi Literatur Klinis Terlampir
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start justify-between gap-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-xs"
                      >
                        <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors leading-relaxed">
                          {ref.title}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary shrink-0">
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

