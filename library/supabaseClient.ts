import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uumofgotjfbzojlyovst.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bW9mZ290amZiem9qbHlvdnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTcyOTcsImV4cCI6MjA5NTM5MzI5N30.VgXRmrMTvr5KF84jYjqL7gN5AjEd6NCD2G_i_2bhofQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
