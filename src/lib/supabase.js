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
    
    // Also update auth metadata
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
  const data = localStorage.getItem('trip_split_friends_v5');
  if (!data) {
    localStorage.setItem('trip_split_friends_v5', JSON.stringify(EMPTY_INITIAL_DATA));
    return EMPTY_INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const saveLocalStore = (data) => {
  localStorage.setItem('trip_split_friends_v5', JSON.stringify(data));
};
