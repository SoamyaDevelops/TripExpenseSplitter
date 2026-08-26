import React, { useState } from 'react';
import { ArrowLeft, Compass, Plus, Users, UserPlus, Calendar, Check, CheckCircle2, History, X } from 'lucide-react';

export default function GroupDetail({
  group,
  groupMembers = [],
  trips = [],
  allExpenses = [],
  onBackToGroups,
  onSelectTrip,
  onCreateTripInGroup,
  onAddMemberToGroup
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Form states
  const [tripTitle, setTripTitle] = useState('');
  const [tripDesc, setTripDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState(groupMembers.map(m => m.id));

  // Add member states
  const [newMemberName, setNewMemberName] = useState('');

  const activeTrips = trips.filter(t => t.status !== 'completed');
  const pastTrips = trips.filter(t => t.status === 'completed');

  const handleCreateTripSubmit = (e) => {
    e.preventDefault();
    if (!tripTitle.trim()) return;

    const code = `TRIP${Math.floor(1000 + Math.random() * 9000)}`;
    onCreateTripInGroup({
      group_id: group.id,
      title: tripTitle.trim(),
      description: tripDesc.trim() || 'Group Trip',
      code,
      selected_member_ids: selectedMemberIds
    });

    setTripTitle('');
    setTripDesc('');
    setShowCreateTripModal(false);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    onAddMemberToGroup(group.id, newMemberName.trim());
    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  const toggleMemberSelection = (mId) => {
    if (selectedMemberIds.includes(mId)) {
      if (selectedMemberIds.length === 1) return;
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== mId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, mId]);
    }
  };

  return (
    <div style={{ marginBottom: '3rem' }} className="animate-fade-in">
      {/* Back & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={onBackToGroups}
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={14} /> Back to Groups
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {group.name}
        </span>
      </div>

      {/* Group Banner */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}>
                {group.name.charAt(0).toUpperCase()}
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {group.name}
              </h1>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {group.description || 'College Friends Group'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddMemberModal(true)}
            >
              <UserPlus size={16} /> Add Member
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedMemberIds(groupMembers.map(m => m.id));
                setShowCreateTripModal(true);
              }}
            >
              <Plus size={18} /> Create New Trip
            </button>
          </div>
        </div>

        {/* Group Members Row */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Group Members ({groupMembers.length}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {groupMembers.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-subtle)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <div
                    className="avatar-circle"
                    style={{ width: '18px', height: '18px', fontSize: '0.65rem', backgroundColor: m.avatar_color || '#4f46e5' }}
                  >
                    {m.display_name?.charAt(0)}
                  </div>
                  {m.display_name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-navigation" style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Compass size={16} /> Active Trips ({activeTrips.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Past History ({pastTrips.length})
        </button>
      </div>

      {/* Trips Display */}
      {((activeTab === 'active' ? activeTrips : pastTrips).length === 0) ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Compass size={44} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {activeTab === 'active' ? 'No Active Trips in this Group' : 'No Past Trip History'}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Click "Create New Trip" to plan a trip with this squad!
          </p>
          {activeTab === 'active' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedMemberIds(groupMembers.map(m => m.id));
                setShowCreateTripModal(true);
              }}
              style={{ marginTop: '1rem' }}
            >
              <Plus size={16} /> Create Trip Now
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {(activeTab === 'active' ? activeTrips : pastTrips).map(trip => {
            const tripExps = allExpenses.filter(e => e.trip_id === trip.id);
            const totalSpend = tripExps.reduce((sum, e) => sum + Number(e.amount), 0);

            return (
              <div
                key={trip.id}
                className="glass-card glass-card-hover"
                onClick={() => onSelectTrip(trip)}
                style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {trip.title}
                    </h3>
                    <span className={`badge ${trip.status === 'completed' ? 'badge-secondary' : 'badge-primary'}`}>
                      {trip.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {trip.description || 'Shared trip'}
                  </p>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Spent</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalSpend.toLocaleString()}</h4>
                  </div>

                  <span className="btn btn-secondary btn-sm">
                    Open Trip Dashboard →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TRIP IN GROUP MODAL */}
      {showCreateTripModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTripModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create Trip in {group.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Set up a new trip and pick participants</p>
              </div>
              <button onClick={() => setShowCreateTripModal(false)} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTripSubmit}>
              <div className="form-group">
                <label className="form-label">Trip Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Goa Beach Bash 2026, Manali Trek"
                  value={tripTitle}
                  onChange={e => setTripTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trip Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 3-day weekend road trip"
                  value={tripDesc}
                  onChange={e => setTripDesc(e.target.value)}
                />
              </div>

              {/* Choose Members going on this trip */}
              <div className="form-group">
                <label className="form-label">Group Members Going on this Trip ({selectedMemberIds.length}):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {groupMembers.map(m => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMemberSelection(m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="avatar-circle" style={{ width: '20px', height: '20px', fontSize: '0.65rem', backgroundColor: m.avatar_color }}>
                          {m.display_name?.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, flex: 1 }}>{m.display_name}</span>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTripModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Launch Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER TO GROUP MODAL */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add Member to {group.name}</h3>
              <button onClick={() => setShowAddMemberModal(false)} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit}>
              <div className="form-group">
                <label className="form-label">Member Name or Email</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sanya Roy"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><UserPlus size={14} /> Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
