import { createClient } from '@supabase/supabase-js';

// Provided Supabase configuration
const SUPABASE_URL = 'https://kobbloiulyfijrsjimmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYmJsb2l1bHlmaWpyc2ppbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjM5NTYsImV4cCI6MjEwMzMzOTk1Nn0.H-V3KneyR8bvtmmYd9HEW1W61jrs7Blwm62SHk8jCpk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Clean Initial Data Store - 100% Real User Inputs Only
export const EMPTY_INITIAL_DATA = {
  trips: [],
  members: [],
  expenses: [],
  settlements: []
};

// Local storage state helpers
export const getLocalStore = () => {
  const data = localStorage.getItem('trip_split_prod_v3');
  if (!data) {
    localStorage.setItem('trip_split_prod_v3', JSON.stringify(EMPTY_INITIAL_DATA));
    return EMPTY_INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const saveLocalStore = (data) => {
  localStorage.setItem('trip_split_prod_v3', JSON.stringify(data));
};
