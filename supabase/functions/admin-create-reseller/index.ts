import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validar usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verificar se é admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .single();

    if (!roles || roles.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const { name, email, whatsapp, password, initial_credits = 0, status = "active" } = await req.json();

    if (!email || !name || !password) {
      throw new Error("Nome, email e senha são obrigatórios");
    }

    // Verificar se o usuário já existe no auth
    const { data: existingUsers, error: listUsersError } = await adminClient.auth.admin.listUsers();
    
    if (listUsersError) throw listUsersError;

    let targetUserId: string;
    let isNewUser = false;

    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      // Usuário já existe
      targetUserId = existingUser.id;
    } else {
      // Criar novo usuário com senha fornecida pelo admin
      const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (createUserError) throw createUserError;
      if (!newUser.user) throw new Error("Erro ao criar usuário");

      targetUserId = newUser.user.id;
      isNewUser = true;
    }

    // Verificar se já é revendedor
    const { data: existingReseller } = await adminClient
      .from("resellers")
      .select("id, status")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingReseller) {
      throw new Error("Usuário já é revendedor");
    }

    // Criar revendedor
    const { data: reseller, error: resellerError } = await adminClient
      .from("resellers")
      .insert({
        user_id: targetUserId,
        name,
        whatsapp,
        status: status,
        credits: initial_credits,
        activation_fee_paid: status === "active"
      })
      .select()
      .single();

    if (resellerError) throw resellerError;

    // Criar role de revendedor
    await adminClient
      .from("user_roles")
      .insert({
        user_id: targetUserId,
        role: "reseller"
      });

    // Log de auditoria
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.user.id,
      action: "create_reseller",
      target_table: "resellers",
      target_id: reseller.id,
      metadata: {
        name,
        email,
        whatsapp,
        initial_credits,
        status,
        is_new_user: isNewUser
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reseller,
        message: `Revendedor criado com sucesso${isNewUser ? ' (usuário novo criado)' : ''}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
