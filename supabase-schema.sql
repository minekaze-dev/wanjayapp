-- Supabase Schema for WA-NJAY
-- Run this in your Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Sales')),
  access_code TEXT NOT NULL,
  whatsapp_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (whatsapp_status IN ('connected', 'reconnecting', 'disconnected')),
  last_active TEXT,
  disabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  sales_name TEXT NOT NULL,
  sales_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Pending',
  message TEXT NOT NULL,
  image_url TEXT,
  template_id TEXT,
  repeat TEXT NOT NULL DEFAULT 'Tidak',
  delay TEXT NOT NULL DEFAULT '30-60 detik',
  follow_up_day INTEGER,
  stop_if_replied BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  last_message TEXT NOT NULL,
  time_ago TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  unread BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('reply', 'schedule_created', 'connected', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated/anon requests for simplicity in this setup
-- Since we use custom login (access_code), we allow anon to read/write, 
-- but in a production app, you would tie this to auth.uid()
CREATE POLICY "Allow anon read users" ON public.users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete users" ON public.users FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read schedules" ON public.schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert schedules" ON public.schedules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update schedules" ON public.schedules FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete schedules" ON public.schedules FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read inbox" ON public.inbox FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert inbox" ON public.inbox FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update inbox" ON public.inbox FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete inbox" ON public.inbox FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read activities" ON public.activities FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert activities" ON public.activities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update activities" ON public.activities FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete activities" ON public.activities FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read templates" ON public.templates FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert templates" ON public.templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update templates" ON public.templates FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete templates" ON public.templates FOR DELETE TO anon USING (true);

-- 3. Insert Initial Admin User
-- Silakan gunakan login ini untuk pertama kali masuk
INSERT INTO public.users (name, email, role, access_code, whatsapp_status, last_active)
VALUES ('Admin Master', 'admin@wa-njay.com', 'Admin', 'admin123', 'disconnected', 'Baru saja');
