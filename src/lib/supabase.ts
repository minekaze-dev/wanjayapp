import { createClient } from '@supabase/supabase-js';

// Get keys from environment variables or use the provided ones as fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pgdqepdyvsxeurwpjsgv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZHFlcGR5dnN4ZXVyd3Bqc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzQwNjMsImV4cCI6MjA5OTk1MDA2M30.A3Wu3jAABolXfSzwLmA6mWewR3CzIY_nsU0YUGawluM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
