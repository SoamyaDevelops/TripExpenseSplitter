import React, { useState } from 'react';
import { Plus, Search, Receipt, Trash2, Calendar, Tag, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpenseList({
  expenses,
  tripMembers,
  currentUser,
  onOpenAddModal,
  onDeleteExpense
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const categories = ['All', 'Food', 'Stay', 'Transport', 'Activities', 'Shopping', 'Misc'];

  // Map member IDs to member objects
  const memberMap = {};
  tripMembers.forEach(m => { memberMap[m.id] = m; });

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase()) ||
      (memberMap[exp.paid_by]?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Food': return 'badge-primary';
      case 'Stay': return 'badge-success';
      case 'Transport': return 'badge-warning';
      case 'Activities': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getCategoryEmoji = (cat) => {
    switch (cat) {
      case 'Food': return '🍽️';
      case 'Stay': return '🏨';
      case 'Transport': return '🚗';
      case 'Activities': return '🏄';
      case 'Shopping': return '🛍️';
      default: return '📦';
    }
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Action Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Trip Expense History ({expenses.length})
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Every bill mentioned and divided equally among participants
          </p>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary">
          <Plus size={18} /> Add New Expense
        </button>
      </div>

      {/* Filters & Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '1.25rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search expenses or payer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-card)',
                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {cat === 'All' ? 'All Expenses' : `${getCategoryEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Expense Cards List */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Receipt size={48} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Expenses Logged Yet</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Click "Add New Expense" to log what someone spent on food, stay, or travel!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredExpenses.map(exp => {
            const payer = memberMap[exp.paid_by] || { name: 'Unknown', avatar_color: '#94a3b8' };
            const isExpanded = expandedId === exp.id;
            const formattedDate = new Date(exp.created_at || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={exp.id}
                className="glass-card glass-card-hover"
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Category Emoji Circle */}
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}>
                      {getCategoryEmoji(exp.category)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {exp.title}
                        </h4>
                        <span className={`badge ${getCategoryBadgeClass(exp.category)}`}>
                          {exp.category}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>
                          Paid by <strong style={{ color: 'var(--text-primary)' }}>{payer.name}</strong>
                        </span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{exp.splits?.length || tripMembers.length} split equally</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{Number(exp.amount).toLocaleString()}
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ₹{(Number(exp.amount) / (exp.splits?.length || 1)).toFixed(2)} / person
                      </p>
                    </div>

                    <div style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Split Breakdown */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-subtle)',
                    padding: '1rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }} className="animate-fade-in">
                    <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                      Equal Share Breakdown:
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.5rem',
                      marginBottom: '0.85rem'
                    }}>
                      {exp.splits?.map(split => {
                        const member = memberMap[split.member_id];
                        if (!member) return null;
                        const isPayer = split.member_id === exp.paid_by;
                        return (
                          <div
                            key={split.member_id}
                            style={{
                              background: 'var(--bg-card)',
                              padding: '0.4rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div
                                className="avatar-circle"
                                style={{ width: '20px', height: '20px', fontSize: '0.65rem', backgroundColor: member.avatar_color }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 600 }}>{member.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: isPayer ? 'var(--success)' : 'var(--text-secondary)' }}>
                              ₹{Number(split.amount).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <Trash2 size={14} /> Delete Expense
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
