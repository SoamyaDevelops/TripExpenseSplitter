import React, { useState } from 'react';
import { X, User, Phone, FileText, Check, ShieldCheck, Palette } from 'lucide-react';
import { updateUserProfile } from '../lib/supabase';

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) {
  if (!isOpen || !currentUser) return null;

  const [fullName, setFullName] = useState(currentUser.name || currentUser.full_name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatar_color || '#4f46e5');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const colors = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const profileData = {
      full_name: fullName.trim(),
      email: currentUser.email,
      phone: phone.trim(),
      bio: bio.trim(),
      avatar_color: avatarColor
    };

    const res = await updateUserProfile(currentUser.id || currentUser.user_id, profileData);

    setSaving(false);
    if (res.success) {
      setSuccessMsg('Profile updated & synced with Supabase!');
      onProfileUpdated({
        ...currentUser,
        name: fullName.trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar_color: avatarColor
      });
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="avatar-circle"
              style={{ width: '42px', height: '42px', fontSize: '1.1rem', backgroundColor: avatarColor }}
            >
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Your Profile
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Syncs with Supabase profile table
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        {successMsg && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Color Picker */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={14} /> Choose Avatar Color
            </label>
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem' }}>
              {colors.map(c => (
                <div
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: avatarColor === c ? '3px solid white' : 'none',
                    boxShadow: avatarColor === c ? '0 0 0 2px var(--primary)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {avatarColor === c && <Check size={14} color="white" />}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email (Registered Account)</label>
            <input
              type="email"
              className="form-control"
              value={currentUser.email || ''}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">College / Bio Note</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. B.Tech Computer Science 2026"
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Syncing...' : 'Save & Sync Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
