-- Pastikan uuid-ossp extension tersedia (biasanya default di Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nama TEXT NOT NULL,
  no_rm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cppt_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add basic policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cppt_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own patients" 
  ON patients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own patients" 
  ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own cppt_records" 
  ON cppt_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own cppt_records" 
  ON cppt_records FOR INSERT WITH CHECK (auth.uid() = user_id);
