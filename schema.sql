-- ====================================================================
-- TRIP SPLIT: SUPABASE DATABASE SETUP SCRIPT
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE (Stores user display info)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE TRIP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    avatar_color TEXT DEFAULT '#4f46e5',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_trip_user UNIQUE (trip_id, user_id)
);

-- 5. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    paid_by UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE EXPENSE SPLITS TABLE (Equal splits for each participant)
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    CONSTRAINT unique_expense_member UNIQUE (expense_id, member_id)
);

-- 7. CREATE SETTLEMENTS TABLE (Recorded debt repayments)
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    from_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
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
-- Enabling smooth access for both authenticated users & anon guest demo mode
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated users and public anon keys
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow user insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trips" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "Allow public delete trips" ON public.trips FOR DELETE USING (true);

CREATE POLICY "Allow public select trip_members" ON public.trip_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert trip_members" ON public.trip_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trip_members" ON public.trip_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete trip_members" ON public.trip_members FOR DELETE USING (true);

CREATE POLICY "Allow public select expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Allow public select expense_splits" ON public.expense_splits FOR SELECT USING (true);
CREATE POLICY "Allow public insert expense_splits" ON public.expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expense_splits" ON public.expense_splits FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expense_splits" ON public.expense_splits FOR DELETE USING (true);

CREATE POLICY "Allow public select settlements" ON public.settlements FOR SELECT USING (true);
CREATE POLICY "Allow public insert settlements" ON public.settlements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete settlements" ON public.settlements FOR DELETE USING (true);

-- ====================================================================
-- SAMPLE DATA (Goa College Trip Demo)
-- ====================================================================
DO $$
DECLARE
    v_trip_id UUID;
    v_m1 UUID := gen_random_uuid();
    v_m2 UUID := gen_random_uuid();
    v_m3 UUID := gen_random_uuid();
    v_m4 UUID := gen_random_uuid();
    v_exp1 UUID := gen_random_uuid();
    v_exp2 UUID := gen_random_uuid();
    v_exp3 UUID := gen_random_uuid();
BEGIN
    -- Check if Goa trip exists, create if not
    SELECT id INTO v_trip_id FROM public.trips WHERE code = 'GOA2026' LIMIT 1;
    
    IF v_trip_id IS NULL THEN
        INSERT INTO public.trips (id, title, description, code)
        VALUES (gen_random_uuid(), 'Goa Beach Bash 2026', 'College reunion road trip to North Goa!', 'GOA2026')
        RETURNING id INTO v_trip_id;

        -- Insert Members
        INSERT INTO public.trip_members (id, trip_id, name, email, avatar_color) VALUES
        (v_m1, v_trip_id, 'Aarav Sharma', 'aarav@college.edu', '#4f46e5'),
        (v_m2, v_trip_id, 'Priya Patel', 'priya@college.edu', '#059669'),
        (v_m3, v_trip_id, 'Rohan Verma', 'rohan@college.edu', '#d97706'),
        (v_m4, v_trip_id, 'Ananya Sen', 'ananya@college.edu', '#e11d48');

        -- Insert Expense 1: Beach Villa Stay paid by Aarav (₹12,000 split 4 ways = ₹3,000 each)
        INSERT INTO public.expenses (id, trip_id, title, amount, paid_by, category)
        VALUES (v_exp1, v_trip_id, 'Beach Villa Airbnb (3 Nights)', 12000, v_m1, 'Stay');

        INSERT INTO public.expense_splits (expense_id, member_id, amount) VALUES
        (v_exp1, v_m1, 3000), (v_exp1, v_m2, 3000), (v_exp1, v_m3, 3000), (v_exp1, v_m4, 3000);

        -- Insert Expense 2: Seafood Dinner paid by Priya (₹4,000 split 4 ways = ₹1,000 each)
        INSERT INTO public.expenses (id, trip_id, title, amount, paid_by, category)
        VALUES (v_exp2, v_trip_id, 'Thalassa Dinner & Drinks', 4000, v_m2, 'Food');

        INSERT INTO public.expense_splits (expense_id, member_id, amount) VALUES
        (v_exp2, v_m1, 1000), (v_exp2, v_m2, 1000), (v_exp2, v_m3, 1000), (v_exp2, v_m4, 1000);

        -- Insert Expense 3: Car Rental & Fuel paid by Rohan (₹6,000 split 4 ways = ₹1,500 each)
        INSERT INTO public.expenses (id, trip_id, title, amount, paid_by, category)
        VALUES (v_exp3, v_trip_id, 'Self Drive SUV + Petrol', 6000, v_m3, 'Transport');

        INSERT INTO public.expense_splits (expense_id, member_id, amount) VALUES
        (v_exp3, v_m1, 1500), (v_exp3, v_m2, 1500), (v_exp3, v_m3, 1500), (v_exp3, v_m4, 1500);

    END IF;
END $$;
