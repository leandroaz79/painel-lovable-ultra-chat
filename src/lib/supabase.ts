import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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
  
  // Usuário final
  USER_CREATE_TRIAL: '/functions/v1/user-create-trial',
  CUSTOMER_CREATE_PAYMENT: '/functions/v1/customer-create-payment',
  CUSTOMER_CHECK_PAYMENT: '/functions/v1/customer-check-payment',
  USER_DELETE_ACCOUNT: '/functions/v1/user-delete-account',
  ADMIN_MANAGE_CUSTOMER_PURCHASE: '/functions/v1/admin-manage-customer-purchase',
  ADMIN_MANAGE_CREDIT_PURCHASE: '/functions/v1/admin-manage-credit-purchase',
}
