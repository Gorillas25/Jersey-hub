import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  role: 'reseller' | 'member' | 'admin' | 'super_admin';
  subscription_status: 'active' | 'inactive' | 'trial';
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Jersey = {
  id: string;
  title: string;
  team_id: string;
  team_name: string;
  image_url: string;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  teams: { name: string } | null;
};

export type WebhookLog = {
  id: string;
  reseller_id: string;
  client_phone: string;
  jersey_ids: string[];
  webhook_response: any;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
};
