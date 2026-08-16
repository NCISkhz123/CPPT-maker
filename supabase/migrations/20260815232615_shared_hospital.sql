-- 1. Update patients table
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create patient_handlers table
CREATE TABLE IF NOT EXISTS patient_handlers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, user_id)
);

-- 3. Enable RLS on patient_handlers
ALTER TABLE patient_handlers ENABLE ROW LEVEL SECURITY;

-- 4. Update RLS Policies for Shared Hospital Mode

-- Drop old policies that restricted visibility to owner
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Users can only insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can only see their own cppt_records" ON cppt_records;
DROP POLICY IF EXISTS "Users can only insert their own cppt_records" ON cppt_records;

-- New Policies for Patients: Anyone authenticated can SELECT and INSERT
CREATE POLICY "Authenticated users can see all patients" 
  ON patients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patients" 
  ON patients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" 
  ON patients FOR UPDATE TO authenticated USING (true);

-- New Policies for CPPT Records: Anyone authenticated can SELECT and INSERT
CREATE POLICY "Authenticated users can see all cppt_records" 
  ON cppt_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cppt_records" 
  ON cppt_records FOR INSERT TO authenticated WITH CHECK (true);

-- New Policies for Patient Handlers: Users can see handlers matching their own ID, but can insert for themselves
CREATE POLICY "Users can see their own patient handlers"
  ON patient_handlers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own patient handlers"
  ON patient_handlers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own patient handlers"
  ON patient_handlers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Optional: Allow users to delete handlers for a patient they handle when discharging
DROP POLICY IF EXISTS "Users can delete their own patient handlers" ON patient_handlers;
DROP POLICY IF EXISTS "Authenticated users can delete any patient handlers" ON patient_handlers;

CREATE POLICY "Users can delete handlers for their handled patients"
  ON patient_handlers FOR DELETE TO authenticated 
  USING (patient_id IN (SELECT patient_id FROM patient_handlers WHERE user_id = auth.uid()));

-- Grant privileges
GRANT ALL ON TABLE public.patient_handlers TO authenticated, anon, service_role;

-- 5. Data Migration: Populate patient_handlers for existing patients
INSERT INTO patient_handlers (patient_id, user_id, created_at)
SELECT id, user_id, created_at FROM patients
ON CONFLICT (patient_id, user_id) DO NOTHING;
