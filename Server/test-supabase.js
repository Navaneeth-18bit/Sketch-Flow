const { createClient } = require('@supabase/supabase-js');
const url = 'https://hhfxjfppadumbjmvttvr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZnhqZnBwYWR1bWJqbXZ0dHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwOTE0MSwiZXhwIjoyMDg4NDg1MTQxfQ.AzjATORXnKqgcPLTuRPCDIAvgeZfS6UwjAiHDlbU41k';

const supabase = createClient(url, key);

async function run() {
    console.log('Testing Supabase Connection & RLS with Service Role Key');

    // 1. Fetch sessions
    const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .limit(5);
    console.log('Sessions Error:', sessionsError?.message || sessionsError);
    console.log('Sessions Data:', sessions);

    // 2. Fetch teachers
    const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .limit(5);
    console.log('Teachers Error:', teachersError?.message || teachersError);
    console.log('Teachers Data:', teachers);

    // 3. Test insertions with a dummy teacher
    const testuid = 'test-uid-' + Date.now();
    const { data: insertedTeacher, error: insertError } = await supabase
        .from('teachers')
        .insert([
            { teacher_id: testuid, email: 'test@example.com', name: 'Test' }
        ]);
    console.log('Insert Teacher Error:', insertError?.message || insertError);
    console.log('Insert Teacher Data:', insertedTeacher);
}

run();
