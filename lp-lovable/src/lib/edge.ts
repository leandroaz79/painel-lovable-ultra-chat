import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function invokeEdge<T = any>(name: string, body?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body ?? {},
  });
  if (error) {
    // tenta extrair mensagem real do response
    let msg = error.message;
    try {
      const ctx: any = (error as any).context;
      if (ctx?.body) {
        const txt = typeof ctx.body === "string" ? ctx.body : await new Response(ctx.body).text();
        try {
          const j = JSON.parse(txt);
          msg = j.error || j.message || txt || msg;
        } catch {
          if (txt) msg = txt;
        }
      }
    } catch {
      /* ignore */
    }
    throw new Error(`${name}: ${msg}`);
  }
  return data as T;
}

export function toastError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  toast.error(msg);
}
