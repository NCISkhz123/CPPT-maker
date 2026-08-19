import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  ArrowLeft,
  Calendar,
  FileText,
  ExternalLink,
  BookOpen,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Patient } from "./Dashboard"

export interface CpptRecord {
  id: string
  patient_id: string
  tanggal: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  created_at?: string
  references?: { title: string; url: string }[] | null
}

export default function PatientDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<CpptRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single()
        
      if (patientError) {
        toast({
          title: "Gagal Mengambil Data",
          description: "Data profil pasien tidak dapat ditemukan.",
          variant: "destructive",
        })
      } else if (patientData) {
        setPatient(patientData)
      }

      const { data: recordsData, error: recordsError } = await supabase
        .from("cppt_records")
        .select("*")
        .eq("patient_id", id)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })

      if (recordsError) {
        toast({
          title: "Gagal Mengambil CPPT",
          description: "Riwayat catatan CPPT tidak dapat dimuat.",
          variant: "destructive",
        })
      } else if (recordsData) {
        setRecords(recordsData)
      }

      setLoading(false)
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="w-full py-16 px-4 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat data rekam medis pasien...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="w-full py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Pasien Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Data pasien tidak ditemukan atau telah dihapus dari sistem.
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Kembali ke Daftar Pasien</span>
          </Link>
        </Button>

        <Button asChild size="default" className="shadow-sm">
          <Link to={`/patients/${id}/new-cppt`}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Buat CPPT Baru</span>
          </Link>
        </Button>
      </div>

      {/* Patient Profile Hero Card */}
      <Card className="border-border/80 shadow-sm bg-card/90">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                {getInitials(patient.nama)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {patient.nama}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Rawat Aktif
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <strong className="font-semibold text-foreground/80">No. RM:</strong>
                    <span className="bg-muted px-2 py-0.5 rounded border border-border/60 tabular-nums">
                      {patient.no_rm}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>Masuk: {formatDate(patient.admitted_at || patient.created_at)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
              <span className="text-xs text-muted-foreground font-medium">Total Rekam CPPT</span>
              <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {records.length} <span className="text-xs font-normal text-muted-foreground">catatan</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPPT History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Riwayat Catatan Perkembangan (SOAP)</span>
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {records.length} riwayat ditemukan
          </span>
        </div>

        {records.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-muted/20">
            <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Belum Ada Catatan CPPT</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Pasien ini belum memiliki catatan perkembangan terintegrasi. Buat catatan SOAP pertama dengan asisten AI PCNE.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link to={`/patients/${id}/new-cppt`}>
                  <Plus className="w-4 h-4 mr-1.5" /> Buat CPPT Sekarang
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {records.map((record, index) => (
              <Card key={record.id} className="border-border/80 shadow-subtle overflow-hidden">
                {/* Record Header */}
                <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold tabular-nums">
                        #{records.length - index}
                      </span>
                      <CardTitle className="text-base font-semibold">
                        {formatDate(record.tanggal)}
                      </CardTitle>
                    </div>
                    {record.created_at && (
                      <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Dicatat pada: {new Date(record.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </CardHeader>

                {/* SOAP Content Blocks */}
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* S - Subjektif */}
                  <div className="rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-sky-500 text-white font-bold text-xs">
                        S
                      </span>
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-sky-900 dark:text-sky-200">
                        Subjektif (Keluhan & Riwayat Pasien)
                      </h4>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-7">
                      {record.subjective || <span className="italic text-muted-foreground">Tidak ada catatan subjektif.</span>}
                    </p>
                  </div>

                  {/* O - Objektif */}
                  <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-emerald-600 text-white font-bold text-xs">
                        O
                      </span>
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                        Objektif (Pemeriksaan Fisik, Lab, & Terapi Obat Saat Ini)
                      </h4>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-7">
                      {record.objective || <span className="italic text-muted-foreground">Tidak ada catatan objektif.</span>}
                    </p>
                  </div>

                  {/* A - Assessment */}
                  <div className="rounded-xl border border-violet-200/80 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-violet-600 text-white font-bold text-xs">
                        A
                      </span>
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-violet-900 dark:text-violet-200">
                        Assessment (Analisis Masalah Terapi / DRP Berbasis PCNE)
                      </h4>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-7">
                      {record.assessment || <span className="italic text-muted-foreground">Tidak ada catatan assessment.</span>}
                    </p>
                  </div>

                  {/* P - Plan */}
                  <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-indigo-600 text-white font-bold text-xs">
                        P
                      </span>
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                        Plan (Rencana Intervensi & Rekomendasi Farmakoterapi)
                      </h4>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-7">
                      {record.plan || <span className="italic text-muted-foreground">Tidak ada catatan plan.</span>}
                    </p>
                  </div>

                  {/* References Section */}
                  {record.references && record.references.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/70">
                      <div className="flex items-center gap-2 mb-2.5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-primary">
                          Referensi Ilmiah & Panduan Klinis Terkait
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pl-6">
                        {record.references.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-primary/40 transition-all text-xs"
                          >
                            <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors leading-relaxed">
                              {ref.title}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary shrink-0">
                              <span>Buka Sumber</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

