import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, Terminal } from 'lucide-react';

export default function SqlScriptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const sqlCode = `-- ====================================================================
-- TRIP SPLIT: SUPABASE DATABASE SETUP SCRIPT
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE
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

-- 6. CREATE EXPENSE SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    CONSTRAINT unique_expense_member UNIQUE (expense_id, member_id)
);

-- 7. CREATE SETTLEMENTS TABLE
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
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow user insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trips" ON public.trips FOR UPDATE USING (true);

CREATE POLICY "Allow public select trip_members" ON public.trip_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert trip_members" ON public.trip_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trip_members" ON public.trip_members FOR UPDATE USING (true);

CREATE POLICY "Allow public select expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Allow public select expense_splits" ON public.expense_splits FOR SELECT USING (true);
CREATE POLICY "Allow public insert expense_splits" ON public.expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expense_splits" ON public.expense_splits FOR UPDATE USING (true);

CREATE POLICY "Allow public select settlements" ON public.settlements FOR SELECT USING (true);
CREATE POLICY "Allow public insert settlements" ON public.settlements FOR INSERT WITH CHECK (true);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Supabase SQL Setup Script
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                One-click script for your Supabase SQL Editor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div style={{
          background: 'var(--bg-subtle)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          lineHeight: '1.5'
        }}>
          <strong>Quick Setup Steps:</strong>
          <ol style={{ marginLeft: '1.2rem', marginTop: '0.3rem' }}>
            <li>Click <strong>"Copy SQL Script"</strong> below.</li>
            <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>Supabase SQL Editor <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
            <li>Click <strong>New Query</strong>, paste the script, and press <strong>RUN</strong>!</li>
          </ol>
        </div>

        {/* Code block */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <button
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              zIndex: 10
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
          </button>

          <pre style={{
            background: '#0f172a',
            color: '#f8fafc',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '0.775rem',
            maxHeight: '280px',
            overflowY: 'auto',
            lineHeight: '1.5'
          }}>
            <code>{sqlCode}</code>
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            File created at: <code>schema.sql</code>
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
