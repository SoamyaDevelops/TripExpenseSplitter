import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import PersonalPortal from './components/PersonalPortal';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import SettlementView from './components/SettlementView';
import TripChat from './components/TripChat';
import ProfileModal from './components/ProfileModal';
import FriendsManager from './components/FriendsManager';
import {
  supabase,
  getLocalStore,
  saveLocalStore,
  sendSupabaseFriendRequest,
  fetchSupabaseFriendships,
  respondSupabaseFriendRequest
} from './lib/supabase';
import { User, Receipt, Zap, MessageSquare, ArrowLeft, UserPlus } from 'lucide-react';
import './App.css';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Hierarchy Data
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripMembers, setTripMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [friendships, setFriendships] = useState([]);

  // Navigation Level: 'groups' | 'group_detail' | 'trip_detail'
  const [viewMode, setViewMode] = useState('groups');
  const [tripTab, setTripTab] = useState('portal'); // 'portal' | 'expenses' | 'chat' | 'settlement'

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  // Initialize data on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchSupabaseUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchSupabaseUserProfile(session.user);
      } else {
        setSessionUser(null);
        setUserProfile(null);
      }
    });

    loadData();
    return () => subscription.unsubscribe();
  }, []);

  // Poll for live friendship requests every 4 seconds
  useEffect(() => {
    if (!userProfile?.id) return;

    const loadFriendships = async () => {
      const live = await fetchSupabaseFriendships(userProfile.id);
      if (live && live.length > 0) {
        setFriendships(live);
        const store = getLocalStore();
        store.friendships = live;
        saveLocalStore(store);
      }
    };

    loadFriendships();
    const interval = setInterval(loadFriendships, 4000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  const fetchSupabaseUserProfile = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const profileObj = {
          id: data.id,
          name: data.full_name || user.email.split('@')[0],
          full_name: data.full_name,
          email: data.email || user.email,
          phone: data.phone || '',
          bio: data.bio || '',
          avatar_color: data.avatar_color || '#4f46e5'
        };
        setUserProfile(profileObj);

        const liveFriendships = await fetchSupabaseFriendships(data.id);
        if (liveFriendships && liveFriendships.length > 0) {
          setFriendships(liveFriendships);
        }
      } else {
        setUserProfile({
          id: user.id,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
          avatar_color: '#4f46e5'
        });
      }
    } catch (err) {
      setUserProfile({
        id: user.id,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        avatar_color: '#4f46e5'
      });
    }
  };

  const loadData = () => {
    const store = getLocalStore();
    setGroups(store.groups || []);
    setGroupMembers(store.groupMembers || []);
    setTrips(store.trips || []);
    setFriendships(store.friendships || []);
  };

  // Compute confirmed accepted friends list for friend pickers
  const confirmedFriends = (userProfile ? friendships.filter(f => f.status === 'accepted') : []).map(f => {
    const isMeRequester = f.requester_id === userProfile?.id;
    return {
      id: isMeRequester ? f.addressee_id : f.requester_id,
      name: isMeRequester ? f.addressee_name : f.requester_name,
      email: isMeRequester ? f.addressee_email : f.requester_email,
      avatar_color: isMeRequester ? f.addressee_color : f.requester_color
    };
  });

  // Open Group Detail
  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    setViewMode('group_detail');
  };

  // Open Trip Detail Workspace
  const handleSelectTrip = (trip) => {
    const store = getLocalStore();
    setActiveTrip(trip);

    const parentGroup = (store.groups || []).find(g => g.id === trip.group_id);
    if (parentGroup) setActiveGroup(parentGroup);

    const members = (store.tripMembers || []).filter(m => m.trip_id === trip.id);
    const exps = (store.expenses || []).filter(e => e.trip_id === trip.id);
    const sets = (store.settlements || []).filter(s => s.trip_id === trip.id);
    const msgs = (store.chatMessages || []).filter(c => c.trip_id === trip.id);

    setTripMembers(members);
    setExpenses(exps);
    setSettlements(sets);
    setChatMessages(msgs);

    if (members.length > 0) {
      setCurrentMember(members[0]);
    } else {
      const myMember = {
        id: `tm-${Date.now()}`,
        trip_id: trip.id,
        name: userProfile?.name || 'Me',
        email: sessionUser?.email || 'me@college.edu',
        avatar_color: userProfile?.avatar_color || '#4f46e5'
      };
      if (!store.tripMembers) store.tripMembers = [];
      store.tripMembers.push(myMember);
      saveLocalStore(store);
      setTripMembers([myMember]);
      setCurrentMember(myMember);
    }

    setViewMode('trip_detail');
  };

  // Create Group Handler (Using selected friend objects)
  const handleCreateGroup = ({ name, description, members }) => {
    const store = getLocalStore();
    const newGroup = {
      id: `group-${Date.now()}`,
      name,
      description,
      created_by: sessionUser?.id,
      created_at: new Date().toISOString()
    };

    if (!store.groups) store.groups = [];
    store.groups.unshift(newGroup);

    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    const myName = userProfile?.name || 'Me';
    const myGroupMember = {
      id: `gm-${Date.now()}-0`,
      group_id: newGroup.id,
      display_name: myName,
      email: sessionUser?.email || 'me@college.edu',
      avatar_color: userProfile?.avatar_color || colorList[0]
    };

    if (!store.groupMembers) store.groupMembers = [];
    store.groupMembers.push(myGroupMember);

    // Add selected friends
    members.forEach((fObj, idx) => {
      store.groupMembers.push({
        id: `gm-${Date.now()}-${idx + 1}`,
        group_id: newGroup.id,
        display_name: fObj.name || fObj.display_name,
        email: fObj.email,
        avatar_color: fObj.avatar_color || colorList[(idx + 1) % colorList.length]
      });
    });

    saveLocalStore(store);

    setGroups([newGroup, ...groups]);
    setGroupMembers(store.groupMembers);
    setActiveGroup(newGroup);
    setViewMode('group_detail');
  };

  // FRIEND REQUEST HANDLERS
  const handleSendFriendRequest = async (targetProfile) => {
    if (!userProfile?.id) return;

    const res = await sendSupabaseFriendRequest(userProfile.id, targetProfile.id);

    const newRequest = {
      id: res.data?.[0]?.id || `fr-${Date.now()}`,
      requester_id: userProfile.id,
      requester_name: userProfile.name || userProfile.full_name,
      requester_email: userProfile.email,
      requester_color: userProfile.avatar_color,
      addressee_id: targetProfile.id,
      addressee_name: targetProfile.full_name,
      addressee_email: targetProfile.email,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const store = getLocalStore();
    if (!store.friendships) store.friendships = [];
    store.friendships.unshift(newRequest);
    saveLocalStore(store);

    setFriendships([...store.friendships]);
  };

  const handleAcceptFriendRequest = async (friendshipId) => {
    await respondSupabaseFriendRequest(friendshipId, 'accepted');

    const store = getLocalStore();
    store.friendships = (store.friendships || []).map(f => {
      if (f.id === friendshipId) {
        return { ...f, status: 'accepted', updated_at: new Date().toISOString() };
      }
      return f;
    });

    saveLocalStore(store);
    setFriendships([...store.friendships]);
  };

  const handleRejectFriendRequest = async (friendshipId) => {
    await respondSupabaseFriendRequest(friendshipId, 'rejected');

    const store = getLocalStore();
    store.friendships = (store.friendships || []).filter(f => f.id !== friendshipId);

    saveLocalStore(store);
    setFriendships([...store.friendships]);
  };

  // Add Member to specific Group
  const handleAddMemberToGroup = (groupId, memberName, email = '') => {
    const store = getLocalStore();
    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    const newGM = {
      id: `gm-${Date.now()}`,
      group_id: groupId,
      display_name: memberName,
      email: email || `${memberName.toLowerCase().replace(/\s+/g, '')}@college.edu`,
      avatar_color: colorList[(store.groupMembers?.length || 0) % colorList.length]
    };
    if (!store.groupMembers) store.groupMembers = [];
    store.groupMembers.push(newGM);
    saveLocalStore(store);
    setGroupMembers([...store.groupMembers]);
  };

  // Create Trip inside Group Handler
  const handleCreateTripInGroup = ({ group_id, title, description, code, selected_member_ids }) => {
    const store = getLocalStore();
    const newTrip = {
      id: `trip-${Date.now()}`,
      group_id,
      title,
      description,
      code,
      status: 'active',
      created_by: sessionUser?.id,
      created_at: new Date().toISOString()
    };

    if (!store.trips) store.trips = [];
    store.trips.unshift(newTrip);

    const activeGMs = (store.groupMembers || []).filter(gm => gm.group_id === group_id && selected_member_ids.includes(gm.id));
    if (!store.tripMembers) store.tripMembers = [];

    activeGMs.forEach(gm => {
      store.tripMembers.push({
        id: `tm-${Date.now()}-${gm.id}`,
        trip_id: newTrip.id,
        name: gm.display_name,
        email: gm.email,
        avatar_color: gm.avatar_color
      });
    });

    const initMsg = {
      id: `chat-${Date.now()}`,
      trip_id: newTrip.id,
      text: `🎉 Trip "${newTrip.title}" was created!`,
      is_system_event: true,
      created_at: new Date().toISOString()
    };
    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(initMsg);

    saveLocalStore(store);

    setTrips([newTrip, ...trips]);
    handleSelectTrip(newTrip);
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

    if (!store.expenses) store.expenses = [];
    store.expenses.unshift(created);

    const payerName = tripMembers.find(m => m.id === newExp.paid_by)?.name || 'Someone';
    const splitCount = newExp.splits?.length || 1;
    const perPerson = (newExp.amount / splitCount).toFixed(2);

    const notificationMsg = {
      id: `chat-${Date.now()}`,
      trip_id: activeTrip.id,
      text: `💸 ${payerName} logged expense "${newExp.title}" (₹${Number(newExp.amount).toLocaleString()}). Split equal: ₹${perPerson} each for ${splitCount} people.`,
      is_system_event: true,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(notificationMsg);

    saveLocalStore(store);

    setExpenses([created, ...expenses]);
    setChatMessages([...chatMessages, notificationMsg]);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expId) => {
    const store = getLocalStore();
    store.expenses = (store.expenses || []).filter(e => e.id !== expId);
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

    if (!store.settlements) store.settlements = [];
    store.settlements.unshift(newSettlement);

    const fromName = tripMembers.find(m => m.id === fromMemberId)?.name || 'User';
    const toName = tripMembers.find(m => m.id === toMemberId)?.name || 'User';

    const setMsg = {
      id: `chat-${Date.now()}`,
      trip_id: activeTrip.id,
      text: `✅ ${fromName} paid ₹${Number(amount).toLocaleString()} to ${toName} and settled up!`,
      is_system_event: true,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(setMsg);

    saveLocalStore(store);

    setSettlements([newSettlement, ...settlements]);
    setChatMessages([...chatMessages, setMsg]);
  };

  // Send Group Chat Message
  const handleSendMessage = (msgObj) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const newMsg = {
      id: `chat-${Date.now()}`,
      trip_id: activeTrip.id,
      ...msgObj,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(newMsg);
    saveLocalStore(store);

    setChatMessages([...chatMessages, newMsg]);
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUserProfile(null);
    setViewMode('groups');
  };

  const pendingRequestsCount = (userProfile ? friendships.filter(f => f.addressee_id === userProfile.id && f.status === 'pending') : []).length;

  if (!sessionUser) {
    return (
      <Auth
        onLoginSuccess={(user) => setSessionUser(user)}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar with Breadcrumb Navigation & Profile Trigger */}
      <Navbar
        activeGroup={activeGroup}
        activeTrip={viewMode === 'trip_detail' ? activeTrip : null}
        currentUser={userProfile || currentMember}
        allMembers={tripMembers}
        pendingFriendRequestsCount={pendingRequestsCount}
        onChangeCurrentUser={(m) => setCurrentMember(m)}
        onGoToGroups={() => { setViewMode('groups'); setActiveTrip(null); }}
        onGoToGroupDetail={() => { setViewMode('group_detail'); setActiveTrip(null); }}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenFriendsModal={() => setShowFriendsModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="main-content">
        {/* LEVEL 1: GROUPS LIST */}
        {viewMode === 'groups' && (
          <GroupList
            groups={groups}
            allGroupMembers={groupMembers}
            allTrips={trips}
            confirmedFriends={confirmedFriends}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}

        {/* LEVEL 2: GROUP DETAIL & TRIPS HISTORY */}
        {viewMode === 'group_detail' && activeGroup && (
          <GroupDetail
            group={activeGroup}
            groupMembers={groupMembers.filter(m => m.group_id === activeGroup.id)}
            trips={trips.filter(t => t.group_id === activeGroup.id)}
            allExpenses={expenses}
            confirmedFriends={confirmedFriends}
            onBackToGroups={() => setViewMode('groups')}
            onSelectTrip={handleSelectTrip}
            onCreateTripInGroup={handleCreateTripInGroup}
            onAddMemberToGroup={handleAddMemberToGroup}
          />
        )}

        {/* LEVEL 3: TRIP WORKSPACE DASHBOARD */}
        {viewMode === 'trip_detail' && activeTrip && (
          <div>
            {/* Back to Group Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setViewMode('group_detail')}
              >
                <ArrowLeft size={14} /> Back to {activeGroup?.name || 'Group'}
              </button>

              <button
                onClick={() => setShowAddFriendModal(true)}
                className="btn btn-secondary btn-sm"
              >
                <UserPlus size={14} /> Add Friend to Trip ({tripMembers.length})
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-navigation" style={{ maxWidth: '680px', margin: '0 auto 1.75rem auto' }}>
              <button
                className={`tab-btn ${tripTab === 'portal' ? 'active' : ''}`}
                onClick={() => setTripTab('portal')}
              >
                <User size={16} /> My Portal
              </button>
              <button
                className={`tab-btn ${tripTab === 'expenses' ? 'active' : ''}`}
                onClick={() => setTripTab('expenses')}
              >
                <Receipt size={16} /> Expenses ({expenses.length})
              </button>
              <button
                className={`tab-btn ${tripTab === 'chat' ? 'active' : ''}`}
                onClick={() => setTripTab('chat')}
              >
                <MessageSquare size={16} /> Trip Chat ({chatMessages.length})
              </button>
              <button
                className={`tab-btn ${tripTab === 'settlement' ? 'active' : ''}`}
                onClick={() => setTripTab('settlement')}
              >
                <Zap size={16} /> Settlements
              </button>
            </div>

            {/* Tab Views */}
            {tripTab === 'portal' && (
              <PersonalPortal
                currentUser={currentMember}
                tripMembers={tripMembers}
                expenses={expenses}
                settlements={settlements}
                onSettleUp={handleSettleUp}
              />
            )}

            {tripTab === 'expenses' && (
              <ExpenseList
                expenses={expenses}
                tripMembers={tripMembers}
                currentUser={currentMember}
                onOpenAddModal={() => setIsAddExpenseOpen(true)}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {tripTab === 'chat' && (
              <TripChat
                messages={chatMessages}
                tripMembers={tripMembers}
                currentUser={currentMember}
                onSendMessage={handleSendMessage}
              />
            )}

            {tripTab === 'settlement' && (
              <SettlementView
                tripMembers={tripMembers}
                expenses={expenses}
                settlements={settlements}
                onSettleUp={handleSettleUp}
              />
            )}
          </div>
        )}
      </main>

      {/* Add Friend to Trip Modal */}
      {showAddFriendModal && activeTrip && (
        <div className="modal-overlay" onClick={() => setShowAddFriendModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.85rem' }}>Add Friend to Trip</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newFriendName.trim()) return;
              const store = getLocalStore();
              const newTM = {
                id: `tm-${Date.now()}`,
                trip_id: activeTrip.id,
                name: newFriendName.trim(),
                email: `${newFriendName.trim().toLowerCase().replace(/\s+/g, '')}@college.edu`,
                avatar_color: '#059669'
              };
              if (!store.tripMembers) store.tripMembers = [];
              store.tripMembers.push(newTM);
              saveLocalStore(store);
              setTripMembers([...tripMembers, newTM]);
              setNewFriendName('');
              setShowAddFriendModal(false);
            }}>
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
                <button type="submit" className="btn btn-primary">Add to Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        tripMembers={tripMembers}
        currentUser={currentMember}
        onAddExpense={handleAddExpense}
      />

      {/* Profile Management Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
      />

      {/* Friends & Network Manager Modal */}
      <FriendsManager
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        currentUser={userProfile}
        friendships={friendships}
        onSendFriendRequest={handleSendFriendRequest}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onRejectFriendRequest={handleRejectFriendRequest}
      />
    </div>
  );
}
