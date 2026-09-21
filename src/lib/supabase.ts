import { createClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      supabaseUrl?: string
      supabaseAnonKey?: string
    }
  }
}

const runtimeConfig = typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : undefined

// Runtime config (injected via /env.js in Docker/production) takes precedence.
// Fallback to build-time Vite env vars so local `npm run dev` works without
// needing a generated public/env.js.
const supabaseUrl = runtimeConfig?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = runtimeConfig?.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL: set window.__RUNTIME_CONFIG__.supabaseUrl or VITE_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key: set window.__RUNTIME_CONFIG__.supabaseAnonKey or VITE_SUPABASE_ANON_KEY')
}

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const FUNCTIONS = {
  LIST_LICENSES: '/functions/v1/admin-list-licenses',
  CREATE_LICENSE: '/functions/v1/admin-create-license',
  RESET_HWID: '/functions/v1/admin-reset-hwid',
  RENEW_LICENSE: '/functions/v1/admin-renew-license',
  REVOKE_LICENSE: '/functions/v1/admin-revoke-license',
  DELETE_LICENSE: '/functions/v1/admin-delete-license',
  CLEANUP_EXPIRED_TRIALS: '/functions/v1/admin-cleanup-expired-trials',
  ADMIN_CREATE_RESELLER: '/functions/v1/admin-create-reseller',
  ADMIN_MANAGE_RESELLER: '/functions/v1/admin-manage-reseller',
  ADMIN_LIST_CUSTOMERS: '/functions/v1/admin-list-customers',
  ADMIN_MANAGE_CUSTOMER: '/functions/v1/admin-manage-customer',
  ADMIN_LIST_CUSTOMER_PURCHASES: '/functions/v1/admin-list-customer-purchases',
  
  // Revendedor
  RESELLER_DASHBOARD: '/functions/v1/reseller-dashboard',
  RESELLER_CREATE_LICENSE: '/functions/v1/reseller-create-license',
  RESELLER_LIST_LICENSES: '/functions/v1/reseller-list-licenses',
  RESELLER_BUY_CREDITS: '/functions/v1/reseller-buy-credits',
  RESELLER_DELETE_LICENSE: '/functions/v1/reseller-delete-license',
  RESELLER_LIST_PURCHASES: '/functions/v1/reseller-list-purchases',
  
  // Usuário final
  USER_CREATE_TRIAL: '/functions/v1/user-create-trial',
  CUSTOMER_CREATE_PAYMENT: '/functions/v1/customer-create-payment',
  CUSTOMER_CHECK_PAYMENT: '/functions/v1/customer-check-payment',
  USER_DELETE_ACCOUNT: '/functions/v1/user-delete-account',
  ADMIN_MANAGE_CUSTOMER_PURCHASE: '/functions/v1/admin-manage-customer-purchase',
  ADMIN_MANAGE_CREDIT_PURCHASE: '/functions/v1/admin-manage-credit-purchase',
  
  // Meta Integration
  GET_META_SETTINGS: '/functions/v1/get-meta-settings',
  UPDATE_META_SETTINGS: '/functions/v1/update-meta-settings',
  META_CAPI_EVENT: '/functions/v1/meta-capi-event',
}
