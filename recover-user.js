import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54331';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'apoteker@cppt.com',
    password: 'password123',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User recreated successfully:', data.user.id);
  }
}

main();
