import React, { useState } from 'react';
import { X, Plus, Compass, Hash, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function TripSelector({
  isOpen,
  onClose,
  trips,
  activeTrip,
  onSelectTrip,
  onCreateTrip,
  onJoinTrip
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'join'
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Please enter a trip name');
      return;
    }
    const code = newCode.trim().toUpperCase() || `TRIP${Math.floor(1000 + Math.random() * 9000)}`;

    onCreateTrip({
      title: newTitle.trim(),
      description: newDesc.trim() || 'College Friends Trip',
      code
    });

    setMode('list');
    onClose();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter a valid trip code');
      return;
    }

    const success = onJoinTrip(joinCode.trim().toUpperCase());
    if (success) {
      setMode('list');
      onClose();
    } else {
      setError(`No trip found matching code "${joinCode.trim().toUpperCase()}"`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {mode === 'list' ? 'Your Trips' : (mode === 'create' ? 'Create New College Trip' : 'Join Trip via Code')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Manage shared trip expense groups
            </p>
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

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* LIST MODE */}
        {mode === 'list' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {trips.map(trip => {
                const isActive = activeTrip?.id === trip.id;
                return (
                  <div
                    key={trip.id}
                    onClick={() => { onSelectTrip(trip); onClose(); }}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: isActive ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: isActive ? 'white' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Compass size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {trip.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Code: <strong>{trip.code}</strong> • {trip.description}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="badge badge-primary">Active</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => { setMode('create'); setError(''); }}
              >
                <Plus size={16} /> Create Trip
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setMode('join'); setError(''); }}
              >
                <Hash size={16} /> Join Code
              </button>
            </div>
          </div>
        )}

        {/* CREATE MODE */}
        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Trip Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Goa Beach Bash 2026"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Trip Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. College reunion road trip"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Custom Trip Code (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. GOA2026 (Auto-generated if empty)"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('list')}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Create & Switch Trip
              </button>
            </div>
          </form>
        )}

        {/* JOIN MODE */}
        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">Enter Friend's Trip Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. GOA2026"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                required
                autoFocus
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('list')}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Join Trip Now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
