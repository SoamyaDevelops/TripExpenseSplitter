import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Compass, LogIn, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              avatar_color: '#4f46e5'
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          onLoginSuccess(data.user);
        } else {
          setSuccessMsg('Account created! Please check your email for the confirmation link to sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }} className="animate-pop-in">
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--primary)',
            color: 'white',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)',
            marginBottom: '0.75rem'
          }}>
            <Compass size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            TripSplit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            College Friends Expense & Settlement Tracker
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {/* Toggle Switch */}
          <div className="tab-navigation" style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`tab-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          {errorMsg && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              lineHeight: '1.4'
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              color: 'var(--success)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">College Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="your.name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In to TripSplit')}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          <ShieldCheck size={14} /> Powered by Supabase Authentication
        </p>
      </div>
    </div>
  );
}
