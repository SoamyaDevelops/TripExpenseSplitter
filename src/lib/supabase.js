import { createClient } from '@supabase/supabase-js';

// Provided Supabase configuration
const SUPABASE_URL = 'https://kobbloiulyfijrsjimmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYmJsb2l1bHlmaWpyc2ppbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjM5NTYsImV4cCI6MjEwMzMzOTk1Nn0.H-V3KneyR8bvtmmYd9HEW1W61jrs7Blwm62SHk8jCpk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    if (error) {
      console.warn('Supabase profile query notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Failed to search Supabase profiles:', err);
    return [];
  }
};

// Sync profile updates to Supabase profiles table
export const updateUserProfile = async (userId, profileData) => {
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
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) return [];
    if (!data || data.length === 0) return [];

    const userIds = new Set();
    data.forEach(f => {
      userIds.add(f.requester_id);
      userIds.add(f.addressee_id);
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
    const { data: groupData, error: groupErr } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by
      })
      .select()
      .single();

    if (groupErr) throw groupErr;

    const group_id = groupData.id;

    // Prepare member rows
    const memberRows = members.map(m => ({
      group_id,
      user_id: m.user_id || m.id || null,
      display_name: m.display_name || m.name,
      email: m.email || '',
      avatar_color: m.avatar_color || '#4f46e5'
    }));

    const { data: memberData, error: memberErr } = await supabase
      .from('group_members')
      .insert(memberRows)
      .select();

    if (memberErr) console.warn('Group members insert warning:', memberErr.message);

    return { success: true, group: groupData, members: memberData || memberRows };
  } catch (err) {
    console.error('Failed to create group in Supabase:', err);
    return { success: false, error: err.message };
  }
};

export const fetchSupabaseUserGroups = async (userEmail, userId) => {
  try {
    // 1. Fetch group_members where user matches email or user_id
    let memberQuery = supabase.from('group_members').select('*');
    if (userEmail && userId) {
      memberQuery = memberQuery.or(`user_id.eq.${userId},email.ilike.${userEmail}`);
    } else if (userId) {
      memberQuery = memberQuery.eq('user_id', userId);
    } else if (userEmail) {
      memberQuery = memberQuery.ilike('email', userEmail);
    }

    const { data: myMemberships, error: memErr } = await memberQuery;
    if (memErr) return { groups: [], groupMembers: [] };
    if (!myMemberships || myMemberships.length === 0) return { groups: [], groupMembers: [] };

    const groupIds = Array.from(new Set(myMemberships.map(m => m.group_id)));

    // 2. Fetch all groups matching groupIds
    const { data: groupList, error: groupErr } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupErr) return { groups: [], groupMembers: [] };

    // 3. Fetch all members for these groups
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

// Local storage state helpers
export const getLocalStore = () => {
  const data = localStorage.getItem('trip_split_groups_v7');
  if (!data) {
    localStorage.setItem('trip_split_groups_v7', JSON.stringify(EMPTY_INITIAL_DATA));
    return EMPTY_INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const saveLocalStore = (data) => {
  localStorage.setItem('trip_split_groups_v7', JSON.stringify(data));
};
