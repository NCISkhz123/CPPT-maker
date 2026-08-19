import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Plus, LogOut, Search, Users, FileText, Loader2, X } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  
  // Add Patient Form State
  const [nama, setNama] = useState("")
  const [noRm, setNoRm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Discharge Patient Dialog State
  const [dischargePatient, setDischargePatient] = useState<Patient | null>(null)
  const [isDischarging, setIsDischarging] = useState(false)

  const fetchPatients = async () => {
    if (!session?.user.id) return
    setLoading(true)
    
    // Fetch patients through the patient_handlers junction table
    const { data, error } = await supabase
      .from("patient_handlers")
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
      .eq("user_id", session.user.id)
      
    if (!error && data) {
      // Extract the patients from the join and filter only active ones
      const activePatients = data
        .map((h) => h.patients as unknown as Patient)
        .filter((p) => p && p.is_active !== false)
        .sort((a, b) => {
          const dateA = new Date(a.admitted_at || a.created_at || 0).getTime()
          const dateB = new Date(b.admitted_at || b.created_at || 0).getTime()
          return dateB - dateA
        })
        
      setPatients(activePatients)
    } else if (error) {
      console.error("Error fetching patients:", error)
      toast({
        title: "Gagal Mengambil Data",
        description: "Tidak dapat memuat daftar pasien aktif.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPatients()
  }, [session?.user.id])

  // Filtered patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients
    const query = searchQuery.toLowerCase().trim()
    return patients.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query)
    )
  }, [patients, searchQuery])

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim() || !noRm.trim() || !session?.user.id) return
    setIsSubmitting(true)
    
    try {
      // 1. Check if patient RM exists
      const { data: existingPatients, error: searchError } = await supabase
        .from("patients")
        .select("*")
        .eq("no_rm", noRm.trim())
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
            nama: nama.trim(),
            no_rm: noRm.trim(),
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
      
      // 2. Add to patient_handlers
      if (patientIdToHandle) {
        const { error: handlerError } = await supabase
          .from("patient_handlers")
          .upsert({
            patient_id: patientIdToHandle,
            user_id: session.user.id
          }, { onConflict: "patient_id, user_id" })
          
        if (handlerError) throw handlerError
      }
      
      setOpen(false)
      setNama("")
      setNoRm("")
      toast({
        title: "Pasien Ditambahkan",
        description: `Pasien ${nama} (${noRm}) berhasil ditambahkan ke dashboard.`,
      })
      fetchPatients()
      
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Gagal Menambahkan Pasien",
        description: err.message || "Terjadi kesalahan saat menambahkan pasien.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDischarge = async () => {
    if (!dischargePatient) return
    setIsDischarging(true)
    
    try {
      // Set patient to inactive
      const { error: updateError } = await supabase
        .from("patients")
        .update({ is_active: false })
        .eq("id", dischargePatient.id)
        
      if (updateError) throw updateError
      
      // Remove all handlers for this patient
      const { error: handlerError } = await supabase
        .from("patient_handlers")
        .delete()
        .eq("patient_id", dischargePatient.id)
        
      if (handlerError) throw handlerError
      
      toast({
        title: "Pasien Telah Dipulangkan",
        description: `${dischargePatient.nama} berhasil dipulangkan dari sistem rawat inap.`,
      })
      
      setDischargePatient(null)
      fetchPatients()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Gagal Memulangkan Pasien",
        description: "Terjadi gangguan saat memproses pemulangan pasien.",
        variant: "destructive"
      })
    } finally {
      setIsDischarging(false)
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

  return (
    <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Daftar Pasien
          </h1>
        </div>

        {/* Add Patient Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Tambah Pasien</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pasien Baru</DialogTitle>
              <DialogDescription>
                Masukkan No. Rekam Medis (RM) dan nama pasien untuk memulai pemantauan terapi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="no_rm">No. Rekam Medis (RM)</Label>
                <Input
                  id="no_rm"
                  value={noRm}
                  onChange={(e) => setNoRm(e.target.value)}
                  placeholder="Contoh: 12-34-56"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Jika No. RM sudah terdaftar sebelumnya, data riwayat pasien akan otomatis diaktifkan kembali.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Pasien</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Tn. Bambang Irawan"
                  required
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan & Tambahkan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>


      {/* Main Content Area */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari pasien berdasarkan nama atau No. RM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 bg-background h-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-muted-foreground sm:text-right">
            Menampilkan <span className="font-bold text-foreground tabular-nums">{filteredPatients.length}</span> dari{" "}
            <span className="tabular-nums">{patients.length}</span> pasien
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nama Pasien</TableHead>
                <TableHead>No. Rekam Medis</TableHead>
                <TableHead className="text-right">Aksi Layanan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-medium">Memuat data pasien...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-foreground text-base">
                        {searchQuery ? "Pasien Tidak Ditemukan" : "Belum Ada Pasien Aktif"}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ditemukan pasien yang sesuai dengan kata kunci "${searchQuery}".`
                          : "Tambahkan pasien baru untuk mulai membuat Catatan Perkembangan Pasien Terintegrasi (CPPT)."}
                      </p>
                      {searchQuery ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="mt-2"
                        >
                          Reset Pencarian
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setOpen(true)} className="mt-2">
                          <Plus className="w-4 h-4 mr-1.5" /> Tambah Pasien Sekarang
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="group">
                    <TableCell>
                      <Link
                        to={`/patients/${patient.id}`}
                        className="flex items-center gap-3 group-hover:text-primary transition-colors"
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                          {getInitials(patient.nama)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {patient.nama}
                          </span>
                          <span className="text-xs text-muted-foreground md:hidden tabular-nums">
                            RM: {patient.no_rm}
                          </span>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium border border-border/60 tabular-nums">
                        {patient.no_rm}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="default" size="sm" asChild className="h-8 shadow-xs">
                          <Link to={`/patients/${patient.id}`}>
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span>Detail CPPT</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDischargePatient(patient)}
                          className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label={`Pulangkan pasien ${patient.nama}`}
                        >
                          <LogOut className="w-3.5 h-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Pulang</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Discharge Confirmation Modal */}
      <Dialog
        open={Boolean(dischargePatient)}
        onOpenChange={(isOpen) => !isOpen && setDischargePatient(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <LogOut className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Konfirmasi Pemulangan Pasien</DialogTitle>
            <DialogDescription className="text-center">
              Apakah Anda yakin ingin memulangkan pasien{" "}
              <strong className="text-foreground">{dischargePatient?.nama}</strong> (No. RM:{" "}
              <span className="font-mono text-foreground">{dischargePatient?.no_rm}</span>)?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50 text-center">
            Pasien akan ditandai non-aktif dan diarsipkan dari dashboard rawat inap semua apoteker. Riwayat CPPT tetap tersimpan.
          </p>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDischargePatient(null)}
              disabled={isDischarging}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDischarge}
              disabled={isDischarging}
              className="flex-1"
            >
              {isDischarging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                "Pulangkan Pasien"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

