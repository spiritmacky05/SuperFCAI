-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table (Public table for app-level user data)
-- Note: If using Supabase Auth, you might want to link this to auth.users via a trigger,
-- but for this standalone seed script, we'll create a public users table.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    params JSONB NOT NULL,
    result TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Knowledge Base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('provision', 'interpretation', 'correction')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Note: These are permissive policies for development. 
-- In production, you should restrict these based on auth.uid().

-- Users: Allow read/write to everyone (for dev) or restrict to owner
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.users FOR UPDATE USING (true);

-- Reports: Allow read/write to everyone (for dev)
CREATE POLICY "Enable read access for all reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all reports" ON public.reports FOR INSERT WITH CHECK (true);

-- Knowledge Base: Allow read/write to everyone (for dev)
CREATE POLICY "Enable read access for all knowledge" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all knowledge" ON public.knowledge_base FOR INSERT WITH CHECK (true);

-- Seed Data: Users
INSERT INTO public.users (email, name, password, role)
VALUES 
    ('admin@bfp.gov.ph', 'Super Admin', 'admin123', 'admin'),
    ('inspector@bfp.gov.ph', 'Chief Inspector', 'inspector123', 'pro'),
    ('owner@business.com', 'Business Owner', 'owner123', 'free')
ON CONFLICT (email) DO NOTHING;

-- Seed Data: Knowledge Base
INSERT INTO public.knowledge_base (title, content, category)
VALUES 
    ('Section 10.2.5.2 - Means of Egress', 'Every building or structure, new or old, designed for human occupancy shall be provided with exits sufficient to permit the escape of occupants in case of fire or other emergency.', 'provision'),
    ('Section 10.2.6.4 - Fire Detection', 'Apartment buildings with more than 3 stories or more than 12 living units shall be provided with a fire alarm system.', 'provision'),
    ('Interpretation: Mixed Occupancy', 'When a building contains more than one occupancy, the stricter requirements of the involved occupancies shall apply to the entire building unless separated by fire barriers.', 'interpretation')
ON CONFLICT DO NOTHING;

-- Seed Data: Reports (Sample)
INSERT INTO public.reports (user_email, params, result)
VALUES 
    ('owner@business.com', '{"establishmentType": "Business", "area": "150", "stories": "1"}', '# Fire Safety Assessment\n\n**Establishment:** Business\n**Area:** 150 sqm\n\n## Requirements\n1. Portable Fire Extinguishers (1 per 200 sqm)\n2. Emergency Lights\n3. Exit Signs')
ON CONFLICT DO NOTHING;
