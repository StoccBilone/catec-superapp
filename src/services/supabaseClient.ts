import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = async (): Promise<SupabaseClient | null> => {
  if (supabaseInstance) return supabaseInstance;

  const config = await StorageService.getSupabaseConfig();
  if (config.isEnabled && config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client', e);
      return null;
    }
  }
  return null;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};
