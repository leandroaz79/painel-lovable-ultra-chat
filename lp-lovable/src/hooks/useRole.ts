import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "reseller" | "user" | "customer" | string;
export type PrimaryRole = "admin" | "reseller" | "customer";

/**
 * Lê todos os roles do usuário em `user_roles`.
 * RLS precisa permitir o usuário ler suas próprias linhas (espera-se policy `user_id = auth.uid()`).
 */
export function useRoles() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["user_roles", user?.id],
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => (r as { role: string }).role);
    },
    staleTime: 60_000,
  });
}

export function pickPrimaryRole(roles: AppRole[]): PrimaryRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("reseller")) return "reseller";
  return "customer";
}

export function roleHome(role: PrimaryRole): "/admin" | "/reseller" | "/dashboard" {
  if (role === "admin") return "/admin";
  if (role === "reseller") return "/reseller";
  return "/dashboard";
}

export function isRoleRouteAllowed(path: string, role: PrimaryRole) {
  const pathname = path.split(/[?#]/)[0];
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return role === "admin";
  if (pathname === "/reseller" || pathname.startsWith("/reseller/")) return role === "reseller";
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return role === "customer";
  return true;
}

export function routeForRole(role: PrimaryRole, redirectPath?: string) {
  if (redirectPath?.startsWith("/") && isRoleRouteAllowed(redirectPath, role)) {
    return redirectPath;
  }
  return roleHome(role);
}
