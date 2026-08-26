import React from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle, AlertCircle, Sparkles, Send, ShieldAlert } from 'lucide-react';

export default function PersonalPortal({
  currentUser,
  tripMembers,
  expenses,
  settlements,
  onSettleUp
}) {
  if (!currentUser) return null;

  // Calculate stats for current user
  // 1. Total paid by current user
  const totalPaid = expenses
    .filter(e => e.paid_by === currentUser.id)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // 2. Total fair share for current user across all equal splits
  let totalShare = 0;
  expenses.forEach(e => {
    const split = e.splits?.find(s => s.member_id === currentUser.id);
    if (split) {
      totalShare += Number(split.amount);
    }
  });

  // Calculate detailed pairwise debts:
  // For each other member, calculate net owe/get back balance considering expenses & settlements
  const memberBalances = {};
  tripMembers.forEach(m => {
    if (m.id !== currentUser.id) {
      memberBalances[m.id] = { member: m, netAmount: 0 };
    }
  });

  // Compute expense balances between currentUser and each other member
  expenses.forEach(exp => {
    const numSplitters = exp.splits?.length || 1;
    const splitPerPerson = Number(exp.amount) / numSplitters;

    if (exp.paid_by === currentUser.id) {
      // Current user paid: all other participants in the split owe currentUser their share
      exp.splits?.forEach(s => {
        if (s.member_id !== currentUser.id && memberBalances[s.member_id]) {
          memberBalances[s.member_id].netAmount += Number(s.amount);
        }
      });
    } else {
      // Someone else paid: if currentUser is in the split, currentUser owes payer
      const payerId = exp.paid_by;
      const currentUserSplit = exp.splits?.find(s => s.member_id === currentUser.id);
      if (currentUserSplit && memberBalances[payerId]) {
        memberBalances[payerId].netAmount -= Number(currentUserSplit.amount);
      }
    }
  });

  // Account for settlements recorded
  settlements.forEach(set => {
    if (set.from_member_id === currentUser.id && memberBalances[set.to_member_id]) {
      // Current user paid off debt to to_member -> increases net balance towards to_member
      memberBalances[set.to_member_id].netAmount += Number(set.amount);
    } else if (set.to_member_id === currentUser.id && memberBalances[set.from_member_id]) {
      // from_member paid off debt to current user -> decreases net balance from from_member
      memberBalances[set.from_member_id].netAmount -= Number(set.amount);
    }
  });

  // Net balance overall
  const netOverall = totalPaid - totalShare;

  // Filter list of who currentUser owes and who owes currentUser
  const iOweList = Object.values(memberBalances).filter(b => b.netAmount < -0.5);
  const owesMeList = Object.values(memberBalances).filter(b => b.netAmount > 0.5);

  return (
    <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
      {/* Header Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Personal Portal
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Individual trip summary & settlement tasks for <strong style={{ color: 'var(--primary)' }}>{currentUser.name}</strong>
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-subtle)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)'
        }}>
          <div
            className="avatar-circle"
            style={{ width: '24px', height: '24px', fontSize: '0.75rem', backgroundColor: currentUser.avatar_color }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>{currentUser.name}</span>
        </div>
      </div>

      {/* Main Status Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Paid Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                You Paid Out
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                ₹{totalPaid.toLocaleString()}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Total amount paid upfront by you for the group
          </p>
        </div>

        {/* Fair Share Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Your Fair Share
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                ₹{Math.round(totalShare).toLocaleString()}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Your calculated equal portion of shared expenses
          </p>
        </div>

        {/* Net Status Card */}
        <div className="glass-card" style={{
          padding: '1.25rem',
          background: iOweList.length > 0 ? 'var(--danger-bg)' : (owesMeList.length > 0 ? 'var(--success-bg)' : 'var(--bg-card)'),
          border: `1.5px solid ${iOweList.length > 0 ? 'var(--danger-border)' : (owesMeList.length > 0 ? 'var(--success-border)' : 'var(--border-color)')}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: iOweList.length > 0 ? 'var(--danger)' : (owesMeList.length > 0 ? 'var(--success)' : 'var(--text-secondary)'),
                textTransform: 'uppercase'
              }}>
                Net Settlement Status
              </p>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: iOweList.length > 0 ? 'var(--danger)' : (owesMeList.length > 0 ? 'var(--success)' : 'var(--primary)'),
                marginTop: '0.2rem'
              }}>
                {iOweList.length > 0 ? `You owe ₹${Math.abs(Math.round(iOweList.reduce((s, x) => s + x.netAmount, 0))).toLocaleString()}` :
                  (owesMeList.length > 0 ? `You get back ₹${Math.round(owesMeList.reduce((s, x) => s + x.netAmount, 0)).toLocaleString()}` : 'All Settled Up! 🎉')}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'white',
              color: iOweList.length > 0 ? 'var(--danger)' : 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {iOweList.length > 0 ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {iOweList.length > 0 ? 'Action required: Pay your college friends below' : 'You are in the green! Sit back & relax.'}
          </p>
        </div>
      </div>

      {/* Actionable Settlement Items - "WHAT YOU HAVE TO DO" */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--primary)" /> What You Have To Do
        </h4>

        {iOweList.length === 0 && owesMeList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
            <h5 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Zero Pending Debts!</h5>
            <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>You have no pending payments to make or collect.</p>
          </div>
        )}

        {/* You Owe Section */}
        {iOweList.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <span className="badge badge-danger" style={{ marginBottom: '0.75rem' }}>
              Payments You Need to Send ({iOweList.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {iOweList.map(({ member, netAmount }) => {
                const amountOwed = Math.abs(Math.round(netAmount));
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        className="avatar-circle"
                        style={{ width: '38px', height: '38px', fontSize: '0.9rem', backgroundColor: member.avatar_color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          Pay {member.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Equal trip split settlement balance
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger)' }}>
                        ₹{amountOwed.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onSettleUp(currentUser.id, member.id, amountOwed)}
                        className="btn btn-success btn-sm"
                        title={`Settle ₹${amountOwed} with ${member.name}`}
                      >
                        <Send size={14} /> Settle Up
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Owes You Section */}
        {owesMeList.length > 0 && (
          <div>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
              Payments You Will Receive ({owesMeList.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {owesMeList.map(({ member, netAmount }) => {
                const amountDue = Math.round(netAmount);
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        className="avatar-circle"
                        style={{ width: '38px', height: '38px', fontSize: '0.9rem', backgroundColor: member.avatar_color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {member.name} owes you
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Awaiting direct payment or settlement
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>
                        ₹{amountDue.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onSettleUp(member.id, currentUser.id, amountDue)}
                        className="btn btn-secondary btn-sm"
                        title="Mark as received/settled"
                      >
                        Mark Settled
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
