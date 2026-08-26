import React from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, RefreshCw, Zap, Award, Sparkles, Check } from 'lucide-react';

export default function SettlementView({
  tripMembers,
  expenses,
  settlements,
  onSettleUp
}) {
  // Member ID map
  const memberMap = {};
  tripMembers.forEach(m => { memberMap[m.id] = m; });

  // 1. Calculate Net Balance for each member across expenses & settlements
  const balances = {};
  tripMembers.forEach(m => { balances[m.id] = 0; });

  expenses.forEach(exp => {
    // Payer gets credited full amount
    if (balances[exp.paid_by] !== undefined) {
      balances[exp.paid_by] += Number(exp.amount);
    }
    // Each splitter gets debited their equal share
    exp.splits?.forEach(s => {
      if (balances[s.member_id] !== undefined) {
        balances[s.member_id] -= Number(s.amount);
      }
    });
  });

  // Account for past recorded settlements
  settlements.forEach(set => {
    if (balances[set.from_member_id] !== undefined) {
      balances[set.from_member_id] += Number(set.amount); // paid off debt
    }
    if (balances[set.to_member_id] !== undefined) {
      balances[set.to_member_id] -= Number(set.amount); // received money
    }
  });

  // 2. Greedy Minimal Settlement Algorithm ("Who Pays Whom")
  const debtors = [];  // members who owe (balance < 0)
  const creditors = []; // members who are owed (balance > 0)

  Object.keys(balances).forEach(mId => {
    const bal = Math.round(balances[mId]);
    if (bal < -0.5) {
      debtors.push({ id: mId, amount: Math.abs(bal) });
    } else if (bal > 0.5) {
      creditors.push({ id: mId, amount: bal });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const suggestedTransfers = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      suggestedTransfers.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(transferAmount)
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount <= 0.5) dIdx++;
    if (creditor.amount <= 0.5) cIdx++;
  }

  // Handle click on Settle Up
  const handleSettleAction = (fromId, toId, amount) => {
    onSettleUp(fromId, toId, amount);

    // Fire celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const totalTripSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const perPersonAvg = tripMembers.length > 0 ? totalTripSpend / tripMembers.length : 0;

  return (
    <div style={{ marginBottom: '3rem' }} className="animate-fade-in">
      {/* Group Summary Box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
            Total Group Spend
          </p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
            ₹{totalTripSpend.toLocaleString()}
          </h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.4rem' }}>
            Across {expenses.length} shared expenses
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Equal Share / Person
          </p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            ₹{Math.round(perPersonAvg).toLocaleString()}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Split among {tripMembers.length} trip friends
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Status
          </p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: suggestedTransfers.length === 0 ? 'var(--success)' : 'var(--warning)', marginTop: '0.4rem' }}>
            {suggestedTransfers.length === 0 ? 'Fully Settled 🎉' : `${suggestedTransfers.length} Transfers Left`}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Optimized minimal debt routes
          </p>
        </div>
      </div>

      {/* Suggested Minimal Transfers Section */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="var(--primary)" /> Optimized "Who Pays Whom"
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Smart calculation engine minimizes group payments into direct transfers
            </p>
          </div>
        </div>

        {suggestedTransfers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Award size={52} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              All Balances Are Equal & Settled!
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              No one owes anyone anything. Great job tracking your college trip expenses!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {suggestedTransfers.map((tr, idx) => {
              const fromMember = memberMap[tr.from] || { name: 'Friend', avatar_color: '#4f46e5' };
              const toMember = memberMap[tr.to] || { name: 'Friend', avatar_color: '#059669' };

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* From Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '160px' }}>
                    <div
                      className="avatar-circle"
                      style={{ width: '40px', height: '40px', fontSize: '0.95rem', backgroundColor: fromMember.avatar_color }}
                    >
                      {fromMember.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {fromMember.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payer (Owes)</p>
                    </div>
                  </div>

                  {/* Arrow & Amount */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0 0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{tr.amount.toLocaleString()}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                      pays <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* To Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '160px', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)' }}>
                        {toMember.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receiver (Gets Back)</p>
                    </div>
                    <div
                      className="avatar-circle"
                      style={{ width: '40px', height: '40px', fontSize: '0.95rem', backgroundColor: toMember.avatar_color }}
                    >
                      {toMember.name.charAt(0)}
                    </div>
                  </div>

                  {/* Settle Action */}
                  <div>
                    <button
                      onClick={() => handleSettleAction(tr.from, tr.to, tr.amount)}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircle2 size={16} /> Mark Paid & Settle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
            Settlement History ({settlements.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {settlements.map((st, idx) => {
              const fromM = memberMap[st.from_member_id] || { name: 'User' };
              const toM = memberMap[st.to_member_id] || { name: 'User' };
              const dateStr = new Date(st.created_at || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--success)" />
                    <span>
                      <strong>{fromM.name}</strong> paid <strong>₹{Number(st.amount).toLocaleString()}</strong> to <strong>{toM.name}</strong>
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
