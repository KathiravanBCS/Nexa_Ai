-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Threads table
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NULL,
  title TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for threads table
DO $$ 
BEGIN
  CREATE POLICY "Users can view their own threads" 
  ON public.threads FOR SELECT 
  USING (auth.uid()::text = user_id OR user_id IS NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can insert their own threads" 
  ON public.threads FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can update their own threads" 
  ON public.threads FOR UPDATE 
  USING (auth.uid()::text = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can delete their own threads" 
  ON public.threads FOR DELETE 
  USING (auth.uid()::text = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policies for messages table
DO $$ 
BEGIN
  CREATE POLICY "Users can view messages from their threads" 
  ON public.messages FOR SELECT 
  USING (thread_id IN (SELECT id FROM public.threads WHERE user_id = auth.uid()::text OR user_id IS NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can insert messages to their threads" 
  ON public.messages FOR INSERT 
  WITH CHECK (thread_id IN (SELECT id FROM public.threads WHERE user_id = auth.uid()::text OR user_id IS NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS threads_user_id_idx ON public.threads(user_id);
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON public.messages(thread_id);