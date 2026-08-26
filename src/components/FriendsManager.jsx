import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserPlus, Clock, Check, X, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { searchSupabaseProfiles, supabase } from '../lib/supabase';

export default function FriendsManager({
  isOpen,
  onClose,
  currentUser,
  friendships = [],
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest
}) {
  if (!isOpen || !currentUser) return null;

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'pending' | 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Handle Supabase Profile Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchSupabaseProfiles(searchQuery);
      // Filter out current user from search results
      const filtered = results.filter(p => p.id !== currentUser.id && p.email !== currentUser.email);
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  // Compute status for a searched user
  const getFriendshipStatus = (otherUserId) => {
    const found = friendships.find(
      f => (f.requester_id === currentUser.id && f.addressee_id === otherUserId) ||
           (f.addressee_id === currentUser.id && f.requester_id === otherUserId)
    );
    if (!found) return 'none';
    return found.status; // 'pending' | 'accepted' | 'rejected'
  };

  // Filter incoming pending requests
  const pendingRequests = friendships.filter(
    f => f.addressee_id === currentUser.id && f.status === 'pending'
  );

  // Filter accepted friends
  const acceptedFriends = friendships.filter(
    f => f.status === 'accepted'
  );

  const handleSendRequest = async (profile) => {
    onSendFriendRequest(profile);
    setNotificationMsg(`Friend request sent to ${profile.full_name}!`);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} color="var(--primary)" /> Friends & Network Manager
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Search real Supabase users, send friend requests & manage friends
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="tab-navigation" style={{ marginBottom: '1.25rem' }}>
          <button
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={15} /> Search Supabase
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={15} /> Requests {pendingRequests.length > 0 && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{pendingRequests.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <UserCheck size={15} /> My Friends ({acceptedFriends.length})
          </button>
        </div>

        {notificationMsg && (
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
            <Check size={16} /> {notificationMsg}
          </div>
        )}

        {/* TAB 1: SEARCH REAL SUPABASE PROFILES */}
        {activeTab === 'search' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Type name or email to search registered users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {isSearching && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem' }}>
                Querying Supabase database...
              </p>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  No registered user found matching "{searchQuery}"
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Ask your friend to sign up for TripSplit first, then search their email!
                </p>
              </div>
            )}

            {!isSearching && searchQuery.trim().length < 2 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={36} color="var(--primary)" style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
                <p style={{ fontSize: '0.85rem' }}>Type at least 2 characters to search registered Supabase users by name or email.</p>
              </div>
            )}

            {/* Search Results Feed */}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map(profile => {
                  const status = getFriendshipStatus(profile.id);
                  return (
                    <div
                      key={profile.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          className="avatar-circle"
                          style={{ width: '38px', height: '38px', fontSize: '0.9rem', backgroundColor: profile.avatar_color || '#4f46e5' }}
                        >
                          {profile.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {profile.full_name}
                          </h4>
                          <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                            {profile.email} {profile.bio ? `• ${profile.bio}` : ''}
                          </p>
                        </div>
                      </div>

                      <div>
                        {status === 'accepted' ? (
                          <span className="badge badge-success">
                            <Check size={12} /> Friends
                          </span>
                        ) : status === 'pending' ? (
                          <span className="badge badge-warning">
                            <Clock size={12} /> Request Sent
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSendRequest(profile)}
                          >
                            <UserPlus size={14} /> Send Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING FRIEND REQUESTS */}
        {activeTab === 'pending' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={40} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>No Pending Friend Requests</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>When someone sends you a friend request, it will appear here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'var(--primary-light)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        className="avatar-circle"
                        style={{ width: '38px', height: '38px', fontSize: '0.9rem', backgroundColor: req.requester_color || '#4f46e5' }}
                      >
                        {req.requester_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {req.requester_name}
                        </h4>
                        <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                          {req.requester_email}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => onAcceptFriendRequest(req.id)}
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onRejectFriendRequest(req.id)}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY CONFIRMED FRIENDS */}
        {activeTab === 'friends' && (
          <div>
            {acceptedFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>No Friends Added Yet</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Search registered users tab to send friend requests!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {acceptedFriends.map(fr => {
                  const friendName = fr.requester_id === currentUser.id ? fr.addressee_name : fr.requester_name;
                  const friendEmail = fr.requester_id === currentUser.id ? fr.addressee_email : fr.requester_email;
                  const avatarColor = fr.avatar_color || '#059669';

                  return (
                    <div
                      key={fr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          className="avatar-circle"
                          style={{ width: '38px', height: '38px', fontSize: '0.9rem', backgroundColor: avatarColor }}
                        >
                          {friendName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {friendName}
                          </h4>
                          <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                            {friendEmail}
                          </p>
                        </div>
                      </div>

                      <span className="badge badge-success">
                        <UserCheck size={12} /> Friend
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
