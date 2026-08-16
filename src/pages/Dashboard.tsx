import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link } from "react-router-dom"
import { Plus, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface Patient {
  id: string
  user_id: string // creator
  nama: string
  no_rm: string
  created_at?: string
  is_active?: boolean
  admitted_at?: string
}

export default function Dashboard() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  
  const [nama, setNama] = useState("")
  const [noRm, setNoRm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPatients = async () => {
    if (!session?.user.id) return
    setLoading(true)
    
    // Fetch patients through the patient_handlers junction table
    const { data, error } = await supabase
      .from('patient_handlers')
      .select(`
        patient_id,
        patients (
          id,
          user_id,
          nama,
          no_rm,
          created_at,
          is_active,
          admitted_at
        )
      `)
      .eq('user_id', session.user.id)
      
    if (!error && data) {
      // Extract the patients from the join and filter only active ones
      const activePatients = data
        .map(h => h.patients as unknown as Patient)
        .filter(p => p && p.is_active !== false)
        
      setPatients(activePatients)
    } else if (error) {
      console.error("Error fetching patients:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPatients()
  }, [session?.user.id])

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama || !noRm || !session?.user.id) return
    setIsSubmitting(true)
    
    try {
      // 1. Check if patient RM exists
      const { data: existingPatients, error: searchError } = await supabase
        .from("patients")
        .select("*")
        .eq("no_rm", noRm)
        .limit(1)
        
      if (searchError) throw searchError
      
      let patientIdToHandle = ""

      if (existingPatients && existingPatients.length > 0) {
        // Old Patient
        const patient = existingPatients[0]
        patientIdToHandle = patient.id
        
        // If inactive, reactivate and update admitted_at
        if (!patient.is_active) {
          const { error: updateError } = await supabase
            .from("patients")
            .update({ 
              is_active: true, 
              admitted_at: new Date().toISOString() 
            })
            .eq("id", patient.id)
            
          if (updateError) throw updateError
        }
      } else {
        // New Patient
        const { data: newPatient, error: insertError } = await supabase
          .from("patients")
          .insert({
            user_id: session.user.id,
            nama: nama,
            no_rm: noRm,
            is_active: true,
            admitted_at: new Date().toISOString()
          })
          .select()
          .single()
          
        if (insertError) throw insertError
        if (newPatient) {
          patientIdToHandle = newPatient.id
        }
      }
      
      // 2. Add to patient_handlers (upsert to ignore unique constraint error if already handling)
      if (patientIdToHandle) {
        const { error: handlerError } = await supabase
          .from("patient_handlers")
          .upsert({
            patient_id: patientIdToHandle,
            user_id: session.user.id
          }, { onConflict: 'patient_id, user_id' })
          
        if (handlerError) throw handlerError
      }
      
      setOpen(false)
      setNama("")
      setNoRm("")
      fetchPatients()
      
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Gagal",
        description: err.message || "Terjadi kesalahan saat menambahkan pasien.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDischarge = async (patientId: string, patientName: string) => {
    if (!confirm(`Apakah Anda yakin ingin memulangkan pasien ${patientName}? Ini akan menghapusnya dari dashboard semua apoteker.`)) {
      return
    }
    
    try {
      // Set patient to inactive
      const { error: updateError } = await supabase
        .from("patients")
        .update({ is_active: false })
        .eq("id", patientId)
        
      if (updateError) throw updateError
      
      // Remove all handlers for this patient
      const { error: handlerError } = await supabase
        .from("patient_handlers")
        .delete()
        .eq("patient_id", patientId)
        
      if (handlerError) throw handlerError
      
      toast({
        title: "Pasien Pulang",
        description: `${patientName} telah berhasil dipulangkan.`,
      })
      
      fetchPatients()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Gagal",
        description: "Gagal memulangkan pasien.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Daftar Pasien</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Tambah Pasien</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pasien</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Pasien</Label>
                <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Tn. Irawan" required />
                <p className="text-xs text-muted-foreground">Jika RM sudah terdaftar, sistem akan menggunakan nama asli pasien secara otomatis.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_rm">No Rekam Medis</Label>
                <Input id="no_rm" value={noRm} onChange={(e) => setNoRm(e.target.value)} required />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Menyimpan..." : "Simpan & Tambahkan ke Dashboard"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pasien</TableHead>
              <TableHead>No RM</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">Belum ada pasien yang sedang Anda tangani.</TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:underline">
                      {patient.nama}
                    </Link>
                  </TableCell>
                  <TableCell>{patient.no_rm}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/patients/${patient.id}`}>Detail CPPT</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDischarge(patient.id, patient.nama)}>
                      <LogOut className="w-4 h-4 mr-1" /> Pulang
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
