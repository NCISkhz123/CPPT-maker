import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface Patient {
  id: string
  user_id: string
  nama: string
  no_rm: string
  created_at?: string
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
    setLoading(true)
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      
    if (!error && data) {
      setPatients(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama || !noRm) return
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from("patients")
      .insert({
        user_id: session?.user.id,
        nama,
        no_rm: noRm
      })
      
    setIsSubmitting(false)
    if (!error) {
      setOpen(false)
      setNama("")
      setNoRm("")
      fetchPatients()
    } else {
      console.error(error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menambahkan pasien.",
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
              <DialogTitle>Tambah Pasien Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Pasien</Label>
                <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_rm">No Rekam Medis</Label>
                <Input id="no_rm" value={noRm} onChange={(e) => setNoRm(e.target.value)} required />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Menyimpan..." : "Simpan"}
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
                <TableCell colSpan={3} className="text-center py-4">Belum ada pasien</TableCell>
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
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/patients/${patient.id}`}>Detail</Link>
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
