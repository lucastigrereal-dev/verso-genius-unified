import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/shared/types/database.types'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

/**
 * Supabase client with service role (bypasses RLS)
 * Use for server-side operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Supabase client with anon key (respects RLS)
 * Use for client-side operations
 */
export const supabaseAnon = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

export default supabase
