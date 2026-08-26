import React, { useState } from 'react';
import { Compass, Users, Copy, Check, Database, LogOut, ChevronDown, PlusCircle } from 'lucide-react';

export default function Navbar({
  activeTrip,
  currentUser,
  allMembers,
  onChangeCurrentUser,
  onOpenTripModal,
  onOpenSqlModal,
  onLogout
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleCopyCode = () => {
    if (activeTrip?.code) {
      navigator.clipboard.writeText(activeTrip.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
          }}>
            <Compass size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-primary)' }}>
              TripSplit
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              College Friends Trip
            </span>
          </div>
        </div>

        {/* Active Trip Badge & Code */}
        {activeTrip && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-subtle)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {activeTrip.title}
            </span>

            <button
              onClick={handleCopyCode}
              title="Click to copy trip code for friends"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)'
              }}
            >
              {copiedCode ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              Code: {activeTrip.code}
            </button>

            <button
              onClick={onOpenTripModal}
              title="Switch or Create Trip"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >
              <PlusCircle size={14} /> Switch
            </button>
          </div>
        )}

        {/* Controls & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* SQL Modal Trigger Button */}
          <button
            onClick={onOpenSqlModal}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
            title="View Supabase SQL Script"
          >
            <Database size={14} color="var(--primary)" /> SQL Script
          </button>

          {/* Member Switcher Dropdown */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)'
                }}
              >
                <div
                  className="avatar-circle"
                  style={{
                    width: '30px',
                    height: '30px',
                    fontSize: '0.8rem',
                    backgroundColor: currentUser.avatar_color || '#4f46e5'
                  }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.name}
                </span>
                <ChevronDown size={14} color="var(--text-secondary)" />
              </button>

              {showUserDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  width: '220px',
                  padding: '0.5rem',
                  zIndex: 60
                }} className="animate-pop-in">
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.35rem 0.65rem' }}>
                    View Portal As Member:
                  </p>
                  {allMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChangeCurrentUser(m);
                        setShowUserDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: m.id === currentUser.id ? 700 : 500,
                        background: m.id === currentUser.id ? 'var(--primary-light)' : 'transparent',
                        color: m.id === currentUser.id ? 'var(--primary)' : 'var(--text-primary)',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        className="avatar-circle"
                        style={{ width: '22px', height: '22px', fontSize: '0.7rem', backgroundColor: m.avatar_color }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      {m.name}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.4rem 0' }}></div>

                  <button
                    onClick={() => { setShowUserDropdown(false); onLogout(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--danger)',
                      fontWeight: 600
                    }}
                  >
                    <LogOut size={14} /> Sign Out / Exit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
