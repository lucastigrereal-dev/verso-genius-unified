import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/shared/types/database.types'

// Lazy initialization - só cria client quando realmente usado
let _supabase: ReturnType<typeof createClient<Database>> | null = null
let _supabaseAnon: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || 'https://cxuethubwfvqolsppfst.supabase.co'
  return url
}

function getSupabaseKey(): string {
  const key = process.env.SUPABASE_SERVICE_KEY || 
              process.env.SUPABASE_ANON_KEY ||
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWV0aHVid2Z2cW9sc3BwZnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1MjM1NCwiZXhwIjoyMDg1NTI4MzU0fQ.exKab4S_Ge760AqfkZNS2mKTYNwPsBC1QmknoUk_giQ'
  
  if (!key) {
    throw new Error('Missing Supabase KEY. Check environment variables.')
  }
  
  return key
}

/**
 * Supabase client with service role (bypasses RLS)
 * Use for server-side operations
 */
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    if (!_supabase) {
      const url = getSupabaseUrl()
      const key = getSupabaseKey()
      
      console.log('🔧 Creating Supabase client...')
      console.log('   URL:', url)
      console.log('   Key exists:', !!key)
      
      _supabase = createClient<Database>(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return Reflect.get(_supabase, prop)
  }
})

/**
 * Supabase client with anon key (respects RLS)
 * Use for client-side operations
 */
export const supabaseAnon = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    if (!_supabaseAnon) {
      const url = getSupabaseUrl()
      const anonKey = process.env.SUPABASE_ANON_KEY || getSupabaseKey()
      
      _supabaseAnon = createClient<Database>(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      })
    }
    return Reflect.get(_supabaseAnon, prop)
  }
})

export default supabase
