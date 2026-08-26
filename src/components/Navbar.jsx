import React, { useState } from 'react';
import { Compass, Users, ChevronRight, LogOut, ChevronDown, User, UserCheck } from 'lucide-react';

export default function Navbar({
  activeGroup,
  activeTrip,
  currentUser,
  allMembers,
  pendingFriendRequestsCount = 0,
  onChangeCurrentUser,
  onGoToGroups,
  onGoToGroupDetail,
  onOpenProfileModal,
  onOpenFriendsModal,
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

        {/* Member Profile Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Friends & Network Trigger */}
          {currentUser && (
            <button
              onClick={onOpenFriendsModal}
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative' }}
              title="Manage Friends & Pending Requests"
            >
              <Users size={14} color="var(--primary)" /> Friends
              {pendingFriendRequestsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  {pendingFriendRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* Profile Dropdown */}
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
                  {currentUser.name || currentUser.full_name}
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
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfileModal();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'left'
                    }}
                  >
                    <User size={15} color="var(--primary)" /> Edit Profile (Sync Supabase)
                  </button>

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
