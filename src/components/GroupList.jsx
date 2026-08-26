import React, { useState } from 'react';
import { Users, Plus, ChevronRight, X } from 'lucide-react';

export default function GroupList({
  groups = [],
  allGroupMembers = [],
  allTrips = [],
  onSelectGroup,
  onCreateGroup
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [initialMembers, setInitialMembers] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    onCreateGroup({
      name: groupName.trim(),
      description: groupDesc.trim() || 'College Friend Circle',
      members: initialMembers.split(',').map(m => m.trim()).filter(Boolean)
    });

    setGroupName('');
    setGroupDesc('');
    setInitialMembers('');
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

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create New Group</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Organize your friends into a group circle</p>
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

              <div className="form-group">
                <label className="form-label">Add Initial Friends (Comma Separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul, Priya, Rohan, Ananya"
                  value={initialMembers}
                  onChange={e => setInitialMembers(e.target.value)}
                />
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
