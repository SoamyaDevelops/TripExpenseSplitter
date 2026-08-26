import { createClient } from '@supabase/supabase-js';

// Provided Supabase configuration
const SUPABASE_URL = 'https://kobbloiulyfijrsjimmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYmJsb2l1bHlmaWpyc2ppbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjM5NTYsImV4cCI6MjEwMzMzOTk1Nn0.H-V3KneyR8bvtmmYd9HEW1W61jrs7Blwm62SHk8jCpk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UUID Validation and Generator Helpers
export const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const ensureUUID = (idStr) => {
  if (isValidUUID(idStr)) return idStr;
  return generateUUID();
};

// Search Supabase profiles table for real registered users
export const searchSupabaseProfiles = async (query) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const cleanQ = query.trim();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${cleanQ}%,full_name.ilike.%${cleanQ}%`)
      .limit(10);

    if (error) return [];
    return data || [];
  } catch (err) {
    console.error('Failed to search Supabase profiles:', err);
    return [];
  }
};

// Sync profile updates to Supabase profiles table
export const updateUserProfile = async (userId, profileData) => {
  if (!isValidUUID(userId)) return { success: false, error: 'Invalid User UUID' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        avatar_color: profileData.avatar_color || '#4f46e5',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    
    await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        avatar_color: profileData.avatar_color
      }
    });

    return { success: true, data };
  } catch (err) {
    console.error('Error updating profile in Supabase:', err);
    return { success: false, error: err.message };
  }
};

// REAL SUPABASE FRIENDSHIP DB FUNCTIONS
export const sendSupabaseFriendRequest = async (requesterId, addresseeId) => {
  if (!isValidUUID(requesterId) || !isValidUUID(addresseeId)) {
    return { success: false, error: 'Invalid UUIDs' };
  }
  try {
    const { data, error } = await supabase
      .from('friendships')
      .upsert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'requester_id,addressee_id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to send friend request in Supabase:', err);
    return { success: false, error: err.message };
  }
};

export const fetchSupabaseFriendships = async (userId) => {
  if (!isValidUUID(userId)) return [];
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error || !data || data.length === 0) return [];

    const userIds = new Set();
    data.forEach(f => {
      if (isValidUUID(f.requester_id)) userIds.add(f.requester_id);
      if (isValidUUID(f.addressee_id)) userIds.add(f.addressee_id);
    });

    const { data: profileList } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_color')
      .in('id', Array.from(userIds));

    const profileMap = {};
    (profileList || []).forEach(p => { profileMap[p.id] = p; });

    return data.map(f => {
      const reqP = profileMap[f.requester_id] || { full_name: 'Friend', email: '' };
      const addP = profileMap[f.addressee_id] || { full_name: 'Friend', email: '' };
      return {
        ...f,
        requester_name: reqP.full_name,
        requester_email: reqP.email,
        requester_color: reqP.avatar_color || '#4f46e5',
        addressee_name: addP.full_name,
        addressee_email: addP.email,
        addressee_color: addP.avatar_color || '#059669'
      };
    });
  } catch (err) {
    console.error('Failed to fetch friendships from Supabase:', err);
    return [];
  }
};

export const respondSupabaseFriendRequest = async (friendshipId, newStatus) => {
  if (!isValidUUID(friendshipId)) return { success: false };
  try {
    if (newStatus === 'rejected') {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', friendshipId);
      if (error) throw error;
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to update friendship status in Supabase:', err);
    return { success: false, error: err.message };
  }
};

// REAL SUPABASE GROUPS & GROUP MEMBERS FUNCTIONS
export const createSupabaseGroup = async ({ name, description, created_by, members }) => {
  try {
    const validCreatorId = isValidUUID(created_by) ? created_by : null;

    const { data: groupData, error: groupErr } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: validCreatorId
      })
      .select()
      .single();

    if (groupErr) throw groupErr;

    const group_id = groupData.id;

    const memberRows = members.map(m => ({
      group_id,
      user_id: isValidUUID(m.user_id || m.id) ? (m.user_id || m.id) : null,
      display_name: m.display_name || m.name,
      email: m.email || '',
      avatar_color: m.avatar_color || '#4f46e5'
    }));

    const { data: memberData, error: memberErr } = await supabase
      .from('group_members')
      .insert(memberRows)
      .select();

    if (memberErr) console.warn('Group members insert notice:', memberErr.message);

    return { success: true, group: groupData, members: memberData || memberRows };
  } catch (err) {
    console.error('Failed to create group in Supabase:', err);
    return { success: false, error: err.message };
  }
};

export const fetchSupabaseUserGroups = async (userEmail, userId) => {
  try {
    const validUserId = isValidUUID(userId) ? userId : null;
    let memberQuery = supabase.from('group_members').select('*');

    if (userEmail && validUserId) {
      memberQuery = memberQuery.or(`user_id.eq.${validUserId},email.ilike.${userEmail}`);
    } else if (validUserId) {
      memberQuery = memberQuery.eq('user_id', validUserId);
    } else if (userEmail) {
      memberQuery = memberQuery.ilike('email', userEmail);
    }

    const { data: myMemberships, error: memErr } = await memberQuery;
    if (memErr || !myMemberships || myMemberships.length === 0) return { groups: [], groupMembers: [] };

    const groupIds = Array.from(new Set(myMemberships.map(m => m.group_id))).filter(isValidUUID);
    if (groupIds.length === 0) return { groups: [], groupMembers: [] };

    const { data: groupList, error: groupErr } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupErr) return { groups: [], groupMembers: [] };

    const { data: allGroupMembers } = await supabase
      .from('group_members')
      .select('*')
      .in('group_id', groupIds);

    return {
      groups: groupList || [],
      groupMembers: allGroupMembers || []
    };
  } catch (err) {
    console.error('Failed to fetch user groups from Supabase:', err);
    return { groups: [], groupMembers: [] };
  }
};

export const addSupabaseGroupMember = async (groupId, display_name, email, avatar_color = '#4f46e5') => {
  if (!isValidUUID(groupId)) return { success: false };
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        display_name,
        email,
        avatar_color
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, member: data };
  } catch (err) {
    console.error('Failed to add group member in Supabase:', err);
    return { success: false, error: err.message };
  }
};

// REAL SUPABASE TRIPS & TRIP MEMBERS FUNCTIONS
export const createSupabaseTrip = async ({ group_id, title, description, code, created_by, selected_group_members }) => {
  const safeGroupId = ensureUUID(group_id);
  try {
    const validCreatorId = isValidUUID(created_by) ? created_by : null;

    const { data: tripData, error: tripErr } = await supabase
      .from('trips')
      .insert({
        group_id: safeGroupId,
        title,
        description,
        code,
        status: 'active',
        created_by: validCreatorId
      })
      .select()
      .single();

    if (tripErr) throw tripErr;

    const trip_id = tripData.id;

    const memberRows = selected_group_members.map(gm => ({
      trip_id,
      user_id: isValidUUID(gm.user_id) ? gm.user_id : null,
      name: gm.display_name || gm.name,
      email: gm.email || '',
      avatar_color: gm.avatar_color || '#4f46e5'
    }));

    const { data: tmData, error: tmErr } = await supabase
      .from('trip_members')
      .insert(memberRows)
      .select();

    if (tmErr) console.warn('Trip members insert notice:', tmErr.message);

    await supabase.from('chat_messages').insert({
      trip_id,
      text: `🎉 Trip "${title}" was created!`,
      is_system_event: true,
      created_at: new Date().toISOString()
    });

    return { success: true, trip: tripData, members: tmData || memberRows };
  } catch (err) {
    console.error('Failed to create trip in Supabase:', err);
    return { success: false, error: err.message };
  }
};

export const fetchSupabaseGroupTrips = async (groupId) => {
  if (!groupId || !isValidUUID(groupId)) {
    return { trips: [], tripMembers: [], expenses: [] };
  }
  try {
    const { data: tripList, error: tripErr } = await supabase
      .from('trips')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (tripErr || !tripList) return { trips: [], tripMembers: [], expenses: [] };

    const tripIds = tripList.map(t => t.id).filter(isValidUUID);
    if (tripIds.length === 0) return { trips: tripList, tripMembers: [], expenses: [] };

    const { data: tmList } = await supabase.from('trip_members').select('*').in('trip_id', tripIds);
    const { data: expList } = await supabase.from('expenses').select('*').in('trip_id', tripIds);

    return {
      trips: tripList,
      tripMembers: tmList || [],
      expenses: expList || []
    };
  } catch (err) {
    console.error('Failed to fetch group trips from Supabase:', err);
    return { trips: [], tripMembers: [], expenses: [] };
  }
};

export const fetchSupabaseTripWorkspace = async (tripId) => {
  if (!tripId || !isValidUUID(tripId)) {
    return { tripMembers: [], expenses: [], settlements: [], chatMessages: [] };
  }
  try {
    const { data: tmList } = await supabase.from('trip_members').select('*').eq('trip_id', tripId);
    const { data: expList } = await supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false });
    const { data: splitList } = await supabase.from('expense_splits').select('*');
    const { data: setList } = await supabase.from('settlements').select('*').eq('trip_id', tripId).order('created_at', { ascending: false });
    const { data: msgList } = await supabase.from('chat_messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true });

    const splitMap = {};
    (splitList || []).forEach(s => {
      if (!splitMap[s.expense_id]) splitMap[s.expense_id] = [];
      splitMap[s.expense_id].push(s);
    });

    const enrichedExpenses = (expList || []).map(e => ({
      ...e,
      splits: splitMap[e.id] || []
    }));

    return {
      tripMembers: tmList || [],
      expenses: enrichedExpenses,
      settlements: setList || [],
      chatMessages: msgList || []
    };
  } catch (err) {
    console.error('Failed to fetch trip workspace from Supabase:', err);
    return { tripMembers: [], expenses: [], settlements: [], chatMessages: [] };
  }
};

// Initial store fallback structure
export const EMPTY_INITIAL_DATA = {
  groups: [],
  groupMembers: [],
  trips: [],
  tripMembers: [],
  expenses: [],
  settlements: [],
  chatMessages: [],
  friendships: []
};

// Local storage state helpers with automatic UUID conversion for legacy IDs
export const getLocalStore = () => {
  try {
    const raw = localStorage.getItem('trip_split_clean_v10');
    if (!raw) {
      localStorage.setItem('trip_split_clean_v10', JSON.stringify(EMPTY_INITIAL_DATA));
      return EMPTY_INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);

    // Sanitize any legacy non-UUID IDs
    if (parsed.groups) {
      parsed.groups = parsed.groups.map(g => ({ ...g, id: ensureUUID(g.id) }));
    }
    if (parsed.trips) {
      parsed.trips = parsed.trips.map(t => ({ ...t, id: ensureUUID(t.id), group_id: ensureUUID(t.group_id) }));
    }

    return parsed;
  } catch (e) {
    return EMPTY_INITIAL_DATA;
  }
};

export const saveLocalStore = (data) => {
  localStorage.setItem('trip_split_clean_v10', JSON.stringify(data));
};
