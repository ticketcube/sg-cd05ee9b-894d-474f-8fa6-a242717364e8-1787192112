
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ljgglrgqkuvowlwzrtoa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ2dscmdxa3V2b3dsd3pydG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNzIzNjUsImV4cCI6MjA0ODY0ODM2NX0.PdFjyaWH_3ooI6rlPQlV0MJN2OdDWx2Gv5DZJvPVRpQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
