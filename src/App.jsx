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
  generateUUID,
  isValidUUID,
  getLocalStore,
  saveLocalStore,
  sendSupabaseFriendRequest,
  fetchSupabaseFriendships,
  respondSupabaseFriendRequest,
  createSupabaseGroup,
  fetchSupabaseUserGroups,
  addSupabaseGroupMember,
  createSupabaseTrip,
  fetchSupabaseGroupTrips,
  fetchSupabaseTripWorkspace
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
  const [tripTab, setTripTab] = useState('portal');

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
        loadSupabaseGroups(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchSupabaseUserProfile(session.user);
        loadSupabaseGroups(session.user);
      } else {
        setSessionUser(null);
        setUserProfile(null);
      }
    });

    loadData();
    return () => subscription.unsubscribe();
  }, []);

  // Poll for live friendship requests, live groups & live active trips every 3 seconds
  useEffect(() => {
    if (!sessionUser) return;

    const syncLiveSupabaseData = async () => {
      // 1. Sync Friendships
      if (userProfile?.id && isValidUUID(userProfile.id)) {
        const liveFriends = await fetchSupabaseFriendships(userProfile.id);
        if (liveFriends && liveFriends.length > 0) {
          setFriendships(liveFriends);
        }
      }

      // 2. Sync Groups
      const liveGroupRes = await fetchSupabaseUserGroups(sessionUser.email, sessionUser.id);
      if (liveGroupRes.groups && liveGroupRes.groups.length > 0) {
        setGroups(liveGroupRes.groups);
        setGroupMembers(liveGroupRes.groupMembers);
      }

      // 3. Sync Trips for Active Group
      if (activeGroup?.id && isValidUUID(activeGroup.id)) {
        const liveTripRes = await fetchSupabaseGroupTrips(activeGroup.id);
        if (liveTripRes.trips) {
          setTrips(prev => {
            const otherTrips = prev.filter(t => t.group_id !== activeGroup.id);
            return [...liveTripRes.trips, ...otherTrips];
          });
        }
      }

      // 4. Sync Workspace for Active Trip
      if (activeTrip?.id && isValidUUID(activeTrip.id)) {
        const liveWorkspace = await fetchSupabaseTripWorkspace(activeTrip.id);
        if (liveWorkspace.tripMembers && liveWorkspace.tripMembers.length > 0) {
          setTripMembers(liveWorkspace.tripMembers);
          setExpenses(liveWorkspace.expenses);
          setSettlements(liveWorkspace.settlements);
          setChatMessages(liveWorkspace.chatMessages);
        }
      }
    };

    syncLiveSupabaseData();
    const interval = setInterval(syncLiveSupabaseData, 3000);
    return () => clearInterval(interval);
  }, [sessionUser, userProfile?.id, activeGroup?.id, activeTrip?.id]);

  const loadSupabaseGroups = async (user) => {
    const res = await fetchSupabaseUserGroups(user.email, user.id);
    if (res.groups && res.groups.length > 0) {
      setGroups(res.groups);
      setGroupMembers(res.groupMembers);
      const store = getLocalStore();
      store.groups = res.groups;
      store.groupMembers = res.groupMembers;
      saveLocalStore(store);
    }
  };

  const fetchSupabaseUserProfile = async (user) => {
    if (!isValidUUID(user.id)) return;
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

  const confirmedFriends = (userProfile ? friendships.filter(f => f.status === 'accepted') : []).map(f => {
    const isMeRequester = f.requester_id === userProfile?.id;
    return {
      id: isMeRequester ? f.addressee_id : f.requester_id,
      name: isMeRequester ? f.addressee_name : f.requester_name,
      email: isMeRequester ? f.addressee_email : f.requester_email,
      avatar_color: isMeRequester ? f.addressee_color : f.requester_color
    };
  });

  // Open Group Detail & Fetch Trips from Supabase
  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    setViewMode('group_detail');

    if (isValidUUID(group.id)) {
      const res = await fetchSupabaseGroupTrips(group.id);
      if (res.trips && res.trips.length > 0) {
        setTrips(prev => {
          const otherTrips = prev.filter(t => t.group_id !== group.id);
          return [...res.trips, ...otherTrips];
        });
      }
    }
  };

  // Open Trip Detail Workspace
  const handleSelectTrip = async (trip) => {
    setActiveTrip(trip);

    const store = getLocalStore();
    const parentGroup = (store.groups || []).find(g => g.id === trip.group_id);
    if (parentGroup) setActiveGroup(parentGroup);

    if (isValidUUID(trip.id)) {
      const liveWorkspace = await fetchSupabaseTripWorkspace(trip.id);
      if (liveWorkspace.tripMembers && liveWorkspace.tripMembers.length > 0) {
        setTripMembers(liveWorkspace.tripMembers);
        setExpenses(liveWorkspace.expenses);
        setSettlements(liveWorkspace.settlements);
        setChatMessages(liveWorkspace.chatMessages);

        const myMemberCard = liveWorkspace.tripMembers.find(m => m.user_id === userProfile?.id || m.email === userProfile?.email) || liveWorkspace.tripMembers[0];
        setCurrentMember(myMemberCard);
      } else {
        const members = (store.tripMembers || []).filter(m => m.trip_id === trip.id);
        setTripMembers(members);
        setExpenses((store.expenses || []).filter(e => e.trip_id === trip.id));
        setSettlements((store.settlements || []).filter(s => s.trip_id === trip.id));
        setChatMessages((store.chatMessages || []).filter(c => c.trip_id === trip.id));
        if (members.length > 0) setCurrentMember(members[0]);
      }
    } else {
      const members = (store.tripMembers || []).filter(m => m.trip_id === trip.id);
      setTripMembers(members);
      setExpenses((store.expenses || []).filter(e => e.trip_id === trip.id));
      setSettlements((store.settlements || []).filter(s => s.trip_id === trip.id));
      setChatMessages((store.chatMessages || []).filter(c => c.trip_id === trip.id));
      if (members.length > 0) setCurrentMember(members[0]);
    }

    setViewMode('trip_detail');
  };

  // Create Group Handler with Live Supabase Sync
  const handleCreateGroup = async ({ name, description, members }) => {
    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    const myName = userProfile?.name || 'Me';

    const allMembersToSave = [
      {
        user_id: sessionUser?.id,
        display_name: myName,
        email: sessionUser?.email,
        avatar_color: userProfile?.avatar_color || colorList[0]
      },
      ...members.map((fObj, idx) => ({
        user_id: fObj.id || null,
        display_name: fObj.name || fObj.display_name,
        email: fObj.email,
        avatar_color: fObj.avatar_color || colorList[(idx + 1) % colorList.length]
      }))
    ];

    const res = await createSupabaseGroup({
      name,
      description,
      created_by: sessionUser?.id,
      members: allMembersToSave
    });

    const createdGroup = res.group || {
      id: generateUUID(),
      name,
      description,
      created_by: sessionUser?.id,
      created_at: new Date().toISOString()
    };

    const store = getLocalStore();
    if (!store.groups) store.groups = [];
    store.groups.unshift(createdGroup);

    if (!store.groupMembers) store.groupMembers = [];
    (res.members || []).forEach(m => store.groupMembers.push(m));

    saveLocalStore(store);

    setGroups([createdGroup, ...groups]);
    setGroupMembers(store.groupMembers);
    setActiveGroup(createdGroup);
    setViewMode('group_detail');
  };

  // Add Member to specific Group with Live Supabase Sync
  const handleAddMemberToGroup = async (groupId, memberName, email = '') => {
    const colorList = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed'];
    const avatarColor = colorList[groupMembers.length % colorList.length];

    const res = await addSupabaseGroupMember(groupId, memberName, email, avatarColor);

    const newGM = res.member || {
      id: generateUUID(),
      group_id: groupId,
      display_name: memberName,
      email: email || `${memberName.toLowerCase().replace(/\s+/g, '')}@college.edu`,
      avatar_color: avatarColor
    };

    const store = getLocalStore();
    if (!store.groupMembers) store.groupMembers = [];
    store.groupMembers.push(newGM);
    saveLocalStore(store);

    setGroupMembers([...store.groupMembers]);
  };

  // Create Trip inside Group Handler WITH LIVE SUPABASE SYNC FOR ALL GROUP MEMBERS
  const handleCreateTripInGroup = async ({ group_id, title, description, code, selected_member_ids }) => {
    const store = getLocalStore();
    const activeGMs = (store.groupMembers || groupMembers).filter(gm => gm.group_id === group_id && selected_member_ids.includes(gm.id));

    // Save to Supabase DB so ALL group members can see it live!
    const res = await createSupabaseTrip({
      group_id,
      title,
      description,
      code,
      created_by: sessionUser?.id,
      selected_group_members: activeGMs
    });

    const createdTrip = res.trip || {
      id: generateUUID(),
      group_id,
      title,
      description,
      code,
      status: 'active',
      created_by: sessionUser?.id,
      created_at: new Date().toISOString()
    };

    if (!store.trips) store.trips = [];
    store.trips.unshift(createdTrip);

    if (!store.tripMembers) store.tripMembers = [];
    (res.members || []).forEach(tm => store.tripMembers.push(tm));

    saveLocalStore(store);

    setTrips([createdTrip, ...trips]);
    handleSelectTrip(createdTrip);
  };

  // FRIEND REQUEST HANDLERS
  const handleSendFriendRequest = async (targetProfile) => {
    if (!userProfile?.id) return;

    const res = await sendSupabaseFriendRequest(userProfile.id, targetProfile.id);

    const newRequest = {
      id: res.data?.[0]?.id || generateUUID(),
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

  // Add Expense Handler
  const handleAddExpense = async (newExp) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const created = {
      id: generateUUID(),
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
      id: generateUUID(),
      trip_id: activeTrip.id,
      text: `💸 ${payerName} logged expense "${newExp.title}" (₹${Number(newExp.amount).toLocaleString()}). Split equal: ₹${perPerson} each for ${splitCount} people.`,
      is_system_event: true,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(notificationMsg);

    if (isValidUUID(activeTrip.id) && isValidUUID(newExp.paid_by)) {
      try {
        await supabase.from('expenses').insert({
          trip_id: activeTrip.id,
          title: newExp.title,
          amount: newExp.amount,
          paid_by: newExp.paid_by,
          category: newExp.category
        });
        await supabase.from('chat_messages').insert({
          trip_id: activeTrip.id,
          text: notificationMsg.text,
          is_system_event: true
        });
      } catch (e) {
        console.warn('Supabase expense insert notice:', e.message);
      }
    }

    saveLocalStore(store);

    setExpenses([created, ...expenses]);
    setChatMessages([...chatMessages, notificationMsg]);
  };

  // Delete Expense Handler
  const handleDeleteExpense = async (expId) => {
    const store = getLocalStore();
    store.expenses = (store.expenses || []).filter(e => e.id !== expId);
    saveLocalStore(store);

    if (isValidUUID(expId)) {
      try {
        await supabase.from('expenses').delete().eq('id', expId);
      } catch (e) {
        console.warn('Supabase expense delete notice:', e.message);
      }
    }

    setExpenses(expenses.filter(e => e.id !== expId));
  };

  // Settle Up Handler
  const handleSettleUp = async (fromMemberId, toMemberId, amount) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const newSettlement = {
      id: generateUUID(),
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
      id: generateUUID(),
      trip_id: activeTrip.id,
      text: `✅ ${fromName} paid ₹${Number(amount).toLocaleString()} to ${toName} and settled up!`,
      is_system_event: true,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(setMsg);

    if (isValidUUID(activeTrip.id) && isValidUUID(fromMemberId) && isValidUUID(toMemberId)) {
      try {
        await supabase.from('settlements').insert({
          trip_id: activeTrip.id,
          from_member_id: fromMemberId,
          to_member_id: toMemberId,
          amount: Number(amount)
        });
        await supabase.from('chat_messages').insert({
          trip_id: activeTrip.id,
          text: setMsg.text,
          is_system_event: true
        });
      } catch (e) {
        console.warn('Supabase settlement insert notice:', e.message);
      }
    }

    saveLocalStore(store);

    setSettlements([newSettlement, ...settlements]);
    setChatMessages([...chatMessages, setMsg]);
  };

  // Send Group Chat Message
  const handleSendMessage = async (msgObj) => {
    if (!activeTrip) return;

    const store = getLocalStore();
    const newMsg = {
      id: generateUUID(),
      trip_id: activeTrip.id,
      ...msgObj,
      created_at: new Date().toISOString()
    };

    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(newMsg);

    if (isValidUUID(activeTrip.id)) {
      try {
        await supabase.from('chat_messages').insert({
          trip_id: activeTrip.id,
          sender_id: isValidUUID(msgObj.sender_id) ? msgObj.sender_id : null,
          text: msgObj.text,
          is_system_event: false
        });
      } catch (e) {
        console.warn('Supabase chat message insert notice:', e.message);
      }
    }

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
                id: generateUUID(),
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
