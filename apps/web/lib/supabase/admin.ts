import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createAdminClient(){
  const {url}=getSupabaseEnv();
  const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!serviceRoleKey)throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
}
