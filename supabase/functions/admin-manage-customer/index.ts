import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");

  const token = authHeader.replace("Bearer ", "");
  const { data: auth, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !auth.user) throw new Error("Unauthorized");

  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) {
    throw new Error("Forbidden: Admin access required");
  }

  return { adminClient, user: auth.user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, user } = await requireAdmin(req);
    const body = await req.json();
    const { user_id, action, name, email, whatsapp, password, initial_credits } = body;

    if (!user_id || !action) {
      throw new Error("user_id e action são obrigatórios");
    }

    if (!["update_profile", "reset_password", "delete", "promote_to_reseller"].includes(action)) {
      throw new Error("Action inválida. Use: update_profile, reset_password, delete, promote_to_reseller");
    }

    const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(user_id);
    if (authUserError || !authUserData.user) {
      throw new Error("Cliente não encontrado");
    }

    const currentUser = authUserData.user;
    const currentEmail = currentUser.email?.toLowerCase() ?? null;
    const currentName = typeof currentUser.user_metadata?.name === "string"
      ? currentUser.user_metadata.name
      : "";

    let result: Record<string, unknown>;

    if (action === "update_profile") {
      if (!name || !email) {
        throw new Error("Nome e email são obrigatórios");
      }

      const normalizedName = String(name).trim();
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedWhatsapp = typeof whatsapp === 'string' ? whatsapp.trim() : '';

      const { data: listedUsers, error: listUsersError } = await adminClient.auth.admin.listUsers();
      if (listUsersError) throw listUsersError;

      const conflictingUser = listedUsers.users.find(
        (candidate) => candidate.email?.toLowerCase() === normalizedEmail && candidate.id !== user_id,
      );

      if (conflictingUser) {
        throw new Error("Já existe um usuário com este email");
      }

      const updatePayload: {
        email?: string;
        email_confirm?: boolean;
        user_metadata: Record<string, unknown>;
      } = {
        user_metadata: {
          ...currentUser.user_metadata,
          name: normalizedName,
          ...(normalizedWhatsapp ? { whatsapp: normalizedWhatsapp } : {}),
        },
      };

      if (normalizedEmail !== currentEmail) {
        updatePayload.email = normalizedEmail;
        updatePayload.email_confirm = true;
      }

      const { data: updatedUserData, error: updateUserError } = await adminClient.auth.admin.updateUserById(
        user_id,
        updatePayload,
      );

      if (updateUserError) throw updateUserError;

      const { error: updateLicensesError } = await adminClient
        .from("ts_licenses")
        .update({
          user_name: normalizedName,
          email: normalizedEmail,
        })
        .eq("user_id", user_id);

      if (updateLicensesError) throw updateLicensesError;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        action: "update_customer_profile",
        target_table: "auth.users",
        target_id: user_id,
        metadata: {
          previous_name: currentName,
          previous_email: currentEmail,
          name: normalizedName,
          email: normalizedEmail,
          whatsapp: normalizedWhatsapp,
        },
      });

      result = {
        id: updatedUserData.user?.id ?? user_id,
        name: normalizedName,
        email: normalizedEmail,
        whatsapp: normalizedWhatsapp,
      };
    } else if (action === "reset_password") {
      if (!password || String(password).length < 6) {
        throw new Error("Senha deve ter no mínimo 6 caracteres");
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, {
        password: String(password),
      });

      if (updateError) throw updateError;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        action: "reset_customer_password",
        target_table: "customer_purchases",
        target_id: user_id,
        metadata: { user_id },
      });

      result = { user_id, password_reset: true };
    } else if (action === "delete") {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        action: "delete_customer_account",
        target_table: "auth.users",
        target_id: user_id,
        metadata: {
          email: currentEmail,
          name: currentName,
        },
      });

      result = { deleted: true, user_id };
    } else if (action === "promote_to_reseller") {
      const initial_credits = typeof body.initial_credits === "number" ? Math.max(0, Math.floor(body.initial_credits)) : 0;

      const { data: existingReseller, error: existingError } = await adminClient
        .from("resellers")
        .select("id, status")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingReseller) {
        throw new Error("Usuário já é revendedor (status: " + existingReseller.status + ")");
      }

      const { data: reseller, error: resellerError } = await adminClient
        .from("resellers")
        .insert({
          user_id,
          name: currentName || currentUser.email || "Revendedor",
          status: "active",
          credits: initial_credits,
          activation_fee_paid: true,
        })
        .select()
        .single();

      if (resellerError) throw resellerError;

      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({
          user_id,
          role: "reseller",
        });

      if (roleError) throw roleError;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        action: "promote_to_reseller",
        target_table: "resellers",
        target_id: reseller.id,
        metadata: {
          user_id,
          name: currentName,
          email: currentEmail,
          initial_credits,
        },
      });

      result = { user_id, reseller_id: reseller.id, credits: initial_credits };
    }

    return new Response(
      JSON.stringify({
        success: true,
        customer: result,
        message: `Ação '${action}' executada com sucesso`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
