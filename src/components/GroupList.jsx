import React, { useState } from 'react';
import { Users, Plus, ChevronRight, X, Search, Check, UserCheck } from 'lucide-react';

export default function GroupList({
  groups = [],
  allGroupMembers = [],
  allTrips = [],
  confirmedFriends = [],
  onSelectGroup,
  onCreateGroup
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const filteredFriends = confirmedFriends.filter(f =>
    f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const toggleFriend = (fId) => {
    if (selectedFriendIds.includes(fId)) {
      setSelectedFriendIds(selectedFriendIds.filter(id => id !== fId));
    } else {
      setSelectedFriendIds([...selectedFriendIds, fId]);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    // Map selected friend objects
    const chosenFriends = confirmedFriends.filter(f => selectedFriendIds.includes(f.id));

    onCreateGroup({
      name: groupName.trim(),
      description: groupDesc.trim() || 'College Friend Circle',
      members: chosenFriends
    });

    setGroupName('');
    setGroupDesc('');
    setSelectedFriendIds([]);
    setFriendSearchQuery('');
    setShowCreateModal(false);
  };

  return (
    <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={26} color="var(--primary)" /> Your Friend Groups & Squads
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Select a group to view trip history, create new trips, or manage friends
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} /> Create New Group
        </button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Users size={48} color="var(--primary)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            No Groups Created Yet
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.3rem', maxWidth: '440px', marginInLine: 'auto' }}>
            Create a group for your college squad or hostel room to organize trips and split expenses together!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ marginTop: '1.25rem' }}
          >
            <Plus size={16} /> Create Your First Group
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.25rem'
        }}>
          {groups.map(group => {
            const members = allGroupMembers.filter(m => m.group_id === group.id);
            const trips = allTrips.filter(t => t.group_id === group.id);

            return (
              <div
                key={group.id}
                className="glass-card glass-card-hover"
                onClick={() => onSelectGroup(group)}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>

                    <span className="badge badge-primary">
                      {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {group.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    {group.description || 'College Friends Group'}
                  </p>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {/* Member avatars list */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {members.slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="avatar-circle"
                        title={m.display_name}
                        style={{
                          width: '26px',
                          height: '26px',
                          fontSize: '0.7rem',
                          backgroundColor: m.avatar_color || '#4f46e5',
                          marginLeft: idx > 0 ? '-6px' : 0,
                          border: '2px solid white'
                        }}
                      >
                        {m.display_name?.charAt(0) || 'F'}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                        +{members.length - 4}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Open Squad <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GROUP MODAL WITH FRIEND SELECTOR & SEARCH */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create New Group</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select friends from your friends list</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Section B Squad, Hostel Room 302"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Group Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. College friends & weekend road trips"
                  value={groupDesc}
                  onChange={e => setGroupDesc(e.target.value)}
                />
              </div>

              {/* SELECT FRIENDS FROM CONFIRMED FRIENDS LIST */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Select Friends to Add ({selectedFriendIds.length} selected)
                  </label>
                  {confirmedFriends.length > 0 && (
                    <button
                      type="button"
                      style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}
                      onClick={() => setSelectedFriendIds(confirmedFriends.map(f => f.id))}
                    >
                      Select All
                    </button>
                  )}
                </div>

                {confirmedFriends.length === 0 ? (
                  <div style={{
                    padding: '1.25rem 1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <UserCheck size={28} color="var(--primary)" style={{ marginBottom: '0.3rem', opacity: 0.7 }} />
                    <p style={{ fontWeight: 600 }}>No confirmed friends in your network yet.</p>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Click "Friends" in top navbar to search registered users & send friend requests!
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Search box for filtering friends list */}
                    <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '2.2rem', padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                        placeholder="Search your friends list..."
                        value={friendSearchQuery}
                        onChange={e => setFriendSearchQuery(e.target.value)}
                      />
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.5rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '0.2rem'
                    }}>
                      {filteredFriends.map(friend => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <div
                            key={friend.id}
                            onClick={() => toggleFriend(friend.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                              background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            <div
                              className="avatar-circle"
                              style={{ width: '22px', height: '22px', fontSize: '0.7rem', backgroundColor: friend.avatar_color || '#4f46e5' }}
                            >
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {friend.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {friend.email}
                              </div>
                            </div>
                            {isSelected && <Check size={14} color="var(--primary)" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
