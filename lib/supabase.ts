import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (bypasses RLS)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

export type Booking = {
  id: string;
  booking_id: string;
  name: string;
  phone: string;
  email?: string | null;
  dob: string;
  tob?: string | null;
  birth_city: string;
  service: string;
  appointment_date: string;
  time_slot: string;
  confirmed_time_slot?: string | null;
  mode: 'phone' | 'video' | 'in-person';
  query?: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meet_link?: string | null;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};
