import React, { useState } from 'react';
import { Compass, Users, ChevronRight, LogOut, ChevronDown, UserPlus } from 'lucide-react';

export default function Navbar({
  activeGroup,
  activeTrip,
  currentUser,
  allMembers,
  onChangeCurrentUser,
  onGoToGroups,
  onGoToGroupDetail,
  onLogout
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
        {/* Brand & Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            onClick={onGoToGroups}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Compass size={22} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              onClick={onGoToGroups}
              style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              TripSplit
            </span>

            {activeGroup && (
              <>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span
                  onClick={onGoToGroupDetail}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: activeTrip ? 'var(--text-secondary)' : 'var(--primary)',
                    cursor: 'pointer'
                  }}
                >
                  {activeGroup.name}
                </span>
              </>
            )}

            {activeTrip && (
              <>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {activeTrip.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Member Profile Switcher & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  {allMembers.length > 0 && (
                    <>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.35rem 0.65rem' }}>
                        View Portal As:
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
                    </>
                  )}

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
                    <LogOut size={14} /> Sign Out
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
