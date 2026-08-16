import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKey } from '@/lib/aiConfig';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

export default function NewCPPT() {
  const { id: patient_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Tersalin",
      description: `${fieldName} berhasil disalin ke clipboard.`,
    });
  };

  const [tanggal, setTanggal] = useState(getLocalDate());
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [references, setReferences] = useState<{title: string, url: string}[] | null>(null);
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [previousRecord, setPreviousRecord] = useState<any>(null);

  useEffect(() => {
    const fetchPreviousRecord = async () => {
      if (!patient_id) return;
      
      // Fetch patient's admission date
      const { data: patientData } = await supabase
        .from('patients')
        .select('admitted_at')
        .eq('id', patient_id)
        .single();
        
      let query = supabase
        .from('cppt_records')
        .select('*')
        .eq('patient_id', patient_id);
        
      if (patientData?.admitted_at) {
        query = query.gte('created_at', patientData.admitted_at);
      }
      
      const { data, error } = await query
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!error && data) {
        setPreviousRecord(data);
      } else {
        setPreviousRecord(null);
      }
    };
    
    fetchPreviousRecord();
  }, [patient_id]);

  const generateAI = async () => {
    setErrorMsg('');
    const apiKey = getApiKey();
    if (!apiKey) {
      setErrorMsg('API Key belum diatur. Silakan ke halaman Settings untuk mengatur API Key Gemini.');
      return;
    }

    if (!subjective || !objective) {
      setErrorMsg('Isi Subjective dan Objective terlebih dahulu.');
      return;
    }

    setLoadingAI(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        tools: [
          {
            googleSearch: {}
          }
        ],
        generationConfig: {
          temperature: 0.0, // Memaksa AI memberikan jawaban yang konsisten dan paling logis
        }
      });

      const globalInstruction = `SANGAT PENTING (ATURAN UMUM):
1. Di dalam pedoman apoteker klinis, data Objective mencakup "Obat yang sedang digunakan / terapi saat ini". Oleh karena itu, jika Anda melihat daftar obat di data Objective, evaluasilah obat tersebut sebagai TERAPI SAAT INI yang diberikan oleh dokter. Jangan otomatis menyimpulkan bahwa terapi tersebut "telah gagal" (misalnya: "TD masih tinggi padahal sudah minum obat X"), melainkan evaluasilah apakah pemilihan obat tersebut (terapi saat ini) sudah TEPAT untuk kondisi pasien saat ini.
2. JANGAN mencampuradukkan kondisi yang sudah diterapi dengan tepat ke dalam poin masalah (kode C atau P). Jika sebuah penyakit (misal: hipertensi) sudah mendapat obat yang tepat, JANGAN masukkan ke dalam poin "Pengobatan tidak diberikan" hanya untuk sekadar dibahas. Fokuskan poin masalah (kode C/P) HANYA pada kondisi yang bermasalah atau belum mendapat obat (misal: TG tinggi belum ada obatnya). Kondisi yang sudah mendapat terapi tepat bisa dimasukkan ke dalam Plan (I0.1 Tanpa Intervensi) atau tidak perlu dijadikan problem utama.
3. ETIKA INTERVENSI: Jika Anda merekomendasikan penambahan terapi baru pada bagian Plan, sebutkan NAMA GOLONGAN OBATNYA SAJA (misalnya: "Analgetik" atau "Obat penurun lipid golongan Fibrat"). DILARANG KERAS meresepkan nama obat spesifik beserta dosisnya (misalnya: "Parasetamol 500mg" atau "Simvastatin 20mg") untuk menghormati kewenangan klinis dokter.
4. GAYA BAHASA (NADA BICARA): Pada bagian Plan, gunakan bahasa yang sangat sopan, kolaboratif, dan bersifat menyarankan. JANGAN menggurui atau mendikte dokter. Gunakan frasa penawaran seperti "Mengusulkan untuk mempertimbangkan...", "Dapat didiskusikan kemungkinan...", atau "Mohon pertimbangkan penambahan..." alih-alih kalimat perintah seperti "Harus diberikan..." atau "Wajib diganti...".
5. Pada bagian Assessment (Masalah/Penyebab), Anda BOLEH memberikan lebih dari 1 poin PCNE jika memang ditemukan indikasi multipel.
6. Pada bagian Plan (Intervensi), Anda WAJIB menggunakan format kode poin PCNE Intervensi yang bersesuaian.`;

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
- Tugas Anda adalah mengevaluasi ketepatan resep baru tersebut terhadap kondisi pasien (Subjective/Objective) menggunakan PCNE. JANGAN menganggap obat tersebut sebagai riwayat pengobatan yang sudah gagal.`;

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
- Anda WAJIB memberikan referensi yang relevan untuk **SETIAP** masalah klinis spesifik atau intervensi kritis yang Anda angkat (Misalnya: Jika Anda membahas masalah Lisinopril DAN kontraindikasi Etoricoxib, Anda harus mencantumkan minimal 2 referensi yang mewakili kedua topik tersebut).
- OPTIMASI WAKTU TUNGGU (LATENCY): JANGAN gunakan fitur Google Search jika Anda sudah mengetahui nomor DOI jurnal tersebut secara pasti (langsung berikan format \`https://doi.org/[DOI]\`). 
- KARENA FITUR GOOGLE SEARCH ANDA AKTIF, HANYA lakukan pencarian web JIKA Anda merujuk pada artikel/pedoman/website obat yang tidak memiliki DOI, guna menemukan URL ASLI (Direct Link) yang 100% aktif dan valid.
- Referensi harus berkualitas tinggi HANYA dari jenis literatur berikut: Guideline Medis, SRMA, RCT, atau Cohort Study. (DILARANG MENGGUNAKAN SUMBER LAIN SELAIN 4 JENIS INI).
- Berikan URL LANGSUNG (*direct link*) yang spesifik. JANGAN MENGARANG ATAU BERHALUSINASI URL. Jika ragu, selalu gunakan DOI.
- Jika merujuk ke obat, gunakan link spesifik halamannya di drugs.com (contoh: \`https://www.drugs.com/monograph/amlodipine.html\`).
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
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      setAssessment(parsed.assessment || '');
      setPlan(parsed.plan || '');
      setReferences(parsed.references || null);
      
      toast({
        title: "AI Generation Berhasil",
        description: "Assessment dan Plan telah dibuat.",
      });
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : 'Gagal generate dengan AI.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = async () => {
    if (!patient_id || !session?.user.id) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('cppt_records')
        .insert({
          patient_id,
          user_id: session.user.id,
          tanggal,
          subjective,
          objective,
          assessment,
          plan,
          references
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data CPPT berhasil disimpan.",
      });
      navigate(`/patients/${patient_id}`);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : 'Gagal menyimpan CPPT.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Buat CPPT Baru</h1>
        <Button variant="outline" onClick={() => navigate(`/patients/${patient_id}`)}>
          Kembali
        </Button>
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="tanggal">Tanggal</Label>
          <Input 
            id="tanggal" 
            type="date" 
            value={tanggal} 
            onChange={(e) => setTanggal(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="subjective">Subjective (S)</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopy(subjective, "Subjective")}>
              <Copy className="w-3 h-3 mr-1" /> Salin
            </Button>
          </div>
          <Textarea 
            id="subjective" 
            rows={4}
            placeholder="Keluhan pasien..."
            value={subjective} 
            onChange={(e) => setSubjective(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="objective">Objective (O)</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopy(objective, "Objective")}>
              <Copy className="w-3 h-3 mr-1" /> Salin
            </Button>
          </div>
          <Textarea 
            id="objective" 
            rows={4}
            placeholder="Hasil pemeriksaan, lab, dll..."
            value={objective} 
            onChange={(e) => setObjective(e.target.value)} 
          />
        </div>

        <Button onClick={generateAI} disabled={loadingAI} className="w-full">
          {loadingAI ? 'Menghasilkan...' : '✨ Generate Assessment & Plan dengan AI'}
        </Button>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="assessment">Assessment (A)</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopy(assessment, "Assessment")}>
              <Copy className="w-3 h-3 mr-1" /> Salin
            </Button>
          </div>
          <Textarea 
            id="assessment" 
            rows={4}
            placeholder="Assessment (Bisa diedit)..."
            value={assessment} 
            onChange={(e) => setAssessment(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="plan">Plan (P)</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopy(plan, "Plan")}>
              <Copy className="w-3 h-3 mr-1" /> Salin
            </Button>
          </div>
          <Textarea 
            id="plan" 
            rows={4}
            placeholder="Plan (Bisa diedit)..."
            value={plan} 
            onChange={(e) => setPlan(e.target.value)} 
          />
        </div>

        {references && references.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-primary text-base">Referensi Ilmiah</Label>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
              <ul className="space-y-2">
                {references.map((ref, idx) => (
                  <li key={idx}>
                    <a 
                      href={ref.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-start gap-2"
                    >
                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shrink-0 mt-0.5">Link</span>
                      {ref.title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3 italic">
                * Referensi disuplai oleh AI untuk memvalidasi saran intervensi. Data ini bersifat statis dan akan disimpan secara otomatis.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? 'Menyimpan...' : 'Simpan CPPT'}
          </Button>
        </div>
      </div>
    </div>
  );
}
