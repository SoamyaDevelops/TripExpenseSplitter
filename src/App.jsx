import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import PersonalPortal from './components/PersonalPortal';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import SettlementView from './components/SettlementView';
import TripSelector from './components/TripSelector';
import SqlScriptModal from './components/SqlScriptModal';
import { supabase, getLocalStore, saveLocalStore } from './lib/supabase';
import { User, Receipt, Zap, Compass, UserPlus, ArrowRight } from 'lucide-react';
import './App.css';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripMembers, setTripMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('portal'); // 'portal' | 'expenses' | 'settlement'
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isTripSelectorOpen, setIsTripSelectorOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // New trip creation state for onboarding
  const [onboardTripName, setOnboardTripName] = useState('');
  const [onboardUserName, setOnboardUserName] = useState('');
  const [onboardFriends, setOnboardFriends] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
      } else {
        setSessionUser(null);
      }
    });

    loadData();
    return () => subscription.unsubscribe();
  }, []);

  const loadData = () => {
    const store = getLocalStore();
    setTrips(store.trips || []);
    if (store.trips?.length > 0 && !activeTrip) {
      const defaultTrip = store.trips[0];
      setActiveTrip(defaultTrip);
      loadTripDetails(defaultTrip.id, store);
    }
  };

  const loadTripDetails = (tripId, store = getLocalStore()) => {
    const members = (store.members || []).filter(m => m.trip_id === tripId);
    const exps = (store.expenses || []).filter(e => e.trip_id === tripId);
    const sets = (store.settlements || []).filter(s => s.trip_id === tripId);

    setTripMembers(members);
    setExpenses(exps);
    setSettlements(sets);

    if (members.length > 0) {
      setCurrentMember(members[0]);
    }
  };

  // Switch Active Trip
  const handleSelectTrip = (trip) => {
    setActiveTrip(trip);
    loadTripDetails(trip.id);
  };

  // Create First Trip Onboarding Form
  const handleCreateFirstTrip = (e) => {
    e.preventDefault();
    if (!onboardTripName.trim()) return;

    const store = getLocalStore();
    const code = `TRIP${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrip = {
      id: `trip-${Date.now()}`,
      title: onboardTripName.trim(),
      description: 'College Friends Trip',
      code,
      created_at: new Date().toISOString()
    };

    store.trips.unshift(newTrip);

    // Add user member
    const myName = onboardUserName.trim() || sessionUser?.user_metadata?.full_name || 'Me';
    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    
    const userMember = {
      id: `m-${Date.now()}-0`,
      trip_id: newTrip.id,
      name: myName,
      email: sessionUser?.email || 'me@college.edu',
      avatar_color: colorList[0]
    };
    store.members.push(userMember);

    // Parse friend names
    if (onboardFriends.trim()) {
      const friends = onboardFriends.split(',').map(f => f.trim()).filter(Boolean);
      friends.forEach((fName, idx) => {
        store.members.push({
          id: `m-${Date.now()}-${idx + 1}`,
          trip_id: newTrip.id,
          name: fName,
          email: `${fName.toLowerCase().replace(/\s+/g, '')}@college.edu`,
          avatar_color: colorList[(idx + 1) % colorList.length]
        });
      });
    }

    saveLocalStore(store);

    setTrips([newTrip, ...trips]);
    setActiveTrip(newTrip);
    loadTripDetails(newTrip.id, store);
  };

  // Add friend to active trip
  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!newFriendName.trim() || !activeTrip) return;

    const store = getLocalStore();
    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    const newMember = {
      id: `m-${Date.now()}`,
      trip_id: activeTrip.id,
      name: newFriendName.trim(),
      email: `${newFriendName.trim().toLowerCase().replace(/\s+/g, '')}@college.edu`,
      avatar_color: colorList[tripMembers.length % colorList.length]
    };

    store.members.push(newMember);
    saveLocalStore(store);

    setTripMembers([...tripMembers, newMember]);
    setNewFriendName('');
    setShowAddFriendModal(false);
  };

  // Add Expense Handler
  const handleAddExpense = (newExp) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const created = {
      id: `exp-${Date.now()}`,
      trip_id: activeTrip.id,
      ...newExp,
      created_at: new Date().toISOString()
    };

    store.expenses.unshift(created);
    saveLocalStore(store);

    setExpenses([created, ...expenses]);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expId) => {
    const store = getLocalStore();
    store.expenses = store.expenses.filter(e => e.id !== expId);
    saveLocalStore(store);

    setExpenses(expenses.filter(e => e.id !== expId));
  };

  // Settle Up Handler
  const handleSettleUp = (fromMemberId, toMemberId, amount) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const newSettlement = {
      id: `set-${Date.now()}`,
      trip_id: activeTrip.id,
      from_member_id: fromMemberId,
      to_member_id: toMemberId,
      amount: Number(amount),
      created_at: new Date().toISOString()
    };

    store.settlements.unshift(newSettlement);
    saveLocalStore(store);

    setSettlements([newSettlement, ...settlements]);
  };

  // Create Trip Handler
  const handleCreateTrip = ({ title, description, code }) => {
    const store = getLocalStore();
    const newTrip = {
      id: `trip-${Date.now()}`,
      title,
      description,
      code,
      created_at: new Date().toISOString()
    };

    store.trips.unshift(newTrip);

    const defaultMember = {
      id: `m-${Date.now()}`,
      trip_id: newTrip.id,
      name: currentMember ? currentMember.name : (sessionUser?.user_metadata?.full_name || 'Me'),
      email: sessionUser?.email || 'me@college.edu',
      avatar_color: '#4f46e5'
    };

    store.members.push(defaultMember);
    saveLocalStore(store);

    setTrips([newTrip, ...trips]);
    setActiveTrip(newTrip);
    setTripMembers([defaultMember]);
    setCurrentMember(defaultMember);
    setExpenses([]);
    setSettlements([]);
  };

  // Join Trip Handler
  const handleJoinTrip = (code) => {
    const store = getLocalStore();
    const foundTrip = store.trips.find(t => t.code.toUpperCase() === code.toUpperCase());

    if (foundTrip) {
      const existingMember = store.members.find(m => m.trip_id === foundTrip.id && m.email === sessionUser?.email);
      if (!existingMember) {
        const newMember = {
          id: `m-${Date.now()}`,
          trip_id: foundTrip.id,
          name: sessionUser?.user_metadata?.full_name || 'College Friend',
          email: sessionUser?.email || 'friend@college.edu',
          avatar_color: '#059669'
        };
        store.members.push(newMember);
        saveLocalStore(store);
      }

      setActiveTrip(foundTrip);
      loadTripDetails(foundTrip.id, store);
      return true;
    }
    return false;
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  if (!sessionUser) {
    return (
      <Auth
        onLoginSuccess={(user) => setSessionUser(user)}
      />
    );
  }

  // If no trips exist yet, render clean onboarding UI
  if (!activeTrip || trips.length === 0) {
    return (
      <div className="app-container">
        <Navbar
          activeTrip={null}
          currentUser={null}
          allMembers={[]}
          onChangeCurrentUser={() => {}}
          onOpenTripModal={() => setIsTripSelectorOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onLogout={handleLogout}
        />
        <main className="main-content" style={{ maxWidth: '520px', paddingTop: '3rem' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                <Compass size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create Your First Trip</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Start tracking shared expenses with your college friends!
              </p>
            </div>

            <form onSubmit={handleCreateFirstTrip}>
              <div className="form-group">
                <label className="form-label">Trip Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Goa Trip 2026"
                  value={onboardTripName}
                  onChange={e => setOnboardTripName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul"
                  value={onboardUserName}
                  onChange={e => setOnboardUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Friends Going on Trip (Comma Separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Priya, Rohan, Ananya"
                  value={onboardFriends}
                  onChange={e => setOnboardFriends(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
                Start Trip & Split Expenses <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </main>
        <SqlScriptModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeTrip={activeTrip}
        currentUser={currentMember}
        allMembers={tripMembers}
        onChangeCurrentUser={(m) => setCurrentMember(m)}
        onOpenTripModal={() => setIsTripSelectorOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="main-content">
        {/* Navigation Tabs & Member Add Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.75rem'
        }}>
          <div className="tab-navigation" style={{ marginBottom: 0, flex: 1, maxWidth: '550px' }}>
            <button
              className={`tab-btn ${activeTab === 'portal' ? 'active' : ''}`}
              onClick={() => setActiveTab('portal')}
            >
              <User size={16} /> My Portal
            </button>
            <button
              className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <Receipt size={16} /> Expenses ({expenses.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`}
              onClick={() => setActiveTab('settlement')}
            >
              <Zap size={16} /> Settlements
            </button>
          </div>

          <button
            onClick={() => setShowAddFriendModal(true)}
            className="btn btn-secondary btn-sm"
            title="Add another friend to this trip"
          >
            <UserPlus size={14} /> Add Friend ({tripMembers.length})
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'portal' && (
          <PersonalPortal
            currentUser={currentMember}
            tripMembers={tripMembers}
            expenses={expenses}
            settlements={settlements}
            onSettleUp={handleSettleUp}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            tripMembers={tripMembers}
            currentUser={currentMember}
            onOpenAddModal={() => setIsAddExpenseOpen(true)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementView
            tripMembers={tripMembers}
            expenses={expenses}
            settlements={settlements}
            onSettleUp={handleSettleUp}
          />
        )}
      </main>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="modal-overlay" onClick={() => setShowAddFriendModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.85rem' }}>Add Friend to Trip</h3>
            <form onSubmit={handleAddFriend}>
              <div className="form-group">
                <label className="form-label">Friend's Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sanya"
                  value={newFriendName}
                  onChange={e => setNewFriendName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFriendModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Friend</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        tripMembers={tripMembers}
        currentUser={currentMember}
        onAddExpense={handleAddExpense}
      />

      <TripSelector
        isOpen={isTripSelectorOpen}
        onClose={() => setIsTripSelectorOpen(false)}
        trips={trips}
        activeTrip={activeTrip}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTrip}
        onJoinTrip={handleJoinTrip}
      />

      <SqlScriptModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
