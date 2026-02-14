import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nnsclwonednyhmgxlnly.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uc2Nsd29uZWRueWhtZ3hsbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDgxMDcsImV4cCI6MjA4NjYyNDEwN30.R0vHRT0aztiqgEucEOoK01mQCfuZRwuz6r_G-h9dnbQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
