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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verificar se é admin
    const { data: role, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !role) {
      throw new Error("Forbidden: Admin access required");
    }

    const {
      reseller_id,
      user_id,
      action,
      credits,
      name,
      email,
      whatsapp,
      status,
    } = await req.json();

    if ((!reseller_id && !user_id) || !action) {
      throw new Error("reseller_id ou user_id e action são obrigatórios");
    }

    if (!["approve", "suspend", "add_credits", "update_profile", "delete"].includes(action)) {
      throw new Error("Action inválida. Use: approve, suspend, add_credits, update_profile, delete");
    }

    const resellerLookupColumn = reseller_id ? "id" : "user_id";
    const resellerLookupValue = reseller_id ?? user_id;

    // Buscar revendedor
    const { data: reseller, error: resellerError } = await adminClient
      .from("resellers")
      .select("*")
      .eq(resellerLookupColumn, resellerLookupValue)
      .single();

    if (resellerError || !reseller) {
      throw new Error("Revendedor não encontrado");
    }

    const { data: resellerAuthUser, error: resellerAuthUserError } = await adminClient.auth.admin.getUserById(reseller.user_id);
    if (resellerAuthUserError) throw resellerAuthUserError;

    const currentEmail = resellerAuthUser.user?.email?.toLowerCase() ?? null;

    let result;

    if (action === "approve") {
      // Aprovar revendedor (ativa conta)
      const { data, error } = await adminClient
        .from("resellers")
        .update({ 
          status: "active",
          activation_fee_paid: true,
          activation_paid_at: new Date().toISOString()
        })
        .eq("id", reseller.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "approve_reseller",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: { previous_status: reseller.status }
      });

    } else if (action === "suspend") {
      // Suspender revendedor
      const { data, error } = await adminClient
        .from("resellers")
        .update({ status: "suspended" })
        .eq("id", reseller.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "suspend_reseller",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: { previous_status: reseller.status }
      });

    } else if (action === "add_credits") {
      // Adicionar créditos manualmente (bônus)
      if (!credits || credits < 1) {
        throw new Error("Quantidade de créditos inválida");
      }

      const { data, error } = await adminClient
        .from("resellers")
        .update({ 
          credits: reseller.credits + credits,
          total_credits_purchased: reseller.total_credits_purchased + credits
        })
        .eq("id", reseller.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Registrar transação de bônus
      await adminClient
        .from("reseller_credit_transactions")
        .insert({
          reseller_id: reseller.id,
          type: "bonus",
          amount: credits,
          price_per_unit: null,
          total_paid: null,
          payment_method: "manual",
          payment_status: "paid",
          metadata: { added_by_admin: user.user.id }
        });

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "add_credits_manual",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: { credits_added: credits, previous_balance: reseller.credits }
      });
    } else if (action === "update_profile") {
      if (!name || !email) {
        throw new Error("Nome e email são obrigatórios");
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedName = String(name).trim();
      const normalizedWhatsapp = whatsapp ? String(whatsapp).trim() : null;
      const normalizedStatus = status ?? reseller.status;

      if (!["pending", "active", "suspended"].includes(normalizedStatus)) {
        throw new Error("Status inválido");
      }

      const { data: users, error: listUsersError } = await adminClient.auth.admin.listUsers();
      if (listUsersError) throw listUsersError;

      const conflictingUser = users.users.find(
        (candidate) => candidate.email?.toLowerCase() === normalizedEmail && candidate.id !== reseller.user_id,
      );

      if (conflictingUser) {
        throw new Error("Já existe um usuário com este email");
      }

      if (normalizedEmail !== currentEmail) {
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(reseller.user_id, {
          email: normalizedEmail,
          email_confirm: true,
        });

        if (updateAuthError) throw updateAuthError;
      }

      const { data, error } = await adminClient
        .from("resellers")
        .update({
          name: normalizedName,
          whatsapp: normalizedWhatsapp,
          status: normalizedStatus,
        })
        .eq("id", reseller.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "update_reseller_profile",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: {
          previous_name: reseller.name,
          previous_email: currentEmail,
          previous_whatsapp: reseller.whatsapp,
          previous_status: reseller.status,
          name: normalizedName,
          email: normalizedEmail,
          whatsapp: normalizedWhatsapp,
          status: normalizedStatus,
        }
      });
    } else if (action === "delete") {
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", reseller.user_id)
        .eq("role", "reseller");

      const { error: deleteResellerError } = await adminClient
        .from("resellers")
        .delete()
        .eq("id", reseller.id);

      if (deleteResellerError) throw deleteResellerError;

      result = { deleted: true, user_id: reseller.user_id, reseller_id: reseller.id };

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "delete_reseller",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: {
          user_id: reseller.user_id,
          name: reseller.name,
          email: currentEmail,
          whatsapp: reseller.whatsapp,
          status: reseller.status,
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reseller: result,
        message: `Ação '${action}' executada com sucesso`
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
