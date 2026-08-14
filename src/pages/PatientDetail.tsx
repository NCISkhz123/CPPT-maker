import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"
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
          title: "Error",
          description: "Gagal mengambil data pasien.",
          variant: "destructive"
        })
      } else if (patientData) {
        setPatient(patientData)
      }

      const { data: recordsData, error: recordsError } = await supabase
        .from("cppt_records")
        .select("*")
        .eq("patient_id", id)
        .order("tanggal", { ascending: true })

      if (recordsError) {
        toast({
          title: "Error",
          description: "Gagal mengambil riwayat CPPT.",
          variant: "destructive"
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

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!patient) {
    return <div className="p-8 text-center text-red-500">Pasien tidak ditemukan.</div>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold">Detail Pasien</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Pasien</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Nama:</strong> {patient.nama}</p>
          <p><strong>No RM:</strong> {patient.no_rm}</p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Riwayat CPPT</h2>
        <Button asChild>
          <Link to={`/patients/${id}/new-cppt`}>
            <Plus className="w-4 h-4 mr-2" /> Buat CPPT Baru
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {records.length === 0 ? (
          <p className="text-muted-foreground italic">Belum ada riwayat CPPT untuk pasien ini.</p>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <CardTitle className="text-lg">Tanggal: {new Date(record.tanggal).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">S (Subjektif)</h4>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{record.subjective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">O (Objektif)</h4>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{record.objective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">A (Assessment)</h4>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{record.assessment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">P (Plan)</h4>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{record.plan}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
