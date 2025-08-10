-- Migration: Add claim_comments and claim_attachments tables
-- Timestamp: 20250726020000

-- claim_comments table
CREATE TABLE IF NOT EXISTS public.claim_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.claim_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_comments" ON public.claim_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_insert_comments" ON public.claim_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- claim_attachments table
CREATE TABLE IF NOT EXISTS public.claim_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.claim_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_attachments" ON public.claim_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_insert_attachments" ON public.claim_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 