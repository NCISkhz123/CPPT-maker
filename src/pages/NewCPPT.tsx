import { useState } from 'react';
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

export default function NewCPPT() {
  const { id: patient_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [tanggal, setTanggal] = useState(getLocalDate());
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Anda adalah asisten apoteker. Diberikan data Subjective dan Objective pasien, buatlah Assessment dan Plan menggunakan metode PCNE.
SANGAT PENTING: Format output harus sesuai contoh berikut:
P2.1 - Kejadian obat yang merugikan mungkin terjadi
Pasien mengalami efek samping merugikan berupa mual dan pusing yang dicurigai akibat akumulasi Levofloxacin.

Kembalikan respon hanya dalam bentuk JSON murni tanpa markdown blocks, dengan struktur:
{
  "assessment": "string",
  "plan": "string"
}

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
          plan
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
          <Label htmlFor="subjective">Subjective (S)</Label>
          <Textarea 
            id="subjective" 
            rows={4}
            placeholder="Keluhan pasien..."
            value={subjective} 
            onChange={(e) => setSubjective(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objective">Objective (O)</Label>
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
          <Label htmlFor="assessment">Assessment (A)</Label>
          <Textarea 
            id="assessment" 
            rows={4}
            placeholder="Assessment (Bisa diedit)..."
            value={assessment} 
            onChange={(e) => setAssessment(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan (P)</Label>
          <Textarea 
            id="plan" 
            rows={4}
            placeholder="Plan (Bisa diedit)..."
            value={plan} 
            onChange={(e) => setPlan(e.target.value)} 
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? 'Menyimpan...' : 'Simpan CPPT'}
          </Button>
        </div>
      </div>
    </div>
  );
}
