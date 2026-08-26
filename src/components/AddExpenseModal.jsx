import React, { useState } from 'react';
import { X, DollarSign, Tag, Users, Check, AlertCircle } from 'lucide-react';

export default function AddExpenseModal({
  isOpen,
  onClose,
  tripMembers,
  currentUser,
  onAddExpense
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.id || tripMembers[0]?.id || '');
  const [category, setCategory] = useState('Food');
  const [selectedMembers, setSelectedMembers] = useState(tripMembers.map(m => m.id));
  const [error, setError] = useState('');

  const numSelected = selectedMembers.length;
  const numAmount = parseFloat(amount) || 0;
  const equalSplitPerPerson = numSelected > 0 ? (numAmount / numSelected).toFixed(2) : '0.00';

  const toggleMember = (id) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length === 1) return; // Must have at least 1 person
      setSelectedMembers(selectedMembers.filter(mId => mId !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an expense title');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Select at least one participant to split');
      return;
    }

    const splits = selectedMembers.map(mId => ({
      member_id: mId,
      amount: parseFloat(equalSplitPerPerson)
    }));

    onAddExpense({
      title: title.trim(),
      amount: numAmount,
      paid_by: paidBy,
      category,
      splits
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Add Trip Expense
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Record what you spent; it will be divided equally!
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
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Expense Title / What did you buy?</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Thalassa Dinner & Shisha"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Amount & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Total Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-control"
                placeholder="4000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Food">🍽️ Food & Drinks</option>
                <option value="Stay">🏨 Stay & Hotel</option>
                <option value="Transport">🚗 Travel & Fuel</option>
                <option value="Activities">🏄 Activities & Fun</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Misc">📦 Miscellaneous</option>
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div className="form-group">
            <label className="form-label">Who paid upfront?</label>
            <select
              className="form-control"
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
            >
              {tripMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === currentUser?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split participants equal selector */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Split Equally Between ({selectedMembers.length} people)
              </label>
              <button
                type="button"
                style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}
                onClick={() => setSelectedMembers(tripMembers.map(m => m.id))}
              >
                Select All
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '0.25rem'
            }}>
              {tripMembers.map(m => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
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
                      style={{ width: '22px', height: '22px', fontSize: '0.7rem', backgroundColor: m.avatar_color }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, flex: 1 }}>
                      {m.name}
                    </span>
                    {isSelected && <Check size={14} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Equal Split calculation banner */}
          <div style={{
            background: 'var(--bg-subtle)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Calculated Equal Portion:
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{equalSplitPerPerson} / person
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Divide Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
