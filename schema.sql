-- ====================================================================
-- TRIP SPLIT: COMPLETE SUPABASE DATABASE SETUP SCRIPT (WITH VALID UUIDs)
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    bio TEXT,
    avatar_color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- 4. CREATE GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_color TEXT DEFAULT '#4f46e5',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE TRIP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    avatar_color TEXT DEFAULT '#4f46e5',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    paid_by UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE EXPENSE SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL
);

-- 10. CREATE SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    from_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CREATE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.trip_members(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_system_event BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON USER SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_color)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_color', '#4f46e5')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow user insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow user update profiles" ON public.profiles;
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow user insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select friendships" ON public.friendships;
DROP POLICY IF EXISTS "Allow public insert friendships" ON public.friendships;
DROP POLICY IF EXISTS "Allow public update friendships" ON public.friendships;
DROP POLICY IF EXISTS "Allow public delete friendships" ON public.friendships;
CREATE POLICY "Allow public select friendships" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "Allow public insert friendships" ON public.friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update friendships" ON public.friendships FOR UPDATE USING (true);
CREATE POLICY "Allow public delete friendships" ON public.friendships FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select groups" ON public.groups;
DROP POLICY IF EXISTS "Allow public insert groups" ON public.groups;
DROP POLICY IF EXISTS "Allow public update groups" ON public.groups;
DROP POLICY IF EXISTS "Allow public delete groups" ON public.groups;
CREATE POLICY "Allow public select groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert groups" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update groups" ON public.groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete groups" ON public.groups FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select group_members" ON public.group_members;
DROP POLICY IF EXISTS "Allow public insert group_members" ON public.group_members;
DROP POLICY IF EXISTS "Allow public update group_members" ON public.group_members;
DROP POLICY IF EXISTS "Allow public delete group_members" ON public.group_members;
CREATE POLICY "Allow public select group_members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert group_members" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update group_members" ON public.group_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete group_members" ON public.group_members FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public insert trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public update trips" ON public.trips;
CREATE POLICY "Allow public select trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trips" ON public.trips FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select trip_members" ON public.trip_members;
DROP POLICY IF EXISTS "Allow public insert trip_members" ON public.trip_members;
DROP POLICY IF EXISTS "Allow public update trip_members" ON public.trip_members;
CREATE POLICY "Allow public select trip_members" ON public.trip_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert trip_members" ON public.trip_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trip_members" ON public.trip_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public delete expenses" ON public.expenses;
CREATE POLICY "Allow public select expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select expense_splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Allow public insert expense_splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Allow public update expense_splits" ON public.expense_splits;
CREATE POLICY "Allow public select expense_splits" ON public.expense_splits FOR SELECT USING (true);
CREATE POLICY "Allow public insert expense_splits" ON public.expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expense_splits" ON public.expense_splits FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select settlements" ON public.settlements;
DROP POLICY IF EXISTS "Allow public insert settlements" ON public.settlements;
CREATE POLICY "Allow public select settlements" ON public.settlements FOR SELECT USING (true);
CREATE POLICY "Allow public insert settlements" ON public.settlements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public insert chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public select chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
