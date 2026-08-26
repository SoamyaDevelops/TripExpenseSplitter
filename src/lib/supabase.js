import { createClient } from '@supabase/supabase-js';

// Provided Supabase configuration
const SUPABASE_URL = 'https://kobbloiulyfijrsjimmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYmJsb2l1bHlmaWpyc2ppbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjM5NTYsImV4cCI6MjEwMzMzOTk1Nn0.H-V3KneyR8bvtmmYd9HEW1W61jrs7Blwm62SHk8jCpk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Empty Initial Data - No Fake Mock Data!
export const EMPTY_INITIAL_DATA = {
  trips: [],
  members: [],
  expenses: [],
  settlements: []
};

export const DEMO_SAMPLE_DATA = {
  trips: [
    {
      id: 'demo-trip-1',
      title: 'Goa Beach Trip 🌴',
      description: 'College road trip to North Goa',
      code: 'GOA2026',
      created_at: new Date().toISOString()
    }
  ],
  members: [
    { id: 'm-1', trip_id: 'demo-trip-1', name: 'Aarav Sharma', email: 'aarav@college.edu', avatar_color: '#4f46e5' },
    { id: 'm-2', trip_id: 'demo-trip-1', name: 'Priya Patel', email: 'priya@college.edu', avatar_color: '#059669' },
    { id: 'm-3', trip_id: 'demo-trip-1', name: 'Rohan Verma', email: 'rohan@college.edu', avatar_color: '#d97706' },
    { id: 'm-4', trip_id: 'demo-trip-1', name: 'Ananya Sen', email: 'ananya@college.edu', avatar_color: '#e11d48' }
  ],
  expenses: [
    {
      id: 'exp-1',
      trip_id: 'demo-trip-1',
      title: 'Beach Villa Airbnb',
      amount: 12000,
      paid_by: 'm-1',
      category: 'Stay',
      created_at: new Date().toISOString(),
      splits: [
        { member_id: 'm-1', amount: 3000 },
        { member_id: 'm-2', amount: 3000 },
        { member_id: 'm-3', amount: 3000 },
        { member_id: 'm-4', amount: 3000 }
      ]
    }
  ],
  settlements: []
};

// Local storage state helpers
export const getLocalStore = () => {
  const data = localStorage.getItem('trip_split_clean_v2');
  if (!data) {
    localStorage.setItem('trip_split_clean_v2', JSON.stringify(EMPTY_INITIAL_DATA));
    return EMPTY_INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const saveLocalStore = (data) => {
  localStorage.setItem('trip_split_clean_v2', JSON.stringify(data));
};
